"use server";

import { headers } from "next/headers";
import { limitPublicRfqSubmit } from "@/lib/rate-limit/public-rfq";
import { createMultiAssetRfqFromPublic } from "@/lib/rfq/create-multi-asset";
import { publicMultiRfqSchema } from "@/lib/rfq/public-schema";
import { sendRfqAdminNotification } from "@/lib/rfq/email/send-rfq-admin-notification";
import { sendRfqCustomerConfirmation } from "@/lib/rfq/email/send-rfq-customer-confirmation";
import {
  aggregateNotificationStatus,
  enqueueNotificationOutbox,
  recordRfqCommunication,
} from "@/lib/rfq/communications";
import {
  customerMessageForCode,
  type PublicRfqSubmissionResult,
} from "@/lib/rfq/submission-result";
import {
  newIncidentId,
  rfqDebug,
  rfqLogError,
} from "@/lib/rfq/diagnostics";
import { getRfqEmailConfig } from "@/lib/rfq/email/config";

export type SubmitPublicRfqResult = PublicRfqSubmissionResult;

export async function submitPublicRfqAction(
  payload: unknown,
): Promise<SubmitPublicRfqResult> {
  const incidentId = newIncidentId();
  rfqDebug("validation_started", { incidentId });

  const parsed = publicMultiRfqSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: customerMessageForCode("VALIDATION_ERROR"),
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join(".") || "form",
          [issue.message],
        ]),
      ),
      incidentId,
    };
  }

  const data = parsed.data;

  if (!data.phone.trim() && !data.email.trim()) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message:
        "Please provide a phone number or email address so we can reach you.",
      fieldErrors: {
        phone: ["Phone or email is required."],
        email: ["Phone or email is required."],
      },
      incidentId,
    };
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Please enter a valid email address.",
      fieldErrors: { email: ["Please enter a valid email address."] },
      incidentId,
    };
  }

  if (data.formStartedAt && Date.now() - data.formStartedAt < 4000) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Please take a moment to review your details.",
      incidentId,
    };
  }

  // Honeypot — accept silently without rate-limit burn or real work
  if (data.website?.trim()) {
    return {
      ok: true,
      rfqNumber: "RFQ-RECEIVED",
      uploadToken: "spam",
      rfqId: "spam",
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
      ok: false,
      code: "RATE_LIMITED",
      message: customerMessageForCode("RATE_LIMITED", { retryAfterSeconds }),
      retryAfterSeconds,
      incidentId,
    };
  }

  rfqDebug("rate_limit_passed", {
    incidentId,
    provider: limited.provider,
  });
  rfqDebug("database_started", { incidentId });

  const created = await createMultiAssetRfqFromPublic(data, {
    submissionId: data.submissionId,
  });

  if (!created.ok) {
    rfqLogError("rfq_submission_database_failed", {
      incidentId,
      stage: "create_multi_asset_rfq",
      code: created.code,
      message: created.details || created.error,
    });
    const code = created.code || "DATABASE_UNAVAILABLE";
    return {
      ok: false,
      code: code === "VALIDATION_ERROR" ? "VALIDATION_ERROR" : code,
      message:
        code === "VALIDATION_ERROR"
          ? created.error
          : customerMessageForCode(
              code === "CONFIGURATION_ERROR"
                ? "CONFIGURATION_ERROR"
                : "DATABASE_UNAVAILABLE",
              { incidentId },
            ),
      incidentId,
    };
  }

  rfqDebug("database_committed", {
    incidentId,
    rfqNumber: created.rfqNumber,
    idempotentReplay: created.idempotentReplay,
  });

  // Emails are secondary — never fail the customer after DB commit.
  if (created.idempotentReplay) {
    return {
      ok: true,
      rfqNumber: created.rfqNumber,
      uploadToken: created.uploadToken,
      rfqId: created.rfqId,
      notificationStatus: "sent",
      idempotentReplay: true,
    };
  }

  const location =
    [data.farmProjectName, data.town, data.province].filter(Boolean).join(", ") ||
    data.addressLine ||
    "—";

  const assetSummaries = data.assets.map(
    (a) => `${a.assetName} (${a.assetType.replaceAll("_", " ")})`,
  );

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.dam-tech.co.za";

  const emailConfig = getRfqEmailConfig();
  const adminPayload = {
    rfqNumber: created.rfqNumber,
    customerName: data.name,
    services: data.servicesRequested,
    location,
    assetCount: data.assets.length,
    quantitySummary: assetSummaries.join("; "),
    adminUrl: `${origin}/admin/rfqs/${created.rfqId}/`,
    enquiryChannel: "calculator_quote_preparation" as const,
  };

  rfqDebug("admin_email_started", { incidentId });
  rfqDebug("customer_email_started", { incidentId });

  const [adminResult, customerResult] = await Promise.all([
    sendRfqAdminNotification(adminPayload),
    data.email
      ? sendRfqCustomerConfirmation({
          to: data.email,
          customerName: data.name,
          rfqNumber: created.rfqNumber,
          projectLocation: location,
          assetSummaries,
          enquiryChannel: "calculator_quote_preparation",
        })
      : Promise.resolve({
          ok: true as const,
          status: "skipped" as const,
        }),
  ]);

  rfqDebug("admin_email_finished", {
    incidentId,
    ok: adminResult.ok,
  });
  rfqDebug("customer_email_finished", {
    incidentId,
    ok: customerResult.ok,
  });

  await Promise.all([
    recordRfqCommunication({
      rfqId: created.rfqId,
      communicationType: "admin_notification",
      recipient: emailConfig.internalNotificationEmail,
      subject: `New RFQ ${created.rfqNumber}`,
      result: adminResult,
    }),
    data.email
      ? recordRfqCommunication({
          rfqId: created.rfqId,
          communicationType: "customer_confirmation",
          recipient: data.email,
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

  const notificationStatus = aggregateNotificationStatus([
    adminResult,
    customerResult,
  ]);

  rfqDebug("response_success", {
    incidentId,
    notificationStatus,
  });

  return {
    ok: true,
    rfqNumber: created.rfqNumber,
    uploadToken: created.uploadToken,
    rfqId: created.rfqId,
    notificationStatus,
  };
}
