import { createHash } from "node:crypto";

export type RateLimitDecision = {
  success: boolean;
  remaining: number;
  resetAt: number;
  /** True only when using documented local-dev memory fallback. */
  degraded: boolean;
  limit: number;
};

export type RateLimitPolicy = {
  /** Logical name for logs / docs */
  name: string;
  /** Max requests in the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
  /**
   * When Upstash is configured but unavailable:
   * - fail_closed: deny the request (sensitive public writes)
   * - fail_open_dev_only: only allowed when NODE_ENV !== production
   */
  onProviderError: "fail_closed" | "fail_open_dev_only";
};

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/** Hash identifiers so raw IPs / tokens are not stored in Redis keys. */
export function hashRateLimitIdentifier(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 32);
}

/**
 * Prefer the left-most public client IP from Vercel / proxy headers.
 * Still hash before use — never persist raw IPs in limit keys.
 */
export function clientIpFromHeaders(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const vercel = headerList.get("x-vercel-forwarded-for")?.trim();
  if (vercel) {
    const first = vercel.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}

export function rateLimitTooManyResponse(resetAt: number): Response {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      code: "rate_limited",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}
