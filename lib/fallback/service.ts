import type { CreateEmailOptions } from "resend";
import { sendIdempotentResendEmail } from "../email/resend-idempotent.ts";
import { getRfqEmailConfig } from "../rfq/email/config.ts";
import { classifyPersistenceFailure } from "./classifier.ts";
import {
  buildFallbackEmailHtml,
  buildFallbackEmailSubject,
  buildFallbackEmailText,
  buildOperationalAlertText,
} from "./format.ts";
import { fallbackResendIdempotencyKey } from "./idempotency.ts";
import { logFallbackAttempt, logFallbackSkipped } from "./log.ts";
import type { DatabaseFallbackInput, DatabaseFallbackResult } from "./types.ts";

export type DeliverDatabaseFallbackDeps = {
  send?: (
    payload: CreateEmailOptions,
    options: { idempotencyKey: string },
  ) => Promise<{ data: unknown; error: { name?: string; message?: string } | null }>;
};

export async function deliverDatabaseFallback(
  input: DatabaseFallbackInput,
  databaseErrorCode: string,
  deps?: DeliverDatabaseFallbackDeps,
): Promise<DatabaseFallbackResult> {
  const category = classifyPersistenceFailure(databaseErrorCode);
  if (category !== "infrastructure") {
    logFallbackSkipped({
      incidentId: input.incidentId,
      formType: input.formType,
      reason: "ineligible_error_code",
      databaseErrorCategory: databaseErrorCode,
    });
    return { ok: false, incidentId: input.incidentId, reason: "resend_rejected" };
  }

  const config = getRfqEmailConfig();
  if (!config.configured) {
    logFallbackSkipped({
      incidentId: input.incidentId,
      formType: input.formType,
      reason: "resend_not_configured",
      databaseErrorCategory: databaseErrorCode,
    });
    return { ok: false, incidentId: input.incidentId, reason: "resend_unavailable" };
  }

  const idempotencyKey = fallbackResendIdempotencyKey(
    input.formType,
    input.submissionId,
  );

  const detailPayload: CreateEmailOptions = {
    from: `Damtech Operations <${config.fromEmail}>`,
    to: [config.internalNotificationEmail],
    subject: buildFallbackEmailSubject(input),
    html: buildFallbackEmailHtml(input),
    text: buildFallbackEmailText(input),
  };

  const detailResult = await sendIdempotentResendEmail(
    detailPayload,
    idempotencyKey,
    deps,
  );

  if (!detailResult.ok) {
    logFallbackAttempt({
      incidentId: input.incidentId,
      formType: input.formType,
      submissionId: input.submissionId,
      databaseErrorCategory: databaseErrorCode,
      resendAccepted: false,
      idempotentReplay: false,
    });
    return {
      ok: false,
      incidentId: input.incidentId,
      reason:
        detailResult.reason === "not_configured"
          ? "resend_unavailable"
          : "resend_rejected",
    };
  }

  const alertKey = `${idempotencyKey}/ops-alert`;
  const alertPayload: CreateEmailOptions = {
    from: `Damtech Operations <${config.fromEmail}>`,
    to: [config.internalNotificationEmail],
    subject: `[DATABASE FALLBACK ALERT] ${input.formType} — ${input.incidentId.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    text: buildOperationalAlertText({
      formType: input.formType,
      incidentId: input.incidentId,
      timestampIso: new Date().toISOString(),
    }),
  };

  await sendIdempotentResendEmail(alertPayload, alertKey, deps);

  logFallbackAttempt({
    incidentId: input.incidentId,
    formType: input.formType,
    submissionId: input.submissionId,
    databaseErrorCategory: databaseErrorCode,
    resendAccepted: true,
    idempotentReplay: detailResult.idempotentReplay,
  });

  return {
    ok: true,
    incidentId: input.incidentId,
    idempotentReplay: detailResult.idempotentReplay,
  };
}
