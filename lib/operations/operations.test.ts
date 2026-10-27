import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAttentionList,
  checkNextAction,
  checkStageChange,
  stagePath,
  todayInSouthAfrica,
} from "./lifecycle.ts";
import { summarisePayment, guessInvoiceKind } from "./payment.ts";
import {
  buildQuoteImportPayload,
  inferService,
  inferSupplyOnly,
  matchInvoiceToProject,
  quoteNumbersInReference,
  type InvoiceMatchProject,
  type QuoteImportPayload,
} from "./quote-import.ts";
import {
  runXeroProjectSync,
  type InvoiceLinkRow,
  type OpsSyncStore,
  type SyncProject,
} from "./sync.ts";
import {
  createXeroBridgeClient,
  readAllPages,
  xeroBridgeConfigFromEnv,
  type XeroBridgeClient,
  type XeroInvoiceSummary,
  type XeroQuoteDetail,
  type XeroQuoteSummary,
} from "./xero-bridge.ts";
import {
  mapMondayStage,
  migrateMondayMaterial,
  migrateMondayProject,
  parseXeroRefs,
  type MondayProjectItem,
} from "./monday.ts";
import type { PaymentStatus } from "./types.ts";

const TODAY = "2026-10-26";

describe("payment status comes from Xero invoices only", () => {
  it("is not invoiced when there are no approved invoices (an accepted quote is not money)", () => {
    const s = summarisePayment([{ status: "DRAFT", total: 1000, amount_paid: 0, amount_due: 1000, due_date: null }], 1000, TODAY);
    assert.equal(s.status, "not_invoiced");
    assert.equal(s.invoiced, 0);
  });

  it("treats a paid invoice settled with a credit note as paid in full (Kingdom Pumps INV0142)", () => {
    const s = summarisePayment(
      [{ status: "PAID", total: 96795.5, amount_paid: 91045.5, amount_due: 0, due_date: "2026-09-29" }],
      96795.5,
      TODAY,
    );
    assert.equal(s.status, "paid_in_full");
    assert.equal(s.credited, 5750);
  });

  it("is part paid while a balance is due and not yet overdue (Clinton INV0143)", () => {
    const s = summarisePayment(
      [{ status: "AUTHORISED", total: 213625.27, amount_paid: 113625.27, amount_due: 100000, due_date: "2026-10-27" }],
      213625.27,
      TODAY,
    );
    assert.equal(s.status, "part_paid");
    assert.equal(s.due, 100000);
  });

  it("adds up several invoices for one job (Pexmart INV0139 + INV0140)", () => {
    const s = summarisePayment(
      [
        { status: "AUTHORISED", total: 56235, amount_paid: 44988, amount_due: 11247, due_date: "2026-10-31" },
        { status: "AUTHORISED", total: 35420, amount_paid: 28336, amount_due: 7084, due_date: "2026-10-31" },
      ],
      91655,
      TODAY,
    );
    assert.equal(s.status, "part_paid");
    assert.equal(s.invoiced, 91655);
    assert.equal(s.due, 18331);
  });

  it("flags overdue invoices", () => {
    const s = summarisePayment(
      [{ status: "AUTHORISED", total: 1000, amount_paid: 0, amount_due: 1000, due_date: "2026-10-01" }],
      1000,
      TODAY,
    );
    assert.equal(s.status, "overdue");
  });

  it("says invoices are paid but the balance is not yet invoiced after a paid deposit", () => {
    const s = summarisePayment([{ status: "PAID", total: 400, amount_paid: 400, amount_due: 0, due_date: null }], 1000, TODAY);
    assert.equal(s.status, "paid_up_to_date");
  });

  it("ignores voided invoices", () => {
    const s = summarisePayment(
      [
        { status: "VOIDED", total: 1000, amount_paid: 0, amount_due: 0, due_date: null },
        { status: "AUTHORISED", total: 1000, amount_paid: 0, amount_due: 1000, due_date: "2026-11-30" },
      ],
      1000,
      TODAY,
    );
    assert.equal(s.status, "awaiting_payment");
    assert.equal(s.invoiced, 1000);
  });

  it("guesses invoice kinds from references", () => {
    assert.equal(guessInvoiceKind("Deposit 60% QU0300", 600, 1000), "deposit");
    assert.equal(guessInvoiceKind("QU0300", 1000, 1000), "full");
    assert.equal(guessInvoiceKind("QU0300", 300, 1000), "unclassified");
  });
});

describe("project lifecycle", () => {
  const base = { stage: "awaiting_deposit" as const, is_supply_only: false, payment_status: "not_invoiced" as PaymentStatus };

  it("blocks leaving Awaiting deposit with nothing paid unless overridden", () => {
    assert.equal(checkStageChange(base, "planning").ok, false);
    assert.equal(checkStageChange(base, "planning", { allowWithoutDeposit: true }).ok, true);
    assert.equal(checkStageChange({ ...base, payment_status: "part_paid" }, "planning").ok, true);
  });

  it("keeps supply-only jobs out of installation stages", () => {
    const supply = { ...base, stage: "planning" as const, is_supply_only: true, payment_status: "paid_in_full" as PaymentStatus };
    assert.equal(checkStageChange(supply, "in_progress").ok, false);
    assert.equal(checkStageChange(supply, "completed").ok, true);
    assert.deepEqual(stagePath(true), ["awaiting_deposit", "planning", "scheduled", "completed"]);
  });

  it("requires a next action and date on open projects", () => {
    assert.equal(checkNextAction("planning", "  ", "2026-10-27").ok, false);
    assert.equal(checkNextAction("planning", "Order liner", "").ok, false);
    assert.deepEqual(checkNextAction("planning", " Order liner ", "2026-10-27"), { ok: true, action: "Order liner", due: "2026-10-27" });
    assert.equal(checkNextAction("completed", "", "").ok, true);
  });

  it("lists overdue actions first and skips jobs on hold", () => {
    const row = (id: string, extra: Partial<Parameters<typeof buildAttentionList>[0][number]>) => ({
      id,
      title: id,
      stage: "planning" as const,
      on_hold: false,
      next_action: "Do it",
      next_action_due: "2026-10-30",
      needs_review: false,
      payment_status: "part_paid" as PaymentStatus,
      amount_due: 0,
      ...extra,
    });
    const list = buildAttentionList(
      [
        row("later", {}),
        row("today", { next_action_due: TODAY }),
        row("overdue", { next_action_due: "2026-10-21" }),
        row("held", { next_action_due: "2026-10-01", on_hold: true }),
        row("owed", { stage: "completed", amount_due: 500 }),
      ],
      TODAY,
    );
    assert.deepEqual(list.map((i) => i.projectId), ["overdue", "today", "owed"]);
  });

  it("works out today's date in South Africa", () => {
    assert.equal(todayInSouthAfrica(new Date("2026-10-26T22:30:00Z")), "2026-10-27");
  });
});

describe("accepted quote → project payload", () => {
  it("infers the service from the quote title", () => {
    assert.equal(inferService("Lindley 1.5 ML reservoir relining (1.5mm HDPE)", []), "reservoir_lining");
    assert.equal(inferService("116 kL reservoir with roof", []), "steel_reservoir");
    assert.equal(inferService("Torch-on bitumen lining", []), "torch_on_bitumen");
    assert.equal(inferService("2 x 1.0mm HDPE dams", []), "hdpe_dam_lining");
    assert.equal(inferService("Misc", [{ description: "Consulting" }]), "unclassified");
  });

  it("marks supply-only only without installation lines", () => {
    assert.equal(inferSupplyOnly("PVC liner supply only", [{ description: "550gsm PVC" }]), true);
    assert.equal(inferSupplyOnly("Supply only", [{ description: "Installation crew" }]), false);
  });

  it("always asks a person to review an imported project", () => {
    const quote: XeroQuoteDetail = {
      id: "q-1",
      number: "QU0400",
      status: "ACCEPTED",
      contact: "Hire Engineering",
      contact_id: "c-1",
      date: "2026-10-20",
      expiry_date: null,
      title: "69 kL steel reservoir with roof",
      currency: "ZAR",
      total: 71311.73,
      summary: null,
      terms: null,
      reference: null,
      subtotal: 62010.2,
      tax: 9301.53,
      lines: [{ description: "0.8mm galvanised plates", quantity: 18, item_code: null, line_amount: 1 }],
    };
    const p = buildQuoteImportPayload(quote, TODAY);
    assert.equal(p.title, "Hire Engineering – 69 kL steel reservoir with roof");
    assert.equal(p.service, "steel_reservoir");
    assert.equal(p.needs_review, true);
    assert.equal(p.next_action_due, TODAY);
    assert.match(p.scope ?? "", /galvanised plates/);
  });

  it("reads quote numbers from invoice references", () => {
    assert.deepEqual(quoteNumbersInReference("000527 / QU0294"), ["QU0294"]);
    assert.deepEqual(quoteNumbersInReference("1mm HDPE dam relining - Lanseria v2"), []);
  });

  it("matches invoices to projects without guessing", () => {
    const projects: InvoiceMatchProject[] = [
      { id: "a", xero_quote_numbers: ["QU0294"], xero_invoice_numbers: [], customer_name: "Francois Joubert PPCF Boerdery", stage: "planning", since: "2026-09-30" },
      { id: "b", xero_quote_numbers: ["QU0314"], xero_invoice_numbers: [], customer_name: "Clinton", stage: "planning", since: "2026-10-15" },
      { id: "c", xero_quote_numbers: ["QU0337"], xero_invoice_numbers: ["INV0153"], customer_name: "Boscobel", stage: "planning", since: null },
    ];
    assert.deepEqual(matchInvoiceToProject({ number: "INV0137", reference: "000527 / QU0294", contact: "x", date: "2026-10-05" }, projects), { projectId: "a", method: "reference" });
    assert.deepEqual(matchInvoiceToProject({ number: "INV0143", reference: "Lanseria v2", contact: "Clinton", date: "2026-10-20" }, projects), { projectId: "b", method: "contact" });
    assert.deepEqual(matchInvoiceToProject({ number: "INV0153", reference: "RFQ-2026-00065", contact: "Boscobel Trading Pty Ltd", date: "2026-10-22" }, projects), { projectId: "c", method: "reference" });
    // An old invoice for the same customer is not pulled into the new job.
    assert.equal(matchInvoiceToProject({ number: "INV0100", reference: "Old job", contact: "Clinton", date: "2026-06-01" }, projects), null);
    // Two open jobs for one customer: leave it for a person.
    const twice = [...projects, { ...projects[1], id: "d", xero_quote_numbers: ["QU0399"] }];
    assert.equal(matchInvoiceToProject({ number: "INV0150", reference: "Lanseria", contact: "Clinton", date: "2026-10-21" }, twice), null);
  });
});

describe("Xero bridge client", () => {
  it("refuses write tools even when asked", async () => {
    const client = createXeroBridgeClient({ baseUrl: "https://example.test", apiKey: "k", fetchImpl: async () => new Response("{}") });
    await assert.rejects(() => client.call("send_invoice" as never), /not allowed/);
  });

  it("sends the bearer key and reports bridge errors", async () => {
    let auth = "";
    const client = createXeroBridgeClient({
      baseUrl: "https://example.test/xero-bridge",
      apiKey: "secret",
      fetchImpl: async (_url, init) => {
        auth = new Headers(init?.headers).get("authorization") ?? "";
        return new Response(JSON.stringify({ error: "Xero connection expired" }), { status: 503 });
      },
    });
    await assert.rejects(() => client.call("get_quotes", {}), /Xero connection expired/);
    assert.equal(auth, "Bearer secret");
  });

  it("derives the bridge URL from the Supabase URL", () => {
    assert.deepEqual(xeroBridgeConfigFromEnv({ XERO_BRIDGE_API_KEY: "k", SUPABASE_URL: "https://abc.supabase.co/" }), {
      baseUrl: "https://abc.supabase.co/functions/v1/xero-bridge",
      apiKey: "k",
    });
    assert.equal(xeroBridgeConfigFromEnv({ SUPABASE_URL: "https://abc.supabase.co" }), null);
  });

  it("stops paging after a short page and caps runaway lists", async () => {
    assert.equal((await readAllPages(async (p) => (p === 1 ? new Array(100).fill(1) : [1]))).rows.length, 101);
    assert.equal((await readAllPages(async () => new Array(100).fill(1), 2)).truncated, true);
  });
});

// ---------------------------------------------------------------------------
// Sync engine against an in-memory store that mimics the SQL functions.
// ---------------------------------------------------------------------------

type MemProject = SyncProject & { title: string };

function memoryStore() {
  const projects: MemProject[] = [];
  const quoteLinks = new Map<string, { project_id: string; status: string; quote_date: string | null }>();
  const ignores = new Set<string>();
  const invoiceLinks = new Map<string, InvoiceLinkRow>();
  const unmatched = new Map<string, { status: "open" | "linked" | "dismissed"; suggested: string | null; reason: string }>();
  const activity: string[] = [];
  const runs: { id: string; status: string; baseline: boolean }[] = [];
  let running = false;
  let seq = 0;

  const store: OpsSyncStore = {
    async recordUnmatched(rows) {
      for (const row of rows) {
        if (!unmatched.has(row.xero_invoice_id)) {
          unmatched.set(row.xero_invoice_id, { status: "open", suggested: row.suggested_project_id, reason: row.reason });
        }
      }
    },
    async resolveUnmatched(ids) {
      for (const id of ids) {
        const entry = unmatched.get(id);
        if (entry && entry.status === "open") entry.status = "linked";
      }
    },
    async logInvoiceLinked(row) {
      activity.push(`linked ${row.invoice_number}`);
    },
    async startRun() {
      if (running) return null;
      running = true;
      const id = `run-${++seq}`;
      runs.push({ id, status: "running", baseline: false });
      return id;
    },
    async finishRun(id, result) {
      running = false;
      const run = runs.find((r) => r.id === id)!;
      run.status = result.status;
      run.baseline = result.baseline;
    },
    async hasBaseline() {
      return runs.some((r) => r.baseline && (r.status === "ok" || r.status === "partial"));
    },
    async knownQuoteIds() {
      return new Set(quoteLinks.keys());
    },
    async ignoredQuoteIds() {
      return new Set(ignores);
    },
    async recordIgnoredQuotes(rows) {
      rows.forEach((r) => ignores.add(r.xero_quote_id));
    },
    async refreshQuoteStatuses(rows) {
      rows.forEach((r) => {
        const link = quoteLinks.get(r.xero_quote_id);
        if (link) link.status = r.xero_status;
      });
    },
    async importQuote(p: QuoteImportPayload) {
      const existing = quoteLinks.get(p.xero_quote_id);
      if (existing) return { projectId: existing.project_id, created: false };
      const claimed = projects.find((pr) => pr.xero_quote_numbers.includes(p.quote_number));
      if (claimed) {
        quoteLinks.set(p.xero_quote_id, { project_id: claimed.id, status: p.xero_status, quote_date: p.quote_date });
        if (!claimed.since) claimed.since = p.quote_date;
        return { projectId: claimed.id, created: false };
      }
      const id = `p-${++seq}`;
      projects.push({
        id,
        title: p.title,
        customer_name: p.customer_name,
        stage: "awaiting_deposit",
        xero_quote_numbers: [p.quote_number],
        xero_invoice_numbers: [],
        since: p.quote_date,
        quoted_total_incl_vat: p.total_incl_vat,
        payment_status: "not_invoiced",
        amount_invoiced: 0,
        amount_paid: 0,
        amount_due: 0,
      });
      quoteLinks.set(p.xero_quote_id, { project_id: id, status: p.xero_status, quote_date: p.quote_date });
      return { projectId: id, created: true };
    },
    async listProjects() {
      return projects.map((p) => ({ ...p }));
    },
    async existingInvoiceLinks() {
      return new Map([...invoiceLinks.values()].map((l) => [l.xero_invoice_id, { project_id: l.project_id, match_method: l.match_method, kind: l.kind }]));
    },
    async upsertInvoiceLinks(rows) {
      rows.forEach((r) => invoiceLinks.set(r.xero_invoice_id, r));
    },
    async invoiceLinksByProject() {
      const map = new Map<string, InvoiceLinkRow[]>();
      for (const l of invoiceLinks.values()) map.set(l.project_id, [...(map.get(l.project_id) ?? []), l]);
      return map;
    },
    async updateProjectPayment(id, summary) {
      const p = projects.find((x) => x.id === id)!;
      p.payment_status = summary.status;
      p.amount_invoiced = summary.invoiced;
      p.amount_paid = summary.paid;
      p.amount_due = summary.due;
    },
  };
  return { store, projects, quoteLinks, ignores, invoiceLinks, unmatched, activity, setRunning: (v: boolean) => (running = v) };
}

function fakeBridge(state: { quotes: XeroQuoteSummary[]; invoices: XeroInvoiceSummary[] }) {
  const calls: string[] = [];
  const bridge: XeroBridgeClient = {
    async status() {
      return { connected: true };
    },
    async call<T>(tool: string, args: Record<string, unknown> = {}) {
      calls.push(tool);
      if (tool === "get_quotes") return state.quotes.filter((q) => q.status === args.status) as T;
      if (tool === "get_quote") {
        const q = state.quotes.find((x) => x.id === args.quote_id)!;
        return { ...q, summary: null, terms: null, reference: null, subtotal: null, tax: null, lines: [] } as T;
      }
      if (tool === "get_invoices") return state.invoices as T;
      throw new Error(`unexpected ${tool}`);
    },
  };
  return { bridge, calls };
}

const quote = (id: string, number: string, status: string, extra: Partial<XeroQuoteSummary> = {}): XeroQuoteSummary => ({
  id,
  number,
  status,
  contact: "Hire Engineering",
  contact_id: "c-1",
  date: "2026-10-20",
  expiry_date: null,
  title: "69 kL steel reservoir",
  currency: "ZAR",
  total: 71311.73,
  ...extra,
});

const invoice = (extra: Partial<XeroInvoiceSummary>): XeroInvoiceSummary => ({
  id: "i-1",
  number: "INV0144",
  type: "ACCREC",
  contact: "Hire Engineering",
  date: "2026-10-21",
  due_date: "2026-10-28",
  status: "AUTHORISED",
  currency: "ZAR",
  subtotal: null,
  tax: null,
  total: 71311.73,
  amount_due: 16311.73,
  amount_paid: 55000,
  reference: "Hire Engineering - 69 kL reservoir",
  ...extra,
});

describe("Xero → project sync", () => {
  it("refuses to import anything before the baseline run", async () => {
    const mem = memoryStore();
    const { bridge, calls } = fakeBridge({ quotes: [quote("q-old", "QU0100", "ACCEPTED")], invoices: [] });
    const r = await runXeroProjectSync(bridge, mem.store, { trigger: "cron", today: TODAY });
    assert.equal(r.reason, "needs_baseline");
    assert.equal(calls.length, 0);
    assert.equal(mem.projects.length, 0);
  });

  it("baseline records old quotes as pre-existing but links quotes Monday jobs already claim", async () => {
    const mem = memoryStore();
    mem.projects.push({
      id: "monday-1",
      title: "Pexmart",
      customer_name: "Pexmart",
      stage: "handover",
      xero_quote_numbers: ["QU0283", "QU0285"],
      xero_invoice_numbers: ["INV0139", "INV0140"],
      since: null,
      quoted_total_incl_vat: 91655,
      payment_status: "not_invoiced",
      amount_invoiced: 0,
      amount_paid: 0,
      amount_due: 0,
    });
    const { bridge } = fakeBridge({
      quotes: [quote("q-old", "QU0100", "INVOICED"), quote("q-283", "QU0283", "INVOICED", { contact: "Pexmart" })],
      invoices: [],
    });
    const r = await runXeroProjectSync(bridge, mem.store, { trigger: "manual", today: TODAY, baseline: true });
    assert.equal(r.status, "ok");
    assert.equal(r.counts.quotes_ignored, 1);
    assert.equal(r.counts.quotes_linked, 1);
    assert.equal(r.counts.projects_created, 0);
    assert.ok(mem.ignores.has("q-old"));
    assert.equal(mem.quoteLinks.get("q-283")?.project_id, "monday-1");
  });

  it("creates exactly one project per newly accepted quote, however often it runs", async () => {
    const mem = memoryStore();
    const state = { quotes: [] as XeroQuoteSummary[], invoices: [] as XeroInvoiceSummary[] };
    const { bridge, calls } = fakeBridge(state);
    await runXeroProjectSync(bridge, mem.store, { trigger: "manual", today: TODAY, baseline: true });

    state.quotes.push(quote("q-new", "QU0400", "ACCEPTED"));
    const first = await runXeroProjectSync(bridge, mem.store, { trigger: "cron", today: TODAY });
    assert.equal(first.counts.projects_created, 1);
    assert.equal(mem.projects[0].stage, "awaiting_deposit");
    assert.equal(mem.projects[0].payment_status, "not_invoiced");

    // Accepted, then invoiced in Xero: still the same single project, and no
    // second get_quote call.
    state.quotes[0] = { ...state.quotes[0], status: "INVOICED" };
    const before = calls.filter((c) => c === "get_quote").length;
    const second = await runXeroProjectSync(bridge, mem.store, { trigger: "cron", today: TODAY });
    assert.equal(second.counts.projects_created, 0);
    assert.equal(mem.projects.length, 1);
    assert.equal(calls.filter((c) => c === "get_quote").length, before);
    assert.equal(mem.quoteLinks.get("q-new")?.status, "INVOICED");
  });

  it("links the deposit invoice and updates payment status from Xero", async () => {
    const mem = memoryStore();
    const state = { quotes: [] as XeroQuoteSummary[], invoices: [] as XeroInvoiceSummary[] };
    const { bridge } = fakeBridge(state);
    await runXeroProjectSync(bridge, mem.store, { trigger: "manual", today: TODAY, baseline: true });
    state.quotes.push(quote("q-new", "QU0400", "ACCEPTED"));
    await runXeroProjectSync(bridge, mem.store, { trigger: "cron", today: TODAY });

    // No quote number in the reference: same customer is not enough, so it
    // waits in the review queue with the project suggested.
    state.invoices.push(invoice({}));
    const queued = await runXeroProjectSync(bridge, mem.store, { trigger: "cron", today: TODAY });
    assert.equal(queued.counts.invoices_linked, 0);
    assert.equal(queued.counts.invoices_for_review, 1);
    assert.equal(mem.unmatched.get("i-1")?.suggested, mem.projects[0].id);
    assert.equal(mem.projects[0].payment_status, "not_invoiced");

    // Once the invoice names the quote it links automatically and leaves the queue.
    state.invoices[0] = invoice({ reference: "Hire Engineering QU0400" });
    const r = await runXeroProjectSync(bridge, mem.store, { trigger: "cron", today: TODAY });
    assert.equal(r.counts.invoices_linked, 1);
    assert.equal(mem.unmatched.get("i-1")?.status, "linked");
    assert.deepEqual(mem.activity, ["linked INV0144"]);
    assert.equal(r.counts.projects_updated, 1);
    assert.equal(mem.projects[0].payment_status, "part_paid");
    assert.equal(mem.projects[0].amount_due, 16311.73);

    // Paid in Xero later: same link refreshed, not linked twice.
    state.invoices[0] = invoice({ reference: "Hire Engineering QU0400", status: "PAID", amount_due: 0, amount_paid: 71311.73 });
    const later = await runXeroProjectSync(bridge, mem.store, { trigger: "cron", today: TODAY });
    assert.equal(later.counts.invoices_linked, 0);
    assert.equal(mem.invoiceLinks.size, 1);
    assert.equal(mem.projects[0].payment_status, "paid_in_full");

    // Nothing changed: no further writes.
    const idle = await runXeroProjectSync(bridge, mem.store, { trigger: "cron", today: TODAY });
    assert.equal(idle.counts.projects_updated, 0);
  });

  it("skips a run while another is in progress", async () => {
    const mem = memoryStore();
    const { bridge } = fakeBridge({ quotes: [], invoices: [] });
    await runXeroProjectSync(bridge, mem.store, { trigger: "manual", today: TODAY, baseline: true });
    mem.setRunning(true);
    const r = await runXeroProjectSync(bridge, mem.store, { trigger: "cron", today: TODAY });
    assert.equal(r.reason, "already_running");
  });

  it("records a failed run when the bridge is down, without creating anything", async () => {
    const mem = memoryStore();
    const { bridge } = fakeBridge({ quotes: [], invoices: [] });
    await runXeroProjectSync(bridge, mem.store, { trigger: "manual", today: TODAY, baseline: true });
    const broken: XeroBridgeClient = { ...bridge, call: async () => { throw new Error("Xero bridge timed out"); } };
    const r = await runXeroProjectSync(broken, mem.store, { trigger: "cron", today: TODAY });
    assert.equal(r.status, "failed");
    assert.match(r.errors[0], /timed out/);
    assert.equal(mem.projects.length, 0);
  });
});

describe("Monday migration mapping", () => {
  const item = (extra: Partial<MondayProjectItem>): MondayProjectItem => ({
    id: "1",
    name: "Pexmart - 116 kL reservoir with roof, Boksburg",
    stage: "Final invoice",
    service: "Steel Reservoir",
    client: "Pexmart",
    xeroRefs: "QU0283 + QU0285 / INV0139 + INV0140",
    valueInclVat: 91655,
    site: "Boksburg",
    oneWayKm: null,
    siteStart: null,
    siteEnd: null,
    crew: null,
    nextAction: "Confirm the job is complete",
    nextActionDate: "2026-10-22",
    phone: null,
    email: null,
    scope: null,
    safetyFile: "Not required",
    ...extra,
  });

  it("normalises Monday stages into six stages plus an on-hold flag", () => {
    assert.equal(mapMondayStage("Planning & materials").stage, "planning");
    assert.equal(mapMondayStage("On site").stage, "in_progress");
    assert.equal(mapMondayStage("Closed - paid").stage, "completed");
    assert.deepEqual(mapMondayStage("On hold").onHold, true);
  });

  it("moves Final invoice jobs to Handover for a person to confirm, and keeps every Xero number", () => {
    const p = migrateMondayProject(item({}), TODAY);
    assert.equal(p.stage, "handover");
    assert.equal(p.needs_review, true);
    assert.deepEqual(p.xero_quote_numbers, ["QU0283", "QU0285"]);
    assert.deepEqual(p.xero_invoice_numbers, ["INV0139", "INV0140"]);
  });

  it("fills a missing next action date with the migration date and says so", () => {
    const p = migrateMondayProject(item({ stage: "Planning & materials", nextActionDate: null }), TODAY);
    assert.equal(p.next_action_due, TODAY);
    assert.ok(p.review_notes.some((n) => /date/.test(n)));
  });

  it("flags quotes that are still Sent in Xero", () => {
    const p = migrateMondayProject(item({ stage: "Planning & materials", xeroRefs: "QU0288 (still SENT in Xero, mark accepted)" }), TODAY);
    assert.ok(p.review_notes.some((n) => /not marked Accepted/.test(n)));
  });

  it("uses the exact Xero contact name when supplied", () => {
    assert.equal(migrateMondayProject(item({ client: "Francois Joubert, PPCF Boerdery cc", xeroContact: "Francois Joubert PPCF Boerdery" }), TODAY).customer_name, "Francois Joubert PPCF Boerdery");
    assert.equal(migrateMondayProject(item({}), TODAY).customer_name, "Pexmart");
  });

  it("parses Xero references", () => {
    assert.deepEqual(parseXeroRefs("QU0337 / INV0153 (RFQ-2026-00065)"), { quotes: ["QU0337"], invoices: ["INV0153"] });
  });

  it("maps supplier orders and keeps unverified costs out of the cost column", () => {
    const m = migrateMondayMaterial({
      id: "m1",
      name: "Fibertex SO4010749",
      projectItemId: "p1",
      supplier: "Fibertex",
      status: "Ordered",
      materials: "F25 geotextile, 2 rolls",
      supplierRef: "Pro forma SO4010749",
      date: null,
      deliveryNote: "JHB, stock available next week",
      cost: 7020,
      notes: "COD application form",
    });
    assert.equal(m?.status, "ordered");
    assert.equal(m?.cost_excl_vat, null);
    assert.match(m?.notes ?? "", /R7020/);
    assert.equal(migrateMondayMaterial({ ...m!, id: "x", name: "x", projectItemId: null, supplier: null, status: null, materials: null, supplierRef: null, date: null, deliveryNote: null, cost: null, notes: null }), null);
  });
});
