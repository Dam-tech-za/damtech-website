import type { InvoiceKind, PaymentStatus } from "./types.ts";

/**
 * Payment status of a project, worked out from its linked Xero invoices only.
 * An accepted quote says nothing about money received, so it never counts.
 */

export type InvoiceForPayment = {
  status: string;
  total: number;
  amount_paid: number;
  amount_due: number;
  due_date: string | null;
};

export type PaymentSummary = {
  status: PaymentStatus;
  invoiced: number;
  paid: number;
  due: number;
  credited: number;
};

/** Invoices that count: approved (awaiting payment) or paid. Drafts and voids do not. */
export function countsAsInvoiced(status: string): boolean {
  const s = status.toUpperCase();
  return s === "AUTHORISED" || s === "PAID";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarisePayment(
  invoices: InvoiceForPayment[],
  quotedTotalInclVat: number | null,
  today: string,
): PaymentSummary {
  const live = invoices.filter((i) => countsAsInvoiced(i.status));
  const invoiced = round2(live.reduce((s, i) => s + (Number(i.total) || 0), 0));
  const paid = round2(live.reduce((s, i) => s + (Number(i.amount_paid) || 0), 0));
  const due = round2(live.reduce((s, i) => s + (Number(i.amount_due) || 0), 0));
  const credited = round2(Math.max(0, invoiced - paid - due));

  let status: PaymentStatus;
  if (live.length === 0) {
    status = "not_invoiced";
  } else if (live.some((i) => i.amount_due > 0 && i.due_date !== null && i.due_date < today)) {
    status = "overdue";
  } else if (due > 0) {
    status = paid > 0 ? "part_paid" : "awaiting_payment";
  } else if (quotedTotalInclVat !== null && invoiced >= quotedTotalInclVat - 1) {
    // Compare gross invoice totals with the quote: a credit note that settles
    // a small balance (as Xero does) still means the job is settled.
    status = "paid_in_full";
  } else {
    status = "paid_up_to_date";
  }
  return { status, invoiced, paid, due, credited };
}

/**
 * Best-effort label for an invoice from its reference and amount. Only a hint
 * for the screen; staff can correct it.
 */
export function guessInvoiceKind(
  reference: string | null,
  total: number,
  quotedTotalInclVat: number | null,
): InvoiceKind {
  const ref = (reference ?? "").toLowerCase();
  if (/\bdeposit\b/.test(ref)) return "deposit";
  if (/\bvariation\b|\bvo\b/.test(ref)) return "variation";
  if (/\bfinal\b|\bbalance\b/.test(ref)) return "final";
  if (/\bprogress\b/.test(ref)) return "progress";
  if (quotedTotalInclVat !== null && Math.abs(total - quotedTotalInclVat) <= 1) return "full";
  return "unclassified";
}
