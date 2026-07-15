/**
 * Compatibility facade over Upstash-backed rate limiting.
 * Prefer lib/rate-limit/* for new call sites.
 *
 * Implementation stays in this file so Node strip-types tests can import it
 * without Path alias resolution.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  degraded: boolean;
  limit?: number;
};

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  onProviderError?: "fail_closed" | "fail_open_dev_only";
  name?: string;
};

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();
const limiterCache = new Map<string, Ratelimit>();
let redisClient: Redis | null = null;

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function isUpstashConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

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

function memoryLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(options.key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    memoryBuckets.set(options.key, { count: 1, resetAt });
    return {
      success: true,
      remaining: options.limit - 1,
      resetAt,
      degraded: true,
      limit: options.limit,
    };
  }
  if (existing.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
      degraded: true,
      limit: options.limit,
    };
  }
  existing.count += 1;
  return {
    success: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
    degraded: true,
    limit: options.limit,
  };
}

export async function rateLimit(
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const name = options.name || "legacy";
  const onProviderError = options.onProviderError || "fail_closed";
  const redis = getRedis();

  if (redis) {
    const cacheKey = `${name}:${options.limit}:${options.windowMs}`;
    let limiter = limiterCache.get(cacheKey);
    if (!limiter) {
      const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, `${windowSeconds} s`),
        prefix: `damtech:${name}`,
        analytics: false,
      });
      limiterCache.set(cacheKey, limiter);
    }
    try {
      const result = await limiter.limit(options.key);
      return {
        success: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
        degraded: false,
        limit: options.limit,
      };
    } catch (error) {
      console.error(
        `[rate-limit] Upstash error for ${name}:`,
        error instanceof Error ? error.message : error,
      );
      if (onProviderError === "fail_closed" || isProductionRuntime()) {
        return {
          success: false,
          remaining: 0,
          resetAt: Date.now() + options.windowMs,
          degraded: false,
          limit: options.limit,
        };
      }
      return memoryLimit(options);
    }
  }

  if (isProductionRuntime()) {
    console.error(`[rate-limit] ${name}: UPSTASH not configured in production.`);
    return {
      success: false,
      remaining: 0,
      resetAt: Date.now() + options.windowMs,
      degraded: false,
      limit: options.limit,
    };
  }

  return memoryLimit(options);
}

export const RATE_LIMITS = {
  loginInitiation: {
    limit: 10,
    windowMs: 60_000,
    name: "login-initiation",
    onProviderError: "fail_closed" as const,
  },
  adminSensitiveAction: {
    limit: 30,
    windowMs: 60 * 60 * 1000,
    name: "admin-sensitive",
    onProviderError: "fail_closed" as const,
  },
  publicRfqSubmission: {
    limit: 5,
    windowMs: 60 * 60 * 1000,
    name: "public-rfq-submit",
    onProviderError: "fail_closed" as const,
  },
  publicRfqUpload: {
    limit: 20,
    windowMs: 60 * 60 * 1000,
    name: "public-rfq-upload",
    onProviderError: "fail_closed" as const,
  },
  publicQuoteView: {
    limit: 60,
    windowMs: 60 * 60 * 1000,
    name: "public-quote-view",
    onProviderError: "fail_closed" as const,
  },
  publicQuoteRespond: {
    limit: 10,
    windowMs: 60 * 60 * 1000,
    name: "public-quote-respond",
    onProviderError: "fail_closed" as const,
  },
} as const;
