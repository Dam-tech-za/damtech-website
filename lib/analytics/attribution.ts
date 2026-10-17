/**
 * Lead attribution — first-touch landing page, referrer and campaign tags for a
 * browsing session, attached to quote/contact submissions so each enquiry in the
 * admin RFQ record shows which page and campaign produced it.
 *
 * Pure helpers only (no DOM / Next imports) so the server parser can be unit tested.
 */

export const ATTRIBUTION_STORAGE_KEY = "damtech_lead_attribution";

export const ATTRIBUTION_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
] as const;

export type LeadAttribution = {
  landing_page?: string;
  referrer?: string;
  form_page?: string;
  captured_at?: string;
} & Partial<Record<(typeof ATTRIBUTION_PARAM_KEYS)[number], string>>;

const ALLOWED_KEYS = new Set<string>([
  "landing_page",
  "referrer",
  "form_page",
  "captured_at",
  ...ATTRIBUTION_PARAM_KEYS,
]);

function clean(value: unknown, max = 200): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F<>]/g, "")
    .trim()
    .slice(0, max);
}

/** Keep only origin + path of a referrer — never query strings that may hold personal data. */
export function sanitiseReferrer(raw: string): string {
  const value = clean(raw, 500);
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return `${url.origin}${url.pathname}`.slice(0, 200);
  } catch {
    return "";
  }
}

/** Site-relative path only (no query, no external URLs). */
export function sanitisePath(raw: string): string {
  const value = clean(raw, 300);
  if (!value.startsWith("/") || value.startsWith("//")) return "";
  return value.split(/[?#]/)[0]!.slice(0, 200);
}

/**
 * Server-side parser for the hidden `attribution` form field. Accepts only known
 * keys and short plain strings; anything else is dropped. Returns `undefined`
 * when nothing useful remains.
 */
export function parseLeadAttribution(raw: unknown): LeadAttribution | undefined {
  if (typeof raw !== "string" || !raw.trim() || raw.length > 4000) return undefined;
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;

  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    let cleaned = "";
    if (key === "referrer") cleaned = sanitiseReferrer(String(value ?? ""));
    else if (key === "landing_page" || key === "form_page") cleaned = sanitisePath(String(value ?? ""));
    else if (key === "captured_at") {
      const date = new Date(clean(value, 40));
      cleaned = Number.isNaN(date.getTime()) ? "" : date.toISOString();
    } else cleaned = clean(value, 150);
    if (cleaned) out[key] = cleaned;
  }

  return Object.keys(out).length ? (out as LeadAttribution) : undefined;
}

/** Builds the first-touch record from the current URL and document referrer. */
export function buildFirstTouch(
  href: string,
  documentReferrer: string,
  siteOrigin: string,
  now = new Date(),
): LeadAttribution {
  const url = new URL(href);
  const record: LeadAttribution = {
    landing_page: sanitisePath(url.pathname),
    captured_at: now.toISOString(),
  };
  const referrer = sanitiseReferrer(documentReferrer);
  if (referrer && !referrer.startsWith(siteOrigin)) record.referrer = referrer;
  for (const key of ATTRIBUTION_PARAM_KEYS) {
    const value = clean(url.searchParams.get(key) ?? "", 150);
    if (value) record[key] = value;
  }
  return record;
}
