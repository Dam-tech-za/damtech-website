"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin, AdminAuthError } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import {
  assessRfqDeleteBlockers,
  buildRfqDeleteAuditSnapshot,
  createDeleteIncidentId,
  type RfqDeleteSummary,
  validateRfqDeleteId,
  validateRfqDeleteReason,
  validateTypedRfqConfirmation,
} from "@/lib/admin/rfqs/delete-rfq";

export type DeleteRfqResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      code?: string;
      incidentId?: string;
      blocked?: boolean;
    };

export async function deleteRfqAction(input: {
  rfqId: string;
  reason: string;
  reasonOther?: string;
  typedConfirmation: string;
  fromDetailPage?: boolean;
}): Promise<DeleteRfqResult> {
  let admin;
  try {
    admin = await assertAdmin({ permission: "deleteRfqs" });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { ok: false, error: error.message, code: error.code };
    }
    return { ok: false, error: "Sign in required." };
  }

  const rfqId = String(input.rfqId ?? "").trim();
  if (!validateRfqDeleteId(rfqId)) {
    return { ok: false, error: "Invalid RFQ reference." };
  }

  const reasonResult = validateRfqDeleteReason(
    input.reason,
    input.reasonOther,
  );
  if (!reasonResult.ok) {
    return { ok: false, error: reasonResult.error };
  }

  const supabase = await createClient();

  const { data: rfq, error: rfqError } = await supabase
    .from("rfqs")
    .select(
      "id, rfq_number, status, contact_name, company_name, service_required, submitted_at, converted_quote_id, measurement_report_attachment_id",
    )
    .eq("id", rfqId)
    .maybeSingle();

  if (rfqError) {
    console.error("[rfq.delete] load failed:", rfqError.message);
    return {
      ok: false,
      error: "RFQs could not be loaded.",
      incidentId: createDeleteIncidentId(),
    };
  }

  if (!rfq) {
    return { ok: true };
  }

  if (
    !validateTypedRfqConfirmation(input.typedConfirmation, rfq.rfq_number)
  ) {
    return {
      ok: false,
      error: "Typed confirmation does not match the RFQ number.",
    };
  }

  const [
    { count: linkedQuoteCount },
    { count: sentCommunicationCount },
    { count: answeredInfoRequestCount },
    { data: attachments },
    { data: assets },
  ] = await Promise.all([
    supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("rfq_id", rfqId),
    supabase
      .from("rfq_communications")
      .select("*", { count: "exact", head: true })
      .eq("rfq_id", rfqId)
      .eq("status", "sent"),
    supabase
      .from("rfq_information_requests")
      .select("*", { count: "exact", head: true })
      .eq("rfq_id", rfqId)
      .eq("status", "answered"),
    supabase.from("rfq_attachments").select("storage_path").eq("rfq_id", rfqId),
    supabase
      .from("rfq_assets")
      .select("estimator_confirmed, confirmed_material_area_m2, confirmed_capacity_kl")
      .eq("rfq_id", rfqId),
  ]);

  const hasConfirmedAssetQuantities = (assets ?? []).some(
    (asset) =>
      asset.estimator_confirmed ||
      (asset.confirmed_material_area_m2 ?? 0) > 0 ||
      (asset.confirmed_capacity_kl ?? 0) > 0,
  );

  const blockers = assessRfqDeleteBlockers({
    status: rfq.status,
    convertedQuoteId: rfq.converted_quote_id,
    linkedQuoteCount: linkedQuoteCount ?? 0,
    sentCommunicationCount: sentCommunicationCount ?? 0,
    answeredInfoRequestCount: answeredInfoRequestCount ?? 0,
    hasConfirmedAssetQuantities,
  });

  if (blockers.blocked) {
    return {
      ok: false,
      error:
        blockers.message ??
        "This RFQ cannot be permanently deleted because it is linked to quotation or business history. Close or archive it instead.",
      code: blockers.code,
      blocked: true,
    };
  }

  const summary: RfqDeleteSummary = {
    id: rfq.id,
    rfqNumber: rfq.rfq_number,
    customerName: rfq.contact_name,
    companyName: rfq.company_name,
    serviceLabel: rfq.service_required ?? "Not specified",
    submittedAt: rfq.submitted_at,
    status: rfq.status,
  };

  const auditSnapshot = buildRfqDeleteAuditSnapshot({
    summary,
    deletionReason: reasonResult.normalized,
    deletedByEmail: admin.user.email ?? "unknown",
  });

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.user.email,
    action: "delete_rfq",
    entityType: "rfq",
    entityId: rfqId,
    beforeData: auditSnapshot,
    metadata: {
      rfq_number: rfq.rfq_number,
      storage_paths: (attachments ?? []).map((row) => row.storage_path),
    },
  });

  if (rfq.measurement_report_attachment_id) {
    await supabase
      .from("rfqs")
      .update({ measurement_report_attachment_id: null })
      .eq("id", rfqId);
  }

  const { error: deleteError } = await supabase.from("rfqs").delete().eq("id", rfqId);

  if (deleteError) {
    console.error("[rfq.delete] delete failed:", deleteError.message);
    return {
      ok: false,
      error: "RFQs could not be deleted.",
      incidentId: createDeleteIncidentId(),
    };
  }

  const storagePaths = (attachments ?? [])
    .map((row) => row.storage_path)
    .filter(Boolean);

  if (storagePaths.length && isSupabaseServiceConfigured()) {
    try {
      const service = createServiceRoleClient();
      const { error: storageError } = await service.storage
        .from("rfq-attachments")
        .remove(storagePaths);
      if (storageError) {
        console.error("[rfq.delete] storage cleanup failed:", storageError.message);
        await writeAuditLog({
          actorUserId: admin.user.id,
          actorEmail: admin.user.email,
          action: "rfq_delete_storage_cleanup_warning",
          entityType: "rfq",
          entityId: rfqId,
          metadata: {
            rfq_number: rfq.rfq_number,
            paths: storagePaths,
            error: storageError.message,
          },
        });
      }
    } catch (error) {
      console.error("[rfq.delete] storage cleanup unexpected:", error);
    }
  }

  revalidatePath("/admin/rfqs/");
  revalidatePath(`/admin/rfqs/${rfqId}/`);

  if (input.fromDetailPage) {
    redirect("/admin/rfqs/?deleted=1");
  }

  return { ok: true };
}
