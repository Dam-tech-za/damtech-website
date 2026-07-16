import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { memoryLimit } from "./memory";
import {
  hasUpstashConfiguration,
  isProductionRuntime,
  type RateLimitDecision,
  type RateLimitPolicy,
} from "./types";

const limiterCache = new Map<string, Ratelimit>();
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (!hasUpstashConfiguration()) return null;
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

async function supabaseLimit(
  keyHash: string,
  policy: RateLimitPolicy,
): Promise<RateLimitDecision | null> {
  if (!isSupabaseServiceConfigured()) return null;
  try {
    const client = createServiceRoleClient();
    const windowSeconds = Math.max(1, Math.ceil(policy.windowMs / 1000));
    const { data, error } = await client.rpc(
      "check_public_submission_rate_limit",
      {
        p_rate_key_hash: keyHash,
        p_action: policy.name,
        p_limit: policy.limit,
        p_window_seconds: windowSeconds,
      },
    );
    if (error || !data || typeof data !== "object") {
      console.error(
        `[rate-limit] Supabase fallback error for ${policy.name}:`,
        error?.message || "invalid response",
      );
      return null;
    }
    const payload = data as {
      allowed?: boolean;
      remaining?: number;
      resetAt?: number;
      limit?: number;
    };
    const allowed = Boolean(payload.allowed);
    return {
      success: allowed,
      remaining: Number(payload.remaining ?? 0),
      resetAt: Number(payload.resetAt ?? Date.now() + policy.windowMs),
      degraded: false,
      limit: Number(payload.limit ?? policy.limit),
      reason: allowed ? undefined : "rate_limited",
      provider: "supabase",
    };
  } catch (error) {
    console.error(
      `[rate-limit] Supabase fallback exception for ${policy.name}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Enforce a rate-limit policy.
 *
 * Public policies (`fail_open_public`):
 *   Upstash → Supabase RPC → tiny in-memory burst → allow (log outage)
 *
 * Sensitive policies (`fail_closed`):
 *   Upstash preferred; memory in non-production; deny in production when unavailable.
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
        provider: "upstash",
      };
    } catch (error) {
      console.error(
        `[rate-limit] Upstash error for ${policy.name}:`,
        error instanceof Error ? error.message : error,
      );
    }
  } else if (isProductionRuntime() && policy.onProviderError === "fail_closed") {
    console.error(
      `[rate-limit] ${policy.name}: UPSTASH not configured in production.`,
    );
  }

  if (policy.onProviderError === "fail_open_public") {
    const supabase = await supabaseLimit(key, policy);
    if (supabase) return supabase;

    const burstPolicy: RateLimitPolicy = {
      ...policy,
      name: `${policy.name}-burst-memory`,
      limit: Math.min(policy.limit, 5),
      windowMs: Math.min(policy.windowMs, 5 * 60_000),
    };
    const burst = memoryLimit(`burst:${key}`, burstPolicy);
    if (!burst.success) return burst;

    console.error(
      `[rate-limit] ${policy.name}: no distributed provider — allowing with memory burst only.`,
    );
    return {
      ...burst,
      reason: "allowed_without_provider",
      provider: "none",
    };
  }

  if (policy.onProviderError === "fail_closed") {
    if (!isProductionRuntime()) {
      return memoryLimit(key, policy);
    }
    return {
      success: false,
      remaining: 0,
      resetAt: Date.now() + policy.windowMs,
      degraded: false,
      limit: policy.limit,
      reason: "provider_unavailable",
      provider: hasUpstashConfiguration() ? "upstash" : "none",
    };
  }

  if (!isProductionRuntime()) {
    return memoryLimit(key, policy);
  }

  return {
    success: false,
    remaining: 0,
    resetAt: Date.now() + policy.windowMs,
    degraded: false,
    limit: policy.limit,
    reason: "provider_unavailable",
    provider: "none",
  };
}

export { memoryLimit } from "./memory";
