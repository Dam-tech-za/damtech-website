/**
 * A project's money, anchored to its accepted QUOTE.
 *
 * Q (the project value) comes from the primary quote, or a hand-entered value
 * when no quote is linked. Invoices are instalments against Q: they feed
 * "invoiced", "paid" and "owed", never the value. A paid deposit can never
 * read as fully paid; only Paid >= Q does.
 *
 * Pure functions: shared by the board, the project page, the quick view and
 * every Xero refresh, so all of them show the same figures.
 */
import type { InvoiceKind } from "./types.ts";

export type MoneyInvoice = {
  invoice_number?: string | null;
  reference?: string | null;
  /** Stored kind; anything other than "unclassified" is treated as chosen. */
  kind: InvoiceKind;
  xero_status: string;
  total_incl_vat: number;
  amount_paid: number;
  amount_due: number;
  invoice_date?: string | null;
  due_date: string | null;
};

export type MoneyLabel =
  | "deposit_not_invoiced"
  | "deposit_invoiced"
  | "portion_of_deposit_paid"
  | "deposit_paid"
  | "balance_due"
  | "paid_in_full";

export type ProjectMoney = {
  /** Quote total (or manual value); null when neither is known. */
  value: number | null;
  invoiced: number;
  paid: number;
  /** Owed now: what Xero says is still due on issued invoices. */
  due: number;
  credited: number;
  /** True only when something is due AND its due date has passed. */
  overdue: boolean;
  /** Value not yet invoiced (never treated as debt). */
  notYetInvoiced: number | null;
  /** Value not yet paid (invoiced or not). */
  remainingOnQuote: number | null;
  /** Paid / value, 0-100, rounded down. */
  pctPaid: number | null;
  /** Null when there are no live invoices. */
  label: MoneyLabel | null;
  /** Kind per live invoice, in date order (chosen or computed). */
  kinds: { invoice_number: string | null; kind: InvoiceKind; chosen: boolean; xero_status: string; total: number; paid: number }[];
};

const TOLERANCE = 1; // R1 counts as equal
const round2 = (n: number) => Math.round(n * 100) / 100;

export function isLiveInvoice(status: string | null | undefined): boolean {
  const s = (status ?? "").toUpperCase();
  return s === "AUTHORISED" || s === "PAID";
}

/**
 * Deposit / progress / balance(final) / full, from Damtech's reference
 * wording first, then amounts. A kind already stored by a person wins.
 */
export function classifyInvoices(invoices: MoneyInvoice[], value: number | null): { kind: InvoiceKind; chosen: boolean }[] {
  const order = invoices
    .map((inv, i) => ({ inv, i }))
    .sort((a, b) => (a.inv.invoice_date ?? "").localeCompare(b.inv.invoice_date ?? "") || a.i - b.i);
  const out: { kind: InvoiceKind; chosen: boolean }[] = new Array(invoices.length);
  let invoicedBefore = 0;
  for (const { inv, i } of order) {
    if (inv.kind !== "unclassified") {
      out[i] = { kind: inv.kind, chosen: true };
    } else {
      const ref = (inv.reference ?? "").toUpperCase();
      const total = inv.total_incl_vat;
      let kind: InvoiceKind;
      if (/\bDEPOSIT\b/.test(ref)) kind = "deposit";
      else if (/\bBALANCE\b|\bFINAL\b/.test(ref)) kind = "final";
      else if (/\bVARIATION\b|\bVO\b/.test(ref)) kind = "variation";
      else if (value !== null && invoicedBefore > 0 && invoicedBefore + total >= value - TOLERANCE) kind = "final";
      else if (value !== null && total >= value * 0.95 - TOLERANCE) kind = "full";
      else if (value !== null && invoicedBefore === 0 && total < value * 0.95) kind = "deposit";
      else kind = value === null ? "unclassified" : "progress";
      out[i] = { kind, chosen: false };
    }
    if (isLiveInvoice(inv.xero_status)) invoicedBefore += inv.total_incl_vat;
  }
  return out;
}

export function projectMoney(invoices: MoneyInvoice[], value: number | null, today: string): ProjectMoney {
  const kinds = classifyInvoices(invoices, value);
  const live = invoices.map((inv, i) => ({ inv, kind: kinds[i] })).filter((x) => isLiveInvoice(x.inv.xero_status));
  const invoiced = round2(live.reduce((s, x) => s + Number(x.inv.total_incl_vat || 0), 0));
  const paid = round2(live.reduce((s, x) => s + Number(x.inv.amount_paid || 0), 0));
  const due = round2(live.reduce((s, x) => s + Number(x.inv.amount_due || 0), 0));
  const credited = round2(Math.max(0, invoiced - paid - due));
  const overdue = live.some((x) => x.inv.amount_due > 0 && x.inv.due_date !== null && x.inv.due_date < today);
  const notYetInvoiced = value === null ? null : round2(Math.max(0, value - invoiced));
  const remainingOnQuote = value === null ? null : round2(Math.max(0, value - paid - credited));
  const pctPaid = value && value > 0 ? Math.min(100, Math.floor((paid / value) * 100)) : null;

  let label: MoneyLabel | null = null;
  if (live.length) {
    const balanceUnpaid = live.some((x) => ["final", "progress", "full", "variation"].includes(x.kind.kind) && x.inv.amount_due > 0);
    const deposits = live.filter((x) => x.kind.kind === "deposit");
    const depositTotal = deposits.reduce((s, x) => s + x.inv.total_incl_vat, 0);
    const depositPaid = deposits.reduce((s, x) => s + x.inv.amount_paid, 0);
    // Settled against the value (credit notes count as settled). Without a value, never "paid in full".
    const fullPaid = value !== null && due <= 0 && paid + credited >= value - TOLERANCE;
    if (fullPaid) label = "paid_in_full";
    else if (balanceUnpaid) label = "balance_due";
    else if (paid <= 0) label = "deposit_invoiced";
    else if (deposits.length && depositPaid < depositTotal - TOLERANCE) label = "portion_of_deposit_paid";
    else if (!deposits.length && due > 0) label = "portion_of_deposit_paid";
    else label = "deposit_paid";
  }

  return {
    value,
    invoiced,
    paid,
    due,
    credited,
    overdue,
    notYetInvoiced,
    remainingOnQuote,
    pctPaid,
    label,
    kinds: invoices.map((inv, i) => ({ invoice_number: inv.invoice_number ?? null, kind: kinds[i].kind, chosen: kinds[i].chosen, xero_status: inv.xero_status, total: inv.total_incl_vat, paid: inv.amount_paid })),
  };
}

export const KIND_LABELS: Record<InvoiceKind, string> = {
  deposit: "deposit",
  progress: "progress",
  final: "balance",
  variation: "variation",
  full: "full",
  unclassified: "unclassified",
};
