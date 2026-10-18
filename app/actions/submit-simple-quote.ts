"use server";

import { headers } from "next/headers";
import { limitPublicRfqSubmit } from "@/lib/rate-limit/public-rfq";
import { createRfqFromPublicSubmission } from "@/lib/rfq/create-from-public";
import { parsePublicRfqFormData } from "@/lib/rfq/schema";
import { notifyNewPublicRfq } from "@/lib/rfq/notify-public-rfq";
import {
  customerMessageForCode,
  type PublicRfqNotificationStatus,
} from "@/lib/rfq/submission-result";
import {
  newIncidentId,
  rfqDebug,
  rfqLogError,
} from "@/lib/rfq/diagnostics";
import { attemptDatabaseFallbackAfterPersistenceFailure } from "@/lib/fallback/after-persistence-failure";
import { buildSimpleQuoteFallbackInput } from "@/lib/fallback/payloads";
import { parseSubmissionIdFromFormData } from "@/lib/fallback/submission-id";

export type SubmitSimpleQuoteResult =
  | {
      success: true;
      deliveryMode: "normal";
      rfqNumber: string;
      uploadToken: string;
      notificationStatus: PublicRfqNotificationStatus;
    }
  | {
      success: true;
      deliveryMode: "fallback";
      incidentId: string;
    }
  | { success: false; error: string; code?: string; incidentId?: string };

export async function submitSimpleQuote(
  formData: FormData,
  sourcePage = "/quote",
): Promise<SubmitSimpleQuoteResult> {
  const incidentId = newIncidentId();
  rfqDebug("validation_started", { incidentId });

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
    // Bots that trip the honeypot are still recorded for review, but only within
    // the public rate limit so they cannot flood the rfqs/customers tables.
    const spamLimit = await limitPublicRfqSubmit(await headers());
    if (!spamLimit.success) {
      return {
        success: true,
        deliveryMode: "normal",
        rfqNumber: "RFQ-RECEIVED",
        uploadToken: "spam",
        notificationStatus: "sent",
      };
    }
    await createRfqFromPublicSubmission({
      data: parsed.data,
      calculator: null,
      markSpam: true,
      enquiryChannel: parsed.enquiryChannel,
      softEstimates: parsed.softEstimates,
      simpleServiceFields: parsed.simpleServiceFields,
      assetsEstimate: parsed.assetsEstimate,
      submissionId,
      catalogueLine: parsed.catalogueLine,
    });
    return {
      success: true,
      deliveryMode: "normal",
      rfqNumber: "RFQ-RECEIVED",
      uploadToken: "spam",
      notificationStatus: "sent",
    };
  }

  rfqDebug("validation_passed", { incidentId });
  rfqDebug("rate_limit_started", { incidentId });

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

  rfqDebug("rate_limit_passed", { incidentId, provider: limited.provider });
  rfqDebug("database_started", { incidentId });

  const created = await createRfqFromPublicSubmission({
    data: parsed.data,
    calculator: null,
    enquiryChannel: parsed.enquiryChannel,
    softEstimates: parsed.softEstimates,
    simpleServiceFields: parsed.simpleServiceFields,
    assetsEstimate: parsed.assetsEstimate,
    submissionId,
    catalogueLine: parsed.catalogueLine,
  });

  if (!created.ok) {
    rfqLogError("rfq_submission_database_failed", {
      incidentId,
      stage: "create_simple_rfq",
      code: created.code,
      message: created.details || created.error,
    });

    const fallback = await attemptDatabaseFallbackAfterPersistenceFailure({
      incidentId,
      databaseErrorCode: created.code,
      fallbackInput: buildSimpleQuoteFallbackInput({
        incidentId,
        submissionId,
        data: parsed.data,
        catalogueLine: parsed.catalogueLine,
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
      code: created.code || "DATABASE_UNAVAILABLE",
      incidentId,
    };
  }

  rfqDebug("database_committed", {
    incidentId,
    rfqNumber: created.rfqNumber,
  });

  if (created.idempotentReplay) {
    return {
      success: true,
      deliveryMode: "normal",
      rfqNumber: created.rfqNumber,
      uploadToken: created.uploadToken,
      notificationStatus: "sent",
    };
  }

  const notificationStatus = await notifyNewPublicRfq({
    rfqId: created.rfqId,
    rfqNumber: created.rfqNumber,
    parsed,
  });

  return {
    success: true,
    deliveryMode: "normal",
    rfqNumber: created.rfqNumber,
    uploadToken: created.uploadToken,
    notificationStatus,
  };
}
