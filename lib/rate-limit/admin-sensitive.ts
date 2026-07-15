import { enforceRateLimit } from "./client";
import {
  clientIpFromHeaders,
  hashRateLimitIdentifier,
  type RateLimitDecision,
  type RateLimitPolicy,
} from "./types";

export const ADMIN_SENSITIVE_POLICY: RateLimitPolicy = {
  name: "admin-sensitive",
  limit: 30,
  windowMs: 60 * 60 * 1000,
  onProviderError: "fail_closed",
};

export async function limitAdminSensitive(
  headers: Headers,
  userId: string,
): Promise<RateLimitDecision> {
  const userHash = hashRateLimitIdentifier(userId);
  const ipHash = hashRateLimitIdentifier(clientIpFromHeaders(headers));
  return enforceRateLimit(
    `user:${userHash}:ip:${ipHash}`,
    ADMIN_SENSITIVE_POLICY,
  );
}
