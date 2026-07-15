import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { calculateRfqAsset } from "./calculations";
import type { AssetMeasurementStatus } from "./statuses";
import type { MeasurementMethod, RfqAssetType } from "./calculations";

export async function confirmRfqAsset(input: {
  assetId: string;
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await assertAdmin({ permission: "manageRfqs" });
    const supabase = await createClient();
    const { data: asset } = await supabase
      .from("rfq_assets")
      .select("*")
      .eq("id", input.assetId)
      .maybeSingle();
    if (!asset) return { ok: false, error: "Asset not found." };

    const out = (asset.calculated_outputs ?? {}) as Record<string, unknown>;
    const { error } = await supabase
      .from("rfq_assets")
      .update({
        measurement_status: "confirmed_for_quote",
        estimator_confirmed: true,
        estimator_confirmed_by: admin.user.id,
        estimator_confirmed_at: new Date().toISOString(),
        estimator_notes: input.notes ?? asset.estimator_notes,
        confirmed_installation_area_m2:
          asset.confirmed_installation_area_m2 ??
          num(out.installationAreaM2),
        confirmed_material_area_m2:
          asset.confirmed_material_area_m2 ?? num(out.materialAreaM2),
        confirmed_capacity_kl:
          asset.confirmed_capacity_kl ??
          num(out.totalGrossCapacityKL) ??
          num(out.grossCapacityKL),
      })
      .eq("id", input.assetId);

    if (error) return { ok: false, error: error.message };

    await supabase.from("rfq_events").insert({
      rfq_id: asset.rfq_id,
      actor_user_id: admin.user.id,
      actor_email: admin.user.email,
      event_type: "asset_confirmed",
      message: `Asset confirmed: ${asset.asset_name}`,
      metadata: { asset_id: asset.id },
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_asset_confirmed",
      entityType: "rfq_asset",
      entityId: asset.id,
      afterData: { rfq_id: asset.rfq_id },
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to confirm asset.",
    };
  }
}

export async function overrideRfqAssetQuantities(input: {
  assetId: string;
  reason: string;
  measurementStatus?: AssetMeasurementStatus;
  rawInputs?: Record<string, unknown>;
  recalculate?: boolean;
  confirmedInstallationAreaM2?: number | null;
  confirmedMaterialAreaM2?: number | null;
  confirmedGeotextileAreaM2?: number | null;
  confirmedSurfacePrepAreaM2?: number | null;
  confirmedAnchorAreaM2?: number | null;
  confirmedVolumeM3?: number | null;
  confirmedCapacityKl?: number | null;
  confirmedOverlapPercent?: number | null;
  confirmedWastePercent?: number | null;
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await assertAdmin({ permission: "manageRfqs" });
    if (!input.reason.trim()) {
      return { ok: false, error: "Override reason is required." };
    }

    const supabase = await createClient();
    const { data: asset } = await supabase
      .from("rfq_assets")
      .select("*")
      .eq("id", input.assetId)
      .maybeSingle();
    if (!asset) return { ok: false, error: "Asset not found." };

    const before = {
      calculated_outputs: asset.calculated_outputs,
      confirmed_installation_area_m2: asset.confirmed_installation_area_m2,
      confirmed_material_area_m2: asset.confirmed_material_area_m2,
      measurement_status: asset.measurement_status,
      raw_inputs: asset.raw_inputs,
    };

    const rawInputs = {
      ...(asset.raw_inputs as Record<string, unknown>),
      ...(input.rawInputs ?? {}),
    };

    let outputs = asset.calculated_outputs as Record<string, unknown>;
    let warnings = asset.calculation_warnings;
    let version = asset.calculation_version;
    let assumptions: Record<string, unknown> = {};

    if (input.recalculate || input.rawInputs) {
      const calc = calculateRfqAsset({
        assetType: asset.asset_type as RfqAssetType,
        measurementMethod: asset.measurement_method as MeasurementMethod,
        quantity: asset.quantity,
        rawInputs: { ...rawInputs, quantity: asset.quantity },
      });
      if (!calc.ok) {
        return { ok: false, error: calc.errors[0] || "Recalculation failed." };
      }
      outputs = calc.outputs;
      warnings = calc.warnings;
      version = calc.calculationVersion;
      assumptions = calc.assumptions;

      await supabase.from("rfq_asset_calculations").insert({
        rfq_asset_id: asset.id,
        calculation_type: calc.calculationType,
        calculation_version: calc.calculationVersion,
        inputs: rawInputs,
        outputs: calc.outputs,
        assumptions: calc.assumptions,
        warnings: calc.warnings,
        actor_type: "estimator",
        actor_user_id: admin.user.id,
      });
    } else {
      await supabase.from("rfq_asset_calculations").insert({
        rfq_asset_id: asset.id,
        calculation_type: "estimator_override",
        calculation_version: version || "manual",
        inputs: rawInputs,
        outputs: {
          confirmed_installation_area_m2: input.confirmedInstallationAreaM2,
          confirmed_material_area_m2: input.confirmedMaterialAreaM2,
          confirmed_capacity_kl: input.confirmedCapacityKl,
        },
        assumptions: { override: true, reason: input.reason },
        warnings: [],
        actor_type: "estimator",
        actor_user_id: admin.user.id,
      });
    }

    const afterPatch: Record<string, unknown> = {
      raw_inputs: rawInputs,
      calculated_outputs: outputs,
      calculation_warnings: warnings,
      calculation_version: version,
      estimator_override_reason: input.reason,
      estimator_notes: input.notes ?? asset.estimator_notes,
      measurement_status:
        input.measurementStatus ||
        (input.recalculate ? "under_review" : asset.measurement_status),
    };

    if (input.confirmedInstallationAreaM2 !== undefined) {
      afterPatch.confirmed_installation_area_m2 = input.confirmedInstallationAreaM2;
    } else if (input.recalculate) {
      afterPatch.confirmed_installation_area_m2 = num(outputs.installationAreaM2);
    }
    if (input.confirmedMaterialAreaM2 !== undefined) {
      afterPatch.confirmed_material_area_m2 = input.confirmedMaterialAreaM2;
    } else if (input.recalculate) {
      afterPatch.confirmed_material_area_m2 = num(outputs.materialAreaM2);
    }
    if (input.confirmedGeotextileAreaM2 !== undefined) {
      afterPatch.confirmed_geotextile_area_m2 = input.confirmedGeotextileAreaM2;
    }
    if (input.confirmedSurfacePrepAreaM2 !== undefined) {
      afterPatch.confirmed_surface_prep_area_m2 = input.confirmedSurfacePrepAreaM2;
    }
    if (input.confirmedAnchorAreaM2 !== undefined) {
      afterPatch.confirmed_anchor_area_m2 = input.confirmedAnchorAreaM2;
    }
    if (input.confirmedVolumeM3 !== undefined) {
      afterPatch.confirmed_volume_m3 = input.confirmedVolumeM3;
    }
    if (input.confirmedCapacityKl !== undefined) {
      afterPatch.confirmed_capacity_kl = input.confirmedCapacityKl;
    }
    if (input.confirmedOverlapPercent !== undefined) {
      afterPatch.confirmed_overlap_percent = input.confirmedOverlapPercent;
    }
    if (input.confirmedWastePercent !== undefined) {
      afterPatch.confirmed_waste_percent = input.confirmedWastePercent;
    }

    const { error } = await supabase
      .from("rfq_assets")
      .update(afterPatch)
      .eq("id", asset.id);
    if (error) return { ok: false, error: error.message };

    await supabase.from("rfq_events").insert({
      rfq_id: asset.rfq_id,
      actor_user_id: admin.user.id,
      actor_email: admin.user.email,
      event_type: "calculation_overridden",
      message: `Override on ${asset.asset_name}: ${input.reason}`,
      metadata: { asset_id: asset.id, before, after: afterPatch, assumptions },
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_asset_override",
      entityType: "rfq_asset",
      entityId: asset.id,
      beforeData: before,
      afterData: afterPatch,
      metadata: { reason: input.reason },
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to override asset.",
    };
  }
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}
