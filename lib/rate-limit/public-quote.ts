import { enforceRateLimit } from "./client";
import {
  clientIpFromHeaders,
  hashRateLimitIdentifier,
  type RateLimitDecision,
  type RateLimitPolicy,
} from "./types";

export const PUBLIC_QUOTE_VIEW_POLICY: RateLimitPolicy = {
  name: "public-quote-view",
  limit: 60,
  windowMs: 60 * 60 * 1000,
  onProviderError: "fail_closed",
};

export const PUBLIC_QUOTE_RESPOND_POLICY: RateLimitPolicy = {
  name: "public-quote-respond",
  limit: 10,
  windowMs: 60 * 60 * 1000,
  onProviderError: "fail_closed",
};

function clientKeyHash(headers: Headers): string {
  const ip = clientIpFromHeaders(headers);
  if (ip) return hashRateLimitIdentifier(`ip:${ip}`);
  const ua = headers.get("user-agent")?.trim() || "no-ua";
  return hashRateLimitIdentifier(`fp:${ua}`);
}

export async function limitPublicQuoteView(
  headers: Headers,
  token: string,
): Promise<RateLimitDecision> {
  const ipHash = clientKeyHash(headers);
  const tokenHash = hashRateLimitIdentifier(token);
  return enforceRateLimit(
    `view:${tokenHash}:${ipHash}`,
    PUBLIC_QUOTE_VIEW_POLICY,
  );
}

export async function limitPublicQuoteRespond(
  headers: Headers,
  token: string,
): Promise<RateLimitDecision> {
  const ipHash = clientKeyHash(headers);
  const tokenHash = hashRateLimitIdentifier(token);
  return enforceRateLimit(
    `respond:${tokenHash}:${ipHash}`,
    PUBLIC_QUOTE_RESPOND_POLICY,
  );
}
