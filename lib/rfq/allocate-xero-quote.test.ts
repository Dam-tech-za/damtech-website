import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAllocateXeroQuotePatch,
  nextRfqStatusAfterXeroAllocation,
  normaliseXeroQuoteNumber,
  pickQuoteByNumber,
} from "./allocate-xero-quote.ts";
import type { XeroQuoteSummary } from "../operations/xero-bridge.ts";

describe("normaliseXeroQuoteNumber", () => {
  it("trims and uppercases", () => {
    assert.equal(normaliseXeroQuoteNumber("  qu0288 "), "QU0288");
  });
});

describe("nextRfqStatusAfterXeroAllocation", () => {
  it("marks open enquiries as quote_sent", () => {
    assert.equal(nextRfqStatusAfterXeroAllocation("new"), "quote_sent");
    assert.equal(nextRfqStatusAfterXeroAllocation("ready_for_quote"), "quote_sent");
  });

  it("keeps converted website quotes as converted", () => {
    assert.equal(nextRfqStatusAfterXeroAllocation("converted"), "converted");
  });

  it("refuses terminal statuses", () => {
    assert.equal(nextRfqStatusAfterXeroAllocation("closed"), null);
    assert.equal(nextRfqStatusAfterXeroAllocation("spam"), null);
    assert.equal(nextRfqStatusAfterXeroAllocation("archived"), null);
  });
});

describe("pickQuoteByNumber", () => {
  const rows: XeroQuoteSummary[] = [
    {
      id: "a",
      number: "QU0288",
      status: "DRAFT",
      contact: "TMS",
      contact_id: null,
      date: "2026-09-01",
      expiry_date: null,
      title: null,
      currency: "ZAR",
      total: 100,
    },
    {
      id: "b",
      number: "QU0288",
      status: "SENT",
      contact: "TMS",
      contact_id: null,
      date: "2026-09-02",
      expiry_date: null,
      title: null,
      currency: "ZAR",
      total: 110,
    },
  ];

  it("prefers SENT over DRAFT", () => {
    const hit = pickQuoteByNumber(rows, "qu0288");
    assert.equal(hit?.id, "b");
    assert.equal(hit?.status, "SENT");
  });

  it("returns null when missing", () => {
    assert.equal(pickQuoteByNumber(rows, "QU9999"), null);
  });
});

describe("buildAllocateXeroQuotePatch", () => {
  const quote = {
    id: "11111111-1111-4111-8111-111111111111",
    number: "QU0288",
    status: "SENT",
    contact: "TMS Redec",
    total: 142518.01,
    date: "2026-09-02",
  };

  it("builds patch and sets quote_sent", () => {
    const result = buildAllocateXeroQuotePatch({
      quote,
      currentStatus: "reviewing",
      allocatedAt: "2026-10-27T08:00:00.000Z",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.patch.status, "quote_sent");
    assert.equal(result.patch.xero_quote_number, "QU0288");
    assert.equal(result.patch.xero_quote_id, quote.id);
    assert.equal(result.previousStatusKept, false);
  });

  it("blocks closed enquiries", () => {
    const result = buildAllocateXeroQuotePatch({
      quote,
      currentStatus: "closed",
    });
    assert.equal(result.ok, false);
  });
});
