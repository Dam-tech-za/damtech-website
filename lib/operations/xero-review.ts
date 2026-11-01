/**
 * Per-project "Update from Xero" preview. Never writes until the user accepts
 * rows on the review card. Contact lookup is ContactID-from-document only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { XeroBridgeClient } from "./xero-bridge.ts";
import { BLOCKED_XERO_CONTACT_IDS, locationFromXeroCity, type XeroContactExtras } from "./xero-contact.ts";
import {
  documentKindOf,
  getXeroDocumentWithContact,
  XeroDocumentError,
  type XeroDocumentKind,
  type XeroDocumentWithContact,
} from "./xero-document.ts";

/** Same signature as getXeroDocumentWithContact minus the bridge; bulk runs pass a cached one. */
export type DocumentLookup = (
  kind: XeroDocumentKind,
  number: string,
  context?: { projectId?: string | null; storedContactId?: string | null },
) => Promise<XeroDocumentWithContact>;

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
  /** Fields that already match Xero, shown greyed so you can see they were checked. */
  matched: ReviewRow[];
  /** Fields Xero has nothing for on this contact (e.g. no phone or address). */
  missingInXero: string[];
};

export type ReviewApplyItem = {
  field: ReviewFieldKey;
  value: string;
};

function normNumber(raw: string): string {
  return raw.replace(/[-\s]/g, "").toUpperCase();
}

/** Same number written differently: "074 921 7449" and "+27749217449". */
function samePhone(a: string, b: string): boolean {
  const d = (v: string) => {
    const n = v.replace(/\D/g, "");
    return n.startsWith("0") ? `27${n.slice(1)}` : n;
  };
  return Boolean(d(a)) && d(a) === d(b);
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
  options?: { hideIfEmptyProposed?: boolean; missing?: string[]; same?: (a: string, b: string) => boolean },
) {
  const cur = (current ?? "").trim();
  const prop = (proposed ?? "").trim();
  if (options?.hideIfEmptyProposed && !prop) {
    options.missing?.push(label);
    return;
  }
  const match = Boolean(prop) && (options?.same ?? eq)(cur, prop);
  rows.push({
    field,
    label,
    current: cur,
    proposed: prop,
    defaultAccept: !cur && Boolean(prop) ? true : false,
    match,
  });
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
): { rows: ReviewRow[]; matchCount: number; matched: ReviewRow[]; missingInXero: string[] } {
  const missing: string[] = [];
  const rows: ReviewRow[] = [];
  const clientName = extras.person || extras.name || "";
  const ourClient = project.contact_person || project.customer_name || "";
  const ourXero =
    [...(project.xero_quote_numbers ?? []), ...(project.xero_invoice_numbers ?? [])].join(", ") || "";
  const loc = locationFromXeroCity(extras.city, extras.region);
  const xeroLocation = loc ? locationText(loc.site_province, loc.site_town) : locationText(extras.region, extras.city);

  pushRow(rows, "title", "Project name", project.title, documentTitle || project.title);
  pushRow(rows, "customer_name", "Client name", ourClient, clientName || extras.name || "");
  // Never offer to blank a field because Xero has nothing for it.
  pushRow(rows, "contact_phone", "Phone", project.contact_phone ?? "", extras.phone ?? "", { hideIfEmptyProposed: true, missing, same: samePhone });
  pushRow(rows, "contact_email", "Email", project.contact_email ?? "", extras.email ?? "", { hideIfEmptyProposed: true, missing });
  pushRow(rows, "xero_number", "Xero number", ourXero, documentNumber);
  if (documentTotal !== null) {
    pushRow(rows, "quoted_total_incl_vat", "Total project value (from the quote)", moneyText(project.quoted_total_incl_vat), moneyText(documentTotal));
  }
  pushRow(rows, "location", "Location", locationText(project.site_province, project.site_town), xeroLocation, {
    hideIfEmptyProposed: true,
    missing,
  });

  const matchCount = rows.filter((r) => r.match).length;
  return { rows: rows.filter((r) => !r.match), matchCount, matched: rows.filter((r) => r.match), missingInXero: missing };
}

export async function buildProjectXeroReview(
  db: SupabaseClient,
  bridge: XeroBridgeClient,
  projectId: string,
  documentNumberHint?: string | null,
  lookup?: DocumentLookup,
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
  const kind = documentKindOf(want) ?? documentKindOf(`QU${want}`);
  const number = documentKindOf(want) ? want : `QU${want}`;
  if (!kind) return { error: `“${stored}” isn't a Xero quote or invoice number.` };
  try {
    const found = await (lookup ?? ((k, n, c) => getXeroDocumentWithContact(bridge, k, n, c)))(kind, number, {
      projectId,
      storedContactId: project.xero_contact_id ?? null,
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
      found.contact,
      found.document.number,
      // The project value comes from a quote only, never from an invoice.
      kind === "quote" ? found.document.total : null,
      kind === "quote" ? found.document.title : null,
    );
    // A project still carrying a known wrong contact gets the contact rows
    // pre-ticked: they are corrections, shown as normal rows to accept.
    if (project.xero_contact_id && BLOCKED_XERO_CONTACT_IDS.has(project.xero_contact_id) && project.xero_contact_id !== found.contactId) {
      for (const row of built.rows) {
        if (row.field === "customer_name" || row.field === "contact_phone" || row.field === "contact_email") row.defaultAccept = Boolean(row.proposed);
      }
    }
    return {
      projectId,
      projectTitle: project.title,
      documentNumber: found.document.number,
      documentKind: kind,
      documentContactId: found.contactId,
      contactId: found.contact.id!,
      rows: built.rows,
      matchCount: built.matchCount,
      matched: built.matched,
      missingInXero: built.missingInXero,
    };
  } catch (err) {
    if (err instanceof XeroDocumentError) return { error: err.message };
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
