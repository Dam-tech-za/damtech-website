import { assertAdmin } from "@/lib/auth/require-admin";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { suggestLineItemsFromCalculator } from "./calculator";
import type { CalculatorPayload } from "./schema";

export type ConvertRfqResult =
  | { ok: true; quoteId: string; quoteNumber: string }
  | { ok: false; error: string; code?: "already_converted" | "forbidden" | "not_found" };

/**
 * Convert RFQ → draft quote foundation (Phase 3 expands full quote UX).
 */
export async function convertRfqToQuote(
  rfqId: string,
  options: { forceSecondQuote?: boolean } = {},
): Promise<ConvertRfqResult> {
  try {
    const admin = await assertAdmin({ permission: "manageQuotes" });
    const supabase = await createClient();

    const { data: rfq, error } = await supabase
      .from("rfqs")
      .select("*")
      .eq("id", rfqId)
      .maybeSingle();

    if (error || !rfq) {
      return { ok: false, error: "RFQ not found.", code: "not_found" };
    }

    if (rfq.status === "converted" && rfq.converted_quote_id && !options.forceSecondQuote) {
      return {
        ok: false,
        error: "RFQ already converted. Use explicit second-quote action if needed.",
        code: "already_converted",
      };
    }

    const service = createServiceRoleClient();
    const { data: quoteNumber, error: numberError } = await service.rpc(
      "next_quote_number",
    );

    if (numberError || typeof quoteNumber !== "string") {
      return { ok: false, error: "Unable to allocate quote number." };
    }

    const calculator: CalculatorPayload | null =
      rfq.calculator_type && rfq.calculator_input && rfq.calculator_result
        ? {
            calculatorType: rfq.calculator_type,
            inputs: rfq.calculator_input as Record<string, unknown>,
            results: rfq.calculator_result as Record<string, unknown>,
          }
        : null;

    const lineItems = suggestLineItemsFromCalculator(calculator);
    const validityDays = 30;
    const expiresAt = new Date(
      Date.now() + validityDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        status: "draft",
        customer_id: rfq.customer_id,
        rfq_id: rfq.id,
        title: `${rfq.service_required ?? "Project"} — ${rfq.rfq_number}`,
        contact_name: rfq.contact_name,
        company_name: rfq.company_name,
        email: rfq.email,
        phone: rfq.phone,
        province: rfq.province,
        project_location: rfq.project_location,
        service_required: rfq.service_required,
        project_description: rfq.project_description,
        calculator_type: rfq.calculator_type,
        calculator_input: rfq.calculator_input,
        calculator_result: rfq.calculator_result,
        line_items: lineItems,
        validity_days: validityDays,
        expires_at: expiresAt,
        created_by: admin.user.id,
        assigned_to: rfq.assigned_to ?? admin.user.id,
      })
      .select("id, quote_number")
      .single();

    if (quoteError || !quote) {
      console.error("[rfq] convert quote insert failed:", quoteError?.message);
      return { ok: false, error: "Unable to create draft quote." };
    }

    const { error: updateError } = await supabase
      .from("rfqs")
      .update({
        status: "converted",
        converted_quote_id: quote.id,
        reviewed_at: rfq.reviewed_at ?? new Date().toISOString(),
      })
      .eq("id", rfq.id);

    if (updateError) {
      console.error("[rfq] convert status update failed:", updateError.message);
    }

    await supabase.from("rfq_events").insert({
      rfq_id: rfq.id,
      actor_user_id: admin.user.id,
      actor_email: admin.user.email,
      event_type: "converted_to_quote",
      message: `Converted to draft quote ${quote.quote_number}`,
      metadata: {
        quote_id: quote.id,
        force_second: Boolean(options.forceSecondQuote),
      },
    });

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.user.email,
      action: "rfq_converted_to_quote",
      entityType: "rfq",
      entityId: rfq.id,
      afterData: {
        quote_id: quote.id,
        quote_number: quote.quote_number,
      },
    });

    return { ok: true, quoteId: quote.id, quoteNumber: quote.quote_number };
  } catch (error) {
    if (error instanceof Error && error.name === "AdminAuthError") {
      return { ok: false, error: error.message, code: "forbidden" };
    }
    console.error("[rfq] convert unexpected:", error);
    return { ok: false, error: "Unable to convert RFQ." };
  }
}
