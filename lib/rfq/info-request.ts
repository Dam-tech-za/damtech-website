import { createHash, randomBytes } from "node:crypto";
import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { calculateRfqAsset } from "./calculations";
import type { MeasurementMethod, RfqAssetType } from "./calculations";
import { INFO_REQUEST_FIELDS } from "./statuses";

const VALID_FIELD_IDS = new Set(INFO_REQUEST_FIELDS.map((f) => f.id));

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createInformationRequest(input: {
  rfqId: string;
  assetId?: string | null;
  fieldIds: string[];
  message?: string;
  expiresInDays?: number;
}): Promise<
  | { ok: true; token: string; requestId: string; publicPath: string }
  | { ok: false; error: string }
> {
  try {
    const admin = await assertAdmin({ permission: "manageRfqs" });
    const fields = input.fieldIds.filter((id) => VALID_FIELD_IDS.has(id as never));
    if (!fields.length) {
      return { ok: false, error: "Select at least one missing information item." };
    }

    const supabase = await createClient();
    const { data: rfq } = await supabase
      .from("rfqs")
      .select("id, rfq_number, assigned_to, status")
      .eq("id", input.rfqId)
      .maybeSingle();
    if (!rfq) return { ok: false, error: "RFQ not found." };

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 14));

    const { data: request, error } = await supabase
      .from("rfq_information_requests")
      .insert({
        rfq_id: rfq.id,
        rfq_asset_id: input.assetId || null,
        token_hash: tokenHash,
        token_expires_at: expiresAt.toISOString(),
        status: "open",
        requested_fields: fields,
        message: input.message?.trim() || null,
        created_by: admin.user.id,
      })
      .select("id")
      .single();

    if (error || !request) {
      return { ok: false, error: error?.message || "Unable to create request." };
    }

    await supabase
      .from("rfqs")
      .update({ status: "information_required" })
      .eq("id", rfq.id);

    await supabase.from("rfq_events").insert({
      rfq_id: rfq.id,
      actor_user_id: admin.user.id,
      actor_email: admin.user.email,
      event_type: "information_requested",
      message: `Information requested: ${fields.join(", ")}`,
      metadata: { request_id: request.id, fields },
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_information_requested",
      entityType: "rfq",
      entityId: rfq.id,
      afterData: { request_id: request.id, fields },
    });

    return {
      ok: true,
      token,
      requestId: request.id,
      publicPath: `/quote/info/${token}/`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to create request.",
    };
  }
}

export type PublicInfoRequestView = {
  rfqNumber: string;
  message: string | null;
  requestedFields: Array<{ id: string; label: string }>;
  assets: Array<{
    id: string;
    name: string;
    type: string;
    sequence: number;
    summary: Record<string, unknown>;
  }>;
  expiresAt: string;
};

/** Token-gated public view — no pricing, notes, or full customer DB. */
export async function getPublicInfoRequest(
  token: string,
): Promise<
  | { ok: true; view: PublicInfoRequestView; requestId: string; rfqId: string }
  | { ok: false; error: string }
> {
  if (!token || token.length < 20) {
    return { ok: false, error: "Invalid link." };
  }
  const service = createServiceRoleClient();
  const hash = hashToken(token);
  const { data: request } = await service
    .from("rfq_information_requests")
    .select("*")
    .eq("token_hash", hash)
    .maybeSingle();

  if (!request) return { ok: false, error: "Link not found." };
  if (request.status !== "open") {
    return { ok: false, error: "This request is no longer open." };
  }
  if (new Date(request.token_expires_at).getTime() < Date.now()) {
    await service
      .from("rfq_information_requests")
      .update({ status: "expired" })
      .eq("id", request.id);
    return { ok: false, error: "This link has expired." };
  }

  const { data: rfq } = await service
    .from("rfqs")
    .select("id, rfq_number")
    .eq("id", request.rfq_id)
    .maybeSingle();
  if (!rfq) return { ok: false, error: "RFQ not found." };

  let assetQuery = service
    .from("rfq_assets")
    .select(
      "id, asset_name, asset_type, asset_sequence, calculated_outputs, quantity, material_preference, measurement_method",
    )
    .eq("rfq_id", rfq.id)
    .order("asset_sequence");
  if (request.rfq_asset_id) {
    assetQuery = assetQuery.eq("id", request.rfq_asset_id);
  }
  const { data: assets } = await assetQuery;

  const fieldIds = (request.requested_fields as string[]) ?? [];
  const requestedFields = INFO_REQUEST_FIELDS.filter((f) =>
    fieldIds.includes(f.id),
  ).map((f) => ({ id: f.id, label: f.label }));

  return {
    ok: true,
    requestId: request.id,
    rfqId: rfq.id,
    view: {
      rfqNumber: rfq.rfq_number,
      message: request.message,
      requestedFields,
      expiresAt: request.token_expires_at,
      assets: (assets ?? []).map((a) => ({
        id: a.id,
        name: a.asset_name,
        type: a.asset_type,
        sequence: a.asset_sequence,
        summary: publicAssetSummary(a),
      })),
    },
  };
}

function publicAssetSummary(asset: {
  quantity: number;
  material_preference: string | null;
  measurement_method: string;
  calculated_outputs: Record<string, unknown> | null;
}): Record<string, unknown> {
  const out = (asset.calculated_outputs ?? {}) as Record<string, unknown>;
  return {
    quantity: asset.quantity,
    materialPreference: asset.material_preference,
    measurementMethod: asset.measurement_method,
    installationAreaM2: out.installationAreaM2 ?? null,
    materialAreaM2: out.materialAreaM2 ?? null,
    capacityKL:
      out.totalGrossCapacityKL ?? out.grossCapacityKL ?? out.requiredCapacityKL ?? null,
  };
}

export async function submitPublicInfoResponse(input: {
  token: string;
  responses: Record<string, string>;
  assetUpdates?: Array<{
    assetId: string;
    rawInputPatches: Record<string, unknown>;
  }>;
  otherNotes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const loaded = await getPublicInfoRequest(input.token);
  if (!loaded.ok) return loaded;

  const service = createServiceRoleClient();
  const payload = {
    responses: input.responses,
    otherNotes: input.otherNotes ?? null,
    submittedAt: new Date().toISOString(),
  };

  const { data: request } = await service
    .from("rfq_information_requests")
    .select("*")
    .eq("id", loaded.requestId)
    .maybeSingle();
  if (!request || request.status !== "open") {
    return { ok: false, error: "Request is no longer open." };
  }

  for (const update of input.assetUpdates ?? []) {
    const { data: asset } = await service
      .from("rfq_assets")
      .select("*")
      .eq("id", update.assetId)
      .eq("rfq_id", loaded.rfqId)
      .maybeSingle();
    if (!asset) continue;

    const rawInputs = {
      ...(asset.raw_inputs as Record<string, unknown>),
      ...update.rawInputPatches,
    };

    const calc = calculateRfqAsset({
      assetType: asset.asset_type as RfqAssetType,
      measurementMethod: asset.measurement_method as MeasurementMethod,
      quantity: asset.quantity,
      rawInputs: { ...rawInputs, quantity: asset.quantity },
    });

    if (calc.ok) {
      await service.from("rfq_asset_calculations").insert({
        rfq_asset_id: asset.id,
        calculation_type: calc.calculationType,
        calculation_version: calc.calculationVersion,
        inputs: rawInputs,
        outputs: calc.outputs,
        assumptions: calc.assumptions,
        warnings: calc.warnings,
        actor_type: "customer",
      });

      await service
        .from("rfq_assets")
        .update({
          raw_inputs: rawInputs,
          calculated_outputs: calc.outputs,
          calculation_warnings: calc.warnings,
          calculation_version: calc.calculationVersion,
          measurement_status: "under_review",
          estimator_confirmed: false,
        })
        .eq("id", asset.id);
    } else {
      await service
        .from("rfq_assets")
        .update({
          raw_inputs: rawInputs,
          measurement_status: "under_review",
          estimator_confirmed: false,
        })
        .eq("id", asset.id);
    }
  }

  await service
    .from("rfq_information_requests")
    .update({
      status: "answered",
      response_payload: payload,
      answered_at: new Date().toISOString(),
    })
    .eq("id", request.id);

  await service
    .from("rfqs")
    .update({ status: "reviewing" })
    .eq("id", loaded.rfqId);

  await service.from("rfq_events").insert({
    rfq_id: loaded.rfqId,
    event_type: "customer_response_received",
    message: "Customer supplied requested information",
    metadata: { request_id: request.id, fields: Object.keys(input.responses) },
  });

  await writeAuditLog({
    action: "rfq_customer_info_response",
    entityType: "rfq",
    entityId: loaded.rfqId,
    afterData: { request_id: request.id },
    metadata: { via: "public_info_token" },
  });

  return { ok: true };
}

export async function updateMeasurementSchedule(input: {
  rfqId: string;
  siteMeasurementRequired?: boolean;
  proposedDate?: string | null;
  confirmedDate?: string | null;
  assignedEmployeeId?: string | null;
  travelKm?: number | null;
  customerConfirmed?: boolean;
  notes?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await assertAdmin({ permission: "manageRfqs" });
    const supabase = await createClient();

    const patch: Record<string, unknown> = {};
    if (input.siteMeasurementRequired !== undefined) {
      patch.site_measurement_required = input.siteMeasurementRequired;
      if (input.siteMeasurementRequired) {
        patch.status = "site_measurement_required";
      }
    }
    if (input.proposedDate !== undefined) {
      patch.measurement_proposed_date = input.proposedDate || null;
    }
    if (input.confirmedDate !== undefined) {
      patch.measurement_confirmed_date = input.confirmedDate || null;
    }
    if (input.assignedEmployeeId !== undefined) {
      patch.measurement_assigned_to = input.assignedEmployeeId || null;
    }
    if (input.travelKm !== undefined) {
      patch.measurement_travel_km = input.travelKm;
    }
    if (input.customerConfirmed !== undefined) {
      patch.measurement_customer_confirmed = input.customerConfirmed;
    }
    if (input.notes !== undefined) {
      patch.measurement_notes = input.notes;
    }

    const { error } = await supabase
      .from("rfqs")
      .update(patch)
      .eq("id", input.rfqId);
    if (error) return { ok: false, error: error.message };

    await supabase.from("rfq_events").insert({
      rfq_id: input.rfqId,
      actor_user_id: admin.user.id,
      actor_email: admin.user.email,
      event_type: "measurement_scheduled",
      message: "Measurement schedule updated",
      metadata: patch,
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_measurement_scheduled",
      entityType: "rfq",
      entityId: input.rfqId,
      afterData: patch,
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to update schedule.",
    };
  }
}
