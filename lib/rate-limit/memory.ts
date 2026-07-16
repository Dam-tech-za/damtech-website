import type { RateLimitDecision, RateLimitPolicy } from "./types";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

/** In-memory limiter for tests, local DX, and emergency burst fallback. */
export function memoryLimit(
  key: string,
  policy: RateLimitPolicy,
): RateLimitDecision {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + policy.windowMs;
    memoryBuckets.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: policy.limit - 1,
      resetAt,
      degraded: true,
      limit: policy.limit,
      provider: "memory",
    };
  }
  if (existing.count >= policy.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
      degraded: true,
      limit: policy.limit,
      reason: "rate_limited",
      provider: "memory",
    };
  }
  existing.count += 1;
  return {
    success: true,
    remaining: policy.limit - existing.count,
    resetAt: existing.resetAt,
    degraded: true,
    limit: policy.limit,
    provider: "memory",
  };
}
