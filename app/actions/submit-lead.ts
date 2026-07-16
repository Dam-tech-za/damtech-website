"use server";

import { headers } from "next/headers";
import { sendLeadEmail, leadEmailChannel } from "@/lib/email";
import { insertLead, isSupabaseConfigured } from "@/lib/supabase/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { limitPublicRfqSubmit } from "@/lib/rate-limit/public-rfq";
import { createRfqFromPublicSubmission } from "@/lib/rfq/create-from-public";
import { parsePublicRfqFormData } from "@/lib/rfq/schema";
import {
  customerMessageForCode,
} from "@/lib/rfq/submission-result";
import { newIncidentId, rfqLogError } from "@/lib/rfq/diagnostics";

export type SubmitLeadResult =
  | { success: true; rfqNumber?: string }
  | { success: false; error: string; code?: string; incidentId?: string };

export async function submitLead(
  formData: FormData,
  sourcePage: string,
): Promise<SubmitLeadResult> {
  const incidentId = newIncidentId();

  const parsed = parsePublicRfqFormData(formData, sourcePage);
  if (!parsed.ok) {
    return {
      success: false,
      error: parsed.error,
      code: "VALIDATION_ERROR",
      incidentId,
    };
  }

  if (parsed.isSpam) {
    if (isSupabaseServiceConfigured()) {
      await createRfqFromPublicSubmission({
        data: parsed.data,
        calculator: parsed.calculator,
        markSpam: true,
        enquiryChannel: parsed.enquiryChannel,
        softEstimates: parsed.softEstimates,
        simpleServiceFields: parsed.simpleServiceFields,
        assetsEstimate: parsed.assetsEstimate,
      });
    }
    return { success: true };
  }

  const headerList = await headers();
  const limited = await limitPublicRfqSubmit(headerList);
  if (!limited.success && limited.reason === "rate_limited") {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((limited.resetAt - Date.now()) / 1000),
    );
    return {
      success: false,
      error: customerMessageForCode("RATE_LIMITED", { retryAfterSeconds }),
      code: "RATE_LIMITED",
      incidentId,
    };
  }

  // Persist RFQ first when service role is available — email is secondary.
  let rfqNumber: string | undefined;
  if (isSupabaseServiceConfigured()) {
    const rfqResult = await createRfqFromPublicSubmission({
      data: parsed.data,
      calculator: parsed.calculator,
      enquiryChannel: parsed.enquiryChannel,
      softEstimates: parsed.softEstimates,
      simpleServiceFields: parsed.simpleServiceFields,
      assetsEstimate: parsed.assetsEstimate,
    });
    if (!rfqResult.ok) {
      rfqLogError("rfq_submission_database_failed", {
        incidentId,
        stage: "create_lead_rfq",
        code: rfqResult.code,
        message: rfqResult.details || rfqResult.error,
      });
      // Fall through to email-only path for contact if DB fails — still try email.
    } else {
      rfqNumber = rfqResult.rfqNumber;
    }
  }

  const channel = leadEmailChannel(sourcePage);
  const emailResult = await sendLeadEmail(
    {
      name: parsed.data.name,
      company: parsed.data.company,
      phone: parsed.data.phone,
      email: parsed.data.email,
      province: parsed.data.province,
      serviceRequired: parsed.data.serviceRequired,
      projectSize: parsed.data.projectSize,
      projectLocation: parsed.data.projectLocation,
      message: parsed.data.message,
      sourcePage: parsed.data.sourcePage,
    },
    channel,
  );

  // Success if RFQ saved OR email sent — never lose the enquiry both ways.
  if (rfqNumber) {
    if (isSupabaseConfigured()) {
      await insertLead({
        name: parsed.data.name,
        company: parsed.data.company || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        province: parsed.data.province || null,
        service_required: parsed.data.serviceRequired,
        project_size: parsed.data.projectSize || null,
        project_location: parsed.data.projectLocation || null,
        message: parsed.data.message,
        source_page: parsed.data.sourcePage,
      });
    }
    return { success: true, rfqNumber };
  }

  if (!emailResult.ok) {
    return {
      success: false,
      error: emailResult.error,
      code: "CONFIGURATION_ERROR",
      incidentId,
    };
  }

  if (isSupabaseConfigured()) {
    await insertLead({
      name: parsed.data.name,
      company: parsed.data.company || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      province: parsed.data.province || null,
      service_required: parsed.data.serviceRequired,
      project_size: parsed.data.projectSize || null,
      project_location: parsed.data.projectLocation || null,
      message: parsed.data.message,
      source_page: parsed.data.sourcePage,
    });
  }

  return { success: true };
}
