"use server";

import { headers } from "next/headers";
import {
  RATE_LIMITS,
  publicSubmissionLimitError,
  rateLimit,
} from "@/lib/security/rate-limit";
import { clientIpFromHeaders } from "@/lib/rate-limit/types";
import { createMultiAssetRfqFromPublic } from "@/lib/rfq/create-multi-asset";
import { publicMultiRfqSchema } from "@/lib/rfq/public-schema";
import {
  sendRfqAdminNotification,
  sendRfqCustomerConfirmation,
} from "@/lib/rfq/public-email";

export type SubmitPublicRfqResult =
  | { ok: true; rfqNumber: string; uploadToken: string }
  | { ok: false; error: string };

export async function submitPublicRfqAction(
  payload: unknown,
): Promise<SubmitPublicRfqResult> {
  const parsed = publicMultiRfqSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid submission.",
    };
  }

  const data = parsed.data;

  if (!data.phone.trim() && !data.email.trim()) {
    return {
      ok: false,
      error: "Please provide a phone number or email address so we can reach you.",
    };
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  // Timing check — reject instant bots (< 4s)
  if (data.formStartedAt && Date.now() - data.formStartedAt < 4000) {
    return { ok: false, error: "Please take a moment to review your details." };
  }

  const headerList = await headers();
  const ip = clientIpFromHeaders(headerList);

  const limited = await rateLimit({
    key: `public-rfq-multi:${ip}`,
    ...RATE_LIMITS.publicRfqSubmission,
  });
  if (!limited.success) {
    return {
      ok: false,
      error: publicSubmissionLimitError(limited),
    };
  }

  // Honeypot
  if (data.website) {
    await createMultiAssetRfqFromPublic(data, { markSpam: true });
    return {
      ok: true,
      rfqNumber: "RFQ-RECEIVED",
      uploadToken: "spam",
    };
  }

  const created = await createMultiAssetRfqFromPublic(data);
  if (!created.ok) return created;

  const location =
    [data.farmProjectName, data.town, data.province].filter(Boolean).join(", ") ||
    data.addressLine ||
    "—";

  const assetSummaries = data.assets.map(
    (a) => `${a.assetName} (${a.assetType.replaceAll("_", " ")})`,
  );

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.dam-tech.co.za";

  // Admin notify — soft fail after RFQ saved
  await sendRfqAdminNotification({
    rfqNumber: created.rfqNumber,
    customerName: data.name,
    services: data.servicesRequested,
    location,
    assetCount: data.assets.length,
    quantitySummary: assetSummaries.join("; "),
    adminUrl: `${origin}/admin/rfqs/${created.rfqId}/`,
    enquiryChannel: "calculator_quote_preparation",
  });

  if (data.email) {
    await sendRfqCustomerConfirmation({
      to: data.email,
      customerName: data.name,
      rfqNumber: created.rfqNumber,
      projectLocation: location,
      assetSummaries,
      enquiryChannel: "calculator_quote_preparation",
    });
  }

  return {
    ok: true,
    rfqNumber: created.rfqNumber,
    uploadToken: created.uploadToken,
  };
}
