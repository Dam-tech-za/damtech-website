export const RFQ_DELETE_REASONS = [
  "Test submission",
  "Duplicate RFQ",
  "Spam",
  "Customer requested removal",
  "Incorrect record",
  "Other",
] as const;

export type RfqDeleteReason = (typeof RFQ_DELETE_REASONS)[number];

export type RfqDeleteSummary = {
  id: string;
  rfqNumber: string;
  customerName: string;
  companyName: string | null;
  serviceLabel: string;
  submittedAt: string;
  status: string;
};

export type RfqDeleteBlockAssessment = {
  blocked: boolean;
  code?: "RFQ_DELETE_BLOCKED";
  message?: string;
};

export type RfqDeleteAuditSnapshot = {
  rfqNumber: string;
  customerName: string;
  companyName: string | null;
  serviceLabel: string;
  status: string;
  submittedAt: string;
  deletionReason: string;
  deletedBy: string;
  deletedAt: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateRfqDeleteId(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function validateRfqDeleteReason(
  reason: string,
  otherText?: string,
): { ok: true; normalized: string } | { ok: false; error: string } {
  const trimmed = reason.trim();
  if (!(RFQ_DELETE_REASONS as readonly string[]).includes(trimmed)) {
    return { ok: false, error: "Select a valid deletion reason." };
  }
  if (trimmed === "Other") {
    const detail = otherText?.trim() ?? "";
    if (detail.length < 3) {
      return {
        ok: false,
        error: "Provide a short explanation when selecting Other.",
      };
    }
    return { ok: true, normalized: `Other: ${detail}` };
  }
  return { ok: true, normalized: trimmed };
}

export function validateTypedRfqConfirmation(
  typed: string,
  rfqNumber: string,
): boolean {
  return typed.trim() === rfqNumber.trim();
}

export function assessRfqDeleteBlockers(input: {
  status: string;
  convertedQuoteId: string | null;
  linkedQuoteCount: number;
  sentCommunicationCount: number;
  answeredInfoRequestCount: number;
  hasConfirmedAssetQuantities: boolean;
}): RfqDeleteBlockAssessment {
  if (input.status === "converted" || input.convertedQuoteId) {
    return blocked(
      "This RFQ cannot be permanently deleted because it is linked to quotation or business history. Close or archive it instead.",
    );
  }

  if (input.linkedQuoteCount > 0) {
    return blocked(
      "This RFQ cannot be permanently deleted because it is linked to quotation or business history. Close or archive it instead.",
    );
  }

  if (input.status === "ready_for_quote" && input.hasConfirmedAssetQuantities) {
    return blocked(
      "This RFQ cannot be permanently deleted because confirmed estimator work exists. Close or archive it instead.",
    );
  }

  if (input.sentCommunicationCount > 0) {
    return blocked(
      "This RFQ cannot be permanently deleted because sent customer communications must be retained. Close or archive it instead.",
    );
  }

  if (input.answeredInfoRequestCount > 0) {
    return blocked(
      "This RFQ cannot be permanently deleted because customer responses are on record. Close or archive it instead.",
    );
  }

  return { blocked: false };
}

function blocked(message: string): RfqDeleteBlockAssessment {
  return {
    blocked: true,
    code: "RFQ_DELETE_BLOCKED",
    message,
  };
}

export function buildRfqDeleteAuditSnapshot(input: {
  summary: RfqDeleteSummary;
  deletionReason: string;
  deletedByEmail: string;
  deletedAt?: string;
}): RfqDeleteAuditSnapshot {
  return {
    rfqNumber: input.summary.rfqNumber,
    customerName: input.summary.customerName,
    companyName: input.summary.companyName,
    serviceLabel: input.summary.serviceLabel,
    status: input.summary.status,
    submittedAt: input.summary.submittedAt,
    deletionReason: input.deletionReason,
    deletedBy: input.deletedByEmail,
    deletedAt: input.deletedAt ?? new Date().toISOString(),
  };
}

export function createDeleteIncidentId(): string {
  return `RFQ-DEL-${Date.now().toString(36).toUpperCase()}`;
}
