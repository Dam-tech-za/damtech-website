/**
 * GTM dataLayer events for conversion measurement.
 *
 * Event names follow GA4 recommended/custom conventions. GTM must forward these
 * to GA4 (see docs/seo-growth-baseline.md → "GTM configuration required").
 */

import { META_STANDARD_EVENTS, trackMetaEvent } from "./meta-pixel.ts";

export const CONVERSION_EVENTS = {
  /** Successful quote or contact form submission (GA4 recommended event). */
  generateLead: "generate_lead",
  phoneClick: "phone_click",
  whatsAppClick: "whatsapp_click",
  emailClick: "email_click",
} as const;

export type ContactMethod = "phone" | "whatsapp" | "email";

/** Classify a link href as a contact action, or null when it is not one. */
export function classifyContactHref(href: string | null | undefined): ContactMethod | null {
  if (!href) return null;
  const value = href.trim().toLowerCase();
  if (value.startsWith("tel:")) return "phone";
  if (value.startsWith("mailto:")) return "email";
  if (
    value.startsWith("https://wa.me/") ||
    value.startsWith("https://api.whatsapp.com/") ||
    value.startsWith("whatsapp:")
  ) {
    return "whatsapp";
  }
  return null;
}

export function contactEventName(method: ContactMethod): string {
  if (method === "phone") return CONVERSION_EVENTS.phoneClick;
  if (method === "whatsapp") return CONVERSION_EVENTS.whatsAppClick;
  return CONVERSION_EVENTS.emailClick;
}

type DataLayerWindow = Window & { dataLayer?: Array<Record<string, unknown>> };

export function pushDataLayerEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...params });
}

/** Fire once per successful lead submission. Never include names, emails or phone numbers. */
export function trackLeadSubmitted(params: {
  form: "simple_quote" | "contact_form" | "detailed_rfq";
  service?: string;
  rfqNumber?: string;
}) {
  pushDataLayerEvent(CONVERSION_EVENTS.generateLead, {
    lead_form: params.form,
    lead_service: params.service || undefined,
    rfq_number: params.rfqNumber || undefined,
    page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
  });
  trackMetaEvent(META_STANDARD_EVENTS.lead, {
    content_name: params.form,
    content_category: params.service || undefined,
  });
}
