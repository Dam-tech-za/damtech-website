"use server";

import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { headers } from "next/headers";

/** Soft server-side gate before the browser starts Google OAuth. */
export async function checkLoginRateLimit(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";

  const result = await rateLimit({
    key: `login:${ip}`,
    ...RATE_LIMITS.loginInitiation,
  });

  if (!result.success) {
    return {
      ok: false,
      error: "Too many sign-in attempts. Please wait a minute and try again.",
    };
  }

  return { ok: true };
}
