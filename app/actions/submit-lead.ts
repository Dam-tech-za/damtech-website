"use server";

import { sendLeadEmail, leadEmailChannel } from "@/lib/email";
import { insertLead, isSupabaseConfigured } from "@/lib/supabase/server";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { createRfqFromPublicSubmission } from "@/lib/rfq/create-from-public";
import { parsePublicRfqFormData } from "@/lib/rfq/schema";

export type SubmitLeadResult =
  | { success: true }
  | { success: false; error: string };

export async function submitLead(
  formData: FormData,
  sourcePage: string,
): Promise<SubmitLeadResult> {
  const limit = await rateLimit({
    key: `public-rfq:${sourcePage}`,
    ...RATE_LIMITS.publicRfqSubmission,
  });

  if (!limit.success) {
    return {
      success: false,
      error: "Too many submissions. Please wait a minute and try again.",
    };
  }

  const parsed = parsePublicRfqFormData(formData, sourcePage);
  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  // Honeypot: accept silently without creating operational work
  if (parsed.isSpam) {
    await createRfqFromPublicSubmission({
      data: parsed.data,
      calculator: parsed.calculator,
      markSpam: true,
    });
    return { success: true };
  }

  const { data } = parsed;
  const channel = leadEmailChannel(sourcePage);

  const emailResult = await sendLeadEmail(
    {
      name: data.name,
      company: data.company,
      phone: data.phone,
      email: data.email,
      province: data.province,
      serviceRequired: data.serviceRequired,
      projectSize: data.projectSize,
      projectLocation: data.projectLocation,
      message: data.message,
      sourcePage: data.sourcePage,
    },
    channel,
  );

  if (!emailResult.ok) {
    return { success: false, error: emailResult.error };
  }

  if (isSupabaseConfigured()) {
    // Legacy leads table (best-effort)
    const leadResult = await insertLead({
      name: data.name,
      company: data.company || null,
      phone: data.phone || null,
      email: data.email || null,
      province: data.province || null,
      service_required: data.serviceRequired,
      project_size: data.projectSize || null,
      project_location: data.projectLocation || null,
      message: data.message,
      source_page: data.sourcePage,
    });
    if (!leadResult.ok) {
      console.error("[leads] insert failed after email:", leadResult.error);
    }

    const rfqResult = await createRfqFromPublicSubmission({
      data,
      calculator: parsed.calculator,
    });
    if (!rfqResult.ok) {
      console.error("[rfq] create failed after email:", rfqResult.error);
    }
  }

  return { success: true };
}
