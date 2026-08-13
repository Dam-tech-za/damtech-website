/**
 * Canonical production origin for metadata, sitemap, JSON-LD, and canonical tags.
 * Never use the Vercel preview URL here — set NEXT_PUBLIC_SITE_URL in production.
 */
export const CANONICAL_ORIGIN = "https://www.dam-tech.co.za";

function isNonProductionOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return true;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith(".vercel.app")) return true;
    if (host === "dam-tech.co.za") return true;
    return host !== "www.dam-tech.co.za";
  } catch {
    return true;
  }
}

/** Normalise env override to the canonical www origin (apex/preview/localhost → www). */
function resolveSiteUrl(raw: string | undefined): string {
  const trimmed = raw?.trim().replace(/\/$/, "");
  if (!trimmed || isNonProductionOrigin(trimmed)) return CANONICAL_ORIGIN;
  return CANONICAL_ORIGIN;
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
