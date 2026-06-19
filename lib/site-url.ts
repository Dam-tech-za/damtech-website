/**
 * Canonical production origin for metadata, sitemap, JSON-LD, and canonical tags.
 * Never use the Vercel preview URL here — set NEXT_PUBLIC_SITE_URL in production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
  "https://dam-tech.co.za"
);
