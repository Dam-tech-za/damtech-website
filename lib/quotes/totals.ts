import { calculateVatBreakdown } from "@/lib/estimating/vat";
import {
  grossMarginPercentFromPrices,
  markupPercentFromPrices,
} from "@/lib/estimating/margin";
import { multiplyMoney, roundMoney } from "@/lib/estimating/money";
import type { QuoteLineInput, QuoteTotals } from "./types";

const NON_PRICED_LINES = new Set(["heading", "note"]);

export function lineTotalExVat(line: QuoteLineInput): number {
  if (NON_PRICED_LINES.has(line.lineType)) return 0;
  const qty = Math.max(0, line.quantity);
  const sell = Math.max(0, line.sellUnitPrice);
  const discount = Math.min(100, Math.max(0, line.discountPercent));
  const gross = multiplyMoney(sell, qty);
  return roundMoney(gross * (1 - discount / 100));
}

export function lineDirectCost(line: QuoteLineInput): number {
  if (NON_PRICED_LINES.has(line.lineType)) return 0;
  const cost = Math.max(0, line.costUnitPrice ?? 0);
  const qty = Math.max(0, line.quantity);
  return multiplyMoney(cost, qty);
}

export function lineMarkupPercent(line: QuoteLineInput): number {
  return markupPercentFromPrices(line.costUnitPrice ?? 0, line.sellUnitPrice);
}

export function lineMarginPercent(line: QuoteLineInput): number {
  return grossMarginPercentFromPrices(
    line.costUnitPrice ?? 0,
    line.sellUnitPrice,
  );
}

/**
 * Recalculate quote totals from line items. Never trust client-submitted totals.
 */
export function recalculateQuoteTotals(
  lines: QuoteLineInput[],
  options: {
    discountAmount?: number;
    vatRatePercent: number;
  },
): QuoteTotals & { lines: Array<QuoteLineInput & { lineTotalExVat: number }> } {
  const priced = lines.map((line) => ({
    ...line,
    lineTotalExVat: lineTotalExVat(line),
  }));

  const subtotalExVat = roundMoney(
    priced.reduce((sum, line) => sum + line.lineTotalExVat, 0),
  );
  const discountAmount = roundMoney(
    Math.min(subtotalExVat, Math.max(0, options.discountAmount ?? 0)),
  );

  const vatExemptAmount = roundMoney(
    priced
      .filter((line) => line.taxCategory === "exempt" || line.taxCategory === "zero")
      .reduce((sum, line) => sum + line.lineTotalExVat, 0),
  );

  const discountRatio =
    subtotalExVat > 0 ? discountAmount / subtotalExVat : 0;
  const exemptAfterDiscount = roundMoney(vatExemptAmount * (1 - discountRatio));

  const vat = calculateVatBreakdown({
    subtotalExVat,
    discountAmount,
    vatRatePercent: options.vatRatePercent,
    vatExemptAmount: exemptAfterDiscount,
  });

  const directCost = roundMoney(
    priced.reduce((sum, line) => sum + lineDirectCost(line), 0),
  );
  const netSell = vat.netExVat;
  const grossProfit = roundMoney(netSell - directCost);
  const grossMarginPercent =
    netSell > 0 ? roundMoney((grossProfit / netSell) * 100) : 0;

  return {
    lines: priced,
    subtotalExVat: vat.subtotalExVat,
    discountAmount: vat.discount,
    vatRate: vat.vatRatePercent,
    vatAmount: vat.vatAmount,
    totalIncVat: vat.totalIncVat,
    directCost,
    grossProfit,
    grossMarginPercent,
    vatExemptAmount: vat.vatExemptAmount,
  };
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayIsoDateJohannesburg(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
