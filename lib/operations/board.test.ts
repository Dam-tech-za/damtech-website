import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attentionBuckets,
  bucketForProject,
  groupForStage,
  groupProjects,
  materialsRollup,
  matchesSearch,
  orderNeedsAction,
  paymentPicture,
  sortProjects,
  type InvoiceForLabel,
} from "./board.ts";
import { classifyInvoice, type InvoiceMatchProject } from "./quote-import.ts";
import { PROJECT_STAGES } from "./types.ts";

const TODAY = "2026-10-27";

const inv = (extra: Partial<InvoiceForLabel>): InvoiceForLabel => ({
  kind: "unclassified",
  xero_status: "AUTHORISED",
  total_incl_vat: 0,
  amount_paid: 0,
  amount_due: 0,
  due_date: "2026-11-30",
  ...extra,
});

describe("automatic groups", () => {
  it("puts every stage in exactly one group", () => {
    for (const stage of PROJECT_STAGES) assert.ok(groupForStage(stage));
    assert.equal(groupForStage("awaiting_deposit"), "awaiting");
    assert.equal(groupForStage("scheduled"), "on_site");
    assert.equal(groupForStage("in_progress"), "on_site");
    assert.equal(groupForStage("handover"), "handover");
  });

  it("moves a project to the new group when its stage changes", () => {
    const p = { stage: "planning" as const };
    assert.equal(groupProjects([p])[0].group, "planning");
    assert.equal(groupProjects([{ ...p, stage: "in_progress" as const }])[0].group, "on_site");
  });
});

describe("payment labels from Xero", () => {
  it("no invoices: deposit not invoiced", () => {
    assert.equal(paymentPicture([], 100000, TODAY).label, "deposit_not_invoiced");
  });

  it("unpaid deposit invoice: deposit invoiced", () => {
    const p = paymentPicture([inv({ kind: "deposit", total_incl_vat: 50000, amount_due: 50000 })], 100000, TODAY);
    assert.equal(p.label, "deposit_invoiced");
    assert.equal(p.notYetInvoiced, 50000);
  });

  it("deposit paid, balance not invoiced yet: deposit paid, contract value still to invoice shown separately", () => {
    const p = paymentPicture(
      [inv({ kind: "deposit", xero_status: "PAID", total_incl_vat: 50000, amount_paid: 50000 })],
      100000,
      TODAY,
    );
    assert.equal(p.label, "deposit_paid");
    assert.equal(p.due, 0);
    assert.equal(p.notYetInvoiced, 50000);
  });

  it("partial payment on a full invoice: balance due with the right amount (Clinton)", () => {
    const p = paymentPicture(
      [inv({ total_incl_vat: 213625.27, amount_paid: 113625.27, amount_due: 100000, due_date: "2026-10-27" })],
      213625.27,
      TODAY,
    );
    assert.equal(p.label, "balance_due");
    assert.equal(p.due, 100000);
    assert.equal(p.overdue, false);
  });

  it("flags overdue separately from the label", () => {
    const p = paymentPicture([inv({ total_incl_vat: 100, amount_paid: 50, amount_due: 50, due_date: "2026-10-01" })], 100, TODAY);
    assert.equal(p.label, "balance_due");
    assert.equal(p.overdue, true);
  });

  it("Kingdom Pumps: settled with a credit note is paid in full, nothing requested", () => {
    const p = paymentPicture(
      [inv({ kind: "full", xero_status: "PAID", total_incl_vat: 96795.5, amount_paid: 91045.5, amount_due: 0 })],
      96795.5,
      TODAY,
    );
    assert.equal(p.label, "paid_in_full");
    assert.equal(p.due, 0);
    assert.equal(p.credited, 5750);
    assert.equal(p.notYetInvoiced, 0);
  });

  it("two invoices with partial payments (Pexmart)", () => {
    const p = paymentPicture(
      [
        inv({ total_incl_vat: 56235, amount_paid: 44988, amount_due: 11247 }),
        inv({ total_incl_vat: 35420, amount_paid: 28336, amount_due: 7084 }),
      ],
      91655,
      TODAY,
    );
    assert.equal(p.label, "balance_due");
    assert.equal(p.due, 18331);
  });

  it("ignores voided and draft invoices", () => {
    const p = paymentPicture(
      [inv({ xero_status: "VOIDED", total_incl_vat: 5000, amount_due: 5000 }), inv({ xero_status: "DRAFT", total_incl_vat: 1, amount_due: 1 })],
      5000,
      TODAY,
    );
    assert.equal(p.label, "deposit_not_invoiced");
    assert.equal(p.invoiced, 0);
  });

  it("paid in full when the quote is unknown and nothing is owed", () => {
    assert.equal(paymentPicture([inv({ xero_status: "PAID", total_incl_vat: 10, amount_paid: 10 })], null, TODAY).label, "paid_in_full");
  });
});

describe("materials status from supplier orders", () => {
  it("client supplies when there are no orders and the client provides materials", () => {
    assert.equal(materialsRollup([], true), "client_supplies");
    assert.equal(materialsRollup([], false), "none");
  });

  it("worst status wins", () => {
    assert.equal(materialsRollup([{ status: "collected_delivered" }, { status: "problem" }], false), "problem");
    assert.equal(materialsRollup([{ status: "ordered" }, { status: "quote_requested" }], false), "to_order");
    assert.equal(materialsRollup([{ status: "paid" }, { status: "collected_delivered" }], false), "awaiting_supplier");
    assert.equal(materialsRollup([{ status: "collected_delivered" }, { status: "cancelled" }], false), "all_in");
  });

  it("supplier orders needing action", () => {
    assert.equal(orderNeedsAction({ status: "not_ordered", expected_date: null }, TODAY), true);
    assert.equal(orderNeedsAction({ status: "ordered", expected_date: "2026-10-20" }, TODAY), true);
    assert.equal(orderNeedsAction({ status: "ordered", expected_date: "2026-11-20" }, TODAY), false);
    assert.equal(orderNeedsAction({ status: "collected_delivered", expected_date: "2026-10-01" }, TODAY), false);
  });
});

describe("what needs attention", () => {
  const base = {
    id: "p",
    title: "Job",
    stage: "planning" as const,
    on_hold: false,
    on_hold_reason: null,
    next_action: "Order liner",
    next_action_due: TODAY,
    needs_review: false,
    archived_at: null,
  };

  it("buckets by due date, hold and missing action", () => {
    assert.equal(bucketForProject({ ...base, next_action_due: "2026-10-20" }, TODAY), "overdue");
    assert.equal(bucketForProject(base, TODAY), "today");
    assert.equal(bucketForProject({ ...base, next_action_due: "2026-11-02" }, TODAY), "next_7_days");
    assert.equal(bucketForProject({ ...base, next_action_due: "2026-12-01" }, TODAY), null);
    assert.equal(bucketForProject({ ...base, next_action: "" }, TODAY), "no_next_action");
    assert.equal(bucketForProject({ ...base, on_hold: true }, TODAY), "on_hold");
    assert.equal(bucketForProject({ ...base, stage: "completed" }, TODAY), null);
  });

  it("orders buckets with overdue first", () => {
    const list = attentionBuckets(
      [
        { ...base, id: "a", next_action_due: "2026-11-01" },
        { ...base, id: "b", next_action_due: "2026-10-01" },
      ],
      TODAY,
    );
    assert.deepEqual(list.map((l) => l.bucket), ["overdue", "next_7_days"]);
  });
});

describe("search and sort", () => {
  const p = { title: "Clinton – HDPE relining", customer_name: "Clinton", site_location: "Lanseria", xero_quote_numbers: ["QU0301"], xero_invoice_numbers: ["INV0143"] };
  it("searches title, customer, site and Xero numbers", () => {
    assert.ok(matchesSearch(p, "lanseria"));
    assert.ok(matchesSearch(p, "inv0143"));
    assert.ok(!matchesSearch(p, "gansbaai"));
  });
  it("sorts by next action date by default", () => {
    const sorted = sortProjects(
      [
        { next_action_due: "2026-11-01", updated_at: "1", customer_name: "B" },
        { next_action_due: "2026-10-01", updated_at: "2", customer_name: "A" },
      ],
      undefined,
    );
    assert.equal(sorted[0].next_action_due, "2026-10-01");
  });
});

describe("invoice classification (never guess on the customer name)", () => {
  const project = (extra: Partial<InvoiceMatchProject>): InvoiceMatchProject => ({
    id: "p1",
    xero_quote_numbers: ["QU0301"],
    xero_invoice_numbers: [],
    customer_name: "Clinton",
    stage: "planning",
    since: "2026-10-01",
    ...extra,
  });

  it("links when the reference names the project's quote", () => {
    assert.deepEqual(classifyInvoice({ number: "INV1", reference: "QU0301 deposit", contact: "Clinton", date: "2026-10-20" }, [project({})]), {
      kind: "linked",
      projectId: "p1",
      method: "reference",
    });
  });

  it("same customer, one open project, no reference: review with a suggestion", () => {
    const c = classifyInvoice({ number: "INV2", reference: "Lanseria", contact: "Clinton", date: "2026-10-20" }, [project({})]);
    assert.equal(c.kind, "review");
    assert.equal(c.kind === "review" ? c.suggestedProjectId : null, "p1");
  });

  it("same customer with two projects: review, no suggestion", () => {
    const c = classifyInvoice({ number: "INV3", reference: "HDPE", contact: "Clinton", date: "2026-10-20" }, [
      project({}),
      project({ id: "p2", xero_quote_numbers: ["QU0302"] }),
    ]);
    assert.equal(c.kind, "review");
    assert.equal(c.kind === "review" ? c.suggestedProjectId : "x", null);
  });

  it("customer with no project: an ordinary sale, left alone", () => {
    assert.deepEqual(classifyInvoice({ number: "INV4", reference: "Tank kit", contact: "Someone Else", date: "2026-10-20" }, [project({})]), {
      kind: "unrelated",
    });
  });

  it("names a quote no project holds: review", () => {
    const c = classifyInvoice({ number: "INV5", reference: "QU0999", contact: "New Co", date: "2026-10-20" }, [project({})]);
    assert.equal(c.kind, "review");
  });
});
