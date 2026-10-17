/**
 * Pages whose URL carries a private access token (quotation links, information
 * requests, document uploads). Third-party analytics must never load on these
 * pages: GTM/GA4 and the Meta Pixel record the full page URL, which would hand
 * the token to an analytics vendor and anyone with access to those reports.
 */
export function isPrivateTokenPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/q/")) return true;
  if (pathname.startsWith("/quote/info/")) return true;
  // /quote/<rfq-reference>/upload/
  if (/^\/quote\/[^/]+\/upload(\/|$)/.test(pathname)) return true;
  return false;
}

/** Admin and auth routes use their own chrome and are excluded from public analytics. */
export function isAdminSurfacePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/admin") || pathname.startsWith("/auth");
}

/** True when public analytics (GTM, Meta Pixel, contact-click tracking) may run. */
export function isTrackablePath(pathname: string | null | undefined): boolean {
  return !isAdminSurfacePath(pathname) && !isPrivateTokenPath(pathname);
}
