import type { XeroInvoiceSummary, XeroQuoteSummary } from "./xero-bridge.ts";

/**
 * "Start a project from Xero": recent accepted quotes and sales invoices that
 * are not on any project yet, so a project can be created from one click with
 * the customer, numbers and value already filled in. Pure helpers here; the
 * bridge calls live in queries.ts.
 */

export type XeroContactOption = { id: string; name: string; email: string | null };

export type XeroStartItem = {
  kind: "quote" | "invoice";
  id: string;
  number: string;
  contact: string;
  contactId: string | null;
  date: string | null;
  total: number;
  /** Quote title, or the invoice reference. */
  label: string | null;
  status: string;
  amountDue: number | null;
};

export type ClaimedXero = {
  quoteNumbers: Set<string>;
  invoiceNumbers: Set<string>;
  quoteIds: Set<string>;
  invoiceIds: Set<string>;
};

const upper = (v: string | null | undefined) => (v ?? "").trim().toUpperCase();

/** Quotes and invoices not already on a project, newest first, optionally for one Xero contact. */
export function unclaimedXeroItems(
  quotes: XeroQuoteSummary[],
  invoices: XeroInvoiceSummary[],
  claimed: ClaimedXero,
  contact?: { id: string; name?: string | null } | null,
): XeroStartItem[] {
  const items: XeroStartItem[] = [];
  for (const q of quotes) {
    if (claimed.quoteIds.has(q.id) || claimed.quoteNumbers.has(upper(q.number))) continue;
    items.push({
      kind: "quote",
      id: q.id,
      number: q.number,
      contact: q.contact?.trim() || "Unknown customer",
      contactId: q.contact_id ?? null,
      date: q.date,
      total: Number(q.total ?? 0),
      label: q.title?.trim() || null,
      status: q.status,
      amountDue: null,
    });
  }
  for (const inv of invoices) {
    if (!inv.number || upper(inv.status) === "VOIDED") continue;
    if (claimed.invoiceIds.has(inv.id) || claimed.invoiceNumbers.has(upper(inv.number))) continue;
    items.push({
      kind: "invoice",
      id: inv.id,
      number: inv.number,
      contact: inv.contact?.trim() || "Unknown customer",
      contactId: inv.contact_id ?? null,
      date: inv.date,
      total: Number(inv.total ?? 0),
      label: inv.reference?.trim() || null,
      status: inv.status,
      amountDue: Number(inv.amount_due ?? 0),
    });
  }
  return items
    // Invoice lists from the bridge carry no contact id, so fall back to the name.
    .filter((i) => !contact || (i.contactId ? i.contactId === contact.id : !!contact.name && upper(i.contact) === upper(contact.name)))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

/** Starting stage for a project made from an invoice: paid something → planning, otherwise awaiting deposit. */
export function stageFromInvoice(amountPaid: number): "planning" | "awaiting_deposit" {
  return amountPaid > 0 ? "planning" : "awaiting_deposit";
}
