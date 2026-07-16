import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  isProductionRuntime,
  isUpstashConfigured,
  type RateLimitDecision,
  type RateLimitPolicy,
} from "./types";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();
const limiterCache = new Map<string, Ratelimit>();

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (!isUpstashConfigured()) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisClient;
}

function getLimiter(policy: RateLimitPolicy): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const cacheKey = `${policy.name}:${policy.limit}:${policy.windowMs}`;
  const existing = limiterCache.get(cacheKey);
  if (existing) return existing;

  const windowSeconds = Math.max(1, Math.ceil(policy.windowMs / 1000));
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(policy.limit, `${windowSeconds} s`),
    prefix: `damtech:${policy.name}`,
    analytics: false,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

function memoryLimit(
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
    };
  }
  existing.count += 1;
  return {
    success: true,
    remaining: policy.limit - existing.count,
    resetAt: existing.resetAt,
    degraded: true,
    limit: policy.limit,
  };
}

/**
 * Enforce a rate-limit policy.
 * Production refuses silent in-memory fallback when Upstash is missing
 * for fail_closed policies (and warns for all).
 */
export async function enforceRateLimit(
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitDecision> {
  const limiter = getLimiter(policy);

  if (limiter) {
    try {
      const result = await limiter.limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
        degraded: false,
        limit: policy.limit,
        reason: result.success ? undefined : "rate_limited",
      };
    } catch (error) {
      console.error(
        `[rate-limit] Upstash error for ${policy.name}:`,
        error instanceof Error ? error.message : error,
      );
      if (policy.onProviderError === "fail_closed") {
        return {
          success: false,
          remaining: 0,
          resetAt: Date.now() + policy.windowMs,
          degraded: false,
          limit: policy.limit,
          reason: "provider_unavailable",
        };
      }
      if (isProductionRuntime()) {
        return {
          success: false,
          remaining: 0,
          resetAt: Date.now() + policy.windowMs,
          degraded: false,
          limit: policy.limit,
          reason: "provider_unavailable",
        };
      }
      return memoryLimit(key, policy);
    }
  }

  // Upstash not configured
  if (isProductionRuntime()) {
    console.error(
      `[rate-limit] ${policy.name}: UPSTASH not configured in production.`,
    );
    if (policy.onProviderError === "fail_closed") {
      return {
        success: false,
        remaining: 0,
        resetAt: Date.now() + policy.windowMs,
        degraded: false,
        limit: policy.limit,
        reason: "provider_unavailable",
      };
    }
    // Non-fail-closed in production without Upstash still refuses silent memory
    return {
      success: false,
      remaining: 0,
      resetAt: Date.now() + policy.windowMs,
      degraded: false,
      limit: policy.limit,
      reason: "provider_unavailable",
    };
  }

  // Documented local-development memory fallback only
  return memoryLimit(key, policy);
}
