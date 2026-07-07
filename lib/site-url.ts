/**
 * Canonical production origin for metadata, sitemap, JSON-LD, and canonical tags.
 * Never use the Vercel preview URL here — set NEXT_PUBLIC_SITE_URL in production.
 */
const CANONICAL_ORIGIN = "https://www.dam-tech.co.za";

/** Normalise env override to the canonical www origin (apex → www). */
function resolveSiteUrl(raw: string | undefined): string {
  const trimmed = raw?.trim().replace(/\/$/, "");
  if (!trimmed) return CANONICAL_ORIGIN;
  if (trimmed === "https://dam-tech.co.za" || trimmed === "http://dam-tech.co.za") {
    return CANONICAL_ORIGIN;
  }
  return trimmed;
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
