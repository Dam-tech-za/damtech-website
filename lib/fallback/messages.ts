import { shortIncidentRef } from "../rfq/submission-result.ts";

const FALLBACK_PHONE = "+27 82 853 1026";
const FALLBACK_EMAIL = "info@dam-tech.co.za";
const FALLBACK_WHATSAPP_URL = "https://wa.me/27828531026";

export function fallbackSuccessCustomerMessage(incidentId: string): string {
  const ref = shortIncidentRef(incidentId);
  return `Your request could not be entered into our quotation system, but it has been sent to the DamTech team through our backup channel. Your formal reference will follow. Please keep this incident reference: ${ref}. Please do not submit the form again.`;
}

export function totalFailureCustomerMessage(incidentId?: string): string {
  const ref = incidentId
    ? ` Reference: ${shortIncidentRef(incidentId)}.`
    : "";
  return `We could not save or deliver your request through our online systems.${ref} Please contact DamTech directly by phone at ${FALLBACK_PHONE}, email ${FALLBACK_EMAIL}, or WhatsApp (${FALLBACK_WHATSAPP_URL}).`;
}

export const FALLBACK_CONTACT_CHANNELS = {
  phone: FALLBACK_PHONE,
  email: FALLBACK_EMAIL,
  whatsAppUrl: FALLBACK_WHATSAPP_URL,
} as const;
