import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type RateLimitDecision = {
  success: boolean;
  remaining: number;
  resetAt: number;
  /** True only when using documented local-dev / emergency memory fallback. */
  degraded: boolean;
  limit: number;
  reason?: "rate_limited" | "provider_unavailable" | "allowed_without_provider";
  provider?: "upstash" | "supabase" | "memory" | "none";
};

export type RateLimitPolicy = {
  name: string;
  limit: number;
  windowMs: number;
  /**
   * When Upstash is configured but unavailable:
   * - fail_closed: deny (admin / sensitive)
   * - fail_open_public: try Supabase then allow with burst memory
   * - fail_open_dev_only: memory only outside production
   */
  onProviderError: "fail_closed" | "fail_open_public" | "fail_open_dev_only";
};

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function hasUpstashConfiguration(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/** @deprecated Prefer hasUpstashConfiguration */
export function isUpstashConfigured(): boolean {
  return hasUpstashConfiguration();
}

function rateLimitHashSecret(): string {
  return (
    process.env.RATE_LIMIT_HASH_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()?.slice(0, 32) ||
    "damtech-dev-rate-limit-salt"
  );
}

/** Hash identifiers so raw IPs / tokens are not stored in Redis or Postgres keys. */
export function hashRateLimitIdentifier(value: string): string {
  return createHmac("sha256", rateLimitHashSecret())
    .update(value, "utf8")
    .digest("hex")
    .slice(0, 32);
}

/**
 * Prefer Vercel-controlled client IP, then standard proxy headers.
 * Returns null when no usable IP is present — callers must use a composite key.
 */
export function clientIpFromHeaders(headerList: Headers): string | null {
  const candidates = [
    headerList.get("x-vercel-forwarded-for"),
    headerList.get("x-forwarded-for"),
    headerList.get("x-real-ip"),
  ];

  for (const header of candidates) {
    if (!header?.trim()) continue;
    const first = header.split(",")[0]?.trim();
    if (first && isPlausibleIp(first)) return first;
  }
  return null;
}

function isPlausibleIp(value: string): boolean {
  // Basic IPv4 / IPv6 sanity — reject empty and the literal "unknown".
  if (!value || value.toLowerCase() === "unknown") return false;
  if (value.includes(":")) return value.length >= 2 && value.length <= 45;
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const n = Number(part);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

/**
 * Privacy-conscious client key for public submission rate limits.
 * Never returns a shared global "unknown" bucket.
 */
export function publicClientRateKey(
  headerList: Headers,
  action: string,
): string {
  const ip = clientIpFromHeaders(headerList);
  if (ip) {
    return hashRateLimitIdentifier(`ip:${action}:${ip}`);
  }

  const ua = headerList.get("user-agent")?.trim() || "no-ua";
  const origin =
    headerList.get("origin")?.trim() ||
    headerList.get("referer")?.trim() ||
    "no-origin";
  const acceptLang = headerList.get("accept-language")?.trim() || "no-lang";

  // Composite fingerprint — still hashed with secret; not a shared singleton.
  return hashRateLimitIdentifier(
    `fp:${action}:${ua}|${origin}|${acceptLang}`,
  );
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

/** Constant-time compare for optional future token checks. */
export function safeEqualText(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}
