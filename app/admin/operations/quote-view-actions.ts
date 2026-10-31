"use server";

import { unstable_rethrow } from "next/navigation";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { createXeroBridgeClient, xeroBridgeConfigFromEnv } from "@/lib/operations/xero-bridge";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const QUOTE_NO = /^[A-Z]{1,4}-?\d{1,8}$/i;

export type ProjectQuoteRef = {
  /** Xero QuoteID when the project is linked by id (authoritative). */
  quoteId: string | null;
  number: string;
  status: string | null;
  total: number | null;
  date: string | null;
};

export type QuoteLine = {
  description: string | null;
  quantity: number | null;
  unit_amount: number | null;
  item_code: string | null;
  tax_type: string | null;
  line_amount: number | null;
};

export type QuoteDetail = {
  id: string;
  number: string;
  status: string;
  contact: string | null;
  date: string | null;
  expiry_date: string | null;
  title: string | null;
  summary: string | null;
  terms: string | null;
  reference: string | null;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  lines: QuoteLine[];
  /** How the quote was matched to the project. */
  matchedBy: "quote_id" | "quote_number";
  /** True when matched by number and Xero's customer differs from the project's Xero contact. */
  contactMismatch: boolean;
  fetchedAt: string;
};

const normNo = (n: string) => n.trim().toUpperCase().replace(/-/g, "");

/** The Xero quotes this project is linked to (ids first, then numbers typed on the board). */
export async function projectQuotesAction(projectId: string): Promise<{ quotes: ProjectQuoteRef[] } | { error: string }> {
  if (!UUID.test(projectId)) return { error: "That project could not be found." };
  try {
    const { db } = await adminOpsDb();
    const [project, links] = await Promise.all([
      db.from("ops_projects").select("xero_quote_numbers").eq("id", projectId).maybeSingle(),
      db.from("ops_xero_quote_links").select("xero_quote_id, quote_number, xero_status, total_incl_vat, quote_date").eq("project_id", projectId).order("quote_date", { ascending: false }),
    ]);
    if (project.error || links.error) return { error: "The project's quotes could not be loaded." };
    if (!project.data) return { error: "That project could not be found." };
    const linked: ProjectQuoteRef[] = ((links.data ?? []) as Record<string, unknown>[]).map((l) => ({
      quoteId: l.xero_quote_id as string,
      number: (l.quote_number as string) ?? "",
      status: (l.xero_status as string | null) ?? null,
      total: l.total_incl_vat === null ? null : Number(l.total_incl_vat),
      date: (l.quote_date as string | null) ?? null,
    }));
    const seen = new Set(linked.map((q) => normNo(q.number)));
    const typed = ((project.data.xero_quote_numbers as string[] | null) ?? [])
      .filter((n) => n && !seen.has(normNo(n)))
      .map((n) => ({ quoteId: null, number: n, status: null, total: null, date: null }));
    return { quotes: [...linked, ...typed] };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "The project's quotes could not be loaded." };
  }
}

/**
 * One Xero quote, read live through the bridge. Only quotes that belong to the
 * project (linked id, or a number recorded on the project) can be opened, so
 * a client cannot read an arbitrary quote. Nothing is stored.
 */
export async function quoteDetailAction(projectId: string, ref: { quoteId?: string | null; number?: string | null }): Promise<{ quote: QuoteDetail } | { error: string }> {
  if (!UUID.test(projectId)) return { error: "That project could not be found." };
  const config = xeroBridgeConfigFromEnv();
  if (!config) return { error: "Xero is not connected on this site." };
  try {
    const { db } = await adminOpsDb();
    const { data: project } = await db.from("ops_projects").select("xero_contact_id, xero_quote_numbers").eq("id", projectId).maybeSingle();
    if (!project) return { error: "That project could not be found." };

    let args: Record<string, string>;
    let matchedBy: QuoteDetail["matchedBy"];
    if (ref.quoteId) {
      if (!UUID.test(ref.quoteId)) return { error: "That quote could not be found." };
      const { data: link } = await db.from("ops_xero_quote_links").select("id").eq("project_id", projectId).eq("xero_quote_id", ref.quoteId).maybeSingle();
      if (!link) return { error: "That quote is not linked to this project." };
      args = { quote_id: ref.quoteId };
      matchedBy = "quote_id";
    } else {
      const number = (ref.number ?? "").trim();
      const onProject = ((project.xero_quote_numbers as string[] | null) ?? []).some((n) => normNo(n) === normNo(number));
      if (!QUOTE_NO.test(number) || !onProject) return { error: "That quote number is not on this project." };
      args = { quote_number: number.toUpperCase() };
      matchedBy = "quote_number";
    }

    const q = await createXeroBridgeClient(config).call<Record<string, unknown>>("get_quote", args);
    if (!q || !q.id) return { error: "Xero did not return that quote. It may have been deleted." };
    const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
    const projectContact = (project.xero_contact_id as string | null) ?? null;
    return {
      quote: {
        id: String(q.id),
        number: String(q.number ?? ""),
        status: String(q.status ?? ""),
        contact: str(q.contact),
        date: str(q.date),
        expiry_date: str(q.expiry_date),
        title: str(q.title),
        summary: str(q.summary),
        terms: str(q.terms),
        reference: str(q.reference),
        currency: str(q.currency),
        subtotal: num(q.subtotal),
        tax: num(q.tax),
        total: num(q.total),
        lines: ((q.lines as Record<string, unknown>[] | undefined) ?? []).map((l) => ({
          description: str(l.description),
          quantity: num(l.quantity),
          unit_amount: num(l.unit_amount),
          item_code: str(l.item_code),
          tax_type: str(l.tax_type),
          line_amount: num(l.line_amount),
        })),
        matchedBy,
        contactMismatch: matchedBy === "quote_number" && Boolean(projectContact) && str(q.contact_id) !== null && str(q.contact_id) !== projectContact,
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[operations] view quote:", error instanceof Error ? error.message : error);
    return { error: "Xero could not be reached. Try again in a moment." };
  }
}
