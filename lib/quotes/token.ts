import { createHash, randomBytes } from "node:crypto";

/** At least 32 bytes of CSPRNG entropy → URL-safe token. */
export function generatePublicQuoteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPublicQuoteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function hashIpForAcceptance(ip: string | null | undefined): string | null {
  if (!ip?.trim()) return null;
  // One-way hash only — never store raw IP on acceptance records.
  return createHash("sha256")
    .update(`damtech-accept:${ip.trim()}`, "utf8")
    .digest("hex");
}

export function summariseUserAgent(ua: string | null | undefined): string | null {
  if (!ua?.trim()) return null;
  return ua.trim().slice(0, 180);
}
