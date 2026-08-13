import { enforceRateLimit } from "./client.ts";
import {
  publicClientRateKey,
  type RateLimitDecision,
  type RateLimitPolicy,
} from "./types.ts";

/** Stricter than public RFQ (10/hour): genuine orders, still allows a customer to retry. */
export const PUBLIC_ORDER_HOURLY_POLICY: RateLimitPolicy = {
  name: "public-order-submit-hourly",
  limit: 5,
  windowMs: 60 * 60 * 1000,
  onProviderError: "fail_open_public",
};

/** Short burst protection — tighter than RFQ’s 3 / 5 min. */
export const PUBLIC_ORDER_BURST_POLICY: RateLimitPolicy = {
  name: "public-order-submit-burst",
  limit: 2,
  windowMs: 5 * 60 * 1000,
  onProviderError: "fail_open_public",
};

export async function limitPublicOrderSubmit(
  headers: Headers,
): Promise<RateLimitDecision> {
  const key = publicClientRateKey(headers, "public-order-submit");
  const burst = await enforceRateLimit(key, PUBLIC_ORDER_BURST_POLICY);
  if (!burst.success) return burst;
  return enforceRateLimit(key, PUBLIC_ORDER_HOURLY_POLICY);
}
