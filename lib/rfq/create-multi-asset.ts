import { createHash, randomBytes } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { writeAuditLog } from "@/lib/auth/audit";
import { calculateRfqAsset } from "./calculations";
import {
  type PublicMultiRfqInput,
  validateProvince,
} from "./public-schema";

export type MultiRfqCreateResult =
  | {
      ok: true;
      rfqId: string;
      rfqNumber: string;
      uploadToken: string;
      idempotentReplay?: boolean;
    }
  | {
      ok: false;
      error: string;
      code?:
        | "VALIDATION_ERROR"
        | "CONFIGURATION_ERROR"
        | "DATABASE_UNAVAILABLE"
        | "DATABASE_CONSTRAINT"
        | "UNKNOWN_ERROR";
      details?: string;
    };

async function findOrCreateCustomer(input: {
  name: string;
  company: string;
  email: string;
  phone: string;
  province: string;
  vatNumber?: string;
}): Promise<string | null> {
  const client = createServiceRoleClient();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();

  if (email) {
    const { data } = await client
      .from("customers")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (phone) {
    const { data } = await client
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const { data: created, error } = await client
    .from("customers")
    .insert({
      customer_type: input.company ? "company" : "individual",
      name: input.name,
      company_name: input.company || null,
      email: email || null,
      phone: phone || null,
      province: input.province || null,
      vat_number: input.vatNumber || null,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[rfq] customer create failed:", error?.message);
    return null;
  }
  return created.id;
}

/**
 * Atomic-ish public RFQ submission: number → customer → RFQ → assets → snapshots.
 * Compensating deletes if a later step fails (service role has no SQL transaction RPC).
 */
export async function createMultiAssetRfqFromPublic(
  input: PublicMultiRfqInput,
  options: { markSpam?: boolean; submissionId?: string | null } = {},
): Promise<MultiRfqCreateResult> {
  if (!isSupabaseServiceConfigured()) {
    return {
      ok: false,
      error: "RFQ storage is not configured.",
      code: "CONFIGURATION_ERROR",
    };
  }

  const client = createServiceRoleClient();
  let rfqId: string | null = null;
  const submissionId = options.submissionId || input.submissionId || null;

  try {
    if (submissionId) {
      const { data: existing } = await client
        .from("rfqs")
        .select("id, rfq_number")
        .eq("public_submission_id", submissionId)
        .maybeSingle();
      if (existing?.id && existing.rfq_number) {
        const uploadToken = randomBytes(32).toString("base64url");
        const uploadTokenHash = createHash("sha256")
          .update(uploadToken, "utf8")
          .digest("hex");
        const uploadExpires = new Date();
        uploadExpires.setDate(uploadExpires.getDate() + 14);
        await client
          .from("rfqs")
          .update({
            public_upload_token_hash: uploadTokenHash,
            public_upload_token_expires_at: uploadExpires.toISOString(),
          })
          .eq("id", existing.id);
        return {
          ok: true,
          rfqId: existing.id,
          rfqNumber: existing.rfq_number,
          uploadToken,
          idempotentReplay: true,
        };
      }
    }

    // Recalculate every asset server-side
    const calculatedAssets = input.assets.map((asset, index) => {
      const calc = calculateRfqAsset({
        assetType: asset.assetType,
        measurementMethod: asset.measurementMethod,
        quantity: asset.quantity,
        rawInputs: { ...asset.rawInputs, quantity: asset.quantity },
      });
      return { asset, index, calc };
    });

    const hardFailures = calculatedAssets.filter(
      (row) =>
        !row.calc.ok &&
        row.asset.measurementMethod !== "drawings" &&
        row.asset.measurementMethod !== "site_measurement_required",
    );
    if (hardFailures.length) {
      const first = hardFailures[0].calc;
      return {
        ok: false,
        error:
          (!first.ok && first.errors[0]) ||
          "One or more assets have invalid dimensions.",
        code: "VALIDATION_ERROR",
      };
    }

    const { data: numberData, error: numberError } = await client.rpc(
      "next_rfq_number",
    );
    if (numberError || typeof numberData !== "string") {
      return {
        ok: false,
        error: "Unable to allocate RFQ number.",
        code: "DATABASE_UNAVAILABLE",
        details: numberError?.message,
      };
    }

    const customerId = await findOrCreateCustomer({
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      province: validateProvince(input.province),
      vatNumber: input.vatNumber,
    });
    if (!customerId) {
      return {
        ok: false,
        error: "Unable to save customer record.",
        code: "DATABASE_UNAVAILABLE",
      };
    }

    const uploadToken = randomBytes(32).toString("base64url");
    const uploadTokenHash = createHash("sha256")
      .update(uploadToken, "utf8")
      .digest("hex");
    const uploadExpires = new Date();
    uploadExpires.setDate(uploadExpires.getDate() + 14);

    const primaryService = input.servicesRequested[0] || "Other";
    const sizeSummary = calculatedAssets
      .map((row) => {
        if (!row.calc.ok) return `${row.asset.assetName}: measurement required`;
        const out = row.calc.outputs;
        const material = out.materialAreaM2 ?? out.provisionalMaterialAreaM2;
        const install = out.installationAreaM2;
        const capacity = out.grossCapacityKL ?? out.grossVolumeM3;
        if (typeof material === "number") {
          return `${row.asset.assetName}: ~${material} m² material (provisional)`;
        }
        if (typeof install === "number") {
          return `${row.asset.assetName}: ~${install} m² install (provisional)`;
        }
        if (typeof capacity === "number") {
          return `${row.asset.assetName}: ~${capacity} kL (provisional)`;
        }
        return `${row.asset.assetName}: details submitted`;
      })
      .join("; ");

    const { data: rfq, error: rfqError } = await client
      .from("rfqs")
      .insert({
        rfq_number: numberData,
        status: options.markSpam ? "spam" : "new",
        source: "website",
        source_page: input.sourcePage,
        customer_id: customerId,
        contact_name: input.name,
        company_name: input.company || null,
        email: input.email || null,
        phone: input.phone || null,
        alternative_phone: input.alternativePhone || null,
        province: validateProvince(input.province) || null,
        project_location:
          [input.farmProjectName, input.town, input.province]
            .filter(Boolean)
            .join(", ") || input.addressLine || null,
        farm_project_name: input.farmProjectName || null,
        address_line: input.addressLine || null,
        town: input.town || null,
        postal_code: input.postalCode || null,
        gps_lat: input.gpsLat ?? null,
        gps_lng: input.gpsLng ?? null,
        maps_link: input.mapsLink || null,
        access_notes: input.accessNotes || null,
        distance_from_town_km: input.distanceFromTownKm ?? null,
        service_required: primaryService,
        services_requested: input.servicesRequested,
        project_description: input.message || sizeSummary,
        approximate_project_size: sizeSummary.slice(0, 200),
        approximate_project_size_text: sizeSummary.slice(0, 500),
        preferred_contact_method: input.preferredContactMethod || null,
        vat_number: input.vatNumber || null,
        company_registration: input.companyRegistration || null,
        site_conditions: input.siteConditions ?? {},
        enquiry_channel: "calculator_quote_preparation",
        has_calculator_data: true,
        measurement_status: "information_not_yet_confirmed",
        calculator_type: input.calculatorSource?.calculatorType ?? null,
        calculator_input: input.calculatorSource?.inputs ?? null,
        calculator_result: input.calculatorSource?.results ?? null,
        public_upload_token_hash: uploadTokenHash,
        public_upload_token_expires_at: uploadExpires.toISOString(),
        public_submission_id: submissionId,
        submission_payload: {
          assetCount: input.assets.length,
          services: input.servicesRequested,
        },
      })
      .select("id, rfq_number")
      .single();

    if (rfqError || !rfq) {
      if (rfqError?.code === "23505" && submissionId) {
        const { data: existing } = await client
          .from("rfqs")
          .select("id, rfq_number")
          .eq("public_submission_id", submissionId)
          .maybeSingle();
        if (existing) {
          return {
            ok: true,
            rfqId: existing.id,
            rfqNumber: existing.rfq_number,
            uploadToken,
            idempotentReplay: true,
          };
        }
      }
      console.error("[rfq] insert failed:", rfqError?.message, rfqError?.code);
      return {
        ok: false,
        error: "Unable to save RFQ.",
        code:
          rfqError?.code === "23505"
            ? "DATABASE_CONSTRAINT"
            : "DATABASE_UNAVAILABLE",
        details: rfqError?.message,
      };
    }
    rfqId = rfq.id;

    const assetRows = calculatedAssets.map((row) => {
      const calc = row.calc;
      return {
        rfq_id: rfq.id,
        asset_sequence: row.index + 1,
        asset_name: row.asset.assetName,
        asset_type: row.asset.assetType,
        quantity: row.asset.quantity,
        measurement_method: row.asset.measurementMethod,
        material_preference: row.asset.materialPreference || null,
        measurement_status: calc.ok
          ? calc.measurementStatus
          : "site_measurement_required",
        raw_inputs: {
          ...row.asset.rawInputs,
          siteNotes: row.asset.siteNotes,
        },
        calculated_outputs: calc.ok
          ? calc.outputs
          : { errors: !calc.ok ? calc.errors : [] },
        calculation_version: calc.ok ? calc.calculationVersion : null,
        calculation_warnings: calc.ok
          ? calc.warnings
          : !calc.ok
            ? calc.warnings
            : [],
        site_conditions: row.asset.siteConditions ?? {},
      };
    });

    const { data: insertedAssets, error: assetsError } = await client
      .from("rfq_assets")
      .insert(assetRows)
      .select("id, asset_sequence");

    if (assetsError || !insertedAssets?.length) {
      console.error("[rfq] assets insert failed:", assetsError?.message);
      await client.from("rfqs").delete().eq("id", rfq.id);
      return {
        ok: false,
        error: "Unable to save RFQ assets.",
        code: "DATABASE_UNAVAILABLE",
        details: assetsError?.message,
      };
    }

    const calcSnapshots = calculatedAssets.flatMap((row) => {
      if (!row.calc.ok) return [];
      const assetRow = insertedAssets.find(
        (a) => a.asset_sequence === row.index + 1,
      );
      if (!assetRow) return [];
      return [
        {
          rfq_asset_id: assetRow.id,
          calculation_type: row.calc.calculationType,
          calculation_version: row.calc.calculationVersion,
          inputs: row.asset.rawInputs,
          outputs: row.calc.outputs,
          assumptions: row.calc.assumptions,
          warnings: row.calc.warnings,
          actor_type: "public",
        },
      ];
    });

    if (calcSnapshots.length) {
      const { error: snapError } = await client
        .from("rfq_asset_calculations")
        .insert(calcSnapshots);
      if (snapError) {
        console.error("[rfq] calc snapshot failed:", snapError.message);
        await client.from("rfqs").delete().eq("id", rfq.id);
        return {
          ok: false,
          error: "Unable to save calculation records.",
          code: "DATABASE_UNAVAILABLE",
          details: snapError.message,
        };
      }
    }

    await client.from("rfq_events").insert({
      rfq_id: rfq.id,
      event_type: "submitted",
      message: "Multi-asset RFQ submitted from public website",
      metadata: {
        source_page: input.sourcePage,
        asset_count: input.assets.length,
        spam: Boolean(options.markSpam),
      },
    });

    await writeAuditLog({
      action: "rfq_created_multi_asset",
      entityType: "rfq",
      entityId: rfq.id,
      afterData: {
        rfq_number: rfq.rfq_number,
        asset_count: input.assets.length,
      },
      metadata: { public: true },
    });

    return {
      ok: true,
      rfqId: rfq.id,
      rfqNumber: rfq.rfq_number,
      uploadToken,
    };
  } catch (error) {
    console.error("[rfq] multi-asset create unexpected:", error);
    if (rfqId) {
      await createServiceRoleClient().from("rfqs").delete().eq("id", rfqId);
    }
    return {
      ok: false,
      error: "Unable to save RFQ.",
      code: "UNKNOWN_ERROR",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}
