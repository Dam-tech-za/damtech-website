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

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.dam-tech.co.za";

  const catalogueLine = parsed.catalogueLine;
  const sizeHint = catalogueLine
    ? `${catalogueLine.sku} · ${catalogueLine.productName} × ${catalogueLine.quantity} · R ${catalogueLine.lineTotalInclVatZar.toFixed(2)} incl. VAT · transport excluded · installation excluded`
    : parsed.data.projectSize ||
      (parsed.softEstimates.estimated_area_m2
        ? `~${parsed.softEstimates.estimated_area_m2} m² (soft parse)`
        : parsed.softEstimates.estimated_capacity_kl
          ? `~${parsed.softEstimates.estimated_capacity_kl} kL (soft parse)`
          : "Size not provided");

  const emailConfig = getRfqEmailConfig();
  const adminPayload = {
    rfqNumber: created.rfqNumber,
    customerName: parsed.data.name,
    customerEmail: parsed.data.email,
    customerPhone: parsed.data.phone,
    customerCompany: parsed.data.company,
    services: [parsed.data.serviceRequired],
    location:
      parsed.data.deliveryAddress ||
      parsed.data.town ||
      parsed.data.projectLocation ||
      parsed.data.province ||
      "—",
    assetCount: catalogueLine ? catalogueLine.quantity : 0,
    quantitySummary: sizeHint,
    adminUrl: `${origin}/admin/rfqs/${created.rfqId}/`,
    enquiryChannel: parsed.enquiryChannel,
    messagePreview: parsed.data.message.slice(0, 280),
    extraRows: catalogueLine
      ? ([
          ["SKU", catalogueLine.sku],
          ["Product", catalogueLine.productName],
          ["Quantity", String(catalogueLine.quantity)],
          [
            "Unit price incl. VAT",
            `R ${catalogueLine.unitPriceInclVatZar.toFixed(2)}`,
          ],
          [
            "Line total incl. VAT",
            `R ${catalogueLine.lineTotalInclVatZar.toFixed(2)}`,
          ],
          ["VAT", "Included (15%)"],
          ["Transport", "Excluded"],
          ["Installation", "Excluded"],
        ] as const)
      : undefined,
  };

  const [adminResult, customerResult] = await Promise.all([
    sendRfqAdminNotification(adminPayload),
    parsed.data.email
      ? sendRfqCustomerConfirmation({
          to: parsed.data.email,
          customerName: parsed.data.name,
          rfqNumber: created.rfqNumber,
          projectLocation:
            parsed.data.town || parsed.data.projectLocation || "",
          assetSummaries: catalogueLine
            ? [
                `${catalogueLine.productName} (${catalogueLine.sku}) × ${catalogueLine.quantity}`,
                `Unit price: R ${catalogueLine.unitPriceInclVatZar.toFixed(2)} incl. VAT`,
                `Line total: R ${catalogueLine.lineTotalInclVatZar.toFixed(2)} incl. VAT`,
                "Transport excluded",
                "Installation excluded",
              ]
            : [],
          enquiryChannel: parsed.enquiryChannel,
          serviceRequired: parsed.data.serviceRequired,
          invoiceRequest: Boolean(catalogueLine),
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
    deliveryMode: "normal",
    rfqNumber: created.rfqNumber,
    uploadToken: created.uploadToken,
    notificationStatus: aggregateNotificationStatus([
      adminResult,
      customerResult,
    ]),
  };
}
