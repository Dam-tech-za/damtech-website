import { safeEqualText } from "../rate-limit/types.ts";

export type CronAuthResult =
  | { ok: true }
  | { ok: false; reason: "missing_secret" | "invalid_secret" };

/**
 * Validates Vercel cron authentication.
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 */
export function authorizeCronRequest(request: Request): CronAuthResult {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return { ok: false, reason: "missing_secret" };
  }

  const auth = request.headers.get("authorization")?.trim() ?? "";
  const expected = `Bearer ${secret}`;
  if (!auth.startsWith("Bearer ") || !safeEqualText(auth, expected)) {
    return { ok: false, reason: "invalid_secret" };
  }

  return { ok: true };
}
