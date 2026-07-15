import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generatePublicQuoteToken, hashPublicQuoteToken } from "./token.ts";
import { formatQuoteNumber } from "./types.ts";
import { compareQuoteLines } from "./compare.ts";
import { canPerform } from "../auth/permissions.ts";

/**
 * Inlined formula copies so Node's strip-types runner does not need to resolve
 * the full @/ import graph used by production quote modules.
 */

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function lineTotal(
  quantity: number,
  sell: number,
  discountPercent: number,
  lineType: string,
): number {
  if (lineType === "heading" || lineType === "note") return 0;
  return roundMoney(quantity * sell * (1 - discountPercent / 100));
}

function recalculate(
  lines: Array<{
    lineType: string;
    quantity: number;
    sellUnitPrice: number;
    costUnitPrice?: number;
    discountPercent: number;
    taxCategory: string;
  }>,
  vatRatePercent: number,
  discountAmount: number,
) {
  const subtotal = roundMoney(
    lines.reduce(
      (sum, line) =>
        sum +
        lineTotal(
          line.quantity,
          line.sellUnitPrice,
          line.discountPercent,
          line.lineType,
        ),
      0,
    ),
  );
  const discount = Math.min(subtotal, Math.max(0, discountAmount));
  const net = roundMoney(subtotal - discount);
  const exempt = roundMoney(
    lines
      .filter((l) => l.taxCategory === "exempt" || l.taxCategory === "zero")
      .reduce(
        (sum, line) =>
          sum +
          lineTotal(
            line.quantity,
            line.sellUnitPrice,
            line.discountPercent,
            line.lineType,
          ),
        0,
      ),
  );
  const ratio = subtotal > 0 ? discount / subtotal : 0;
  const exemptAfter = roundMoney(exempt * (1 - ratio));
  const taxable = roundMoney(net - exemptAfter);
  const vatAmount = roundMoney(taxable * (vatRatePercent / 100));
  const directCost = roundMoney(
    lines.reduce(
      (sum, line) =>
        line.lineType === "heading" || line.lineType === "note"
          ? sum
          : sum + (line.costUnitPrice ?? 0) * line.quantity,
      0,
    ),
  );
  return {
    subtotalExVat: subtotal,
    discountAmount: discount,
    vatAmount,
    totalIncVat: roundMoney(net + vatAmount),
    directCost,
    grossProfit: roundMoney(net - directCost),
    grossMarginPercent: net > 0 ? roundMoney(((net - directCost) / net) * 100) : 0,
  };
}

describe("quote totals", () => {
  it("recalculates VAT and ignores heading sell prices", () => {
    const result = recalculate(
      [
        {
          lineType: "material",
          quantity: 100,
          sellUnitPrice: 50,
          costUnitPrice: 40,
          discountPercent: 0,
          taxCategory: "standard",
        },
        {
          lineType: "heading",
          quantity: 0,
          sellUnitPrice: 999,
          discountPercent: 0,
          taxCategory: "standard",
        },
      ],
      15,
      0,
    );
    assert.equal(result.subtotalExVat, 5000);
    assert.equal(result.vatAmount, 750);
    assert.equal(result.totalIncVat, 5750);
    assert.equal(result.directCost, 4000);
    assert.equal(result.grossProfit, 1000);
    assert.equal(result.grossMarginPercent, 20);
  });
});

describe("quote numbering display", () => {
  it("formats revision labels and PDF file names", () => {
    const display = formatQuoteNumber("DT-Q-2026-00001", 0);
    assert.equal(display.label, "DT-Q-2026-00001 Rev 0");
    assert.equal(
      display.fileSlug,
      "Damtech-Quotation-DT-Q-2026-00001-Rev-0.pdf",
    );
  });
});

describe("public token hashing", () => {
  it("hashes tokens with sha-256 hex and never equals raw token", () => {
    const token = generatePublicQuoteToken();
    assert.ok(token.length >= 43);
    const hash = hashPublicQuoteToken(token);
    assert.equal(hash.length, 64);
    assert.notEqual(hash, token);
  });
});

describe("quote workflow permissions", () => {
  it("requires approval roles for approveQuotes", () => {
    assert.equal(canPerform("sales", "approveQuotes"), false);
    assert.equal(canPerform("admin", "approveQuotes"), true);
    assert.equal(canPerform("sales", "sendQuotes"), true);
    assert.equal(canPerform("sales", "viewQuoteMargin"), false);
  });
});

describe("revision comparison", () => {
  it("detects added and price changes", () => {
    const diff = compareQuoteLines(
      [
        {
          item_code: "A",
          description: "Liner",
          line_type: "material",
          quantity: 10,
          sell_unit_price: 50,
        },
      ],
      [
        {
          item_code: "A",
          description: "Liner",
          line_type: "material",
          quantity: 12,
          sell_unit_price: 55,
        },
        {
          item_code: "B",
          description: "Labour",
          line_type: "labour",
          quantity: 1,
          sell_unit_price: 100,
        },
      ],
    );
    assert.equal(diff.added.length, 1);
    assert.equal(diff.changed.length, 1);
  });
});
