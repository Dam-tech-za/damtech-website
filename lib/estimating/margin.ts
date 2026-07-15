import { roundMoney } from "./money";

/**
 * Markup: selling_price = cost × (1 + markup_percent / 100)
 * Gross margin: selling_price = cost / (1 - gross_margin_percent / 100)
 * These are different relationships — never interchange them.
 */

export function sellingPriceFromMarkup(
  cost: number,
  markupPercent: number,
): number {
  const safeCost = Math.max(0, cost);
  const markup = Math.max(0, markupPercent);
  return roundMoney(safeCost * (1 + markup / 100));
}

export function sellingPriceFromGrossMargin(
  cost: number,
  grossMarginPercent: number,
): number {
  const safeCost = Math.max(0, cost);
  const margin = Math.min(99.999, Math.max(0, grossMarginPercent));
  if (margin >= 100) {
    throw new Error("Gross margin percent must be less than 100.");
  }
  return roundMoney(safeCost / (1 - margin / 100));
}

export function markupPercentFromPrices(cost: number, sell: number): number {
  if (cost <= 0) return 0;
  return roundMoney(((sell - cost) / cost) * 100);
}

export function grossMarginPercentFromPrices(cost: number, sell: number): number {
  if (sell <= 0) return 0;
  return roundMoney(((sell - cost) / sell) * 100);
}

export function isBelowMinimumMargin(
  cost: number,
  sell: number,
  minimumMarginPercent: number,
): boolean {
  return grossMarginPercentFromPrices(cost, sell) < minimumMarginPercent;
}
