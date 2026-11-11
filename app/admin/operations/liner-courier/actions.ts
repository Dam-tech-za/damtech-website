"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { assertAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { describeActionError } from "@/lib/admin/action-state";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/auth/audit";
import {
  cancelCourierShipment,
  COURIER_DEPOTS,
  createCourierQuote,
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
import { savedJob, savedParcel, type LinerCourierHistoryRow } from "@/lib/courier/liner-board";
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
 * Note that a formal quote was asked for by hand (brief copied or portal
 * opened). sendCourierQuoteAction sends one through the API instead.
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

export type SendQuoteResult = {
  ok: boolean;
  message: string;
  /** Courier Guy's status for what it created ("quote" when it worked). */
  status?: string;
  trackingReference?: string | null;
  /** True when Courier Guy booked it instead of keeping it as a quote. */
  booked?: boolean;
};

async function loadSavedQuote(historyId: unknown) {
  const id = uuidOrNull(historyId);
  if (!id) return { error: "Get a rate first, so the quote is saved." } as const;
  const db = createServiceRoleClient();
  const { data, error } = await db.from("liner_courier_quotes").select("*").eq("id", id).maybeSingle();
  if (error || !data) return { error: "This courier quote could not be found." } as const;
  return { error: null, db, row: data as unknown as LinerCourierHistoryRow } as const;
}

/**
 * Send this courier quote to The Courier Guy so it shows in their portal as a
 * quote (a shipment with status "quote", notifications off, collection a week
 * out). If they book it instead, the answer says so and the admin cancels it.
 */
export async function sendCourierQuoteAction(input: { historyId: string | null; serviceCode: string }): Promise<SendQuoteResult> {
  try {
    const admin = await assertAdmin({ permission: "manageOrders" });
    const serviceCode = String(input.serviceCode ?? "").trim();
    if (!/^[A-Za-z0-9_-]{2,20}$/.test(serviceCode)) return fail("Choose a service first.");
    const loaded = await loadSavedQuote(input.historyId);
    if (loaded.error !== null) return fail(loaded.error);
    const { db, row } = loaded;
    if (row.formal_quote_status === "api_submitted" && row.formal_quote_ref) {
      return fail(`Already sent to The Courier Guy (${row.formal_quote_ref}). Check the Courier Guy portal before sending again.`);
    }
    const job = savedJob(row);
    const check = checkJob(job);
    if (!check.ok) return fail(`${check.error} Edit the quote first.`);
    const config = getCourierConfig();
    if (!config.ok) return fail(config.reason);
    const depot: CourierDepotId = isCourierDepotId(row.depot) && config.config.depots[row.depot] ? row.depot : "pretoria";
    const parcels = parcelsForQuantity(savedParcel(row), row.quantity);

    const result = await createCourierQuote(withCourierDepot(config.config, depot), linerJobAsCourierOrder(job), parcels, serviceCode);
    if (!result.ok) return fail(result.error);
    const sent = result.data;
    const ref = sent.trackingReference ?? `id ${sent.id}`;

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: sent.isQuote ? "courier.quote_sent" : "courier.quote_booked_instead",
      entityType: "liner_courier_quote",
      entityId: row.id,
      afterData: { service_code: serviceCode, shipment_id: sent.id, tracking_reference: sent.trackingReference, status: sent.status, rate: sent.rate },
    });
    const { error } = await db
      .from("liner_courier_quotes")
      .update({
        formal_quote_status: "api_submitted",
        formal_quote_ref: `${ref} · ${sent.status || "no status"}`.slice(0, 120),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) console.error("[liner-courier] quote reference not saved:", error.message);
    revalidatePath(PAGE);

    if (sent.isQuote) {
      return {
        ok: true,
        status: sent.status,
        trackingReference: sent.trackingReference,
        message: `Sent to The Courier Guy as a quote (${ref}${sent.rate != null ? `, R${sent.rate.toFixed(2)}` : ""}). It is in the Courier Guy portal; nothing is booked.`,
      };
    }
    return {
      ok: false,
      booked: true,
      status: sent.status,
      trackingReference: sent.trackingReference,
      message: `The Courier Guy BOOKED this instead of saving a quote (status "${sent.status || "unknown"}", waybill ${ref}). Cancel it now${sent.trackingReference ? " with the button below or" : ""} in the Courier Guy portal. Collection is set a week out, so there is time.`,
    };
  } catch (error) {
    unstable_rethrow(error);
    return fail(describeActionError(error));
  }
}

/** Cancel a shipment Courier Guy booked by mistake (charges reverse if not collected). */
export async function cancelCourierQuoteAction(input: { historyId: string | null; trackingReference: string }): Promise<{ ok: boolean; message: string }> {
  try {
    const admin = await assertAdmin({ permission: "manageOrders" });
    const ref = String(input.trackingReference ?? "").trim();
    if (!/^[A-Za-z0-9-]{2,40}$/.test(ref)) return fail("No waybill number to cancel.");
    const config = getCourierConfig();
    if (!config.ok) return fail(config.reason);
    const result = await cancelCourierShipment(config.config, ref);
    if (!result.ok) return fail(`${result.error} Cancel it in the Courier Guy portal instead.`);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: "courier.quote_booking_cancelled",
      entityType: "liner_courier_quote",
      entityId: uuidOrNull(input.historyId),
      afterData: { tracking_reference: ref },
    });
    const id = uuidOrNull(input.historyId);
    if (id) {
      const db = createServiceRoleClient();
      await db
        .from("liner_courier_quotes")
        .update({ formal_quote_status: "none", formal_quote_ref: `${ref} · cancelled`, updated_at: new Date().toISOString() })
        .eq("id", id);
    }
    revalidatePath(PAGE);
    return { ok: true, message: `Cancelled ${ref} with The Courier Guy.` };
  } catch (error) {
    unstable_rethrow(error);
    return fail(describeActionError(error));
  }
}
