"use server";

import { headers } from "next/headers";
import { limitPublicRfqSubmit } from "@/lib/rate-limit/public-rfq";
import { createRfqFromPublicSubmission } from "@/lib/rfq/create-from-public";
import { parsePublicRfqFormData } from "@/lib/rfq/schema";
import { sendRfqAdminNotification } from "@/lib/rfq/email/send-rfq-admin-notification";
import { sendRfqCustomerConfirmation } from "@/lib/rfq/email/send-rfq-customer-confirmation";
import {
  aggregateNotificationStatus,
  enqueueNotificationOutbox,
  recordRfqCommunication,
} from "@/lib/rfq/communications";
import {
  customerMessageForCode,
  type PublicRfqNotificationStatus,
} from "@/lib/rfq/submission-result";
import {
  newIncidentId,
  rfqDebug,
  rfqLogError,
} from "@/lib/rfq/diagnostics";
import { getRfqEmailConfig } from "@/lib/rfq/email/config";

export type SubmitSimpleQuoteResult =
  | {
      success: true;
      rfqNumber: string;
      uploadToken: string;
      notificationStatus: PublicRfqNotificationStatus;
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

  const submissionIdRaw = String(formData.get("submissionId") ?? "").trim();
  const submissionId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      submissionIdRaw,
    )
      ? submissionIdRaw
      : null;

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
    await createRfqFromPublicSubmission({
      data: parsed.data,
      calculator: null,
      markSpam: true,
      enquiryChannel: "simple_public_rfq",
      softEstimates: parsed.softEstimates,
      simpleServiceFields: parsed.simpleServiceFields,
      assetsEstimate: parsed.assetsEstimate,
      submissionId,
    });
    return {
      success: true,
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
    enquiryChannel: "simple_public_rfq",
    softEstimates: parsed.softEstimates,
    simpleServiceFields: parsed.simpleServiceFields,
    assetsEstimate: parsed.assetsEstimate,
    submissionId,
  });

  if (!created.ok) {
    rfqLogError("rfq_submission_database_failed", {
      incidentId,
      stage: "create_simple_rfq",
      code: created.code,
      message: created.details || created.error,
    });
    return {
      success: false,
      error: customerMessageForCode(
        created.code === "CONFIGURATION_ERROR"
          ? "CONFIGURATION_ERROR"
          : "DATABASE_UNAVAILABLE",
        { incidentId },
      ),
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
      rfqNumber: created.rfqNumber,
      uploadToken: created.uploadToken,
      notificationStatus: "sent",
    };
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.dam-tech.co.za";

  const sizeHint =
    parsed.data.projectSize ||
    (parsed.softEstimates.estimated_area_m2
      ? `~${parsed.softEstimates.estimated_area_m2} m² (soft parse)`
      : parsed.softEstimates.estimated_capacity_kl
        ? `~${parsed.softEstimates.estimated_capacity_kl} kL (soft parse)`
        : "Size not provided");

  const emailConfig = getRfqEmailConfig();
  const adminPayload = {
    rfqNumber: created.rfqNumber,
    customerName: parsed.data.name,
    services: [parsed.data.serviceRequired],
    location: parsed.data.projectLocation || parsed.data.province || "—",
    assetCount: 0,
    quantitySummary: sizeHint,
    adminUrl: `${origin}/admin/rfqs/${created.rfqId}/`,
    enquiryChannel: "simple_public_rfq" as const,
    messagePreview: parsed.data.message.slice(0, 280),
  };

  const [adminResult, customerResult] = await Promise.all([
    sendRfqAdminNotification(adminPayload),
    parsed.data.email
      ? sendRfqCustomerConfirmation({
          to: parsed.data.email,
          customerName: parsed.data.name,
          rfqNumber: created.rfqNumber,
          projectLocation: parsed.data.projectLocation || "",
          assetSummaries: [],
          enquiryChannel: "simple_public_rfq",
          serviceRequired: parsed.data.serviceRequired,
        })
      : Promise.resolve({ ok: true as const, status: "skipped" as const }),
  ]);

  await Promise.all([
    recordRfqCommunication({
      rfqId: created.rfqId,
      communicationType: "admin_notification",
      recipient: emailConfig.internalNotificationEmail,
      subject: `New RFQ ${created.rfqNumber}`,
      result: adminResult,
    }),
    parsed.data.email
      ? recordRfqCommunication({
          rfqId: created.rfqId,
          communicationType: "customer_confirmation",
          recipient: parsed.data.email,
          subject: `Damtech RFQ Received — ${created.rfqNumber}`,
          result: customerResult,
        })
      : Promise.resolve(),
  ]);

  if (!adminResult.ok) {
    await enqueueNotificationOutbox({
      entityType: "rfq",
      entityId: created.rfqId,
      notificationType: "admin_notification",
      recipient: emailConfig.internalNotificationEmail,
      payload: adminPayload,
    });
  }

  return {
    success: true,
    rfqNumber: created.rfqNumber,
    uploadToken: created.uploadToken,
    notificationStatus: aggregateNotificationStatus([
      adminResult,
      customerResult,
    ]),
  };
}
