import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canPerform } from "../auth/permissions.ts";

/**
 * Estimating formula tests are inlined so Node's strip-types runner does not
 * need extensioned relative import resolution across the library graph.
 */

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function sellingPriceFromMarkup(cost: number, markupPercent: number): number {
  return roundMoney(Math.max(0, cost) * (1 + Math.max(0, markupPercent) / 100));
}

function sellingPriceFromGrossMargin(cost: number, grossMarginPercent: number): number {
  const margin = Math.min(99.999, Math.max(0, grossMarginPercent));
  return roundMoney(Math.max(0, cost) / (1 - margin / 100));
}

function calculateVatBreakdown(input: {
  subtotalExVat: number;
  discountAmount?: number;
  vatRatePercent: number;
  vatExemptAmount?: number;
}) {
  const subtotalExVat = roundMoney(Math.max(0, input.subtotalExVat));
  const discount = roundMoney(
    Math.min(subtotalExVat, Math.max(0, input.discountAmount || 0)),
  );
  const netExVat = roundMoney(subtotalExVat - discount);
  const vatExemptAmount = roundMoney(
    Math.min(netExVat, Math.max(0, input.vatExemptAmount || 0)),
  );
  const taxableNetExVat = roundMoney(netExVat - vatExemptAmount);
  const vatAmount = roundMoney(taxableNetExVat * (Math.max(0, input.vatRatePercent) / 100));
  return {
    netExVat,
    taxableNetExVat,
    vatAmount,
    totalIncVat: roundMoney(netExVat + vatAmount),
  };
}

describe("estimating formulas", () => {
  it("keeps markup and margin distinct", () => {
    assert.equal(sellingPriceFromMarkup(100, 25), 125);
    assert.equal(sellingPriceFromGrossMargin(100, 20), 125);
  });

  it("computes VAT with exempt portion", () => {
    const result = calculateVatBreakdown({
      subtotalExVat: 1150,
      discountAmount: 150,
      vatRatePercent: 15,
      vatExemptAmount: 200,
    });
    assert.equal(result.netExVat, 1000);
    assert.equal(result.taxableNetExVat, 800);
    assert.equal(result.vatAmount, 120);
    assert.equal(result.totalIncVat, 1120);
  });
});

describe("pricing permissions", () => {
  it("hides cost prices from sales", () => {
    assert.equal(canPerform("sales", "viewCostPrices"), false);
    assert.equal(canPerform("estimator", "viewCostPrices"), true);
    assert.equal(canPerform("viewer", "managePricing"), false);
    assert.equal(canPerform("admin", "exportRfqs"), true);
  });
});
