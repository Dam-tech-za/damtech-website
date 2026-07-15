"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { RFQ_STATUSES, type RfqStatus } from "@/lib/rfq/schema";
import { convertRfqToQuote } from "@/lib/rfq/convert-to-quote";

async function touchRfqEvent(
  rfqId: string,
  eventType: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  const admin = await assertAdmin({ permission: "manageRfqs" });
  const supabase = await createClient();
  await supabase.from("rfq_events").insert({
    rfq_id: rfqId,
    actor_user_id: admin.user.id,
    actor_email: admin.user.email,
    event_type: eventType,
    message,
    metadata: metadata ?? null,
  });
  return admin;
}

export async function updateRfqStatusAction(formData: FormData): Promise<void> {
  const rfqId = String(formData.get("rfqId") ?? "");
  const status = String(formData.get("status") ?? "") as RfqStatus;
  if (!rfqId || !RFQ_STATUSES.includes(status)) return;

  const admin = await assertAdmin({ permission: "manageRfqs" });
  const supabase = await createClient();
  const { data: before } = await supabase
    .from("rfqs")
    .select("status")
    .eq("id", rfqId)
    .maybeSingle();

  const patch: Record<string, unknown> = { status };
  if (status === "reviewing" || status === "ready_for_quote") {
    patch.reviewed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("rfqs").update(patch).eq("id", rfqId);
  if (error) {
    console.error("[rfq] status update failed:", error.message);
    return;
  }

  await touchRfqEvent(rfqId, "status_changed", `Status → ${status}`, {
    from: before?.status,
    to: status,
  });
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "rfq_status_updated",
    entityType: "rfq",
    entityId: rfqId,
    beforeData: { status: before?.status },
    afterData: { status },
  });

  revalidatePath("/admin/rfqs/");
  revalidatePath(`/admin/rfqs/${rfqId}/`);
}

export async function assignRfqAction(formData: FormData): Promise<void> {
  const rfqId = String(formData.get("rfqId") ?? "");
  const assignedTo = String(formData.get("assignedTo") ?? "") || null;
  if (!rfqId) return;

  const admin = await assertAdmin({ permission: "manageRfqs" });
  const supabase = await createClient();
  const { error } = await supabase
    .from("rfqs")
    .update({ assigned_to: assignedTo })
    .eq("id", rfqId);
  if (error) {
    console.error("[rfq] assign failed:", error.message);
    return;
  }

  await touchRfqEvent(
    rfqId,
    "assigned",
    assignedTo ? "RFQ assigned" : "Assignment cleared",
    { assigned_to: assignedTo },
  );
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
}

export async function addRfqNoteAction(formData: FormData): Promise<void> {
  const rfqId = String(formData.get("rfqId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!rfqId || !note) return;

  const admin = await assertAdmin({ permission: "manageRfqs" });
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("rfqs")
    .select("internal_notes")
    .eq("id", rfqId)
    .maybeSingle();

  const stamp = new Date().toISOString();
  const nextNotes = [
    existing?.internal_notes?.trim() || "",
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
    return;
  }

  await touchRfqEvent(rfqId, "note_added", note);
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "rfq_note_added",
    entityType: "rfq",
    entityId: rfqId,
  });

  revalidatePath(`/admin/rfqs/${rfqId}/`);
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
  if (error) return { ok: false, error: error.message };

  for (const id of ids) {
    await touchRfqEvent(id, "bulk_status_changed", `Bulk status → ${status}`);
  }

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

export async function convertRfqAction(formData: FormData): Promise<void> {
  const rfqId = String(formData.get("rfqId") ?? "");
  const force = String(formData.get("forceSecond") ?? "") === "1";
  if (!rfqId) return;

  const result = await convertRfqToQuote(rfqId, { forceSecondQuote: force });
  if (!result.ok) {
    console.error("[rfq] convert failed:", result.error);
    return;
  }

  revalidatePath("/admin/rfqs/");
  revalidatePath(`/admin/rfqs/${rfqId}/`);
  revalidatePath("/admin/quotes/");
}
