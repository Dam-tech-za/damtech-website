import {
  ATTRIBUTION_STORAGE_KEY,
  buildFirstTouch,
  type LeadAttribution,
} from "./attribution";

/** Store first-touch attribution once per browser session (sessionStorage only). */
export function captureFirstTouchAttribution() {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)) return;
    const record = buildFirstTouch(
      window.location.href,
      document.referrer,
      window.location.origin,
    );
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage blocked (private mode, disabled cookies) — attribution is optional.
  }
}

export function readLeadAttribution(): LeadAttribution {
  if (typeof window === "undefined") return {};
  let stored: LeadAttribution = {};
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as LeadAttribution;
  } catch {
    stored = {};
  }
  return { ...stored, form_page: window.location.pathname };
}

/** Adds the serialised attribution record to a form submission. */
export function appendLeadAttribution(formData: FormData) {
  try {
    formData.set("attribution", JSON.stringify(readLeadAttribution()));
  } catch {
    // Never block a lead because attribution failed.
  }
}
