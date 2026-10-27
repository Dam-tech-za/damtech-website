import { summarisePayment, guessInvoiceKind, type PaymentSummary } from "./payment.ts";
import {
  buildQuoteImportPayload,
  classifyInvoice,
  type InvoiceMatchProject,
  type QuoteImportPayload,
} from "./quote-import.ts";
import {
  readAllPages,
  type XeroBridgeClient,
  type XeroInvoiceSummary,
  type XeroQuoteDetail,
  type XeroQuoteSummary,
} from "./xero-bridge.ts";
import type { InvoiceKind, PaymentStatus } from "./types.ts";

/**
 * Xero → Operations sync. Ordinary deterministic code, no AI.
 *
 * 1. Accepted (and already-invoiced) quotes become exactly one project each.
 * 2. Sales invoices are linked to projects and refreshed.
 * 3. Each linked project's payment status is recomputed from its invoices.
 *
 * Storage is behind OpsSyncStore so the whole flow is unit-tested without a
 * database; lib/operations/sync-store.ts is the Supabase implementation.
 */

export type SyncTrigger = "cron" | "manual";

export type SyncProject = InvoiceMatchProject & {
  quoted_total_incl_vat: number | null;
  payment_status: PaymentStatus;
  amount_invoiced: number;
  amount_paid: number;
  amount_due: number;
};

export type InvoiceLinkRow = {
  project_id: string;
  xero_invoice_id: string;
  invoice_number: string | null;
  reference: string | null;
  kind: InvoiceKind;
  xero_status: string;
  total_incl_vat: number;
  amount_paid: number;
  amount_due: number;
  invoice_date: string | null;
  due_date: string | null;
  match_method: "reference" | "contact" | "manual";
};

export type UnmatchedRow = {
  xero_invoice_id: string;
  invoice_number: string | null;
  reference: string | null;
  contact_name: string | null;
  invoice_date: string | null;
  due_date: string | null;
  xero_status: string;
  total_incl_vat: number;
  amount_paid: number;
  amount_due: number;
  reason: string;
  suggested_project_id: string | null;
};

export type SyncCounts = {
  quotes_seen: number;
  projects_created: number;
  quotes_linked: number;
  quotes_ignored: number;
  invoices_linked: number;
  projects_updated: number;
  invoices_for_review: number;
};

export type SyncRunResult = {
  status: "ok" | "partial" | "failed" | "skipped";
  reason?: "already_running" | "needs_baseline" | "bridge_not_configured";
  counts: SyncCounts;
  errors: string[];
  createdProjectIds: string[];
  baseline: boolean;
};

export type OpsSyncStore = {
  startRun(trigger: SyncTrigger): Promise<string | null>;
  finishRun(runId: string, result: SyncRunResult): Promise<void>;
  hasBaseline(): Promise<boolean>;
  knownQuoteIds(): Promise<Set<string>>;
  ignoredQuoteIds(): Promise<Set<string>>;
  recordIgnoredQuotes(rows: { xero_quote_id: string; quote_number: string; reason: "baseline" }[]): Promise<void>;
  refreshQuoteStatuses(rows: { xero_quote_id: string; xero_status: string }[]): Promise<void>;
  importQuote(payload: QuoteImportPayload): Promise<{ projectId: string; created: boolean }>;
  listProjects(): Promise<SyncProject[]>;
  existingInvoiceLinks(): Promise<Map<string, { project_id: string; match_method: InvoiceLinkRow["match_method"]; kind: InvoiceKind }>>;
  upsertInvoiceLinks(rows: InvoiceLinkRow[]): Promise<void>;
  invoiceLinksByProject(): Promise<Map<string, InvoiceLinkRow[]>>;
  updateProjectPayment(projectId: string, summary: PaymentSummary, previous: PaymentStatus): Promise<void>;
  /** Queue invoices that need a person; never reopens one already linked or dismissed. */
  recordUnmatched(rows: UnmatchedRow[]): Promise<void>;
  /** Close queue entries for invoices that are now linked. */
  resolveUnmatched(invoiceIds: string[]): Promise<void>;
  logInvoiceLinked(row: InvoiceLinkRow): Promise<void>;
};

export type SyncOptions = {
  trigger: SyncTrigger;
  today: string;
  /** Baseline run: record everything accepted/invoiced today as pre-existing instead of importing it. */
  baseline?: boolean;
  quoteLookbackDays?: number;
  invoiceLookbackDays?: number;
};

const emptyCounts = (): SyncCounts => ({
  quotes_seen: 0,
  projects_created: 0,
  quotes_linked: 0,
  quotes_ignored: 0,
  invoices_linked: 0,
  projects_updated: 0,
  invoices_for_review: 0,
});

export function daysBefore(today: string, days: number): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);

export async function runXeroProjectSync(
  bridge: XeroBridgeClient,
  store: OpsSyncStore,
  options: SyncOptions,
): Promise<SyncRunResult> {
  const counts = emptyCounts();
  const baseline = options.baseline === true;
  const errors: string[] = [];
  const createdProjectIds: string[] = [];

  if (!options.baseline && !(await store.hasBaseline())) {
    return { status: "skipped", reason: "needs_baseline", counts, errors, createdProjectIds, baseline };
  }

  const runId = await store.startRun(options.trigger);
  if (!runId) return { status: "skipped", reason: "already_running", counts, errors, createdProjectIds, baseline };

  let result: SyncRunResult;
  try {
    await syncQuotes(bridge, store, options, counts, errors, createdProjectIds);
    if (!options.baseline) await syncInvoices(bridge, store, options, counts, errors);
    result = { status: errors.length ? "partial" : "ok", counts, errors, createdProjectIds, baseline };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    result = { status: "failed", counts, errors, createdProjectIds, baseline };
  }
  await store.finishRun(runId, result);
  return result;
}

async function syncQuotes(
  bridge: XeroBridgeClient,
  store: OpsSyncStore,
  options: SyncOptions,
  counts: SyncCounts,
  errors: string[],
  createdProjectIds: string[],
) {
  const dateFrom = daysBefore(options.today, options.quoteLookbackDays ?? 120);
  const quotes: XeroQuoteSummary[] = [];
  // A quote can be accepted and invoiced between two syncs, so read both.
  for (const status of ["ACCEPTED", "INVOICED"] as const) {
    const { rows, truncated } = await readAllPages((page) =>
      bridge.call<XeroQuoteSummary[]>("get_quotes", { status, date_from: dateFrom, page }),
    );
    if (truncated) errors.push(`More than 500 ${status.toLowerCase()} quotes; older ones were not read.`);
    quotes.push(...rows);
  }
  counts.quotes_seen = quotes.length;

  const known = await store.knownQuoteIds();
  const ignored = await store.ignoredQuoteIds();
  const projects = await store.listProjects();
  const claimedNumbers = new Set(projects.flatMap((p) => p.xero_quote_numbers.map((q) => q.toUpperCase())));

  await store.refreshQuoteStatuses(
    quotes.filter((q) => known.has(q.id)).map((q) => ({ xero_quote_id: q.id, xero_status: q.status })),
  );

  const toIgnore: { xero_quote_id: string; quote_number: string; reason: "baseline" }[] = [];
  for (const quote of quotes) {
    if (known.has(quote.id)) continue;
    const claimed = claimedNumbers.has(quote.number.toUpperCase());
    if (!claimed && ignored.has(quote.id)) continue;
    if (!claimed && options.baseline) {
      toIgnore.push({ xero_quote_id: quote.id, quote_number: quote.number, reason: "baseline" });
      continue;
    }
    try {
      const detail = await bridge.call<XeroQuoteDetail>("get_quote", { quote_id: quote.id });
      const { projectId, created } = await store.importQuote(buildQuoteImportPayload(detail, options.today));
      known.add(quote.id);
      if (created) {
        counts.projects_created += 1;
        createdProjectIds.push(projectId);
      } else {
        counts.quotes_linked += 1;
      }
    } catch (error) {
      errors.push(`Quote ${quote.number}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (toIgnore.length) {
    await store.recordIgnoredQuotes(toIgnore);
    counts.quotes_ignored = toIgnore.length;
  }
}

async function syncInvoices(
  bridge: XeroBridgeClient,
  store: OpsSyncStore,
  options: SyncOptions,
  counts: SyncCounts,
  errors: string[],
) {
  const dateFrom = daysBefore(options.today, options.invoiceLookbackDays ?? 180);
  const { rows: invoices, truncated } = await readAllPages((page) =>
    bridge.call<XeroInvoiceSummary[]>("get_invoices", {
      kind: "sales",
      status: "AUTHORISED,PAID,VOIDED",
      date_from: dateFrom,
      page,
    }),
  );
  if (truncated) errors.push("More than 500 invoices in the lookback window; older ones were not refreshed.");

  const projects = await store.listProjects();
  const byId = new Map(projects.map((p) => [p.id, p]));
  const existing = await store.existingInvoiceLinks();
  const rows: InvoiceLinkRow[] = [];
  const newlyLinked: InvoiceLinkRow[] = [];
  const review: UnmatchedRow[] = [];

  for (const inv of invoices) {
    const current = existing.get(inv.id);
    let projectId: string;
    let method: InvoiceLinkRow["match_method"];
    let isNew = false;
    if (current) {
      projectId = current.project_id;
      method = current.match_method;
    } else {
      if (inv.status.toUpperCase() === "VOIDED") continue;
      const verdict = classifyInvoice({ number: inv.number, reference: inv.reference, contact: inv.contact, date: inv.date }, projects);
      if (verdict.kind === "unrelated") continue;
      if (verdict.kind === "review") {
        review.push({
          xero_invoice_id: inv.id,
          invoice_number: inv.number,
          reference: inv.reference,
          contact_name: inv.contact,
          invoice_date: inv.date,
          due_date: inv.due_date,
          xero_status: inv.status,
          total_incl_vat: num(inv.total),
          amount_paid: num(inv.amount_paid),
          amount_due: num(inv.amount_due),
          reason: verdict.reason,
          suggested_project_id: verdict.suggestedProjectId,
        });
        continue;
      }
      projectId = verdict.projectId;
      method = verdict.method;
      isNew = true;
      counts.invoices_linked += 1;
    }
    const project = byId.get(projectId);
    const row: InvoiceLinkRow = {
      project_id: projectId,
      xero_invoice_id: inv.id,
      invoice_number: inv.number,
      reference: inv.reference,
      kind: current?.kind ?? guessInvoiceKind(inv.reference, num(inv.total), project?.quoted_total_incl_vat ?? null),
      xero_status: inv.status,
      total_incl_vat: num(inv.total),
      amount_paid: num(inv.amount_paid),
      amount_due: num(inv.amount_due),
      invoice_date: inv.date,
      due_date: inv.due_date,
      match_method: method,
    };
    rows.push(row);
    if (isNew) newlyLinked.push(row);
  }
  if (rows.length) await store.upsertInvoiceLinks(rows);
  if (newlyLinked.length) {
    await store.resolveUnmatched(newlyLinked.map((r) => r.xero_invoice_id));
    for (const row of newlyLinked) await store.logInvoiceLinked(row);
  }
  if (review.length) {
    await store.recordUnmatched(review);
    counts.invoices_for_review = review.length;
  }

  const links = await store.invoiceLinksByProject();
  for (const project of projects) {
    const projectLinks = links.get(project.id);
    if (!projectLinks?.length) continue;
    try {
      const summary = summarisePayment(
        projectLinks.map((l) => ({
          status: l.xero_status,
          total: l.total_incl_vat,
          amount_paid: l.amount_paid,
          amount_due: l.amount_due,
          due_date: l.due_date,
        })),
        project.quoted_total_incl_vat,
        options.today,
      );
      const changed =
        summary.status !== project.payment_status ||
        summary.invoiced !== num(project.amount_invoiced) ||
        summary.paid !== num(project.amount_paid) ||
        summary.due !== num(project.amount_due);
      if (changed) {
        await store.updateProjectPayment(project.id, summary, project.payment_status);
        counts.projects_updated += 1;
      }
    } catch (error) {
      errors.push(`Project ${project.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
