"use server";

import { sendLeadEmail, leadEmailChannel } from "@/lib/email";
import { parseLeadFormData } from "@/lib/form";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { insertLead, isSupabaseConfigured } from "@/lib/supabase/server";

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

  const parsed = parseLeadFormData(formData, sourcePage);

  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  const { data } = parsed;
  const channel = leadEmailChannel(sourcePage);

  const emailResult = await sendLeadEmail(data, channel);
  if (!emailResult.ok) {
    return { success: false, error: emailResult.error };
  }

  if (isSupabaseConfigured()) {
    const result = await insertLead({
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

    if (!result.ok) {
      console.error("[leads] Supabase insert failed after email sent:", result.error);
    }
  }

  return { success: true };
}
