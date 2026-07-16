import { createHash, randomBytes } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { writeAuditLog } from "@/lib/auth/audit";
import type { EnquiryChannel } from "./enquiry-channel";
import type {
  CalculatorPayload,
  ParsedSimpleServiceFields,
  PublicRfqSubmission,
} from "./schema";
import type { SoftSizeEstimates } from "./soft-size-parse";

export type CreateRfqResult =
  | {
      ok: true;
      rfqId: string;
      rfqNumber: string;
      customerId: string;
      uploadToken: string;
      idempotentReplay?: boolean;
    }
  | {
      ok: false;
      error: string;
      code?:
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
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[rfq] customer create failed:", error?.message);
    return null;
  }

  return created.id;
}

export async function createRfqFromPublicSubmission(input: {
  data: PublicRfqSubmission;
  calculator: CalculatorPayload | null;
  markSpam?: boolean;
  enquiryChannel?: EnquiryChannel;
  softEstimates?: SoftSizeEstimates;
  simpleServiceFields?: ParsedSimpleServiceFields;
  assetsEstimate?: number | null;
  submissionId?: string | null;
}): Promise<CreateRfqResult> {
  if (!isSupabaseServiceConfigured()) {
    return {
      ok: false,
      error: "RFQ storage is not configured.",
      code: "CONFIGURATION_ERROR",
    };
  }

  try {
    const client = createServiceRoleClient();

    if (input.submissionId) {
      const { data: existing } = await client
        .from("rfqs")
        .select("id, rfq_number, customer_id")
        .eq("public_submission_id", input.submissionId)
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
          customerId: existing.customer_id || "",
          uploadToken,
          idempotentReplay: true,
        };
      }
    }

    const { data: numberData, error: numberError } = await client.rpc(
      "next_rfq_number",
    );

    if (numberError || typeof numberData !== "string") {
      console.error("[rfq] number generation failed:", numberError?.message);
      return {
        ok: false,
        error: "Unable to allocate RFQ number.",
        code: "DATABASE_UNAVAILABLE",
        details: numberError?.message,
      };
    }

    const customerId = await findOrCreateCustomer({
      name: input.data.name,
      company: input.data.company,
      email: input.data.email,
      phone: input.data.phone,
      province: input.data.province,
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

    const enquiryChannel =
      input.enquiryChannel ??
      (input.calculator
        ? "calculator_quote_preparation"
        : input.data.sourcePage.toLowerCase().includes("contact")
          ? "contact_enquiry"
          : "simple_public_rfq");

    const soft = input.softEstimates;
    const sizeText = input.data.projectSize || null;
    const hasCalculator = Boolean(input.calculator);

    const { data: rfq, error } = await client
      .from("rfqs")
      .insert({
        rfq_number: numberData,
        status: input.markSpam ? "spam" : "new",
        source: "website",
        source_page: input.data.sourcePage,
        enquiry_channel: enquiryChannel,
        customer_id: customerId,
        contact_name: input.data.name,
        company_name: input.data.company || null,
        email: input.data.email || null,
        phone: input.data.phone || null,
        province: input.data.province || null,
        project_location: input.data.projectLocation || null,
        service_required: input.data.serviceRequired,
        project_description: input.data.message,
        approximate_project_size: sizeText,
        approximate_project_size_text: sizeText,
        estimated_area_m2: soft?.estimated_area_m2 ?? null,
        estimated_capacity_kl: soft?.estimated_capacity_kl ?? null,
        estimated_diameter_m: soft?.estimated_diameter_m ?? null,
        estimated_height_m: soft?.estimated_height_m ?? null,
        material_preference: input.data.materialPreference || null,
        number_of_assets_estimate: input.assetsEstimate ?? null,
        preferred_timeframe: input.data.preferredTimeframe || null,
        simple_service_fields: input.simpleServiceFields ?? {},
        measurement_status: "information_not_yet_confirmed",
        has_calculator_data: hasCalculator,
        preferred_contact_method: input.data.preferredContactMethod || null,
        calculator_type: input.calculator?.calculatorType ?? null,
        calculator_input: input.calculator?.inputs ?? null,
        calculator_result: input.calculator?.results ?? null,
        public_upload_token_hash: uploadTokenHash,
        public_upload_token_expires_at: uploadExpires.toISOString(),
        public_submission_id: input.submissionId || null,
      })
      .select("id, rfq_number")
      .single();

    if (error || !rfq) {
      // Unique violation on public_submission_id → return original
      if (error?.code === "23505" && input.submissionId) {
        const { data: existing } = await client
          .from("rfqs")
          .select("id, rfq_number, customer_id")
          .eq("public_submission_id", input.submissionId)
          .maybeSingle();
        if (existing) {
          return {
            ok: true,
            rfqId: existing.id,
            rfqNumber: existing.rfq_number,
            customerId: existing.customer_id || customerId,
            uploadToken: "",
            idempotentReplay: true,
          };
        }
      }
      console.error("[rfq] insert failed:", error?.message, error?.code);
      return {
        ok: false,
        error: "Unable to save RFQ.",
        code:
          error?.code === "23505"
            ? "DATABASE_CONSTRAINT"
            : "DATABASE_UNAVAILABLE",
        details: error?.message,
      };
    }

    await client.from("rfq_events").insert({
      rfq_id: rfq.id,
      event_type: "submitted",
      message: "RFQ submitted from public website",
      metadata: {
        source_page: input.data.sourcePage,
        enquiry_channel: enquiryChannel,
        has_calculator: hasCalculator,
        asset_count: 0,
        spam: Boolean(input.markSpam),
      },
    });

    await writeAuditLog({
      action: "rfq_created",
      entityType: "rfq",
      entityId: rfq.id,
      afterData: {
        rfq_number: rfq.rfq_number,
        source_page: input.data.sourcePage,
        enquiry_channel: enquiryChannel,
        status: input.markSpam ? "spam" : "new",
      },
      metadata: { public: true },
    });

    return {
      ok: true,
      rfqId: rfq.id,
      rfqNumber: rfq.rfq_number,
      customerId,
      uploadToken,
    };
  } catch (error) {
    console.error("[rfq] unexpected create failure:", error);
    return {
      ok: false,
      error: "Unable to save RFQ.",
      code: "UNKNOWN_ERROR",
      details: error instanceof Error ? error.message : undefined,
    };
  }
}
