"use server";

import { revalidatePath } from "next/cache";
import {
  actionFailure,
  actionSuccess,
  describeActionError,
  type AdminActionState,
} from "@/lib/admin/action-state";
import { adminOpsDb, isMissingColumnError } from "@/lib/operations/admin-db";
import {
  isPaymentLabel,
  normalisePhoneInput,
  parseBoardMetaFromScope,
  splitXeroNumbers,
  stripBoardMetaFromScope,
  writeBoardMetaIntoScope,
  type BoardManualField,
} from "@/lib/operations/board-meta";
import { distancesFromPoint, locationPatch } from "@/lib/operations/distance";
import { loadSavedLeads } from "@/lib/operations/project-leads";
import { findTownByName } from "@/lib/operations/sa-places";
import { fillFromXeroContact, locationFromXeroCity } from "@/lib/operations/xero-contact";
import { documentKindOf, getXeroDocumentWithContact, XeroDocumentError } from "@/lib/operations/xero-document";
import { createXeroBridgeClient, xeroBridgeConfigFromEnv } from "@/lib/operations/xero-bridge";
import { refreshProjectXeroCache } from "@/lib/operations/xero-money-refresh";
import { todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { PROJECT_SERVICES } from "@/lib/operations/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function refresh(id?: string) {
  revalidatePath("/admin/operations/projects/");
  revalidatePath("/admin/operations/");
  if (id) revalidatePath(`/admin/operations/projects/${id}/`);
}

async function markManual(
  db: Awaited<ReturnType<typeof adminOpsDb>>["db"],
  id: string,
  fields: BoardManualField[],
  existingManual: Record<string, unknown> | null,
) {
  const next = { ...(existingManual ?? {}) };
  for (const f of fields) next[f] = true;
  const { error } = await db.from("ops_projects").update({ manual_fields: next }).eq("id", id);
  if (error && isMissingColumnError(error)) {
    const { data } = await db.from("ops_projects").select("scope").eq("id", id).maybeSingle();
    const meta = parseBoardMetaFromScope(data?.scope as string | null);
    const manual = { ...(meta.manual ?? {}) };
    for (const f of fields) manual[f] = true;
    const scope = writeBoardMetaIntoScope(data?.scope as string | null, { ...meta, manual });
    await db.from("ops_projects").update({ scope }).eq("id", id);
  }
}

type PatchResult = { ok: true } | { ok: false; message: string };

async function applyPatch(
  db: Awaited<ReturnType<typeof adminOpsDb>>["db"],
  id: string,
  patch: Record<string, unknown>,
): Promise<PatchResult> {
  const { error } = await db.from("ops_projects").update(patch).eq("id", id);
  if (!error) return { ok: true };
  if (!isMissingColumnError(error)) return { ok: false, message: describeActionError(error) };

  // Drop unknown columns and retry (pre-migration databases).
  const retry = { ...patch };
  for (const key of [
    "project_lead_name",
    "payment_label_override",
    "quoted_total_manual",
    "manual_fields",
    "site_place_id",
    "site_lat",
    "site_lng",
  ]) {
    delete retry[key];
  }
  if (!Object.keys(retry).length) return { ok: true };
  const second = await db.from("ops_projects").update(retry).eq("id", id);
  if (second.error) return { ok: false, message: describeActionError(second.error) };
  return { ok: true };
}

export type BoardFieldPayload = {
  id: string;
  field: string;
  value: string;
  /** Optional extras for location / client. */
  extra?: string;
};

/**
 * Optimistic cell save from the board or peek drawer. Empty values are allowed.
 * Marks the field as staff-owned so Xero fill-blanks will not overwrite it.
 */
export async function updateBoardFieldAction(payload: BoardFieldPayload): Promise<AdminActionState> {
  const id = payload.id?.trim() ?? "";
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  const field = payload.field?.trim() ?? "";
  const value = payload.value ?? "";

  try {
    const { db } = await adminOpsDb({ permission: "manageOperations" });
    const { data: row, error: readError } = await db
      .from("ops_projects")
      .select(
        "id, scope, crew, project_lead_name, payment_label_override, manual_fields, quoted_total_manual, contact_person, contact_phone, customer_name, site_location, site_province, site_town",
      )
      .eq("id", id)
      .maybeSingle();
    if (readError && !isMissingColumnError(readError)) throw readError;

    let project = row as Record<string, unknown> | null;
    if (!project || readError) {
      const fallback = await db
        .from("ops_projects")
        .select("id, scope, crew, contact_person, contact_phone, customer_name, site_location, site_province, site_town")
        .eq("id", id)
        .maybeSingle();
      if (fallback.error) throw fallback.error;
      project = fallback.data as Record<string, unknown> | null;
    }
    if (!project) return actionFailure("This project no longer exists.");

    const scopeMeta = parseBoardMetaFromScope(project.scope as string | null);
    const manualCols = (project.manual_fields as Record<string, boolean> | null) ?? scopeMeta.manual ?? {};
    const patch: Record<string, unknown> = {};
    let manualFields: BoardManualField[] = [];

    switch (field) {
      case "title": {
        patch.title = value.trim().slice(0, 200) || "Untitled project";
        manualFields = ["title"];
        break;
      }
      case "lead": {
        const lead = value.trim().slice(0, 120);
        // The Person list is the master list: only its names (or no lead) may be set.
        const saved = await loadSavedLeads(db);
        const currentLead = String(project.project_lead_name ?? project.crew ?? "").trim().toLowerCase();
        if (lead && saved && lead.toLowerCase() !== currentLead && !saved.some((n) => n.toLowerCase() === lead.toLowerCase())) {
          return actionFailure(`${lead} is not on the Person list. Add them there first.`);
        }
        patch.project_lead_name = lead || null;
        patch.crew = lead || null;
        const meta = writeBoardMetaIntoScope(project.scope as string | null, { ...scopeMeta, lead: lead || null });
        patch.scope = meta;
        manualFields = ["lead"];
        break;
      }
      case "payment": {
        const trimmed = value.trim();
        if (trimmed && !isPaymentLabel(trimmed)) return actionFailure("Choose a payment status.");
        const label = trimmed && isPaymentLabel(trimmed) ? trimmed : null;
        patch.payment_label_override = label;
        patch.scope = writeBoardMetaIntoScope(project.scope as string | null, { ...scopeMeta, payment: label });
        manualFields = ["payment"];
        break;
      }
      case "client": {
        patch.contact_person = value.trim().slice(0, 200) || null;
        manualFields = ["client"];
        break;
      }
      case "phone": {
        patch.contact_phone = normalisePhoneInput(value);
        manualFields = ["phone"];
        break;
      }
      case "email": {
        patch.contact_email = value.trim().slice(0, 200) || null;
        manualFields = ["email"];
        break;
      }
      case "company": {
        patch.customer_name = value.trim().slice(0, 200);
        manualFields = ["company"];
        break;
      }
      case "service": {
        if (!(PROJECT_SERVICES as readonly string[]).includes(value)) return actionFailure("Choose a project type.");
        patch.service = value;
        manualFields = ["service"];
        break;
      }
      case "value": {
        const raw = value.trim().replace(/[\sR,]/gi, "");
        if (!raw) {
          patch.quoted_total_incl_vat = null;
        } else {
          const n = Number(raw);
          if (!Number.isFinite(n) || n < 0) return actionFailure("Enter a valid amount in rand.");
          patch.quoted_total_incl_vat = Math.round(n * 100) / 100;
        }
        patch.quoted_total_manual = true;
        manualFields = ["value"];
        break;
      }
      case "xero": {
        const { quotes, invoices } = splitXeroNumbers(value);
        patch.xero_quote_numbers = quotes;
        patch.xero_invoice_numbers = invoices;
        manualFields = ["xero"];
        break;
      }
      case "location": {
        const typed = value.trim().slice(0, 300);
        const townHit = findTownByName(typed) || findTownByName(typed.split(",").pop() ?? "");
        if (townHit) {
          const loc = locationPatch(townHit.province, townHit.name);
          Object.assign(patch, loc);
          patch.site_location = `${townHit.province}, ${townHit.name}`;
          patch.site_lat = townHit.lat;
          patch.site_lng = townHit.lng;
          patch.site_place_id = null;
        } else if (typed) {
          // Free text / "Province, Town" without a curated match.
          const parts = typed.split(",").map((p) => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            const loc = locationPatch(parts[0], parts.slice(1).join(", "));
            Object.assign(patch, loc);
          } else {
            patch.site_town = typed.slice(0, 80);
            patch.site_province = null;
            patch.km_from_pretoria = null;
            patch.km_from_western_cape = null;
            patch.one_way_km = null;
          }
          patch.site_location = typed;
          patch.site_lat = null;
          patch.site_lng = null;
          patch.site_place_id = null;
        } else {
          patch.site_location = null;
          patch.site_province = null;
          patch.site_town = null;
          patch.km_from_pretoria = null;
          patch.km_from_western_cape = null;
          patch.one_way_km = null;
          patch.site_lat = null;
          patch.site_lng = null;
          patch.site_place_id = null;
        }
        // Optional lat/lng from Places (extra = "lat,lng,placeId").
        const extra = (payload.extra ?? "").trim();
        if (extra) {
          const [latS, lngS, placeId] = extra.split(",");
          const lat = Number(latS);
          const lng = Number(lngS);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const km = distancesFromPoint(lat, lng);
            patch.site_lat = lat;
            patch.site_lng = lng;
            patch.km_from_pretoria = km.km_from_pretoria;
            patch.km_from_western_cape = km.km_from_western_cape;
            patch.one_way_km = km.one_way_km;
            if (placeId) patch.site_place_id = placeId.slice(0, 200);
          }
        }
        manualFields = ["location"];
        break;
      }
      case "notes": {
        const meta = parseBoardMetaFromScope(project.scope as string | null);
        patch.scope = writeBoardMetaIntoScope(value, meta);
        manualFields = ["notes"];
        break;
      }
      case "next_action": {
        patch.next_action = value.trim().slice(0, 500) || "Fill in the site, scope and dates";
        manualFields = ["next_action"];
        break;
      }
      case "next_action_due": {
        const due = value.trim();
        if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) return actionFailure("Choose a valid date.");
        patch.next_action_due = due || null;
        manualFields = ["next_action"];
        break;
      }
      case "stage": {
        const allowed = ["awaiting_deposit", "planning", "scheduled", "in_progress", "handover", "completed"];
        if (!allowed.includes(value)) return actionFailure("Choose a stage.");
        patch.stage = value;
        if (value === "completed") patch.completed_at = new Date().toISOString();
        break;
      }
      default:
        return actionFailure("That field cannot be edited here.");
    }

    const result = await applyPatch(db, id, patch);
    if (!result.ok) return actionFailure(result.message);
    if (manualFields.length) await markManual(db, id, manualFields, manualCols as Record<string, unknown>);

    // Clear needs_review once staff touch the row.
    await db.from("ops_projects").update({ needs_review: false }).eq("id", id);

    refresh(id);
    return actionSuccess("Saved");
  } catch (error) {
    return actionFailure(describeActionError(error));
  }
}

/** Fill only empty fields from the linked Xero contact / quote totals. */
export async function refreshProjectFromXeroAction(payload: { id: string }): Promise<AdminActionState> {
  const id = payload.id?.trim() ?? "";
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  try {
    const { db } = await adminOpsDb({ permission: "manageOperations" });
    const { data: project, error } = await db
      .from("ops_projects")
      .select(
        "id, customer_name, contact_person, contact_phone, contact_email, xero_contact_id, site_province, site_town, site_location, quoted_total_incl_vat, quoted_total_manual, manual_fields, scope, xero_quote_numbers, xero_invoice_numbers",
      )
      .eq("id", id)
      .maybeSingle();
    if (error && !isMissingColumnError(error)) throw error;
    if (!project) return actionFailure("This project no longer exists.");

    const meta = parseBoardMetaFromScope(project.scope as string | null);
    const manual = {
      ...((project.manual_fields as Record<string, boolean> | null) ?? {}),
      ...(meta.manual ?? {}),
    };
    const config = xeroBridgeConfigFromEnv();
    if (!config) return actionFailure("The Xero connection is not set up on this site.");
    const bridge = createXeroBridgeClient(config);

    const patch: Record<string, unknown> = {};
    const quotes = Array.isArray(project.xero_quote_numbers) ? (project.xero_quote_numbers as string[]) : [];
    const invoices = Array.isArray(project.xero_invoice_numbers) ? (project.xero_invoice_numbers as string[]) : [];
    const number = quotes[0] ?? invoices[0] ?? null;
    if (!number) return actionFailure("No Xero quote or invoice number on this project yet.");
    const kind = documentKindOf(number);
    if (!kind) return actionFailure(`“${number}” isn't a Xero quote or invoice number.`);

    // Document → its ContactID → that contact. Never a name search or a list.
    let found;
    try {
      found = await getXeroDocumentWithContact(bridge, kind, number, {
        projectId: id,
        storedContactId: (project.xero_contact_id as string | null) ?? null,
      });
    } catch (error) {
      if (error instanceof XeroDocumentError) return actionFailure(error.message);
      throw error;
    }

    if (!manual.client || !manual.phone || !manual.email || !manual.company || !manual.location) {
      const fill = fillFromXeroContact(
        // Only empty fields are filled; anything already on the project stays
        // (changes to filled values go through the From Xero review card).
        {
          customer_name: project.customer_name as string | null,
          contact_person: project.contact_person as string | null,
          contact_phone: project.contact_phone as string | null,
          contact_email: project.contact_email as string | null,
          xero_contact_id: project.xero_contact_id as string | null,
        },
        found.contact,
      );
      Object.assign(patch, fill);
      if (!manual.location && !project.site_town && !project.site_province) {
        const loc = locationFromXeroCity(found.contact.city, found.contact.region);
        if (loc) Object.assign(patch, loc);
      }
    }

    if (kind === "quote" && !manual.value && !project.quoted_total_manual && project.quoted_total_incl_vat == null && found.document.total != null) {
      patch.quoted_total_incl_vat = found.document.total;
    }

    // Re-read the linked invoices and quotes so paid / owed are current.
    const cache = await refreshProjectXeroCache(db, bridge, id, todayInSouthAfrica());
    const money = cache.invoices || cache.quotes
      ? ` Invoices and quotes refreshed (${cache.invoices + cache.quotes}).${cache.errors.length ? ` Not refreshed: ${cache.errors.join("; ")}.` : ""}`
      : "";
    if (!Object.keys(patch).length) {
      refresh(id);
      return actionSuccess(`Nothing empty to fill from Xero.${money}`);
    }
    const result = await applyPatch(db, id, patch);
    if (!result.ok) return actionFailure(result.message);
    refresh(id);
    return actionSuccess(`Empty fields filled from Xero.${money}`);
  } catch (error) {
    return actionFailure(describeActionError(error));
  }
}

export async function applyXeroTotalAction(payload: { id: string }): Promise<AdminActionState> {
  const id = payload.id?.trim() ?? "";
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  try {
    const { db } = await adminOpsDb({ permission: "manageOperations" });
    // The project value is the primary (first) linked quote's total. Invoices never set it.
    const { data: project } = await db.from("ops_projects").select("xero_quote_numbers").eq("id", id).maybeSingle();
    const primary = ((project?.xero_quote_numbers as string[] | null) ?? [])[0];
    if (!primary) return actionFailure("Link the accepted quote first; the value comes from the quote, not from invoices.");
    const { data: link } = await db
      .from("ops_xero_quote_links")
      .select("total_incl_vat")
      .eq("project_id", id)
      .eq("quote_number", primary)
      .maybeSingle();
    let total = link?.total_incl_vat == null ? null : Number(link.total_incl_vat);
    if (total === null) {
      const config = xeroBridgeConfigFromEnv();
      if (!config) return actionFailure("The Xero connection is not set up on this site.");
      const q = await createXeroBridgeClient(config).call<{ total: number | null }>("get_quote", { quote_number: primary });
      total = q?.total ?? null;
    }
    if (total === null || total <= 0) return actionFailure(`Xero has no total for ${primary}.`);
    await applyPatch(db, id, {
      quoted_total_incl_vat: Math.round(total * 100) / 100,
      quoted_total_manual: false,
    });
    refresh(id);
    return actionSuccess(`Value set from quote ${primary}.`);
  } catch (error) {
    return actionFailure(describeActionError(error));
  }
}

export { stripBoardMetaFromScope };
