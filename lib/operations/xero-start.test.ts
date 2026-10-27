import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stageFromInvoice, unclaimedXeroItems, type ClaimedXero } from "./xero-start.ts";
import type { XeroInvoiceSummary, XeroQuoteSummary } from "./xero-bridge.ts";

const quote = (extra: Partial<XeroQuoteSummary>): XeroQuoteSummary => ({
  id: "q1",
  number: "QU0300",
  status: "ACCEPTED",
  contact: "Farm A",
  contact_id: "c1",
  date: "2026-10-01",
  expiry_date: null,
  title: "HDPE dam lining",
  currency: "ZAR",
  total: 100000,
  ...extra,
});

const invoice = (extra: Partial<XeroInvoiceSummary>): XeroInvoiceSummary => ({
  id: "i1",
  number: "INV0200",
  type: "ACCREC",
  contact: "Farm B",
  contact_id: "c2",
  date: "2026-10-10",
  due_date: "2026-10-30",
  status: "AUTHORISED",
  currency: "ZAR",
  subtotal: null,
  tax: null,
  total: 50000,
  amount_due: 50000,
  amount_paid: 0,
  reference: "Deposit",
  ...extra,
});

const none = (): ClaimedXero => ({ quoteNumbers: new Set(), invoiceNumbers: new Set(), quoteIds: new Set(), invoiceIds: new Set() });

describe("start a project from Xero", () => {
  it("lists quotes and invoices newest first", () => {
    const items = unclaimedXeroItems([quote({})], [invoice({})], none());
    assert.deepEqual(items.map((i) => i.number), ["INV0200", "QU0300"]);
  });

  it("hides records already on a project, by id or by number", () => {
    const claimed = none();
    claimed.quoteNumbers.add("QU0300");
    claimed.invoiceIds.add("i1");
    assert.equal(unclaimedXeroItems([quote({})], [invoice({})], claimed).length, 0);
  });

  it("hides voided invoices and filters by Xero customer", () => {
    assert.equal(unclaimedXeroItems([], [invoice({ status: "VOIDED" })], none()).length, 0);
    const items = unclaimedXeroItems([quote({})], [invoice({})], none(), { id: "c1", name: "Farm A" });
    assert.deepEqual(items.map((i) => i.number), ["QU0300"]);
    const byName = unclaimedXeroItems([], [invoice({ contact_id: undefined })], none(), { id: "c2", name: "farm b" });
    assert.deepEqual(byName.map((i) => i.number), ["INV0200"]);
  });

  it("starts at awaiting deposit until something is paid", () => {
    assert.equal(stageFromInvoice(0), "awaiting_deposit");
    assert.equal(stageFromInvoice(1000), "planning");
  });
});
