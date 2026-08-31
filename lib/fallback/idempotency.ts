import type { FallbackFormType } from "./types.ts";

const KEEPALIVE_COOLDOWN_MS = 6 * 60 * 60 * 1000;

export function fallbackResendIdempotencyKey(
  formType: FallbackFormType,
  submissionId: string,
): string {
  return `database-fallback/${formType}/${submissionId}`;
}

export function keepaliveFailureResendIdempotencyKey(
  environment: string,
  timestampMs = Date.now(),
): string {
  const windowId = Math.floor(timestampMs / KEEPALIVE_COOLDOWN_MS);
  return `keepalive-failure/${environment}/${windowId}`;
}

export function keepaliveRecoveryResendIdempotencyKey(
  environment: string,
  outageStartedAtMs: number,
): string {
  return `keepalive-recovery/${environment}/${outageStartedAtMs}`;
}

export function keepaliveCooldownWindowId(timestampMs = Date.now()): number {
  return Math.floor(timestampMs / KEEPALIVE_COOLDOWN_MS);
}

export const RESEND_IDEMPOTENCY_RETENTION_HOURS = 24;
