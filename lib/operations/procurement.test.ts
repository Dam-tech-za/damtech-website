import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ORDER_STATUS_CHOICES,
  costSummary,
  deliveryLabel,
  deliveryProgress,
  lineOutstanding,
  lineTotalExclVat,
  orderTotals,
  parseQty,
  readinessIssue,
  safeFileName,
  sniffMatchesType,
  statusAfterReceipt,
  type OrderLine,
} from "./procurement.ts";

const line = (p: Partial<OrderLine>): OrderLine => ({
  id: "l",
  order_id: "o",
  description: "HDPE 1 mm",
  specification: null,
  unit: "m²",
  quantity: 1000,
  unit_cost_excl_vat: 50,
  discount_pct: 0,
  vat_rate: 15,
  quantity_received: 0,
  quantity_rejected: 0,
  ...p,
});

describe("procurement statuses", () => {
  it("no longer offers 'paid'", () => {
    assert.ok(!ORDER_STATUS_CHOICES.includes("paid"));
  });
});

describe("line and order totals", () => {
  it("applies discount and VAT", () => {
    assert.equal(lineTotalExclVat(line({ discount_pct: 10 })), 45000);
    const t = orderTotals([line({ discount_pct: 10 }), line({ quantity: 2, unit_cost_excl_vat: 99.99 })], null);
    assert.deepEqual(t, { exclVat: 45199.98, vat: 6780, inclVat: 51979.98, priced: true });
  });
  it("falls back to the old single cost and flags unpriced lines", () => {
    assert.equal(orderTotals([], 1000).inclVat, 1150);
    assert.equal(orderTotals([line({ unit_cost_excl_vat: null })], null).priced, false);
  });
});

describe("deliveries", () => {
  it("computes outstanding and progress from receipts", () => {
    assert.equal(lineOutstanding(line({ quantity_received: 600 })), 400);
    assert.equal(deliveryProgress([line({ quantity_received: 600 }), line({ quantity_received: 1000 })]).state, "partial");
    assert.equal(deliveryProgress([line({ quantity_received: 1000 })]).state, "complete");
    assert.equal(deliveryProgress([]).state, "no_lines");
  });
  it("only completes an order when every line is in", () => {
    assert.equal(statusAfterReceipt("ordered", deliveryProgress([line({ quantity_received: 1000 }), line({})])), "partially_received");
    assert.equal(statusAfterReceipt("in_transit", deliveryProgress([line({ quantity_received: 1000 })])), "collected_delivered");
    assert.equal(statusAfterReceipt("collected_delivered", deliveryProgress([line({})])), "ordered");
    assert.equal(statusAfterReceipt("on_hold", deliveryProgress([line({ quantity_received: 1000 })])), "on_hold");
  });
});

describe("costSummary", () => {
  const priced = orderTotals([line({})], null); // 50 000 excl
  it("keeps estimated, committed, billed and paid apart and counts a shared bill once", () => {
    const bill = { xero_invoice_id: "b1", total_incl_vat: 57500, amount_paid: 20000, amount_due: 37500, xero_status: "AUTHORISED" };
    const s = costSummary([
      { status: "quoted", totals: priced, bills: [] },
      { status: "ordered", totals: priced, bills: [bill] },
      { status: "in_transit", totals: priced, bills: [bill] },
      { status: "cancelled", totals: priced, bills: [] },
    ]);
    assert.equal(s.estimatedExclVat, 50000);
    assert.equal(s.committedExclVat, 100000);
    assert.equal(s.billedInclVat, 57500);
    assert.equal(s.paidInclVat, 20000);
    assert.equal(s.billCount, 1);
  });
  it("ignores voided bills", () => {
    const s = costSummary([{ status: "ordered", totals: priced, bills: [{ xero_invoice_id: "v", total_incl_vat: 100, amount_paid: 0, amount_due: 100, xero_status: "VOIDED" }] }]);
    assert.equal(s.billCount, 0);
  });
});

describe("readinessIssue", () => {
  const today = "2026-11-02";
  it("flags late, unordered and after-install deliveries", () => {
    assert.match(readinessIssue({ status: "ordered", expected_date: "2026-11-01", required_on_site: null }, today, null) ?? "", /overdue/);
    assert.match(readinessIssue({ status: "quoted", expected_date: null, required_on_site: "2026-11-10" }, today, null) ?? "", /Not ordered/);
    assert.match(readinessIssue({ status: "ordered", expected_date: "2026-11-12", required_on_site: null }, today, "2026-11-09") ?? "", /after it is needed/);
  });
  it("is quiet when on time or done", () => {
    assert.equal(readinessIssue({ status: "ordered", expected_date: "2026-11-05", required_on_site: "2026-11-09" }, today, null), null);
    assert.equal(readinessIssue({ status: "collected_delivered", expected_date: "2026-10-01", required_on_site: null }, today, null), null);
  });
});

describe("files", () => {
  it("checks magic bytes and cleans names", () => {
    assert.ok(sniffMatchesType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), "application/pdf"));
    assert.ok(!sniffMatchesType(new Uint8Array([0x4d, 0x5a, 0, 0]), "application/pdf"));
    assert.equal(safeFileName("../Quote #12 (final).pdf"), "Quote-12-final-.pdf");
  });
  it("parses decimal commas", () => {
    assert.equal(parseQty("1 000,5"), 1000.5);
    assert.equal(parseQty("abc"), null);
    assert.equal(parseQty(""), null);
  });
});

describe("deliveryLabel", () => {
  it("says plainly where an order stands", () => {
    assert.equal(deliveryLabel("quoted", deliveryProgress([line({})])), "—");
    assert.equal(deliveryLabel("ordered", deliveryProgress([line({})])), "Not yet");
    assert.equal(deliveryLabel("partially_received", deliveryProgress([line({ quantity_received: 10 })])), "Part (0 of 1 items)");
    assert.equal(deliveryLabel("collected_delivered", deliveryProgress([line({ quantity_received: 1000 })])), "All in");
  });
});
