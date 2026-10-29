/**
 * Per-project "Update from Xero" preview. Never writes until the user accepts
 * rows on the review card. Contact lookup is ContactID-from-document only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { XeroBridgeClient, XeroInvoiceSummary, XeroQuoteDetail, XeroQuoteSummary } from "./xero-bridge.ts";
import {
  fetchXeroContactByIdStrict,
  locationFromXeroCity,
  type XeroContactExtras,
  XeroContactLookupError,
} from "./xero-contact.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReviewFieldKey =
  | "title"
  | "customer_name"
  | "contact_phone"
  | "contact_email"
  | "xero_number"
  | "quoted_total_incl_vat"
  | "location";

export type ReviewRow = {
  field: ReviewFieldKey;
  label: string;
  current: string;
  proposed: string;
  /** Default Accept when our value is empty; Reject when ours differs. */
  defaultAccept: boolean;
  match: boolean;
};

export type ReviewPreview = {
  projectId: string;
  projectTitle: string;
  documentNumber: string;
  documentKind: "quote" | "invoice";
  documentContactId: string;
  contactId: string;
  rows: ReviewRow[];
  matchCount: number;
};

export type ReviewApplyItem = {
  field: ReviewFieldKey;
  value: string;
};

function normNumber(raw: string): string {
  return raw.replace(/[-\s]/g, "").toUpperCase();
}

function eq(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function moneyText(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return String(Math.round(n * 100) / 100);
}

function locationText(province: string | null | undefined, town: string | null | undefined): string {
  const parts = [province, town].map((p) => (p ?? "").trim()).filter(Boolean);
  return parts.join(", ");
}

function pushRow(
  rows: ReviewRow[],
  field: ReviewFieldKey,
  label: string,
  current: string,
  proposed: string,
  options?: { hideIfEmptyProposed?: boolean },
) {
  const cur = (current ?? "").trim();
  const prop = (proposed ?? "").trim();
  if (options?.hideIfEmptyProposed && !prop) return;
  const match = Boolean(prop) && eq(cur, prop);
  rows.push({
    field,
    label,
    current: cur,
    proposed: prop,
    defaultAccept: !cur && Boolean(prop) ? true : false,
    match,
  });
}

async function findQuoteByNumber(
  db: SupabaseClient,
  bridge: XeroBridgeClient,
  number: string,
): Promise<{ detail: XeroQuoteDetail; number: string } | null> {
  const want = normNumber(number);
  const { data: links } = await db.from("ops_xero_quote_links").select("xero_quote_id, quote_number").limit(500);
  const linked = (links ?? []).find((r) => normNumber(String(r.quote_number ?? "")) === want);
  if (linked?.xero_quote_id && UUID.test(String(linked.xero_quote_id))) {
    const detail = await bridge.call<XeroQuoteDetail>("get_quote", { quote_id: linked.xero_quote_id });
    return { detail, number: String(detail.number ?? linked.quote_number ?? want).toUpperCase() };
  }

  // Bridge may accept quote_number; fall back to scanning recent statuses.
  try {
    const byNumber = await bridge.call<XeroQuoteSummary[]>("get_quotes", { quote_number: want, page: 1 });
    const hit = Array.isArray(byNumber) ? byNumber.find((q) => normNumber(String(q.number ?? "")) === want) : undefined;
    if (hit?.id) {
      const detail = await bridge.call<XeroQuoteDetail>("get_quote", { quote_id: hit.id });
      return { detail, number: String(detail.number ?? want).toUpperCase() };
    }
  } catch {
    // ignore and scan
  }

  for (const status of ["ACCEPTED", "INVOICED", "SENT", "DRAFT"]) {
    try {
      const batch = await bridge.call<XeroQuoteSummary[]>("get_quotes", { status, page: 1 });
      const hit = batch.find((q) => normNumber(String(q.number ?? "")) === want);
      if (hit?.id) {
        const detail = await bridge.call<XeroQuoteDetail>("get_quote", { quote_id: hit.id });
        return { detail, number: String(detail.number ?? want).toUpperCase() };
      }
    } catch {
      // try next status
    }
  }
  return null;
}

async function findInvoiceByNumber(
  db: SupabaseClient,
  bridge: XeroBridgeClient,
  number: string,
): Promise<{ detail: XeroInvoiceSummary; number: string } | null> {
  const want = normNumber(number);
  const { data: link } = await db
    .from("ops_xero_invoice_links")
    .select("xero_invoice_id, invoice_number")
    .limit(200);
  const linked = (link ?? []).find((r) => normNumber(String(r.invoice_number ?? "")) === want);
  if (linked?.xero_invoice_id && UUID.test(String(linked.xero_invoice_id))) {
    const detail = await bridge.call<XeroInvoiceSummary>("get_invoice", { invoice_id: linked.xero_invoice_id });
    return { detail, number: String(detail.number ?? linked.invoice_number ?? want).toUpperCase() };
  }

  try {
    const byNumber = await bridge.call<XeroInvoiceSummary[]>("get_invoices", {
      kind: "sales",
      InvoiceNumbers: want,
      page: 1,
    });
    const hit = Array.isArray(byNumber) ? byNumber.find((i) => normNumber(String(i.number ?? "")) === want) : undefined;
    if (hit) return { detail: hit, number: String(hit.number ?? want).toUpperCase() };
  } catch {
    // scan
  }

  try {
    const batch = await bridge.call<XeroInvoiceSummary[]>("get_invoices", {
      kind: "sales",
      status: "AUTHORISED,PAID",
      page: 1,
    });
    const hit = batch.find((i) => normNumber(String(i.number ?? "")) === want);
    if (hit) return { detail: hit, number: String(hit.number ?? want).toUpperCase() };
  } catch {
    return null;
  }
  return null;
}

function buildRowsFromContact(
  project: {
    title: string;
    customer_name: string | null;
    contact_person: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    quoted_total_incl_vat: number | null;
    site_province: string | null;
    site_town: string | null;
    xero_quote_numbers: string[] | null;
    xero_invoice_numbers: string[] | null;
  },
  extras: XeroContactExtras,
  documentNumber: string,
  documentTotal: number | null,
  documentTitle: string | null,
): { rows: ReviewRow[]; matchCount: number } {
  const rows: ReviewRow[] = [];
  const clientName = extras.person || extras.name || "";
  const ourClient = project.contact_person || project.customer_name || "";
  const ourXero =
    [...(project.xero_quote_numbers ?? []), ...(project.xero_invoice_numbers ?? [])].join(", ") || "";
  const loc = locationFromXeroCity(extras.city, extras.region);
  const xeroLocation = loc ? locationText(loc.site_province, loc.site_town) : locationText(extras.region, extras.city);

  pushRow(rows, "title", "Project name", project.title, documentTitle || project.title);
  pushRow(rows, "customer_name", "Client name", ourClient, clientName || extras.name || "");
  pushRow(rows, "contact_phone", "Phone", project.contact_phone ?? "", extras.phone ?? "");
  pushRow(rows, "contact_email", "Email", project.contact_email ?? "", extras.email ?? "");
  pushRow(rows, "xero_number", "Xero number", ourXero, documentNumber);
  pushRow(rows, "quoted_total_incl_vat", "Total project value", moneyText(project.quoted_total_incl_vat), moneyText(documentTotal));
  pushRow(rows, "location", "Location", locationText(project.site_province, project.site_town), xeroLocation, {
    hideIfEmptyProposed: true,
  });

  const matchCount = rows.filter((r) => r.match).length;
  return { rows: rows.filter((r) => !r.match), matchCount };
}

export async function buildProjectXeroReview(
  db: SupabaseClient,
  bridge: XeroBridgeClient,
  projectId: string,
  documentNumberHint?: string | null,
): Promise<ReviewPreview | { error: string; needsDocument?: boolean }> {
  const { data: project, error } = await db
    .from("ops_projects")
    .select(
      "id, title, customer_name, contact_person, contact_phone, contact_email, quoted_total_incl_vat, site_province, site_town, xero_quote_numbers, xero_invoice_numbers, xero_contact_id",
    )
    .eq("id", projectId)
    .maybeSingle();
  if (error) return { error: "Could not load this project." };
  if (!project) return { error: "This project no longer exists." };

  const hint = (documentNumberHint ?? "").trim();
  const stored =
    hint ||
    (Array.isArray(project.xero_quote_numbers) && project.xero_quote_numbers[0]) ||
    (Array.isArray(project.xero_invoice_numbers) && project.xero_invoice_numbers[0]) ||
    "";

  if (!stored) {
    return { error: "No Xero quote or invoice linked yet", needsDocument: true };
  }

  const want = normNumber(stored);
  try {
    if (want.startsWith("INV")) {
      const found = await findInvoiceByNumber(db, bridge, want);
      if (!found) return { error: `Could not find ${want} in Xero.` };
      const contactId = found.detail.contact_id?.trim() ?? "";
      if (!contactId) return { error: `${found.number} has no ContactID in Xero. Nothing was changed.` };
      const extras = await fetchXeroContactByIdStrict(bridge, {
        projectId,
        documentNumber: found.number,
        documentContactId: contactId,
      });
      const built = buildRowsFromContact(
        {
          title: project.title,
          customer_name: project.customer_name,
          contact_person: project.contact_person,
          contact_phone: project.contact_phone,
          contact_email: project.contact_email,
          quoted_total_incl_vat: project.quoted_total_incl_vat == null ? null : Number(project.quoted_total_incl_vat),
          site_province: project.site_province,
          site_town: project.site_town,
          xero_quote_numbers: project.xero_quote_numbers,
          xero_invoice_numbers: project.xero_invoice_numbers,
        },
        extras,
        found.number,
        found.detail.total ?? null,
        null,
      );
      return {
        projectId,
        projectTitle: project.title,
        documentNumber: found.number,
        documentKind: "invoice",
        documentContactId: contactId,
        contactId: extras.id!,
        rows: built.rows,
        matchCount: built.matchCount,
      };
    }

    const found = await findQuoteByNumber(db, bridge, want.startsWith("QU") ? want : `QU${want}`);
    if (!found) return { error: `Could not find ${want} in Xero.` };
    const contactId = found.detail.contact_id?.trim() ?? "";
    if (!contactId) return { error: `${found.number} has no ContactID in Xero. Nothing was changed.` };
    const extras = await fetchXeroContactByIdStrict(bridge, {
      projectId,
      documentNumber: found.number,
      documentContactId: contactId,
    });
    const built = buildRowsFromContact(
      {
        title: project.title,
        customer_name: project.customer_name,
        contact_person: project.contact_person,
        contact_phone: project.contact_phone,
        contact_email: project.contact_email,
        quoted_total_incl_vat: project.quoted_total_incl_vat == null ? null : Number(project.quoted_total_incl_vat),
        site_province: project.site_province,
        site_town: project.site_town,
        xero_quote_numbers: project.xero_quote_numbers,
        xero_invoice_numbers: project.xero_invoice_numbers,
      },
      extras,
      found.number,
      found.detail.total ?? null,
      found.detail.title,
    );
    return {
      projectId,
      projectTitle: project.title,
      documentNumber: found.number,
      documentKind: "quote",
      documentContactId: contactId,
      contactId: extras.id!,
      rows: built.rows,
      matchCount: built.matchCount,
    };
  } catch (err) {
    if (err instanceof XeroContactLookupError) return { error: err.message };
    console.error("[xero-review]", err instanceof Error ? err.message : err);
    return { error: "Xero didn't answer, nothing was changed." };
  }
}

export function patchFromAcceptedRows(
  accepted: ReviewApplyItem[],
  contactId: string | null,
): { patch: Record<string, string | number | null>; previous: Record<string, string | null> } {
  const patch: Record<string, string | number | null> = {};
  const previous: Record<string, string | null> = {};
  // previous filled by caller from current row; here we only build the patch keys.
  for (const item of accepted) {
    const value = item.value.trim();
    switch (item.field) {
      case "title":
        if (value) patch.title = value.slice(0, 200);
        break;
      case "customer_name":
        // Client name maps to contact_person; company stays unless empty path used customer_name.
        patch.contact_person = value ? value.slice(0, 200) : null;
        break;
      case "contact_phone":
        patch.contact_phone = value ? value.slice(0, 40) : null;
        break;
      case "contact_email":
        patch.contact_email = value ? value.slice(0, 200) : null;
        break;
      case "xero_number": {
        const n = normNumber(value);
        if (n.startsWith("INV")) patch.xero_invoice_numbers = n; // caller expands to array
        else if (n.startsWith("QU")) patch.xero_quote_numbers = n;
        break;
      }
      case "quoted_total_incl_vat": {
        const n = Number(value.replace(/[\sR,]/g, ""));
        if (Number.isFinite(n) && n >= 0) patch.quoted_total_incl_vat = Math.round(n * 100) / 100;
        break;
      }
      case "location": {
        const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          patch.site_province = parts[0];
          patch.site_town = parts.slice(1).join(", ");
        } else if (parts.length === 1) {
          patch.site_town = parts[0];
        }
        break;
      }
      default:
        break;
    }
  }
  if (contactId && UUID.test(contactId)) patch.xero_contact_id = contactId;
  void previous;
  return { patch, previous };
}
