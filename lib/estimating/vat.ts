import { addMoney, roundMoney } from "./money";

export type VatBreakdownInput = {
  subtotalExVat: number;
  discountAmount?: number;
  vatRatePercent: number;
  /** Explicit VAT-exempt portion of (subtotal - discount). */
  vatExemptAmount?: number;
};

export type VatBreakdown = {
  subtotalExVat: number;
  discount: number;
  netExVat: number;
  taxableNetExVat: number;
  vatExemptAmount: number;
  vatRatePercent: number;
  vatAmount: number;
  totalIncVat: number;
};

/**
 * subtotal_ex_vat → discount → net_ex_vat → vat_amount → total_inc_vat
 * VAT-exempt lines only via explicit tax category amount.
 */
export function calculateVatBreakdown(input: VatBreakdownInput): VatBreakdown {
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
  const totalIncVat = addMoney(netExVat, vatAmount);

  return {
    subtotalExVat,
    discount,
    netExVat,
    taxableNetExVat,
    vatExemptAmount,
    vatRatePercent,
    vatAmount,
    totalIncVat,
  };
}
