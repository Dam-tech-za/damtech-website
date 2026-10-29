"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { XeroBridgeError } from "@/lib/operations/xero-bridge";
import { buildCreateContactPayload, type CreateContactResult } from "@/lib/rfq/xero-contact-payload";
import { createClient } from "@/lib/supabase/server";
import { RFQ_STATUSES, type RfqStatus } from "@/lib/rfq/schema";
import { convertRfqToQuote } from "@/lib/rfq/convert-to-quote";
import { confirmRfqAsset, overrideRfqAssetQuantities } from "@/lib/rfq/estimator";
import {
  createInformationRequest,
  updateMeasurementSchedule,
} from "@/lib/rfq/info-request";
import type { AssetMeasurementStatus } from "@/lib/rfq/statuses";
import { RFQ_STATUS_LABELS } from "@/lib/admin/rfqs/rfq-inbox-types";
import {
  actionFailure,
  actionSuccess,
  describeActionError,
  type AdminActionState,
} from "@/lib/admin/action-state";
import {
  buildAllocateXeroQuotePatch,
  resolveXeroQuote,
} from "@/lib/rfq/allocate-xero-quote";
import {
  createXeroBridgeClient,
  xeroBridgeConfigFromEnv,
} from "@/lib/operations/xero-bridge";

type CurrentAdminRecord = Awaited<ReturnType<typeof assertAdmin>>;

async function insertRfqEvents(
  admin: CurrentAdminRecord,
  rows: Array<{
    rfqId: string;
    eventType: string;
    message: string;
    metadata?: Record<string, unknown>;
  }>,
) {
  if (!rows.length) return;
  const supabase = await createClient();
  const { error } = await supabase.from("rfq_events").insert(
    rows.map((row) => ({
      rfq_id: row.rfqId,
      actor_user_id: admin.user.id,
      actor_email: admin.user.email,
      event_type: row.eventType,
      message: row.message,
      metadata: row.metadata ?? null,
    })),
  );
  if (error) console.error("[rfq] timeline insert failed:", error.message);
}

function statusLabel(status: string): string {
  return RFQ_STATUS_LABELS[status] ?? status;
}

export async function updateRfqStatusAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const rfqId = String(formData.get("rfqId") ?? "");
  const status = String(formData.get("status") ?? "") as RfqStatus;
  if (!rfqId || !RFQ_STATUSES.includes(status)) {
    return actionFailure("Choose a valid status.");
  }

  try {
    const admin = await assertAdmin({ permission: "manageRfqs" });
    const supabase = await createClient();
    const { data: before } = await supabase
      .from("rfqs")
      .select("status")
      .eq("id", rfqId)
      .maybeSingle();
    if (!before) return actionFailure("This enquiry no longer exists.");
    if (before.status === status) {
      return actionSuccess(`Status is already ${statusLabel(status)}.`);
    }

    const patch: Record<string, unknown> = { status };
    if (status !== "new") patch.reviewed_at = new Date().toISOString();

    const { error } = await supabase.from("rfqs").update(patch).eq("id", rfqId);
    if (error) {
      console.error("[rfq] status update failed:", error.message);
      return actionFailure(describeActionError(error));
    }

    await insertRfqEvents(admin, [
      {
        rfqId,
        eventType: "status_changed",
        message: `Status: ${statusLabel(before.status)} → ${statusLabel(status)}`,
        metadata: { from: before.status, to: status },
      },
    ]);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_status_updated",
      entityType: "rfq",
      entityId: rfqId,
      beforeData: { status: before.status },
      afterData: { status },
    });

    revalidatePath("/admin/");
    revalidatePath("/admin/rfqs/");
    revalidatePath(`/admin/rfqs/${rfqId}/`);
    return actionSuccess(`Status changed to ${statusLabel(status)}.`);
  } catch (error) {
    unstable_rethrow(error);
    return actionFailure(describeActionError(error));
  }
}

export async function assignRfqAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const rfqId = String(formData.get("rfqId") ?? "");
  const assignedTo = String(formData.get("assignedTo") ?? "") || null;
  if (!rfqId) return actionFailure("Enquiry not found.");

  try {
    const admin = await assertAdmin({ permission: "manageRfqs" });
    const supabase = await createClient();
    const { error } = await supabase
      .from("rfqs")
      .update({ assigned_to: assignedTo })
      .eq("id", rfqId);
    if (error) {
      console.error("[rfq] assign failed:", error.message);
      return actionFailure(describeActionError(error));
    }

    await insertRfqEvents(admin, [
      {
        rfqId,
        eventType: "assigned",
        message: assignedTo ? "Enquiry assigned" : "Assignment cleared",
        metadata: { assigned_to: assignedTo },
      },
    ]);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_assigned",
      entityType: "rfq",
      entityId: rfqId,
      afterData: { assigned_to: assignedTo },
    });

    revalidatePath("/admin/rfqs/");
    revalidatePath(`/admin/rfqs/${rfqId}/`);
    return actionSuccess(assignedTo ? "Assignment saved." : "Assignment cleared.");
  } catch (error) {
    unstable_rethrow(error);
    return actionFailure(describeActionError(error));
  }
}

export async function addRfqNoteAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const rfqId = String(formData.get("rfqId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!rfqId) return actionFailure("Enquiry not found.");
  if (!note) return actionFailure("Type a note before saving.");
  if (note.length > 5000) return actionFailure("Notes are limited to 5,000 characters.");

  try {
    const admin = await assertAdmin({ permission: "manageRfqs" });
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("rfqs")
      .select("internal_notes")
      .eq("id", rfqId)
      .maybeSingle();
    if (!existing) return actionFailure("This enquiry no longer exists.");

    const stamp = new Date().toISOString();
    const nextNotes = [
      existing.internal_notes?.trim() || "",
      `[${stamp}] ${admin.user.email}: ${note}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const { error } = await supabase
      .from("rfqs")
      .update({ internal_notes: nextNotes })
      .eq("id", rfqId);
    if (error) {
      console.error("[rfq] note failed:", error.message);
      return actionFailure(describeActionError(error));
    }

    await insertRfqEvents(admin, [
      { rfqId, eventType: "note_added", message: note },
    ]);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_note_added",
      entityType: "rfq",
      entityId: rfqId,
    });

    revalidatePath(`/admin/rfqs/${rfqId}/`);
    return actionSuccess("Note saved.");
  } catch (error) {
    unstable_rethrow(error);
    return actionFailure(describeActionError(error));
  }
}

export async function bulkUpdateRfqStatusAction(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const status = String(formData.get("status") ?? "") as RfqStatus;
  const ids = formData.getAll("rfqIds").map(String).filter(Boolean);
  if (!ids.length || !RFQ_STATUSES.includes(status)) {
    return { ok: false, error: "Select RFQs and a valid status." };
  }

  const admin = await assertAdmin({ permission: "manageRfqs" });
  const supabase = await createClient();
  const { error } = await supabase.from("rfqs").update({ status }).in("id", ids);
  if (error) {
    console.error("[rfq] bulk status failed:", error.message);
    return { ok: false, error: describeActionError(error) };
  }

  await insertRfqEvents(
    admin,
    ids.map((id) => ({
      rfqId: id,
      eventType: "bulk_status_changed",
      message: `Bulk status → ${statusLabel(status)}`,
    })),
  );

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "rfq_bulk_status_updated",
    entityType: "rfq",
    metadata: { ids, status },
  });

  revalidatePath("/admin/rfqs/");
  return { ok: true };
}

export async function bulkAssignRfqAction(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const assignedTo = String(formData.get("assignedTo") ?? "") || null;
  const ids = formData.getAll("rfqIds").map(String).filter(Boolean);
  if (!ids.length) {
    return { ok: false, error: "Select RFQs to assign." };
  }

  const admin = await assertAdmin({ permission: "manageRfqs" });
  const supabase = await createClient();
  const { error } = await supabase
    .from("rfqs")
    .update({ assigned_to: assignedTo })
    .in("id", ids);
  if (error) {
    console.error("[rfq] bulk assign failed:", error.message);
    return { ok: false, error: describeActionError(error) };
  }

  await insertRfqEvents(
    admin,
    ids.map((id) => ({
      rfqId: id,
      eventType: "bulk_assigned",
      message: assignedTo ? "Bulk assigned" : "Bulk assignment cleared",
      metadata: { assigned_to: assignedTo },
    })),
  );

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "rfq_bulk_assigned",
    entityType: "rfq",
    metadata: { ids, assigned_to: assignedTo },
  });

  revalidatePath("/admin/rfqs/");
  return { ok: true };
}

export async function convertRfqAction(formData: FormData): Promise<void> {
  const rfqId = String(formData.get("rfqId") ?? "");
  const force = String(formData.get("forceSecond") ?? "") === "1";
  const allowUnconfirmed = String(formData.get("allowUnconfirmed") ?? "") === "1";
  const acknowledgeSiteMeasurement =
    String(formData.get("acknowledgeSiteMeasurement") ?? "") === "1";
  if (!rfqId) return;

  const result = await convertRfqToQuote(rfqId, {
    forceSecondQuote: force,
    allowUnconfirmed,
    acknowledgeSiteMeasurement,
  });
  if (!result.ok) {
    console.error("[rfq] convert failed:", result.error);
    redirect(
      `/admin/rfqs/${rfqId}/?convertError=${encodeURIComponent(result.error)}`,
    );
  }

  revalidatePath("/admin/rfqs/");
  revalidatePath(`/admin/rfqs/${rfqId}/`);
  revalidatePath("/admin/quotes/");
  redirect(`/admin/quotes/${result.quoteId}/edit/`);
}

export async function confirmRfqAssetAction(formData: FormData): Promise<void> {
  const assetId = String(formData.get("assetId") ?? "");
  const rfqId = String(formData.get("rfqId") ?? "");
  const notes = String(formData.get("notes") ?? "");
  if (!assetId) return;

  const result = await confirmRfqAsset({ assetId, notes: notes || undefined });
  if (!result.ok) {
    console.error("[rfq] confirm asset failed:", result.error);
  }

  if (rfqId) {
    revalidatePath(`/admin/rfqs/${rfqId}/`);
  }
  revalidatePath("/admin/rfqs/");
}

export async function overrideRfqAssetAction(formData: FormData): Promise<void> {
  const assetId = String(formData.get("assetId") ?? "");
  const rfqId = String(formData.get("rfqId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!assetId) return;

  const numOrUndef = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };

  const statusRaw = String(formData.get("measurementStatus") ?? "");
  const result = await overrideRfqAssetQuantities({
    assetId,
    reason,
    recalculate: String(formData.get("recalculate") ?? "") === "1",
    measurementStatus: (statusRaw || undefined) as
      | AssetMeasurementStatus
      | undefined,
    confirmedInstallationAreaM2: numOrUndef("confirmedInstallationAreaM2"),
    confirmedMaterialAreaM2: numOrUndef("confirmedMaterialAreaM2"),
    confirmedGeotextileAreaM2: numOrUndef("confirmedGeotextileAreaM2"),
    confirmedSurfacePrepAreaM2: numOrUndef("confirmedSurfacePrepAreaM2"),
    confirmedAnchorAreaM2: numOrUndef("confirmedAnchorAreaM2"),
    confirmedVolumeM3: numOrUndef("confirmedVolumeM3"),
    confirmedCapacityKl: numOrUndef("confirmedCapacityKl"),
    confirmedOverlapPercent: numOrUndef("confirmedOverlapPercent"),
    confirmedWastePercent: numOrUndef("confirmedWastePercent"),
    notes: String(formData.get("notes") ?? "") || undefined,
  });

  if (!result.ok) {
    console.error("[rfq] override failed:", result.error);
    if (rfqId) {
      redirect(
        `/admin/rfqs/${rfqId}/?assetError=${encodeURIComponent(result.error)}`,
      );
    }
  }

  if (rfqId) revalidatePath(`/admin/rfqs/${rfqId}/`);
  revalidatePath("/admin/rfqs/");
}

export async function createInfoRequestAction(formData: FormData): Promise<void> {
  const rfqId = String(formData.get("rfqId") ?? "");
  const assetId = String(formData.get("assetId") ?? "") || null;
  const message = String(formData.get("message") ?? "");
  const fieldIds = formData.getAll("fields").map(String).filter(Boolean);
  if (!rfqId) return;

  const result = await createInformationRequest({
    rfqId,
    assetId,
    fieldIds,
    message: message || undefined,
  });

  if (!result.ok) {
    redirect(
      `/admin/rfqs/${rfqId}/?infoError=${encodeURIComponent(result.error)}`,
    );
  }

  revalidatePath(`/admin/rfqs/${rfqId}/`);
  redirect(
    `/admin/rfqs/${rfqId}/?infoLink=${encodeURIComponent(result.publicPath)}`,
  );
}

export async function updateMeasurementScheduleAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const rfqId = String(formData.get("rfqId") ?? "");
  if (!rfqId) return actionFailure("Enquiry not found.");

  const travelRaw = String(formData.get("travelKm") ?? "").trim();
  if (travelRaw && (!Number.isFinite(Number(travelRaw)) || Number(travelRaw) < 0)) {
    return actionFailure("Travel distance must be a positive number of kilometres.");
  }
  const result = await updateMeasurementSchedule({
    rfqId,
    siteMeasurementRequired: formData.get("siteMeasurementRequired") === "on",
    proposedDate: String(formData.get("proposedDate") ?? "") || null,
    confirmedDate: String(formData.get("confirmedDate") ?? "") || null,
    assignedEmployeeId: String(formData.get("assignedEmployeeId") ?? "") || null,
    travelKm: travelRaw ? Number(travelRaw) : null,
    customerConfirmed: formData.get("customerConfirmed") === "on",
    notes: String(formData.get("notes") ?? "") || null,
  });

  if (!result.ok) {
    console.error("[rfq] measurement schedule failed:", result.error);
    return actionFailure(describeActionError(null));
  }

  revalidatePath(`/admin/rfqs/${rfqId}/`);
  revalidatePath("/admin/rfqs/");
  return actionSuccess("Measurement schedule saved.");
}

export async function prepareQuoteSuggestionsAction(
  formData: FormData,
): Promise<void> {
  await convertRfqAction(formData);
}

export async function allocateXeroQuoteAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const rfqId = String(formData.get("rfqId") ?? "");
  const quoteInput = String(formData.get("xeroQuoteNumber") ?? "");
  if (!rfqId) return actionFailure("Enquiry not found.");

  try {
    const admin = await assertAdmin({ permission: "manageRfqs" });
    const config = xeroBridgeConfigFromEnv();
    if (!config) {
      return actionFailure(
        "Xero is not connected on this server (XERO_BRIDGE_API_KEY). Set it, then try again.",
      );
    }

    const supabase = await createClient();
    const { data: before, error: loadError } = await supabase
      .from("rfqs")
      .select(
        "id, rfq_number, status, xero_quote_id, xero_quote_number",
      )
      .eq("id", rfqId)
      .maybeSingle();
    if (loadError) {
      console.error("[rfq] allocate load failed:", loadError.message);
      return actionFailure(describeActionError(loadError));
    }
    if (!before) return actionFailure("This enquiry no longer exists.");

    const bridge = createXeroBridgeClient(config);
    const resolved = await resolveXeroQuote(bridge, quoteInput);
    if (!resolved.ok) return actionFailure(resolved.error);

    const built = buildAllocateXeroQuotePatch({
      quote: resolved.quote,
      currentStatus: before.status,
    });
    if (!built.ok) return actionFailure(built.error);

    if (
      before.xero_quote_id &&
      before.xero_quote_id !== resolved.quote.id
    ) {
      // Replacing an existing link is allowed; uniqueness is on the new id.
    }

    const { data: conflict } = await supabase
      .from("rfqs")
      .select("id, rfq_number")
      .eq("xero_quote_id", resolved.quote.id)
      .neq("id", rfqId)
      .maybeSingle();
    if (conflict) {
      return actionFailure(
        `${resolved.quote.number} is already linked to ${conflict.rfq_number}.`,
      );
    }

    const { error } = await supabase
      .from("rfqs")
      .update(built.patch)
      .eq("id", rfqId);
    if (error) {
      console.error("[rfq] allocate update failed:", error.message);
      return actionFailure(describeActionError(error));
    }

    const statusNote =
      built.patch.status === before.status
        ? `Status stays ${statusLabel(before.status)}.`
        : `Status: ${statusLabel(before.status)} → ${statusLabel(built.patch.status)}.`;

    await insertRfqEvents(admin, [
      {
        rfqId,
        eventType: "xero_quote_allocated",
        message: `Xero quote ${resolved.quote.number} (${resolved.quote.status}) allocated. ${statusNote}`,
        metadata: {
          xero_quote_id: resolved.quote.id,
          xero_quote_number: resolved.quote.number,
          xero_quote_status: resolved.quote.status,
          from_status: before.status,
          to_status: built.patch.status,
        },
      },
    ]);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_xero_quote_allocated",
      entityType: "rfq",
      entityId: rfqId,
      beforeData: {
        status: before.status,
        xero_quote_id: before.xero_quote_id,
        xero_quote_number: before.xero_quote_number,
      },
      afterData: built.patch,
    });

    revalidatePath("/admin/");
    revalidatePath("/admin/rfqs/");
    revalidatePath(`/admin/rfqs/${rfqId}/`);
    return actionSuccess(
      `Linked ${resolved.quote.number} (${resolved.quote.status}). Enquiry marked ${statusLabel(built.patch.status)}.`,
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error("[rfq] allocate xero quote:", error);
    return actionFailure(describeActionError(error));
  }
}

export async function clearXeroQuoteAllocationAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const rfqId = String(formData.get("rfqId") ?? "");
  if (!rfqId) return actionFailure("Enquiry not found.");

  try {
    const admin = await assertAdmin({ permission: "manageRfqs" });
    const supabase = await createClient();
    const { data: before } = await supabase
      .from("rfqs")
      .select("status, xero_quote_id, xero_quote_number, xero_quote_status")
      .eq("id", rfqId)
      .maybeSingle();
    if (!before) return actionFailure("This enquiry no longer exists.");
    if (!before.xero_quote_id && !before.xero_quote_number) {
      return actionSuccess("No Xero quote is linked to this enquiry.");
    }

    const patch: Record<string, unknown> = {
      xero_quote_id: null,
      xero_quote_number: null,
      xero_quote_status: null,
      xero_quote_allocated_at: null,
    };
    // Only roll status back when it was set by allocation.
    if (before.status === "quote_sent") {
      patch.status = "reviewing";
    }

    const { error } = await supabase.from("rfqs").update(patch).eq("id", rfqId);
    if (error) {
      console.error("[rfq] clear xero quote failed:", error.message);
      return actionFailure(describeActionError(error));
    }

    await insertRfqEvents(admin, [
      {
        rfqId,
        eventType: "xero_quote_cleared",
        message: `Cleared Xero quote ${before.xero_quote_number ?? before.xero_quote_id}.`,
        metadata: {
          cleared_quote_id: before.xero_quote_id,
          cleared_quote_number: before.xero_quote_number,
          from_status: before.status,
          to_status: patch.status ?? before.status,
        },
      },
    ]);
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_xero_quote_cleared",
      entityType: "rfq",
      entityId: rfqId,
      beforeData: before,
      afterData: patch,
    });

    revalidatePath("/admin/");
    revalidatePath("/admin/rfqs/");
    revalidatePath(`/admin/rfqs/${rfqId}/`);
    return actionSuccess("Xero quote link cleared.");
  } catch (error) {
    unstable_rethrow(error);
    return actionFailure(describeActionError(error));
  }
}

export type SendToXeroResult = { ok: boolean; message: string; results: { rfqId: string; ok: boolean; message: string }[] };

/**
 * "Send to Xero": make each selected enquiry's customer a Xero contact
 * through the bridge (it matches an existing contact by email or exact
 * name, otherwise creates one; it never edits an existing contact). The
 * result is noted on the enquiry's history. No other Xero writes.
 */
export async function sendEnquiriesToXeroAction(rfqIds: string[]): Promise<SendToXeroResult> {
  const ids = (Array.isArray(rfqIds) ? rfqIds : []).filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 25);
  if (!ids.length) return { ok: false, message: "Select at least one enquiry.", results: [] };
  try {
    const admin = await assertAdmin({ permission: "manageRfqs" });
    const config = xeroBridgeConfigFromEnv();
    if (!config) return { ok: false, message: "The Xero connection is not set up on this site.", results: [] };
    const bridge = createXeroBridgeClient({ ...config, timeoutMs: 10_000 });
    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from("rfqs")
      .select("id, rfq_number, contact_name, company_name, email, phone, town, province, address_line, postal_code")
      .in("id", ids);
    if (error) throw error;

    const results: SendToXeroResult["results"] = [];
    for (const rfq of rows ?? []) {
      const payload = buildCreateContactPayload(rfq);
      if ("error" in payload) {
        results.push({ rfqId: rfq.id, ok: false, message: payload.error });
        continue;
      }
      try {
        const res = await bridge.write<CreateContactResult>("create_contact_from_website", payload as unknown as Record<string, unknown>);
        const message = res.created
          ? `Added to Xero as a new contact: ${res.name}.`
          : `Already in Xero as ${res.name}${res.matched_by ? ` (matched by ${res.matched_by})` : ""}. Nothing was changed.`;
        results.push({ rfqId: rfq.id, ok: true, message });
        await insertRfqEvents(admin, [
          { rfqId: rfq.id, eventType: "xero_contact", message, metadata: { contact_id: res.contact_id, created: res.created, matched_by: res.matched_by ?? null } },
        ]);
        await writeAuditLog({
          actorUserId: admin.user.id,
          actorEmail: admin.user.email,
          action: res.created ? "rfq_xero_contact_created" : "rfq_xero_contact_matched",
          entityType: "rfq",
          entityId: rfq.id,
          afterData: { contact_id: res.contact_id, created: res.created },
        });
      } catch (err) {
        const status = err instanceof XeroBridgeError ? err.status : null;
        const text = err instanceof Error ? err.message.replace(/^Xero bridge:\s*/, "") : "";
        results.push({
          rfqId: rfq.id,
          ok: false,
          message:
            status === 404 || /not allowed|unknown tool/i.test(text)
              ? "The Xero bridge doesn't accept new contacts from the website yet."
              : status === 400
                ? `${text}.`
                : "Xero didn't answer. Nothing was changed.",
        });
      }
    }
    revalidatePath("/admin/rfqs/");
    const done = results.filter((r) => r.ok).length;
    return {
      ok: done > 0,
      message: done === results.length ? (done === 1 ? results[0].message : `${done} enquiries sent to Xero.`) : results.find((r) => !r.ok)?.message ?? "Nothing was sent.",
      results,
    };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: describeActionError(error), results: [] };
  }
}
