"use server";

import { parseLeadFormData } from "@/lib/form";
import { insertLead } from "@/lib/supabase/server";

export type SubmitLeadResult =
  | { success: true }
  | { success: false; error: string };

export async function submitLead(
  formData: FormData,
  sourcePage: string,
): Promise<SubmitLeadResult> {
  const parsed = parseLeadFormData(formData, sourcePage);

  if (!parsed.ok) {
    return { success: false, error: parsed.error };
  }

  const { data } = parsed;

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
    return {
      success: false,
      error:
        "We could not save your enquiry right now. Please call us directly or try again shortly.",
    };
  }

  return { success: true };
}
