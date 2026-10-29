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
import { findTownByName } from "@/lib/operations/sa-places";
import { fetchXeroContactById, fillFromXeroContact, locationFromXeroCity } from "@/lib/operations/xero-contact";
import { createXeroBridgeClient, xeroBridgeConfigFromEnv } from "@/lib/operations/xero-bridge";

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
        "id, customer_name, contact_person, contact_phone, contact_email, xero_contact_id, site_province, site_town, site_location, quoted_total_incl_vat, quoted_total_manual, manual_fields, scope, xero_quote_numbers",
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
    if (
      (!manual.client || !manual.phone || !manual.email || !manual.company || !manual.location) &&
      project.xero_contact_id
    ) {
      // ContactID only — never match by customer name (K&S49 overwrite bug).
      const extras = await fetchXeroContactById(bridge, project.xero_contact_id as string);
      if (extras) {
        const fill = fillFromXeroContact(
          {
            customer_name: manual.company ? (project.customer_name as string) : null,
            contact_person: manual.client ? (project.contact_person as string) : null,
            contact_phone: manual.phone ? (project.contact_phone as string) : null,
            contact_email: manual.email ? (project.contact_email as string) : null,
            xero_contact_id: project.xero_contact_id as string | null,
          },
          extras,
        );
        Object.assign(patch, fill);
        if (!manual.location && !project.site_town && !project.site_province) {
          const loc = locationFromXeroCity(extras.city, extras.region);
          if (loc) Object.assign(patch, loc);
        }
      }
    }

    if (!manual.value && !project.quoted_total_manual && project.quoted_total_incl_vat == null) {
      const quotes = Array.isArray(project.xero_quote_numbers) ? (project.xero_quote_numbers as string[]) : [];
      if (quotes[0]) {
        try {
          const rows = await bridge.call<Array<{ number?: string; total?: number; subtotal?: number }>>("get_quotes", {
            status: "ACCEPTED",
            page: 1,
          });
          const match = (rows ?? []).find(
            (q) => String(q.number ?? "").replace(/-/g, "").toUpperCase() === quotes[0].replace(/-/g, "").toUpperCase(),
          );
          if (match?.total != null) {
            patch.quoted_total_incl_vat = match.total;
            patch.quoted_total_excl_vat = match.subtotal ?? null;
          }
        } catch {
          // Optional.
        }
      }
    }

    if (!Object.keys(patch).length) {
      return actionSuccess("Nothing empty to fill from Xero.");
    }
    const result = await applyPatch(db, id, patch);
    if (!result.ok) return actionFailure(result.message);
    refresh(id);
    return actionSuccess("Empty fields filled from Xero.");
  } catch (error) {
    return actionFailure(describeActionError(error));
  }
}

export async function applyXeroTotalAction(payload: { id: string }): Promise<AdminActionState> {
  const id = payload.id?.trim() ?? "";
  if (!UUID.test(id)) return actionFailure("This project could not be found.");
  try {
    const { db } = await adminOpsDb({ permission: "manageOperations" });
    const { data: links } = await db
      .from("ops_xero_invoice_links")
      .select("total_incl_vat, xero_status")
      .eq("project_id", id);
    const live = (links ?? []).filter((l) => {
      const s = String(l.xero_status ?? "").toUpperCase();
      return s === "AUTHORISED" || s === "PAID";
    });
    const total = live.reduce((sum, l) => sum + Number(l.total_incl_vat ?? 0), 0);
    if (total <= 0) return actionFailure("No live Xero invoice total to use.");
    await applyPatch(db, id, {
      quoted_total_incl_vat: Math.round(total * 100) / 100,
      quoted_total_manual: false,
    });
    refresh(id);
    return actionSuccess("Value set from Xero invoices.");
  } catch (error) {
    return actionFailure(describeActionError(error));
  }
}

export { stripBoardMetaFromScope };
