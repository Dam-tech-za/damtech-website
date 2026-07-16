import { enforceRateLimit } from "./client";
import {
  publicClientRateKey,
  type RateLimitDecision,
  type RateLimitPolicy,
} from "./types";

/** Hourly successful-submission budget for public RFQs. */
export const PUBLIC_RFQ_HOURLY_POLICY: RateLimitPolicy = {
  name: "public-rfq-submit-hourly",
  limit: 10,
  windowMs: 60 * 60 * 1000,
  onProviderError: "fail_open_public",
};

/** Short burst protection. */
export const PUBLIC_RFQ_BURST_POLICY: RateLimitPolicy = {
  name: "public-rfq-submit-burst",
  limit: 3,
  windowMs: 5 * 60 * 1000,
  onProviderError: "fail_open_public",
};

export const PUBLIC_RFQ_UPLOAD_POLICY: RateLimitPolicy = {
  name: "public-rfq-upload",
  limit: 20,
  windowMs: 60 * 60 * 1000,
  onProviderError: "fail_open_public",
};

/** @deprecated Prefer PUBLIC_RFQ_HOURLY_POLICY */
export const PUBLIC_RFQ_SUBMIT_POLICY = PUBLIC_RFQ_HOURLY_POLICY;

export async function limitPublicRfqSubmit(
  headers: Headers,
): Promise<RateLimitDecision> {
  const key = publicClientRateKey(headers, "public-rfq-submit");

  const burst = await enforceRateLimit(key, PUBLIC_RFQ_BURST_POLICY);
  if (!burst.success) return burst;

  return enforceRateLimit(key, PUBLIC_RFQ_HOURLY_POLICY);
}

export async function limitPublicRfqUpload(
  headers: Headers,
): Promise<RateLimitDecision> {
  const key = publicClientRateKey(headers, "public-rfq-upload");
  return enforceRateLimit(key, PUBLIC_RFQ_UPLOAD_POLICY);
}
