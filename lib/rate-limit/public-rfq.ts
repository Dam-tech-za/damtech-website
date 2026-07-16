import { enforceRateLimit } from "./client";
import {
  clientIpFromHeaders,
  hashRateLimitIdentifier,
  type RateLimitDecision,
  type RateLimitPolicy,
} from "./types";

export const PUBLIC_RFQ_SUBMIT_POLICY: RateLimitPolicy = {
  name: "public-rfq-submit",
  limit: 15,
  windowMs: 60 * 60 * 1000,
  onProviderError: "fail_closed",
};

export const PUBLIC_RFQ_UPLOAD_POLICY: RateLimitPolicy = {
  name: "public-rfq-upload",
  limit: 20,
  windowMs: 60 * 60 * 1000,
  onProviderError: "fail_closed",
};

export async function limitPublicRfqSubmit(
  headers: Headers,
): Promise<RateLimitDecision> {
  const ipHash = hashRateLimitIdentifier(clientIpFromHeaders(headers));
  return enforceRateLimit(`ip:${ipHash}`, PUBLIC_RFQ_SUBMIT_POLICY);
}

export async function limitPublicRfqUpload(
  headers: Headers,
): Promise<RateLimitDecision> {
  const ipHash = hashRateLimitIdentifier(clientIpFromHeaders(headers));
  return enforceRateLimit(`ip:${ipHash}`, PUBLIC_RFQ_UPLOAD_POLICY);
}
