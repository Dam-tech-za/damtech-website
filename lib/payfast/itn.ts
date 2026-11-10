import { lookup } from "node:dns/promises";
import type { PayfastConfig } from "./config.ts";
import {
  itnParamString,
  itnSignature,
  signaturesMatch,
  type PayfastPairs,
} from "./signature.ts";

/** Hosts PayFast sends notifications from (Payfast SDK Notification.php). */
export const PAYFAST_NOTIFY_HOSTS = [
  "www.payfast.co.za",
  "sandbox.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
] as const;

export type PayfastPaymentStatus = "COMPLETE" | "FAILED" | "CANCELLED" | string;

export type ParsedItn = {
  pairs: PayfastPairs;
  fields: Record<string, string>;
  paramString: string;
  signature: string;
  mPaymentId: string;
  pfPaymentId: string;
  paymentStatus: PayfastPaymentStatus;
  amountGross: string;
  merchantId: string;
  viewToken: string;
};

export function parseItnBody(body: string): ParsedItn {
  const params = new URLSearchParams(body);
  const pairs: Array<[string, string]> = [];
  const fields: Record<string, string> = {};
  for (const [key, value] of params) {
    pairs.push([key, value]);
    fields[key] = value;
  }
  return {
    pairs,
    fields,
    paramString: itnParamString(pairs),
    signature: fields.signature ?? "",
    mPaymentId: fields.m_payment_id ?? "",
    pfPaymentId: fields.pf_payment_id ?? "",
    paymentStatus: fields.payment_status ?? "",
    amountGross: fields.amount_gross ?? "",
    merchantId: fields.merchant_id ?? "",
    viewToken: fields.custom_str1 ?? "",
  };
}

export function isItnSignatureValid(itn: ParsedItn, passphrase: string | null): boolean {
  if (!/^[0-9a-f]{32}$/i.test(itn.signature)) return false;
  return signaturesMatch(itnSignature(itn.paramString, passphrase), itn.signature.toLowerCase());
}

/** amount_gross must equal what we asked for, to the cent. */
export function isItnAmountValid(itn: ParsedItn, expectedCents: number): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(itn.amountGross)) return false;
  return Math.round(Number(itn.amountGross) * 100) === expectedCents;
}

/** First address in x-forwarded-for, as set by Vercel. */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "";
}

/**
 * Whether the request IP resolves to a PayFast notification host. Used as a
 * logged signal only: the server-to-server validate call below is the
 * authoritative check, so a DNS change at PayFast cannot block real payments.
 */
export async function isPayfastSourceIp(ip: string): Promise<boolean> {
  if (!ip) return false;
  const results = await Promise.allSettled(
    PAYFAST_NOTIFY_HOSTS.map((host) => lookup(host, { all: true })),
  );
  return results.some(
    (r) => r.status === "fulfilled" && r.value.some((entry) => entry.address === ip),
  );
}

/** Ask PayFast to confirm the notification (expects the body "VALID"). */
export async function confirmItnWithPayfast(
  config: PayfastConfig,
  paramString: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(config.validateUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: paramString,
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const text = (await response.text()).trim();
    return response.ok && text === "VALID";
  } catch (error) {
    console.error(
      "[payfast] validate request failed",
      error instanceof Error ? error.message : "unknown",
    );
    return false;
  }
}
