/**
 * Safe contact fill from Xero: resolve ContactID from linked quote/invoice only,
 * fill empty fields only, and record every change for undo.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { XeroBridgeClient, XeroInvoiceSummary, XeroQuoteDetail } from "./xero-bridge.ts";
import { fetchXeroContactById, fillFromXeroContact, locationFromXeroCity, type XeroContactExtras } from "./xero-contact.ts";
import { parseToE164 } from "./phone-parse.ts";

export type FieldChange = {
  projectId: string;
  projectTitle: string;
  field: "contact_person" | "contact_email" | "contact_phone" | "customer_name" | "xero_contact_id" | "site_province" | "site_town";
  from: string | null;
  to: string | null;
};

export type BackfillPreview = {
  changes: FieldChange[];
  skippedNoContactId: string[];
  skippedNoPhoneInXero: string[];
  dualContactFlags: string[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function contactIdFromInvoice(
  bridge: XeroBridgeClient,
  invoiceId: string | null,
): Promise<string | null> {
  if (!invoiceId || !UUID.test(invoiceId)) return null;
  try {
    const inv = await bridge.call<XeroInvoiceSummary>("get_invoice", { invoice_id: invoiceId });
    return inv.contact_id && UUID.test(inv.contact_id) ? inv.contact_id : null;
  } catch {
    return null;
  }
}

async function contactIdFromQuote(
  bridge: XeroBridgeClient,
  quoteId: string | null,
): Promise<string | null> {
  if (!quoteId || !UUID.test(quoteId)) return null;
  try {
    const q = await bridge.call<XeroQuoteDetail>("get_quote", { quote_id: quoteId });
    return q.contact_id && UUID.test(q.contact_id) ? q.contact_id : null;
  } catch {
    return null;
  }
}

/**
 * Prefer invoice ContactID (more likely the bill-to contact), then quote,
 * then the project's stored xero_contact_id only if it is a UUID.
 */
export async function resolveProjectContactId(
  db: SupabaseClient,
  bridge: XeroBridgeClient,
  project: { id: string; xero_contact_id?: string | null },
): Promise<{ contactId: string | null; dualContacts: boolean }> {
  const [{ data: invoices }, { data: quotes }] = await Promise.all([
    db.from("ops_xero_invoice_links").select("xero_invoice_id").eq("project_id", project.id).limit(5),
    db.from("ops_xero_quote_links").select("xero_quote_id").eq("project_id", project.id).limit(5),
  ]);

  const invoiceIds = (invoices ?? []).map((r) => r.xero_invoice_id as string).filter(Boolean);
  const quoteIds = (quotes ?? []).map((r) => r.xero_quote_id as string).filter(Boolean);

  const contactIds = new Set<string>();
  for (const id of invoiceIds) {
    const c = await contactIdFromInvoice(bridge, id);
    if (c) contactIds.add(c);
  }
  // Prefer invoice contact when any invoice is linked.
  if (contactIds.size === 1) return { contactId: [...contactIds][0], dualContacts: false };
  if (contactIds.size > 1) {
    // Still return the first invoice's contact but flag dual.
    const first = await contactIdFromInvoice(bridge, invoiceIds[0] ?? null);
    return { contactId: first, dualContacts: true };
  }

  for (const id of quoteIds) {
    const c = await contactIdFromQuote(bridge, id);
    if (c) contactIds.add(c);
  }
  if (contactIds.size >= 1) {
    return { contactId: [...contactIds][0], dualContacts: contactIds.size > 1 };
  }

  const stored = project.xero_contact_id?.trim() ?? "";
  if (stored && UUID.test(stored)) return { contactId: stored, dualContacts: false };
  return { contactId: null, dualContacts: false };
}

function pushChange(
  changes: FieldChange[],
  project: { id: string; title: string },
  field: FieldChange["field"],
  from: string | null | undefined,
  to: string | null | undefined,
) {
  const a = (from ?? "").trim() || null;
  const b = (to ?? "").trim() || null;
  if (a === b || !b) return;
  // Only fill empties.
  if (a) return;
  changes.push({ projectId: project.id, projectTitle: project.title, field, from: a, to: b });
}

export async function previewContactBackfill(
  db: SupabaseClient,
  bridge: XeroBridgeClient,
  projects: Array<{
    id: string;
    title: string;
    customer_name: string | null;
    contact_person: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    xero_contact_id: string | null;
    site_province?: string | null;
    site_town?: string | null;
    xero_quote_numbers?: string[] | null;
    xero_invoice_numbers?: string[] | null;
  }>,
  customerPhoneByName: Map<string, string>,
): Promise<BackfillPreview> {
  const changes: FieldChange[] = [];
  const skippedNoContactId: string[] = [];
  const skippedNoPhoneInXero: string[] = [];
  const dualContactFlags: string[] = [];

  for (const project of projects) {
    const hasLink =
      (project.xero_quote_numbers?.length ?? 0) > 0 ||
      (project.xero_invoice_numbers?.length ?? 0) > 0 ||
      Boolean(project.xero_contact_id);
    if (!hasLink) {
      skippedNoContactId.push(project.title);
      continue;
    }

    const resolved = await resolveProjectContactId(db, bridge, project);
    if (resolved.dualContacts) dualContactFlags.push(project.title);
    if (!resolved.contactId) {
      skippedNoContactId.push(project.title);
      continue;
    }

    const extras = await fetchXeroContactById(bridge, resolved.contactId);
    if (!extras) {
      skippedNoContactId.push(project.title);
      continue;
    }

    const patch = fillFromXeroContact(
      {
        customer_name: project.customer_name,
        contact_person: project.contact_person,
        contact_phone: project.contact_phone,
        contact_email: project.contact_email,
        xero_contact_id: project.xero_contact_id,
      },
      extras,
    );

    // Customer-record phone fallback when Xero has none.
    if (!project.contact_phone?.trim() && !patch.contact_phone) {
      const key = (project.contact_person || project.customer_name || "").trim().toLowerCase();
      const fromCustomer = key ? customerPhoneByName.get(key) : undefined;
      const e164 = fromCustomer ? parseToE164(fromCustomer) : null;
      if (e164) patch.contact_phone = e164;
    }

    pushChange(changes, project, "customer_name", project.customer_name, patch.customer_name as string | undefined);
    pushChange(changes, project, "contact_person", project.contact_person, patch.contact_person as string | undefined);
    pushChange(changes, project, "contact_email", project.contact_email, patch.contact_email as string | undefined);
    pushChange(changes, project, "contact_phone", project.contact_phone, patch.contact_phone as string | undefined);
    pushChange(changes, project, "xero_contact_id", project.xero_contact_id, resolved.contactId);

    if (!project.site_town && !project.site_province) {
      const loc = locationFromXeroCity(extras.city, extras.region);
      if (loc?.site_province) pushChange(changes, project, "site_province", project.site_province, loc.site_province);
      if (loc?.site_town) pushChange(changes, project, "site_town", project.site_town, loc.site_town);
    }

    if (!project.contact_phone?.trim() && !patch.contact_phone) {
      skippedNoPhoneInXero.push(project.title);
    }
  }

  return { changes, skippedNoContactId, skippedNoPhoneInXero, dualContactFlags };
}

export async function applyFieldChanges(
  db: SupabaseClient,
  changes: FieldChange[],
): Promise<number> {
  const byProject = new Map<string, Record<string, string | null>>();
  for (const c of changes) {
    const row = byProject.get(c.projectId) ?? {};
    row[c.field] = c.to;
    byProject.set(c.projectId, row);
  }
  let n = 0;
  for (const [id, patch] of byProject) {
    const { error } = await db.from("ops_projects").update(patch).eq("id", id);
    if (!error) n += 1;
    else console.error("[operations] apply field change failed:", id, error.message);
  }
  return n;
}

export async function undoFieldChanges(db: SupabaseClient, changes: FieldChange[]): Promise<number> {
  const byProject = new Map<string, Record<string, string | null>>();
  for (const c of changes) {
    const row = byProject.get(c.projectId) ?? {};
    // Restore previous value (may be null).
    row[c.field] = c.from;
    byProject.set(c.projectId, row);
  }
  let n = 0;
  for (const [id, patch] of byProject) {
    const { error } = await db.from("ops_projects").update(patch).eq("id", id);
    if (!error) n += 1;
  }
  return n;
}

/** Hard-coded restore for the K&S49 overwrite (owner-verified from Xero). */
export const K_AND_S49_RESTORE: Array<{
  match: RegExp;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  flagDualContact?: boolean;
}> = [
  {
    match: /francois|ppcf/i,
    contact_person: "Francois Joubert",
    contact_email: "francois@ppcf.co.za",
    contact_phone: "+27832800970",
    flagDualContact: true,
  },
  { match: /pexmart/i, contact_person: "Pexmart", contact_email: null, contact_phone: null },
  {
    match: /sharetech/i,
    contact_person: "Henry Arendse",
    contact_email: "tara@sharetechsa.co.za",
    contact_phone: null,
  },
  {
    match: /boscobel/i,
    contact_person: "Jannie Odendal",
    contact_email: "jannie@boscobel.net",
    contact_phone: "+27768461543",
  },
  {
    match: /hire\s*eng/i,
    contact_person: null,
    contact_email: "Admin@hireng.co.za",
    contact_phone: null,
  },
  {
    match: /clinton/i,
    contact_person: null,
    contact_email: "Clinton@inimitablevenue.com",
    contact_phone: null,
  },
  {
    match: /dryers/i,
    contact_person: "Catherine de Villiers",
    contact_email: "cath@dryersforafrica.co.za",
    contact_phone: "+27714988436",
  },
  {
    match: /alfred|mensah|qu0348/i,
    contact_person: null, // leave name
    contact_email: null, // leave email
    contact_phone: "+27749217449",
  },
];

export function restorePatchForTitle(
  title: string,
  current: { contact_person: string | null; contact_email: string | null; contact_phone: string | null },
): { patch: Record<string, string | null | boolean>; dual: boolean } | null {
  const rule = K_AND_S49_RESTORE.find((r) => r.match.test(title));
  if (!rule) return null;
  const patch: Record<string, string | null | boolean> = {};
  // Force-correct person/email when they were overwritten with K&S49 / Sharon.
  const looksCorrupted =
    /k\s*&\s*s\s*49/i.test(current.contact_person ?? "") ||
    /sharon@silvertonmidas/i.test(current.contact_email ?? "") ||
    /k\s*&\s*s\s*49/i.test(current.contact_email ?? "");

  if (rule.contact_person !== null && (looksCorrupted || !current.contact_person?.trim())) {
    patch.contact_person = rule.contact_person;
  }
  if (rule.contact_email !== null && (looksCorrupted || !current.contact_email?.trim())) {
    patch.contact_email = rule.contact_email;
  }
  // Alfred: only fill phone when empty; also clear K&S corruption on phone if any.
  if (rule.contact_phone !== null && (looksCorrupted || !current.contact_phone?.trim())) {
    patch.contact_phone = rule.contact_phone;
  }
  // Hire / Clinton: person null means leave company-as-client; if corrupted, clear to empty then company shows.
  if (rule.contact_person === null && looksCorrupted) {
    patch.contact_person = "";
  }
  if (rule.contact_email === null && looksCorrupted && /sharon@silvertonmidas/i.test(current.contact_email ?? "")) {
    patch.contact_email = "";
  }
  if (rule.flagDualContact) patch.xero_dual_contact = true;
  if (!Object.keys(patch).length) return null;
  return { patch, dual: Boolean(rule.flagDualContact) };
}

export type { XeroContactExtras };
