/**
 * Structured RFQ submission diagnostics.
 * Never log secrets, full customer messages, or file contents.
 */

export type RfqDebugStage =
  | "validation_started"
  | "validation_passed"
  | "rate_limit_started"
  | "rate_limit_passed"
  | "database_started"
  | "database_committed"
  | "customer_email_started"
  | "customer_email_finished"
  | "admin_email_started"
  | "admin_email_finished"
  | "response_success";

export function newIncidentId(): string {
  return crypto.randomUUID();
}

export function isRfqDebugLoggingEnabled(): boolean {
  if (process.env.RFQ_DEBUG_LOGGING?.trim().toLowerCase() !== "true") {
    return false;
  }
  // Preview / non-production only
  return process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production";
}

export function rfqDebug(stage: RfqDebugStage, meta?: Record<string, unknown>) {
  if (!isRfqDebugLoggingEnabled()) return;
  console.info("rfq_submission_stage", { stage, ...safeMeta(meta) });
}

export function rfqLogError(
  event: string,
  meta: {
    incidentId: string;
    stage: string;
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  },
) {
  console.error(event, {
    incidentId: meta.incidentId,
    stage: meta.stage,
    code: meta.code,
    message: truncate(meta.message, 300),
    details: truncate(meta.details, 300),
    hint: truncate(meta.hint, 200),
  });
}

function safeMeta(meta?: Record<string, unknown>) {
  if (!meta) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (
      /token|secret|password|key|authorization|message|body|payload/i.test(key)
    ) {
      continue;
    }
    if (typeof value === "string") {
      out[key] = truncate(value, 120);
    } else if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value == null
    ) {
      out[key] = value;
    } else {
      out[key] = typeof value;
    }
  }
  return out;
}

function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) return value;
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}
