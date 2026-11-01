"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { actionFailure, actionSuccess, describeActionError, type AdminActionState } from "@/lib/admin/action-state";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { INVOICE_KINDS, type InvoiceKind } from "@/lib/operations/types";
import { createXeroBridgeClient, readAllPages, xeroBridgeConfigFromEnv, type XeroInvoiceSummary } from "@/lib/operations/xero-bridge";
import { refreshProjectXeroCache } from "@/lib/operations/xero-money-refresh";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type InvoiceCandidate = {
  id: string;
  number: string | null;
  reference: string | null;
  date: string | null;
  status: string;
  total: number;
  amount_due: number;
  /** Reference mentions the quote number or the quote's reference text. */
  referenceMatch: boolean;
};

type Anchor = { contactId: string; since: string | null; quoteNumber: string | null; quoteReference: string | null };

const norm = (s: string | null | undefined) => (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

async function anchorFor(projectId: string) {
  const { db } = await adminOpsDb({ permission: "manageOperations" });
  const config = xeroBridgeConfigFromEnv();
  if (!config) return { error: "The Xero connection is not set up on this site." } as const;
  const bridge = createXeroBridgeClient(config);
  const { data: project } = await db.from("ops_projects").select("xero_quote_numbers, xero_contact_id").eq("id", projectId).maybeSingle();
  if (!project) return { error: "This project could not be found." } as const;
  const primary = ((project.xero_quote_numbers as string[] | null) ?? [])[0] ?? null;
  let anchor: Anchor | null = null;
  if (primary) {
    const { data: link } = await db.from("ops_xero_quote_links").select("xero_quote_id").eq("project_id", projectId).eq("quote_number", primary).maybeSingle();
    const q = await bridge.call<{ contact_id?: string | null; date?: string | null; number?: string; reference?: string | null }>(
      "get_quote",
      link?.xero_quote_id ? { quote_id: link.xero_quote_id } : { quote_number: primary },
    );
    if (q?.contact_id) anchor = { contactId: q.contact_id, since: q.date ?? null, quoteNumber: q.number ?? primary, quoteReference: q.reference ?? null };
  }
  // Without a quote, the project's own Xero contact is the only allowed anchor (never a name search).
  if (!anchor && project.xero_contact_id) anchor = { contactId: project.xero_contact_id as string, since: null, quoteNumber: null, quoteReference: null };
  if (!anchor) return { error: "Link the accepted quote (or the Xero contact) first, so invoices can be found by client." } as const;
  return { db, bridge, anchor } as const;
}

/**
 * Invoices for this project's Xero client (same ContactID as the primary
 * quote, dated on or after it) that are not yet on any project. Nothing is
 * attached: the user ticks which belong here.
 */
export async function findClientInvoicesAction(projectId: string): Promise<{ candidates: InvoiceCandidate[]; anchor: string } | { error: string }> {
  if (!UUID.test(projectId)) return { error: "This project could not be found." };
  try {
    const a = await anchorFor(projectId);
    if ("error" in a) return { error: a.error as string };
    const since = a.anchor.since ?? new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
    const { rows } = await readAllPages((page) =>
      a.bridge.call<XeroInvoiceSummary[]>("get_invoices", { kind: "sales", status: "AUTHORISED,PAID", date_from: since, page }),
      3,
    );
    const { data: linked } = await a.db.from("ops_xero_invoice_links").select("xero_invoice_id");
    const taken = new Set(((linked ?? []) as { xero_invoice_id: string }[]).map((l) => l.xero_invoice_id));
    const qNo = norm(a.anchor.quoteNumber);
    const qRef = norm(a.anchor.quoteReference);
    const candidates = rows
      .filter((i) => i.contact_id === a.anchor.contactId && !taken.has(i.id))
      .map((i) => {
        const ref = norm(i.reference);
        return {
          id: i.id,
          number: i.number,
          reference: i.reference,
          date: i.date,
          status: i.status,
          total: Number(i.total ?? 0),
          amount_due: Number(i.amount_due ?? 0),
          referenceMatch: Boolean((qNo && ref.includes(qNo)) || (qRef.length >= 6 && ref.includes(qRef))),
        };
      })
      .sort((x, y) => Number(y.referenceMatch) - Number(x.referenceMatch) || (y.date ?? "").localeCompare(x.date ?? ""));
    return { candidates, anchor: a.anchor.quoteNumber ? `client of ${a.anchor.quoteNumber}` : "the project's Xero client" };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] find invoices:", error instanceof Error ? error.message : error);
    return { error: "Xero could not be reached. Try again in a moment." };
  }
}

/** Attach one invoice the user ticked. It must belong to the same Xero client. */
export async function attachInvoiceAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const projectId = String(formData.get("project_id") ?? "");
  const invoiceId = String(formData.get("xero_invoice_id") ?? "");
  if (!UUID.test(projectId) || !UUID.test(invoiceId)) return actionFailure("Pick an invoice from the list.");
  try {
    const a = await anchorFor(projectId);
    if ("error" in a) return actionFailure(a.error as string);
    const x = await a.bridge.call<XeroInvoiceSummary>("get_invoice", { invoice_id: invoiceId });
    if (!x?.id || x.type !== "ACCREC") return actionFailure("That is not a sales invoice.");
    if (x.contact_id !== a.anchor.contactId) return actionFailure("That invoice belongs to a different Xero client, so it was not attached.");
    const { data: other } = await a.db.from("ops_xero_invoice_links").select("project_id").eq("xero_invoice_id", x.id).maybeSingle();
    if (other) return actionFailure(other.project_id === projectId ? "That invoice is already on this project." : "That invoice is already on another project.");
    const { error } = await a.db.from("ops_xero_invoice_links").insert({
      project_id: projectId,
      xero_invoice_id: x.id,
      invoice_number: x.number,
      reference: x.reference,
      kind: "unclassified",
      xero_status: x.status,
      total_incl_vat: x.total,
      amount_paid: x.amount_paid,
      amount_due: x.amount_due,
      invoice_date: x.date,
      due_date: x.due_date,
      match_method: "manual",
    });
    if (error) throw error;
    const { data: project } = await a.db.from("ops_projects").select("xero_invoice_numbers").eq("id", projectId).maybeSingle();
    const numbers = [...new Set([...(((project?.xero_invoice_numbers as string[] | null) ?? [])), ...(x.number ? [x.number] : [])])];
    await a.db.from("ops_projects").update({ xero_invoice_numbers: numbers }).eq("id", projectId);
    await refreshProjectXeroCache(a.db, a.bridge, projectId, todayInSouthAfrica());
    revalidatePath(`/admin/operations/projects/${projectId}/`);
    revalidatePath("/admin/operations/projects/");
    return actionSuccess(`${x.number ?? "Invoice"} attached.`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] attach invoice:", error);
    return actionFailure(describeActionError(error));
  }
}

/** Set an invoice's kind by hand ("unclassified" goes back to automatic). Refreshes keep it. */
export async function setInvoiceKindAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const linkId = String(formData.get("link_id") ?? "");
  const kind = String(formData.get("kind") ?? "") as InvoiceKind;
  if (!UUID.test(linkId) || !(INVOICE_KINDS as readonly string[]).includes(kind)) return actionFailure("Choose a type.");
  try {
    const { db } = await adminOpsDb({ permission: "manageOperations" });
    const { data, error } = await db.from("ops_xero_invoice_links").update({ kind }).eq("id", linkId).select("project_id").maybeSingle();
    if (error) throw error;
    if (data?.project_id) {
      revalidatePath(`/admin/operations/projects/${data.project_id}/`);
      revalidatePath("/admin/operations/projects/");
    }
    return actionSuccess("Saved.");
  } catch (error) {
    unstable_rethrow(error);
    return actionFailure(describeActionError(error));
  }
}

// ---------------------------------------------------------------------------
// Quotes for older projects that were created from an invoice
// ---------------------------------------------------------------------------

export type QuoteCandidate = {
  id: string;
  number: string;
  status: string;
  date: string | null;
  title: string | null;
  total: number | null;
  /** The quote number appears in one of this project's invoice references. */
  namedOnInvoice: boolean;
  linked: boolean;
};

/** The Xero clients this project may draw quotes from: its own contact and its linked invoices' contacts. */
async function projectContacts(projectId: string) {
  const { db } = await adminOpsDb({ permission: "manageOperations" });
  const config = xeroBridgeConfigFromEnv();
  if (!config) return { error: "The Xero connection is not set up on this site." } as const;
  const bridge = createXeroBridgeClient(config);
  const [{ data: project }, { data: links }] = await Promise.all([
    db.from("ops_projects").select("xero_contact_id, xero_quote_numbers").eq("id", projectId).maybeSingle(),
    db.from("ops_xero_invoice_links").select("xero_invoice_id, reference").eq("project_id", projectId),
  ]);
  if (!project) return { error: "This project could not be found." } as const;
  const contacts = new Set<string>();
  if (project.xero_contact_id) contacts.add(project.xero_contact_id as string);
  for (const l of ((links ?? []) as { xero_invoice_id: string }[]).slice(0, 5)) {
    try {
      const x = await bridge.call<XeroInvoiceSummary>("get_invoice", { invoice_id: l.xero_invoice_id });
      if (x?.contact_id) contacts.add(x.contact_id);
    } catch {
      /* one unreadable invoice does not stop the search */
    }
  }
  if (!contacts.size) return { error: "This project has no Xero client yet. Link its Xero contact or an invoice first." } as const;
  const refs = ((links ?? []) as { reference: string | null }[]).map((l) => norm(l.reference)).join(" ");
  return { db, bridge, contacts, refs, linked: ((project.xero_quote_numbers as string[] | null) ?? []).map(norm) } as const;
}

/** Quotes of this project's Xero client(s), newest first; ones named on its invoices first. */
export async function findClientQuotesAction(projectId: string): Promise<{ quotes: QuoteCandidate[] } | { error: string }> {
  if (!UUID.test(projectId)) return { error: "This project could not be found." };
  try {
    const c = await projectContacts(projectId);
    if ("error" in c) return { error: c.error as string };
    const all: QuoteCandidate[] = [];
    for (const contactId of c.contacts) {
      const rows = await c.bridge.call<{ id: string; number: string; status: string; date: string | null; title: string | null; total: number | null }[]>("get_quotes", { contact_id: contactId });
      for (const q of rows ?? []) {
        if (["DELETED", "DECLINED"].includes(String(q.status).toUpperCase())) continue;
        all.push({
          id: q.id,
          number: q.number,
          status: q.status,
          date: q.date,
          title: q.title,
          total: q.total ?? null,
          namedOnInvoice: Boolean(q.number) && c.refs.includes(norm(q.number)),
          linked: c.linked.includes(norm(q.number)),
        });
      }
    }
    all.sort((a, b) => Number(b.namedOnInvoice) - Number(a.namedOnInvoice) || (b.date ?? "").localeCompare(a.date ?? ""));
    return { quotes: all.slice(0, 30) };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] find quotes:", error instanceof Error ? error.message : error);
    return { error: "Xero could not be reached. Try again in a moment." };
  }
}

/** Link a quote the user picked as the project's primary quote. The value is not changed here. */
export async function linkQuoteAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const projectId = String(formData.get("project_id") ?? "");
  const quoteId = String(formData.get("xero_quote_id") ?? "");
  if (!UUID.test(projectId) || !UUID.test(quoteId)) return actionFailure("Pick a quote from the list.");
  try {
    const c = await projectContacts(projectId);
    if ("error" in c) return actionFailure(c.error as string);
    const q = await c.bridge.call<{ id: string; number: string; status: string; date: string | null; total: number | null; contact_id?: string | null }>("get_quote", { quote_id: quoteId });
    if (!q?.id || !q.number) return actionFailure("Xero did not return that quote.");
    if (!q.contact_id || !c.contacts.has(q.contact_id)) return actionFailure("That quote belongs to a different Xero client, so it was not linked.");
    const { data: other } = await c.db.from("ops_xero_quote_links").select("project_id").eq("xero_quote_id", q.id).maybeSingle();
    if (other && other.project_id !== projectId) return actionFailure(`${q.number} is already on another project.`);
    if (!other) {
      const { error } = await c.db.from("ops_xero_quote_links").insert({
        project_id: projectId,
        xero_quote_id: q.id,
        quote_number: q.number.toUpperCase(),
        xero_status: q.status,
        total_incl_vat: q.total,
        quote_date: q.date,
      });
      if (error) throw error;
    }
    const { data: project } = await c.db.from("ops_projects").select("xero_quote_numbers").eq("id", projectId).maybeSingle();
    const number = q.number.toUpperCase();
    const numbers = [number, ...(((project?.xero_quote_numbers as string[] | null) ?? []).filter((n) => norm(n) !== norm(number)))];
    await c.db.from("ops_projects").update({ xero_quote_numbers: numbers }).eq("id", projectId);
    revalidatePath(`/admin/operations/projects/${projectId}/`);
    revalidatePath("/admin/operations/projects/");
    return actionSuccess(`${number} linked. Use "Use quote total" if the project value should follow it.`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] link quote:", error);
    return actionFailure(describeActionError(error));
  }
}
