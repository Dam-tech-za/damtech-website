import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Inlined formula copies so Node's strip-types runner does not need to resolve
 * the full @/ import graph used by production quote modules.
 */

type DiscountType = "none" | "amount" | "percent";
type VatPricingMode = "exclusive" | "inclusive";
type TaxCategory = "standard" | "zero" | "exempt";
type LineType = "custom" | "heading" | "note";

type QuoteLineInput = {
  sortOrder: number;
  lineType: LineType;
  description: string;
  quantity: number;
  unit: string;
  costUnitPrice?: number;
  sellUnitPrice: number;
  discountPercent: number;
  taxCategory: TaxCategory;
};

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function multiplyMoney(a: number, b: number): number {
  return roundMoney(a * b);
}

function lineTotalExVat(line: QuoteLineInput): number {
  if (line.lineType === "heading" || line.lineType === "note") return 0;
  const qty = Math.max(0, line.quantity);
  const sell = Math.max(0, line.sellUnitPrice);
  const discount = Math.min(100, Math.max(0, line.discountPercent));
  const gross = multiplyMoney(sell, qty);
  return roundMoney(gross * (1 - discount / 100));
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
  const vatRatePercent = Math.max(0, input.vatRatePercent);
  const vatAmount = roundMoney(taxableNetExVat * (vatRatePercent / 100));
  const totalIncVat = roundMoney(netExVat + vatAmount);
  return {
    subtotalExVat,
    discount,
    netExVat,
    vatAmount,
    totalIncVat,
  };
}

function normaliseLinesForCalculation(
  lines: QuoteLineInput[],
  vatPricingMode: VatPricingMode,
  vatRatePercent: number,
): QuoteLineInput[] {
  if (vatPricingMode === "exclusive") return lines;
  const rate = vatRatePercent / 100;
  return lines.map((line) => {
    if (line.taxCategory !== "standard") return line;
    const inc = Math.max(0, line.sellUnitPrice);
    const ex = rate > 0 ? roundMoney(inc / (1 + rate)) : inc;
    return { ...line, sellUnitPrice: ex };
  });
}

function resolveHeaderDiscount(
  subtotalExVat: number,
  options: {
    discountAmount?: number;
    discountType?: DiscountType;
    discountPercent?: number;
  },
): number {
  const type = options.discountType ?? "amount";
  if (type === "none") return 0;
  if (type === "percent") {
    const pct = Math.min(100, Math.max(0, options.discountPercent ?? 0));
    return roundMoney(subtotalExVat * (pct / 100));
  }
  return roundMoney(Math.min(subtotalExVat, Math.max(0, options.discountAmount ?? 0)));
}

function calculateQuote(
  lines: QuoteLineInput[],
  options: {
    discountAmount?: number;
    discountType?: DiscountType;
    discountPercent?: number;
    vatRatePercent: number;
    vatPricingMode?: VatPricingMode;
  },
) {
  const vatPricingMode = options.vatPricingMode ?? "exclusive";
  const normalised = normaliseLinesForCalculation(
    lines,
    vatPricingMode,
    options.vatRatePercent,
  );
  const subtotalBeforeDiscount = roundMoney(
    normalised.reduce((sum, line) => sum + lineTotalExVat(line), 0),
  );
  const discountAmount = resolveHeaderDiscount(subtotalBeforeDiscount, options);
  const vat = calculateVatBreakdown({
    subtotalExVat: subtotalBeforeDiscount,
    discountAmount,
    vatRatePercent: options.vatRatePercent,
  });
  return {
    subtotalExVat: vat.subtotalExVat,
    discountAmount: vat.discount,
    vatAmount: vat.vatAmount,
    totalIncVat: vat.totalIncVat,
  };
}

function convertLinesForVatModeChange(
  lines: QuoteLineInput[],
  fromMode: VatPricingMode,
  toMode: VatPricingMode,
  vatRatePercent: number,
  strategy: "preserve_value" | "preserve_total",
): QuoteLineInput[] {
  if (fromMode === toMode) return lines;
  const rate = vatRatePercent / 100;
  return lines.map((line) => {
    if (line.taxCategory !== "standard") return line;
    const price = Math.max(0, line.sellUnitPrice);
    if (strategy === "preserve_value") return line;
    if (fromMode === "exclusive" && toMode === "inclusive") {
      return { ...line, sellUnitPrice: roundMoney(price * (1 + rate)) };
    }
    if (fromMode === "inclusive" && toMode === "exclusive") {
      return {
        ...line,
        sellUnitPrice: rate > 0 ? roundMoney(price / (1 + rate)) : price,
      };
    }
    return line;
  });
}

const sampleLine: QuoteLineInput = {
  sortOrder: 0,
  lineType: "custom",
  description: "HDPE supply",
  quantity: 100,
  unit: "m²",
  costUnitPrice: 50,
  sellUnitPrice: 120,
  discountPercent: 0,
  taxCategory: "standard",
};

describe("calculateQuote", () => {
  it("calculates exclusive VAT totals", () => {
    const result = calculateQuote([sampleLine], {
      discountType: "none",
      vatRatePercent: 15,
      vatPricingMode: "exclusive",
    });
    assert.equal(result.subtotalExVat, 12000);
    assert.equal(result.vatAmount, 1800);
    assert.equal(result.totalIncVat, 13800);
  });

  it("applies percentage header discount", () => {
    const result = calculateQuote([sampleLine], {
      discountType: "percent",
      discountPercent: 10,
      vatRatePercent: 15,
      vatPricingMode: "exclusive",
    });
    assert.equal(result.discountAmount, 1200);
    assert.equal(result.totalIncVat, 12420);
  });

  it("normalises inclusive unit prices to ex VAT", () => {
    const inclusiveLine = { ...sampleLine, sellUnitPrice: 115 };
    const result = calculateQuote([inclusiveLine], {
      discountType: "none",
      vatRatePercent: 15,
      vatPricingMode: "inclusive",
    });
    assert.ok(result.subtotalExVat < 11500);
    assert.equal(result.totalIncVat, 11500);
  });
});

describe("resolveHeaderDiscount", () => {
  it("caps fixed discount at subtotal", () => {
    assert.equal(
      resolveHeaderDiscount(100, { discountType: "amount", discountAmount: 150 }),
      100,
    );
  });
});

describe("convertLinesForVatModeChange", () => {
  it("preserves customer-facing totals when converting exclusive to inclusive", () => {
    const converted = convertLinesForVatModeChange(
      [sampleLine],
      "exclusive",
      "inclusive",
      15,
      "preserve_total",
    );
    assert.equal(converted[0]?.sellUnitPrice, 138);
  });
});
