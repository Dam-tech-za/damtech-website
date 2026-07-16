/**
 * Typed public RFQ submission results and safe customer-facing messages.
 */

export type PublicRfqNotificationStatus =
  | "sent"
  | "pending"
  | "failed"
  | "pending_configuration";

export type PublicRfqSubmissionErrorCode =
  | "VALIDATION_ERROR"
  | "SPAM_DETECTED"
  | "RATE_LIMITED"
  | "RATE_LIMIT_UNAVAILABLE"
  | "DATABASE_UNAVAILABLE"
  | "DATABASE_CONSTRAINT"
  | "ATTACHMENT_ERROR"
  | "CONFIGURATION_ERROR"
  | "UNKNOWN_ERROR";

export type PublicRfqSubmissionSuccess = {
  ok: true;
  rfqNumber: string;
  uploadToken: string;
  rfqId: string;
  notificationStatus: PublicRfqNotificationStatus;
  idempotentReplay?: boolean;
};

export type PublicRfqSubmissionFailure = {
  ok: false;
  code: PublicRfqSubmissionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  retryAfterSeconds?: number;
  incidentId?: string;
};

export type PublicRfqSubmissionResult =
  | PublicRfqSubmissionSuccess
  | PublicRfqSubmissionFailure;

export function shortIncidentRef(incidentId: string): string {
  return incidentId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function customerMessageForCode(
  code: PublicRfqSubmissionErrorCode,
  options?: {
    retryAfterSeconds?: number;
    incidentId?: string;
  },
): string {
  switch (code) {
    case "VALIDATION_ERROR":
      return "Please check the highlighted fields and try again.";
    case "SPAM_DETECTED":
      // Silent acceptance path should not surface this; keep a soft fallback.
      return "Please take a moment to review your details.";
    case "RATE_LIMITED": {
      const minutes = Math.max(
        1,
        Math.ceil((options?.retryAfterSeconds ?? 60) / 60),
      );
      return `You have submitted several enquiries recently. Please wait ${minutes} minute${minutes === 1 ? "" : "s"} before trying again, or contact Damtech directly.`;
    }
    case "RATE_LIMIT_UNAVAILABLE":
      // Should not block customers; reserved if we ever need to surface it.
      return "We could not verify submission limits right now. Please try again shortly or contact Damtech at info@dam-tech.co.za.";
    case "DATABASE_UNAVAILABLE":
    case "DATABASE_CONSTRAINT":
      return "We could not save your enquiry right now. Please try again shortly or contact Damtech at info@dam-tech.co.za.";
    case "ATTACHMENT_ERROR":
      return "Your enquiry was received, but one or more files could not be uploaded. Damtech may contact you for the files.";
    case "CONFIGURATION_ERROR":
      return "We could not save your enquiry right now. Please contact Damtech at info@dam-tech.co.za.";
    case "UNKNOWN_ERROR":
    default: {
      const ref = options?.incidentId
        ? ` Reference: ${shortIncidentRef(options.incidentId)}.`
        : "";
      return `Something went wrong while submitting your enquiry.${ref} Please try again or contact Damtech at info@dam-tech.co.za.`;
    }
  }
}
