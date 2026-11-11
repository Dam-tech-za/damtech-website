"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { assertAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { describeActionError } from "@/lib/admin/action-state";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  COURIER_DEPOTS,
  courierDepotForProvince,
  getCourierConfig,
  getCourierRates,
  isCourierDepotId,
  parseParcel,
  withCourierDepot,
  type CourierDepotId,
  type CourierRate,
  type ParcelInput,
} from "@/lib/courier";
import {
  buildCourierQuoteLine,
  checkJob,
  declaredValueFor,
  linerJobAsCourierOrder,
  parcelsForQuantity,
  type LinerCourierJob,
} from "@/lib/courier/liner-quote";
import { addCourierLineToQuote } from "@/lib/quotes/add-courier-line";

const PAGE = "/admin/operations/liner-courier/";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidOrNull = (value: unknown) => (typeof value === "string" && UUID.test(value) ? value : null);

export type LinerShape = "circular" | "rectangular";
export type ParcelSource = "folded" | "catalogue_rule" | "manual";

export type LinerRatesRequest = {
  historyId?: string | null;
  job: LinerCourierJob;
  depot: CourierDepotId | "auto";
  parcel: ParcelInput;
  quantity: number;
  shape: LinerShape;
  inputs: Record<string, unknown>;
  areaM2: number;
  gsm: number;
  parcelSource: ParcelSource;
  rfqId?: string | null;
  quoteId?: string | null;
};

export type LinerRatesResult = {
  ok: boolean;
  message: string;
  rates?: CourierRate[];
  depot?: CourierDepotId;
  depotLabel?: string;
  collection?: string;
  historyId?: string | null;
  ratedAt?: string;
};

const fail = (message: string) => ({ ok: false as const, message });

/** Where to collect from: the admin's choice, else nearest to the customer. */
function pickDepot(requested: unknown, province: string) {
  const config = getCourierConfig();
  if (!config.ok) return { error: `${config.reason}${config.missing.length ? ` Missing: ${config.missing.join(", ")}.` : ""}` };
  const depot: CourierDepotId =
    isCourierDepotId(requested) && config.config.depots[requested] ? requested : courierDepotForProvince(config.config, province);
  const chosen = withCourierDepot(config.config, depot);
  const address = chosen.sender.address;
  return {
    error: null,
    depot,
    config: chosen,
    depotLabel: COURIER_DEPOTS[depot],
    collection: `${COURIER_DEPOTS[depot]} depot, ${address.street_address}, ${address.local_area}, ${address.city}, ${address.code}`,
  };
}

/** Save (or update) the history row. Returns null if the table is not there yet. */
async function saveHistory(
  adminId: string,
  request: LinerRatesRequest,
  patch: Record<string, unknown>,
): Promise<{ id: string | null; note: string }> {
  const db = createServiceRoleClient();
  const row = {
    updated_at: new Date().toISOString(),
    reference: request.job.reference.trim() || null,
    customer_name: request.job.customerName.trim() || null,
    shape: request.shape,
    inputs: request.inputs,
    area_m2: request.areaM2,
    gsm: Math.round(request.gsm),
    quantity: Math.max(1, Math.floor(request.quantity) || 1),
    weight_kg: request.parcel.weightKg,
    parcel_length_cm: request.parcel.lengthCm,
    parcel_width_cm: request.parcel.widthCm,
    parcel_height_cm: request.parcel.heightCm,
    parcel_source: request.parcelSource,
    delivery_address: {
      customerName: request.job.customerName,
      companyName: request.job.companyName ?? "",
      phone: request.job.phone,
      email: request.job.email,
      street: request.job.street,
      suburb: request.job.suburb,
      city: request.job.city,
      province: request.job.province,
      postalCode: request.job.postalCode,
    },
    declared_value: declaredValueFor(request.job.declaredValue).value,
    rfq_id: uuidOrNull(request.rfqId),
    quote_id: uuidOrNull(request.quoteId),
    notes: request.job.notes?.trim() || null,
    ...patch,
  };
  const id = uuidOrNull(request.historyId);
  const result = id
    ? await db.from("liner_courier_quotes").update(row).eq("id", id).select("id").single()
    : await db.from("liner_courier_quotes").insert({ ...row, created_by: adminId }).select("id").single();
  if (result.error || !result.data) {
    console.error("[liner-courier] history not saved:", result.error?.message);
    return { id: null, note: " Not saved to history yet (the liner courier database update is not applied)." };
  }
  return { id: String(result.data.id), note: "" };
}

/**
 * Courier Guy rates for any address and parcel: no shop order needed.
 * Books nothing. The same client and payloads as Online purchases.
 */
export async function courierRatesForParcelAction(request: LinerRatesRequest): Promise<LinerRatesResult> {
  try {
    const admin = await assertAdmin({ permission: "manageOrders" });
    const check = checkJob(request.job);
    if (!check.ok) return fail(check.error);
    const parcel = parseParcel((name) => {
      const map: Record<string, number> = {
        length_cm: request.parcel.lengthCm,
        width_cm: request.parcel.widthCm,
        height_cm: request.parcel.heightCm,
        weight_kg: request.parcel.weightKg,
      };
      return map[name];
    });
    if (!parcel) return fail("Enter the packed length, width and height in cm and the weight in kg.");
    const picked = pickDepot(request.depot, request.job.province);
    if (picked.error !== null) return fail(picked.error);

    const parcels = parcelsForQuantity(parcel, request.quantity);
    const result = await getCourierRates(picked.config, linerJobAsCourierOrder(request.job), parcels);
    if (!result.ok) return fail(result.error);

    const ratedAt = new Date().toISOString();
    const history = await saveHistory(admin.user.id, { ...request, parcel }, {
      depot: picked.depot,
      courier_rates: result.data,
      rated_at: ratedAt,
    });
    const declared = declaredValueFor(request.job.declaredValue);
    const notes = [
      `Rates from The Courier Guy, collecting from ${picked.depotLabel}. Nothing is booked. Rates expire after about 5 minutes for booking, so re-rate before relying on one.`,
      declared.capped ? "The declared value was capped at R30 000 (the Courier Guy limit)." : "",
      result.declaredValueDropped
        ? `Courier Guy refused the declared value of R${result.declaredValueDropped.toFixed(2)}, so these rates are without one.`
        : "",
    ].filter(Boolean);
    revalidatePath(PAGE);
    return {
      ok: true,
      message: notes.join(" ") + history.note,
      rates: result.data,
      depot: picked.depot,
      depotLabel: picked.depotLabel,
      collection: picked.collection,
      historyId: history.id,
      ratedAt,
    };
  } catch (error) {
    unstable_rethrow(error);
    return fail(describeActionError(error));
  }
}

/** Save the job without asking the courier (e.g. to come back to later). */
export async function saveLinerCourierDraftAction(request: LinerRatesRequest): Promise<LinerRatesResult> {
  try {
    const admin = await assertAdmin({ permission: "manageOrders" });
    const picked = pickDepot(request.depot, request.job.province);
    const depot = picked.error === null ? picked.depot : isCourierDepotId(request.depot) ? request.depot : "pretoria";
    const history = await saveHistory(admin.user.id, request, { depot });
    if (!history.id) return fail(history.note.trim());
    revalidatePath(PAGE);
    return { ok: true, message: "Saved to history.", historyId: history.id };
  } catch (error) {
    unstable_rethrow(error);
    return fail(describeActionError(error));
  }
}

export type FormalQuoteStatus = "brief_copied" | "portal_opened";

/**
 * Note that a formal quote was asked for through the portal / brief. The
 * Courier Guy API has no quote endpoint we can rely on (see
 * docs/development/liner-courier-quotes.md), so nothing is sent to them here.
 */
export async function recordFormalQuoteAction(input: {
  historyId: string | null;
  status: FormalQuoteStatus;
  reference?: string;
}): Promise<{ ok: boolean; message: string }> {
  try {
    await assertAdmin({ permission: "manageOrders" });
    const id = uuidOrNull(input.historyId);
    if (!id) return { ok: false, message: "Get a rate or save the job first, so the request is kept in history." };
    if (input.status !== "brief_copied" && input.status !== "portal_opened") return fail("Unknown status.");
    const db = createServiceRoleClient();
    const { error } = await db
      .from("liner_courier_quotes")
      .update({
        formal_quote_status: input.status,
        formal_quote_ref: input.reference?.trim().slice(0, 120) || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return fail("Could not save this to history.");
    revalidatePath(PAGE);
    return { ok: true, message: input.status === "portal_opened" ? "Noted: portal opened with the brief." : "Noted: quote brief copied." };
  } catch (error) {
    unstable_rethrow(error);
    return fail(describeActionError(error));
  }
}

export type AddToQuoteRequest = {
  quoteId: string;
  historyId: string | null;
  rate: Pick<CourierRate, "serviceCode" | "serviceName" | "rate" | "rateExVat">;
  parcel: ParcelInput;
  quantity: number;
  depotLabel: string;
  city: string;
  markupPercent?: number;
  sellExVat?: number | null;
};

/** Put the chosen courier rate on a draft quotation as a delivery line. */
export async function addCourierToQuoteAction(request: AddToQuoteRequest): Promise<{ ok: boolean; message: string }> {
  try {
    const admin = await assertAdmin({ permission: "manageOrders" });
    if (!canPerform(admin.profile.role, "manageQuotes")) return fail("Your role cannot change quotations.");
    const quoteId = uuidOrNull(request.quoteId);
    if (!quoteId) return fail("Link a quotation first (search by its number).");
    const rate = Number(request.rate?.rate);
    if (!Number.isFinite(rate) || rate <= 0 || !request.rate.serviceCode) return fail("Choose a Courier Guy service first.");
    const line = buildCourierQuoteLine(
      {
        rate: { ...request.rate, rate },
        parcel: request.parcel,
        quantity: request.quantity,
        depotLabel: request.depotLabel,
        city: request.city,
        markupPercent: request.markupPercent,
        sellExVat: request.sellExVat,
        courierQuoteId: uuidOrNull(request.historyId),
      },
      0,
    );
    const saved = await addCourierLineToQuote(quoteId, line);
    if (!saved.ok) return fail(saved.error);

    const historyId = uuidOrNull(request.historyId);
    if (historyId) {
      const db = createServiceRoleClient();
      const { error } = await db
        .from("liner_courier_quotes")
        .update({
          quote_id: quoteId,
          chosen_service_code: request.rate.serviceCode,
          chosen_service_name: request.rate.serviceName,
          chosen_amount: rate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", historyId);
      if (error) console.error("[liner-courier] history link not saved:", error.message);
    }
    revalidatePath(PAGE);
    revalidatePath(`/admin/quotes/${quoteId}/`);
    return {
      ok: true,
      message: `${saved.replaced ? "Updated the courier line on" : "Added a courier line to"} quotation ${saved.quoteNumber}. New total R${saved.totalIncVat.toFixed(2)} incl. VAT.`,
    };
  } catch (error) {
    unstable_rethrow(error);
    return fail(describeActionError(error));
  }
}

export type LinkedRecord = {
  kind: "rfq" | "quote";
  id: string;
  number: string;
  status: string;
  rfqId: string | null;
  quoteId: string | null;
  editable: boolean;
  prefill: Partial<LinerCourierJob>;
};

/** Find an enquiry (RFQ) or quotation by number, to fill in the customer. */
export async function findRfqOrQuoteAction(query: string): Promise<{ ok: boolean; message: string; records?: LinkedRecord[] }> {
  try {
    await assertAdmin({ permission: "manageOrders" });
    const q = query.trim().replace(/[%,()]/g, "");
    if (q.length < 3) return fail("Type at least 3 characters of the RFQ or quote number.");
    const supabase = await createClient();
    const [rfqs, quotes] = await Promise.all([
      supabase
        .from("rfqs")
        .select("id, rfq_number, status, contact_name, company_name, email, phone, province, project_location")
        .ilike("rfq_number", `%${q}%`)
        .order("submitted_at", { ascending: false })
        .limit(5),
      supabase
        .from("quotes")
        .select("id, quote_number, revision_number, status, rfq_id, contact_name, company_name, email, phone, province, project_location, is_latest_revision")
        .ilike("quote_number", `%${q}%`)
        .eq("is_latest_revision", true)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    const text = (v: unknown) => (typeof v === "string" ? v : "");
    const prefill = (row: Record<string, unknown>): Partial<LinerCourierJob> => ({
      customerName: text(row.contact_name),
      companyName: text(row.company_name),
      email: text(row.email),
      phone: text(row.phone),
      province: text(row.province),
      city: text(row.project_location),
    });
    const records: LinkedRecord[] = [
      ...(quotes.data ?? []).map((row) => ({
        kind: "quote" as const,
        id: String(row.id),
        number: `${row.quote_number} Rev ${row.revision_number}`,
        status: String(row.status),
        rfqId: (row.rfq_id as string | null) ?? null,
        quoteId: String(row.id),
        editable: row.status === "draft" || row.status === "internal_review",
        prefill: { ...prefill(row), reference: String(row.quote_number) },
      })),
      ...(rfqs.data ?? []).map((row) => ({
        kind: "rfq" as const,
        id: String(row.id),
        number: String(row.rfq_number),
        status: String(row.status),
        rfqId: String(row.id),
        quoteId: null,
        editable: false,
        prefill: { ...prefill(row), reference: String(row.rfq_number) },
      })),
    ];
    if (rfqs.error || quotes.error) console.error("[liner-courier] lookup:", rfqs.error?.message, quotes.error?.message);
    if (records.length === 0) return fail("No enquiry or quotation matches that number.");
    return { ok: true, message: `${records.length} found.`, records };
  } catch (error) {
    unstable_rethrow(error);
    return fail(describeActionError(error));
  }
}
