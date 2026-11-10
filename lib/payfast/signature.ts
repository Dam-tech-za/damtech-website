import { createHash } from "node:crypto";

/**
 * PayFast signatures follow PHP's urlencode(): RFC 1738 style, spaces as "+",
 * upper-case hex, and only A-Z a-z 0-9 - _ . left unescaped.
 * Verified against Payfast/payfast-php-sdk lib/Auth.php and
 * lib/PaymentIntegrations/Notification.php (2026-11-10).
 */
export function phpUrlEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");
}

export function md5Hex(value: string): string {
  return createHash("md5").update(value, "utf8").digest("hex");
}

/** Ordered key/value pairs. Order matters for PayFast signatures. */
export type PayfastPairs = ReadonlyArray<readonly [string, string]>;

/**
 * Signature for the payment (redirect) form. Fields are signed in the order
 * they are sent, empty values are skipped, values are trimmed, and the
 * passphrase (if any) is appended last.
 */
export function paymentFormSignature(
  pairs: PayfastPairs,
  passphrase: string | null,
): string {
  const parts = pairs
    .filter(([key, value]) => key !== "signature" && value.trim() !== "")
    .map(([key, value]) => `${key}=${phpUrlEncode(value.trim())}`);
  if (passphrase && passphrase.trim()) {
    parts.push(`passphrase=${phpUrlEncode(passphrase.trim())}`);
  }
  return md5Hex(parts.join("&"));
}

/**
 * Parameter string for an ITN, built from the posted fields in the order
 * received, stopping at "signature". This exact string (without the
 * passphrase) is what PayFast's /eng/query/validate endpoint expects.
 */
export function itnParamString(pairs: PayfastPairs): string {
  const parts: string[] = [];
  for (const [key, value] of pairs) {
    if (key === "signature") break;
    parts.push(`${key}=${phpUrlEncode(value)}`);
  }
  return parts.join("&");
}

export function itnSignature(paramString: string, passphrase: string | null): string {
  const withPass =
    passphrase && passphrase.trim()
      ? `${paramString}&passphrase=${phpUrlEncode(passphrase.trim())}`
      : paramString;
  return md5Hex(withPass);
}

/** Constant-time compare for hex signatures. */
export function signaturesMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
