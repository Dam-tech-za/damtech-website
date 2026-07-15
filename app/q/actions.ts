"use server";

import { headers } from "next/headers";
import { acceptPublicQuote, rejectPublicQuote } from "@/lib/quotes/public";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

async function clientKey() {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown"
  );
}

export async function acceptPublicQuoteAction(token: string, formData: FormData) {
  const ip = await clientKey();
  const limited = await rateLimit({
    key: `public-quote-accept:${ip}`,
    ...RATE_LIMITS.publicQuoteRespond,
  });
  if (!limited.success) {
    return { ok: false as const, error: "Too many attempts. Try again later." };
  }

  const headerList = await headers();
  return acceptPublicQuote(
    token,
    {
      confirmed: formData.get("confirmed") === "true",
      acceptorName: String(formData.get("acceptorName") || ""),
      jobTitle: String(formData.get("jobTitle") || "") || undefined,
      purchaseOrder: String(formData.get("purchaseOrder") || "") || undefined,
      note: String(formData.get("note") || "") || undefined,
    },
    {
      ip,
      userAgent: headerList.get("user-agent"),
    },
  );
}

export async function rejectPublicQuoteAction(token: string, formData: FormData) {
  const ip = await clientKey();
  const limited = await rateLimit({
    key: `public-quote-reject:${ip}`,
    ...RATE_LIMITS.publicQuoteRespond,
  });
  if (!limited.success) {
    return { ok: false as const, error: "Too many attempts. Try again later." };
  }

  return rejectPublicQuote(token, {
    confirmed: formData.get("confirmed") === "true",
    reason: String(formData.get("reason") || "") || undefined,
    requestRevision: formData.get("requestRevision") === "on",
  });
}
