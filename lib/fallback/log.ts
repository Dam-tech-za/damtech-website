import type { FallbackFormType } from "./types.ts";
import { submissionIdSuffix } from "./submission-id.ts";

export function logFallbackAttempt(input: {
  incidentId: string;
  formType: FallbackFormType;
  submissionId: string;
  databaseErrorCategory: string;
  resendAccepted: boolean;
  idempotentReplay: boolean;
}): void {
  console.info("database_fallback_delivery", {
    timestamp: new Date().toISOString(),
    incidentId: input.incidentId,
    formType: input.formType,
    submissionSuffix: submissionIdSuffix(input.submissionId),
    databaseErrorCategory: input.databaseErrorCategory,
    resendAccepted: input.resendAccepted,
    idempotentReplay: input.idempotentReplay,
  });
}

export function logFallbackSkipped(input: {
  incidentId: string;
  formType: FallbackFormType;
  reason: string;
  databaseErrorCategory?: string;
}): void {
  console.error("database_fallback_skipped", {
    timestamp: new Date().toISOString(),
    incidentId: input.incidentId,
    formType: input.formType,
    reason: input.reason,
    databaseErrorCategory: input.databaseErrorCategory ?? null,
  });
}
