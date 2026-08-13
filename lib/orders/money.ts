import { fromCents, toCents, type MoneyCents } from "../estimating/money.ts";
import { ORDER_VAT_RATE_PERCENT } from "./types.ts";

export type VatInclusiveBreakdown = {
  unitPriceInclVatCents: MoneyCents;
  quantity: number;
  totalInclVatCents: MoneyCents;
  vatAmountCents: MoneyCents;
  exVatCents: MoneyCents;
  vatRatePercent: number;
  unitPriceInclVatZar: number;
  totalInclVatZar: number;
  vatAmountZar: number;
  exVatZar: number;
};

/**
 * Split a VAT-inclusive amount using integer cents.
 * VAT = round(total * rate / (100 + rate)).
 */
export function vatFromInclusiveCents(
  totalInclVatCents: MoneyCents,
  vatRatePercent = ORDER_VAT_RATE_PERCENT,
): MoneyCents {
  if (!Number.isInteger(totalInclVatCents) || totalInclVatCents < 0) {
    throw new Error("Money amounts must be non-negative integer cents.");
  }
  if (!Number.isInteger(vatRatePercent) || vatRatePercent < 0) {
    throw new Error("VAT rate must be a non-negative integer percent.");
  }
  return Math.round(
    (totalInclVatCents * vatRatePercent) / (100 + vatRatePercent),
  );
}

export function breakdownVatInclusive(
  unitPriceInclVatZar: number,
  quantity: number,
  vatRatePercent = ORDER_VAT_RATE_PERCENT,
): VatInclusiveBreakdown {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a positive integer.");
  }
  const unitPriceInclVatCents = toCents(unitPriceInclVatZar);
  const totalInclVatCents = unitPriceInclVatCents * quantity;
  const vatAmountCents = vatFromInclusiveCents(
    totalInclVatCents,
    vatRatePercent,
  );
  const exVatCents = totalInclVatCents - vatAmountCents;
  return {
    unitPriceInclVatCents,
    quantity,
    totalInclVatCents,
    vatAmountCents,
    exVatCents,
    vatRatePercent,
    unitPriceInclVatZar: fromCents(unitPriceInclVatCents),
    totalInclVatZar: fromCents(totalInclVatCents),
    vatAmountZar: fromCents(vatAmountCents),
    exVatZar: fromCents(exVatCents),
  };
}

export function zarFromCents(cents: MoneyCents): number {
  return fromCents(cents);
}
