/**
 * Rate-limiting abstraction for login and sensitive admin / public actions.
 *
 * Without a distributed provider (e.g. Upstash Redis), this uses an in-memory
 * Map which only protects a single Node process. On Vercel serverless that is
 * a best-effort safeguard — document Upstash (or similar) before claiming
 * production-grade rate limits.
 */

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  /** True when no distributed backend is configured. */
  degraded: boolean;
};

export type RateLimitOptions = {
  /** Unique key, e.g. `login:${ip}` or `admin-action:${userId}` */
  key: string;
  /** Max attempts inside the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, Bucket>();

function pruneExpired(now: number) {
  if (memoryBuckets.size < 500) return;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) {
      memoryBuckets.delete(key);
    }
  }
}

/**
 * Check/consume one attempt against the configured limiter.
 * Always returns a result — never throws.
 */
export async function rateLimit(
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const backend = process.env.RATE_LIMIT_BACKEND?.trim().toLowerCase();

  if (backend === "upstash") {
    // Placeholder for future Upstash REST integration.
    // Until configured, fall through to memory so routes keep working.
    console.warn(
      "[rate-limit] RATE_LIMIT_BACKEND=upstash but provider is not wired yet; using in-memory fallback.",
    );
  }

  const now = Date.now();
  pruneExpired(now);

  const existing = memoryBuckets.get(options.key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    memoryBuckets.set(options.key, { count: 1, resetAt });
    return {
      success: true,
      remaining: options.limit - 1,
      resetAt,
      degraded: true,
    };
  }

  if (existing.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
      degraded: true,
    };
  }

  existing.count += 1;
  memoryBuckets.set(options.key, existing);
  return {
    success: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
    degraded: true,
  };
}

export const RATE_LIMITS = {
  loginInitiation: { limit: 10, windowMs: 60_000 },
  adminSensitiveAction: { limit: 30, windowMs: 60_000 },
  publicRfqSubmission: { limit: 5, windowMs: 60_000 },
} as const;
