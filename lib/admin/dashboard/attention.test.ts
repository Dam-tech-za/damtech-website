import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAttentionItems, type AttentionCounts } from "./attention.ts";

const base: AttentionCounts = {
  newEnquiries: 2,
  oldestNewSubmittedAt: null,
  informationRequired: 0,
  siteMeasurement: 0,
  readyForQuote: 0,
  ordersAwaitingInvoice: 0,
  failedEmails: 0,
  failedEmailHref: null,
  quotesAwaitingApproval: 0,
  quotesExpiringSoon: 0,
};

describe("overview needs attention", () => {
  it("gives every item one action", () => {
    const items = buildAttentionItems(base);
    assert.equal(items.length, 1);
    assert.equal(items[0].action, "Reply");
  });

  it("leaves out Operations items for roles that don't load them", () => {
    assert.ok(!buildAttentionItems(base).some((i) => i.id.startsWith("ops-")));
  });

  it("adds overdue project steps, unmatched Xero and late payers", () => {
    const items = buildAttentionItems({ ...base, opsOverdueActions: 3, opsNoNextAction: 0, opsSupplierOrders: 1, unmatchedXero: 2, overdueDebtors: 39635 });
    const ids = items.map((i) => i.id);
    assert.ok(ids.includes("ops-overdue"));
    assert.ok(!ids.includes("ops-no-next"));
    assert.ok(ids.includes("ops-orders"));
    assert.ok(ids.includes("unmatched-xero"));
    const late = items.find((i) => i.id === "overdue-debtors");
    assert.ok(late && /39/.test(late.label));
  });

  it("says when an Operations count could not load instead of hiding it", () => {
    const items = buildAttentionItems({ ...base, unmatchedXero: null });
    assert.equal(items.find((i) => i.id === "unmatched-xero")?.tone, "unavailable");
  });
});
