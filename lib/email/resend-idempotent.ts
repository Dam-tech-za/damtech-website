import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";
import { getRfqEmailConfig } from "../rfq/email/config.ts";

export type IdempotentResendResult =
  | { ok: true; idempotentReplay: boolean }
  | { ok: false; reason: "not_configured" | "rejected" | "exception" };

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const config = getRfqEmailConfig();
  if (!config.configured || !config.apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(config.apiKey);
  }
  return resendClient;
}

function isIdempotentDuplicate(error: { name?: string; message?: string }): boolean {
  const name = (error.name ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();
  return (
    name.includes("idempotent") ||
    message.includes("idempotent") ||
    message.includes("concurrent_idempotent")
  );
}

/**
 * Send via Resend with an idempotency key (24-hour provider retention).
 * Duplicate keys with identical payloads return success without a second send.
 */
export async function sendIdempotentResendEmail(
  payload: CreateEmailOptions,
  idempotencyKey: string,
  deps?: {
    send?: (
      payload: CreateEmailOptions,
      options: { idempotencyKey: string },
    ) => Promise<{ data: unknown; error: { name?: string; message?: string } | null }>;
  },
): Promise<IdempotentResendResult> {
  const key = idempotencyKey.trim().slice(0, 256);
  if (!key) {
    return { ok: false, reason: "rejected" };
  }

  const resend = getResend();
  if (!resend && !deps?.send) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const response = deps?.send
      ? await deps.send(payload, { idempotencyKey: key })
      : await resend!.emails.send(payload, { idempotencyKey: key });

    if (response.error) {
      if (isIdempotentDuplicate(response.error)) {
        return { ok: true, idempotentReplay: true };
      }
      return { ok: false, reason: "rejected" };
    }

    return { ok: true, idempotentReplay: false };
  } catch {
    return { ok: false, reason: "exception" };
  }
}

export function resetResendClientForTests(): void {
  resendClient = null;
}
