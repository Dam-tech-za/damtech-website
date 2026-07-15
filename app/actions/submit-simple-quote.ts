"use server";

import { headers } from "next/headers";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { createRfqFromPublicSubmission } from "@/lib/rfq/create-from-public";
import { parsePublicRfqFormData } from "@/lib/rfq/schema";
import {
  sendRfqAdminNotification,
  sendRfqCustomerConfirmation,
} from "@/lib/rfq/public-email";

export type SubmitSimpleQuoteResult =
  | { success: true; rfqNumber: string; uploadToken: string }
  | { success: false; error: string };

export async function submitSimpleQuote(
  formData: FormData,
  sourcePage = "/quote",
): Promise<SubmitSimpleQuoteResult> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";

  const limited = await rateLimit({
    key: `simple-quote:${ip}`,
    ...RATE_LIMITS.publicRfqSubmission,
  });
  if (!limited.success) {
    return {
      success: false,
      error: "Too many submissions. Please wait a minute and try again.",
    };
  }

  const parsed = parsePublicRfqFormData(formData, sourcePage);
  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  if (parsed.isSpam) {
    await createRfqFromPublicSubmission({
      data: parsed.data,
      calculator: null,
      markSpam: true,
      enquiryChannel: "simple_public_rfq",
      softEstimates: parsed.softEstimates,
      simpleServiceFields: parsed.simpleServiceFields,
      assetsEstimate: parsed.assetsEstimate,
    });
    return {
      success: true,
      rfqNumber: "RFQ-RECEIVED",
      uploadToken: "spam",
    };
  }

  // Simple public quote never carries calculator assets/payloads.
  const created = await createRfqFromPublicSubmission({
    data: parsed.data,
    calculator: null,
    enquiryChannel: "simple_public_rfq",
    softEstimates: parsed.softEstimates,
    simpleServiceFields: parsed.simpleServiceFields,
    assetsEstimate: parsed.assetsEstimate,
  });

  if (!created.ok) {
    return { success: false, error: created.error };
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.dam-tech.co.za";

  const sizeHint =
    parsed.data.projectSize ||
    (parsed.softEstimates.estimated_area_m2
      ? `~${parsed.softEstimates.estimated_area_m2} m² (soft parse)`
      : parsed.softEstimates.estimated_capacity_kl
        ? `~${parsed.softEstimates.estimated_capacity_kl} kL (soft parse)`
        : "Size not provided");

  await sendRfqAdminNotification({
    rfqNumber: created.rfqNumber,
    customerName: parsed.data.name,
    services: [parsed.data.serviceRequired],
    location: parsed.data.projectLocation || parsed.data.province || "—",
    assetCount: 0,
    quantitySummary: sizeHint,
    adminUrl: `${origin}/admin/rfqs/${created.rfqId}/`,
    enquiryChannel: "simple_public_rfq",
    messagePreview: parsed.data.message.slice(0, 280),
  });

  if (parsed.data.email) {
    await sendRfqCustomerConfirmation({
      to: parsed.data.email,
      customerName: parsed.data.name,
      rfqNumber: created.rfqNumber,
      projectLocation: parsed.data.projectLocation || "",
      assetSummaries: [],
      enquiryChannel: "simple_public_rfq",
      serviceRequired: parsed.data.serviceRequired,
    });
  }

  return {
    success: true,
    rfqNumber: created.rfqNumber,
    uploadToken: created.uploadToken,
  };
}
