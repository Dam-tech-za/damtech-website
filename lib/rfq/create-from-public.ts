import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { writeAuditLog } from "@/lib/auth/audit";
import type { CalculatorPayload, PublicRfqSubmission } from "./schema";

export type CreateRfqResult =
  | { ok: true; rfqId: string; rfqNumber: string; customerId: string }
  | { ok: false; error: string };

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
}): Promise<CreateRfqResult> {
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, error: "RFQ storage is not configured." };
  }

  try {
    const client = createServiceRoleClient();
    const { data: numberData, error: numberError } = await client.rpc(
      "next_rfq_number",
    );

    if (numberError || typeof numberData !== "string") {
      console.error("[rfq] number generation failed:", numberError?.message);
      return { ok: false, error: "Unable to allocate RFQ number." };
    }

    const customerId = await findOrCreateCustomer({
      name: input.data.name,
      company: input.data.company,
      email: input.data.email,
      phone: input.data.phone,
      province: input.data.province,
    });

    if (!customerId) {
      return { ok: false, error: "Unable to save customer record." };
    }

    const { data: rfq, error } = await client
      .from("rfqs")
      .insert({
        rfq_number: numberData,
        status: input.markSpam ? "spam" : "new",
        source: "website",
        source_page: input.data.sourcePage,
        customer_id: customerId,
        contact_name: input.data.name,
        company_name: input.data.company || null,
        email: input.data.email || null,
        phone: input.data.phone || null,
        province: input.data.province || null,
        project_location: input.data.projectLocation || null,
        service_required: input.data.serviceRequired,
        project_description: input.data.message,
        approximate_project_size: input.data.projectSize || null,
        preferred_contact_method: input.data.preferredContactMethod || null,
        calculator_type: input.calculator?.calculatorType ?? null,
        calculator_input: input.calculator?.inputs ?? null,
        calculator_result: input.calculator?.results ?? null,
      })
      .select("id, rfq_number")
      .single();

    if (error || !rfq) {
      console.error("[rfq] insert failed:", error?.message);
      return { ok: false, error: "Unable to save RFQ." };
    }

    await client.from("rfq_events").insert({
      rfq_id: rfq.id,
      event_type: "submitted",
      message: "RFQ submitted from public website",
      metadata: {
        source_page: input.data.sourcePage,
        has_calculator: Boolean(input.calculator),
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
        status: input.markSpam ? "spam" : "new",
      },
      metadata: { public: true },
    });

    return {
      ok: true,
      rfqId: rfq.id,
      rfqNumber: rfq.rfq_number,
      customerId,
    };
  } catch (error) {
    console.error("[rfq] unexpected create failure:", error);
    return { ok: false, error: "Unable to save RFQ." };
  }
}
