/**
 * Absolute origin for PayFast return/cancel/notify URLs. On Vercel preview
 * deployments the preview's own URL is used so sandbox tests come back to
 * the preview, not production.
 */
export function shopOrigin(env: Record<string, string | undefined> = process.env): string {
  if (env.VERCEL_ENV === "preview" && env.VERCEL_URL) {
    return `https://${env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.dam-tech.co.za";
}
