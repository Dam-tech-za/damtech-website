import { roundMoney } from "@/lib/estimating/money";
import type { QuoteLineInput, QuoteTotals } from "./types";
import {
  lineDirectCost,
  lineTotalExVat,
  recalculateQuoteTotals,
} from "./totals";
import type { DiscountType, VatPricingMode } from "./quote-builder-types";

export type CalculateQuoteOptions = {
  discountAmount?: number;
  discountType?: DiscountType;
  discountPercent?: number;
  vatRatePercent: number;
  vatPricingMode?: VatPricingMode;
};

export type CalculatedQuote = QuoteTotals & {
  lines: Array<QuoteLineInput & { lineTotalExVat: number }>;
  lineDiscountTotal: number;
  netExVat: number;
  markupPercent: number;
};

/** Normalise UI lines to ex-VAT sell prices before server-authoritative totals. */
export function normaliseLinesForCalculation(
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

export function resolveHeaderDiscount(
  subtotalExVat: number,
  options: Pick<
    CalculateQuoteOptions,
    "discountAmount" | "discountType" | "discountPercent"
  >,
): number {
  const type = options.discountType ?? "amount";
  if (type === "none") return 0;
  if (type === "percent") {
    const pct = Math.min(100, Math.max(0, options.discountPercent ?? 0));
    return roundMoney(subtotalExVat * (pct / 100));
  }
  return roundMoney(Math.min(subtotalExVat, Math.max(0, options.discountAmount ?? 0)));
}

export function calculateQuote(
  lines: QuoteLineInput[],
  options: CalculateQuoteOptions,
): CalculatedQuote {
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

  const totals = recalculateQuoteTotals(normalised, {
    discountAmount,
    vatRatePercent: options.vatRatePercent,
  });

  const netExVat = roundMoney(totals.subtotalExVat - totals.discountAmount);
  const markupPercent =
    totals.directCost > 0
      ? roundMoney((totals.grossProfit / totals.directCost) * 100)
      : 0;

  const lineDiscountTotal = roundMoney(
    normalised.reduce((sum, line) => {
      if (line.lineType === "heading" || line.lineType === "note") return sum;
      const gross = line.sellUnitPrice * Math.max(0, line.quantity);
      const net = lineTotalExVat(line);
      return sum + (gross - net);
    }, 0),
  );

  return {
    ...totals,
    netExVat,
    markupPercent,
    lineDiscountTotal,
  };
}

/** Convert line unit prices when VAT pricing mode changes. */
export function convertLinesForVatModeChange(
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

export function lineDisplayTotalIncVat(
  line: QuoteLineInput,
  vatRatePercent: number,
): number {
  const ex = lineTotalExVat(line);
  if (line.taxCategory === "exempt" || line.taxCategory === "zero") return ex;
  return roundMoney(ex * (1 + vatRatePercent / 100));
}

export { lineDirectCost, lineTotalExVat };
