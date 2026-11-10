import type { PayfastConfig } from "./config.ts";
import { paymentFormSignature, type PayfastPairs } from "./signature.ts";

export type PayfastPaymentRequest = {
  /** Our order reference (m_payment_id). */
  orderReference: string;
  /** Amount to charge, in cents (VAT-inclusive, delivery included). */
  amountCents: number;
  itemName: string;
  itemDescription?: string;
  firstName: string;
  lastName?: string;
  email: string;
  cellNumber?: string;
  /** Public confirmation token, echoed back in the ITN as custom_str1. */
  viewToken: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
};

export type PayfastForm = {
  action: string;
  fields: Array<{ name: string; value: string }>;
};

/** Format integer cents as PayFast expects ("1234.50"). */
export function centsToPayfastAmount(cents: number): string {
  if (!Number.isInteger(cents) || cents <= 0) {
    throw new Error("PayFast amount must be a positive whole number of cents.");
  }
  return (cents / 100).toFixed(2);
}

function clip(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** South African cell numbers only (PayFast rejects other formats). */
export function payfastCellNumber(raw: string | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (/^0[6-8]\d{8}$/.test(digits)) return digits;
  if (/^27[6-8]\d{8}$/.test(digits)) return `0${digits.slice(2)}`;
  return "";
}

/**
 * Build the signed hidden-field form that sends the customer to PayFast.
 * Field order follows PayFast's documented attribute order; the signature is
 * computed over exactly these fields in this order.
 */
export function buildPayfastForm(
  config: PayfastConfig,
  request: PayfastPaymentRequest,
): PayfastForm {
  const pairs: Array<[string, string]> = [
    ["merchant_id", config.merchantId],
    ["merchant_key", config.merchantKey],
    ["return_url", request.returnUrl],
    ["cancel_url", request.cancelUrl],
    ["notify_url", request.notifyUrl],
    ["name_first", clip(request.firstName, 100)],
    ["name_last", clip(request.lastName ?? "", 100)],
    ["email_address", clip(request.email, 100)],
    ["cell_number", payfastCellNumber(request.cellNumber)],
    ["m_payment_id", clip(request.orderReference, 100)],
    ["amount", centsToPayfastAmount(request.amountCents)],
    ["item_name", clip(request.itemName, 100)],
    ["item_description", clip(request.itemDescription ?? "", 255)],
    ["custom_str1", request.viewToken],
  ];
  const used: PayfastPairs = pairs.filter(([, value]) => value.trim() !== "");
  const signature = paymentFormSignature(used, config.passphrase);
  return {
    action: config.processUrl,
    fields: [
      ...used.map(([name, value]) => ({ name, value: value.trim() })),
      { name: "signature", value: signature },
    ],
  };
}

export function splitCustomerName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] ?? "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}
