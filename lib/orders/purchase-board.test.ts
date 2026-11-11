import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  groupPurchases,
  matchesPurchaseSearch,
  purchaseAmountDue,
  purchaseDateTime,
  purchasePaymentKind,
  purchasePaymentPill,
  purchaseShortDate,
  purchasesCsv,
  sortPurchases,
  type PurchaseBoardRow,
} from "./purchase-board.ts";

function row(patch: Partial<PurchaseBoardRow>): PurchaseBoardRow {
  return {
    id: "a",
    order_reference: "DT-1001",
    status: "paid",
    sku: "DMT-PVC-0500-3X3",
    product_name_snapshot: "PVC liner 3 x 3 m",
    quantity: 1,
    total_price_snapshot: 1000,
    customer_name: "Jan Smit",
    business_name: null,
    email: "jan@example.co.za",
    phone: "082 000 0000",
    billing_city: "Pretoria",
    billing_province: "Gauteng",
    fulfilment_method: "delivery_south_africa",
    created_at: "2026-11-10T08:00:00Z",
    payment_method: "payfast",
    payment_status: "paid",
    delivery_fee_snapshot: 250,
    amount_due_snapshot: null,
    ...patch,
  };
}

describe("online purchases board", () => {
  it("groups orders by stage in board order, keeping empty stages", () => {
    const groups = groupPurchases([
      row({ id: "paid" }),
      row({ id: "unpaid", payment_status: "pending" }),
      row({ id: "sent", dispatched_on: "2026-11-11" }),
    ]);
    assert.deepEqual(groups.map((g) => g.stage), ["awaiting_payment", "to_make", "ready", "dispatched", "delivered", "cancelled"]);
    assert.deepEqual(groups.map((g) => g.rows.map((r) => r.id)), [["unpaid"], ["paid"], [], ["sent"], [], []]);
    assert.equal(groups[0].tone, "amber");
  });

  it("labels PayFast and invoice payments", () => {
    assert.deepEqual(purchasePaymentPill(row({})), { label: "Paid on PayFast", tone: "green" });
    assert.equal(purchasePaymentPill(row({ payment_status: "cancelled" })).label, "Payment cancelled");
    assert.equal(purchasePaymentKind(row({ payment_status: "failed" })), "failed");
    assert.equal(purchasePaymentKind(row({ payment_status: null })), "pending");
    assert.equal(purchasePaymentKind(row({ payment_method: null, status: "invoice_sent" })), "invoice");
  });

  it("adds delivery to the goods unless the amount due was saved", () => {
    assert.equal(purchaseAmountDue(row({})), 1250);
    assert.equal(purchaseAmountDue(row({ amount_due_snapshot: "1300.50" })), 1300.5);
    assert.equal(purchaseAmountDue(row({ delivery_fee_snapshot: null })), 1000);
  });

  it("searches reference, customer, SKU and tracking", () => {
    const r = row({ tracking_number: "TCG123", business_name: "Smit Boerdery" });
    assert.ok(matchesPurchaseSearch(r, "dt-1001"));
    assert.ok(matchesPurchaseSearch(r, "boerdery"));
    assert.ok(matchesPurchaseSearch(r, "tcg"));
    assert.ok(matchesPurchaseSearch(r, "  "));
    assert.ok(!matchesPurchaseSearch(r, "nothing"));
  });

  it("sorts by date and total", () => {
    const rows = [row({ id: "old", created_at: "2026-01-01T00:00:00Z", total_price_snapshot: 5000 }), row({ id: "new", created_at: "2026-11-01T00:00:00Z" })];
    assert.deepEqual(sortPurchases(rows, "newest").map((r) => r.id), ["new", "old"]);
    assert.deepEqual(sortPurchases(rows, "oldest").map((r) => r.id), ["old", "new"]);
    assert.deepEqual(sortPurchases(rows, "total_desc").map((r) => r.id), ["old", "new"]);
  });

  it("formats dates in South African time", () => {
    assert.equal(purchaseShortDate("2026-11-10T23:30:00Z"), "11 Nov");
    assert.equal(purchaseDateTime("2026-11-10T08:05:00Z"), "10 Nov 2026, 10:05");
    assert.equal(purchaseDateTime("2026-11-12"), "12 Nov 2026");
    assert.equal(purchaseShortDate(null), "—");
    assert.equal(purchaseShortDate("not a date"), "—");
  });

  it("exports quoted CSV", () => {
    const csv = purchasesCsv([row({ customer_name: 'Jan "JJ" Smit' })]);
    const [header, line] = csv.split("\n");
    assert.match(header, /^"Order","Stage","Payment"/);
    assert.match(line, /"Jan ""JJ"" Smit"/);
    assert.match(line, /"1250\.00"/);
  });
});
