"use server";

import { headers } from "next/headers";
import { insertLead, isSupabaseConfigured } from "@/lib/supabase/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { limitPublicRfqSubmit } from "@/lib/rate-limit/public-rfq";
import { createRfqFromPublicSubmission } from "@/lib/rfq/create-from-public";
import { parsePublicRfqFormData } from "@/lib/rfq/schema";
import { customerMessageForCode } from "@/lib/rfq/submission-result";
import { newIncidentId, rfqLogError } from "@/lib/rfq/diagnostics";
import { attemptDatabaseFallbackAfterPersistenceFailure } from "@/lib/fallback/after-persistence-failure";
import { buildContactFallbackInput } from "@/lib/fallback/payloads";
import { parseSubmissionIdFromFormData } from "@/lib/fallback/submission-id";

export type SubmitLeadResult =
  | { success: true; deliveryMode: "normal"; rfqNumber?: string }
  | { success: true; deliveryMode: "fallback"; incidentId: string }
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

  const submissionParsed = parseSubmissionIdFromFormData(formData);
  if (!submissionParsed.ok) {
    return {
      success: false,
      error: submissionParsed.error,
      code: "VALIDATION_ERROR",
      incidentId,
    };
  }
  const submissionId = submissionParsed.submissionId;

  const formStartedRaw = String(formData.get("formStartedAt") ?? "").trim();
  const formStartedAt = formStartedRaw ? Number(formStartedRaw) : NaN;
  if (Number.isFinite(formStartedAt) && Date.now() - formStartedAt < 4000) {
    return {
      success: false,
      error: "Please take a moment to review your details.",
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
        catalogueLine: parsed.catalogueLine,
        submissionId,
      });
    }
    return { success: true, deliveryMode: "normal" };
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

  let rfqNumber: string | undefined;
  let persistenceErrorCode: string | undefined;

  if (isSupabaseServiceConfigured()) {
    const rfqResult = await createRfqFromPublicSubmission({
      data: parsed.data,
      calculator: parsed.calculator,
      enquiryChannel: parsed.enquiryChannel,
      softEstimates: parsed.softEstimates,
      simpleServiceFields: parsed.simpleServiceFields,
      assetsEstimate: parsed.assetsEstimate,
      catalogueLine: parsed.catalogueLine,
      submissionId,
    });

    if (!rfqResult.ok) {
      rfqLogError("rfq_submission_database_failed", {
        incidentId,
        stage: "create_lead_rfq",
        code: rfqResult.code,
        message: rfqResult.details || rfqResult.error,
      });
      persistenceErrorCode = rfqResult.code;
    } else {
      rfqNumber = rfqResult.rfqNumber;
    }
  } else {
    persistenceErrorCode = "CONFIGURATION_ERROR";
  }

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
    return { success: true, deliveryMode: "normal", rfqNumber };
  }

  const fallback = await attemptDatabaseFallbackAfterPersistenceFailure({
    incidentId,
    databaseErrorCode: persistenceErrorCode,
    fallbackInput: buildContactFallbackInput({
      incidentId,
      submissionId,
      data: parsed.data,
      sourcePage,
    }),
  });

  if (fallback.ok) {
    return {
      success: true,
      deliveryMode: "fallback",
      incidentId: fallback.incidentId,
    };
  }

  return {
    success: false,
    error: fallback.customerMessage,
    code: persistenceErrorCode || "DATABASE_UNAVAILABLE",
    incidentId,
  };
}
