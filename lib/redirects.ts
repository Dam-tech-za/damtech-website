import type { Redirect } from "next/dist/lib/load-custom-routes";

/** Apex → www canonical redirect (must run before path redirects). */
const CANONICAL_HOST_REDIRECTS: Redirect[] = [
  {
    source: "/",
    has: [{ type: "host", value: "dam-tech.co.za" }],
    destination: "https://www.dam-tech.co.za/",
    permanent: true,
  },
  {
    source: "/:path+",
    has: [{ type: "host", value: "dam-tech.co.za" }],
    destination: "https://www.dam-tech.co.za/:path/",
    permanent: true,
  },
];

/** Legacy WordPress URLs — permanent 301 redirects. */
export const redirects: Redirect[] = [
  ...CANONICAL_HOST_REDIRECTS,
  { source: "/linings", destination: "/dam-liners/", permanent: true },
  { source: "/dam-linings", destination: "/dam-liners/", permanent: true },
  { source: "/dam-linings/", destination: "/dam-liners/", permanent: true },
  { source: "/hdpe-linings", destination: "/hdpe-dam-lining/", permanent: true },
  { source: "/torch-on-linings", destination: "/torch-on-dam-lining/", permanent: true },
  { source: "/reservoirs", destination: "/steel-water-storage-tanks/", permanent: true },
  { source: "/services/dam-linings", destination: "/dam-liners/", permanent: true },
  { source: "/services/leak-repair", destination: "/dam-repair-services/", permanent: true },
  { source: "/leak-repair-services", destination: "/dam-repair-services/", permanent: true },
  { source: "/contact-us", destination: "/contact/", permanent: true },
  {
    source: "/bitumen-waterproofing-services-and-more",
    destination: "/bitumen-waterproofing/",
    permanent: true,
  },
  {
    source: "/bitumen-waterproofing-services-and-more/",
    destination: "/bitumen-waterproofing/",
    permanent: true,
  },
  // Short URL aliases
  { source: "/steel-tanks", destination: "/steel-water-storage-tanks/", permanent: true },
  { source: "/steel-tanks/", destination: "/steel-water-storage-tanks/", permanent: true },
  { source: "/waterproofing", destination: "/bitumen-waterproofing/", permanent: true },
  { source: "/waterproofing/", destination: "/bitumen-waterproofing/", permanent: true },
  // Trailing-slash variants
  { source: "/linings/", destination: "/dam-liners/", permanent: true },
  { source: "/hdpe-linings/", destination: "/hdpe-dam-lining/", permanent: true },
  { source: "/torch-on-linings/", destination: "/torch-on-dam-lining/", permanent: true },
  { source: "/hdpe-lining", destination: "/hdpe-dam-lining/", permanent: true },
  { source: "/hdpe-lining/", destination: "/hdpe-dam-lining/", permanent: true },
  { source: "/reservoirs/", destination: "/steel-water-storage-tanks/", permanent: true },
  { source: "/services/dam-linings/", destination: "/dam-liners/", permanent: true },
  { source: "/services/leak-repair/", destination: "/dam-repair-services/", permanent: true },
  { source: "/leak-repair-services/", destination: "/dam-repair-services/", permanent: true },
  { source: "/contact-us/", destination: "/contact/", permanent: true },
  // FAQ route rename
  {
    source: "/waterproofing-and-dam-liners",
    destination: "/faq/",
    permanent: true,
  },
  {
    source: "/waterproofing-and-dam-liners/",
    destination: "/faq/",
    permanent: true,
  },
  // Legacy WP uncategorized archive → blog index
  {
    source: "/category/uncategorized",
    destination: "/blog/",
    permanent: true,
  },
  {
    source: "/category/uncategorized/",
    destination: "/blog/",
    permanent: true,
  },
  {
    source: "/category/uncategorized/page/:page",
    destination: "/blog/",
    permanent: true,
  },
  {
    source: "/category/uncategorized/page/:page/",
    destination: "/blog/",
    permanent: true,
  },
  // SEO-friendly project slug aliases
  {
    source: "/projects/hartswater-hdpe-dam-lining",
    destination: "/projects/centurion-hdpe-dam-liner/",
    permanent: true,
  },
  {
    source: "/projects/hartswater-hdpe-dam-lining/",
    destination: "/projects/centurion-hdpe-dam-liner/",
    permanent: true,
  },
  {
    source: "/projects/hartswater-hdpe-dam-liner",
    destination: "/projects/centurion-hdpe-dam-liner/",
    permanent: true,
  },
  {
    source: "/projects/hartswater-hdpe-dam-liner/",
    destination: "/projects/centurion-hdpe-dam-liner/",
    permanent: true,
  },
  {
    source: "/projects/grabouw-hdpe-dam-lining",
    destination: "/projects/grabouw-hdpe-farm-dam/",
    permanent: true,
  },
  {
    source: "/projects/grabouw-hdpe-dam-lining/",
    destination: "/projects/grabouw-hdpe-farm-dam/",
    permanent: true,
  },
  {
    source: "/projects/hoedspruit-bitumen-torch-on-waterproofing",
    destination: "/projects/hoedspruit-bitumen-dam-lining/",
    permanent: true,
  },
  {
    source: "/projects/hoedspruit-bitumen-torch-on-waterproofing/",
    destination: "/projects/hoedspruit-bitumen-dam-lining/",
    permanent: true,
  },
  {
    source: "/projects/corrugated-steel-water-tank-installation",
    destination: "/steel-water-storage-tanks/",
    permanent: true,
  },
  {
    source: "/projects/corrugated-steel-water-tank-installation/",
    destination: "/steel-water-storage-tanks/",
    permanent: true,
  },
  {
    source: "/projects/western-cape-steel-water-tank",
    destination: "/steel-water-storage-tanks/",
    permanent: true,
  },
  {
    source: "/projects/western-cape-steel-water-tank/",
    destination: "/steel-water-storage-tanks/",
    permanent: true,
  },
  {
    source: "/projects/tulbagh-steel-water-tank",
    destination: "/steel-water-storage-tanks/",
    permanent: true,
  },
  {
    source: "/projects/tulbagh-steel-water-tank/",
    destination: "/steel-water-storage-tanks/",
    permanent: true,
  },
  {
    source: "/projects/free-state-bitumen-earth-dam-lining-15000m2",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/free-state-bitumen-earth-dam-lining-15000m2/",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/western-cape-bitumen-earth-dam-lining-15000m2",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/western-cape-bitumen-earth-dam-lining-15000m2/",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/worcester-bitumen-earth-dam-lining-15000m2",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/worcester-bitumen-earth-dam-lining-15000m2/",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/limpopo-hdpe-dam-lining-8230m2",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/limpopo-hdpe-dam-lining-8230m2/",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/western-cape-hdpe-dam-lining-8230m2",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/western-cape-hdpe-dam-lining-8230m2/",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/villiersdorp-hdpe-dam-lining-8230m2",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/villiersdorp-hdpe-dam-lining-8230m2/",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/hdpe-dam-liner-installation",
    destination: "/projects/stellenbosch-hdpe-dam-liner/",
    permanent: true,
  },
  {
    source: "/projects/hdpe-dam-liner-installation/",
    destination: "/projects/stellenbosch-hdpe-dam-liner/",
    permanent: true,
  },
  {
    source: "/projects/mpumalanga-torch-on-bitumen-concrete-dam-15m",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/mpumalanga-torch-on-bitumen-concrete-dam-15m/",
    destination: "/projects/",
    permanent: true,
  },
  // Unpublished until client measurements confirmed
  {
    source: "/projects/marico-hill-game-lodge-dam-lining",
    destination: "/projects/",
    permanent: true,
  },
  {
    source: "/projects/marico-hill-game-lodge-dam-lining/",
    destination: "/projects/",
    permanent: true,
  },
];

/**
 * Host-level redirects (http → https, apex → www) are also enforced above for
 * `dam-tech.co.za` → `https://www.dam-tech.co.za`. On Vercel, confirm the
 * Production domain primary is `www.dam-tech.co.za` with apex as redirect alias
 * so HTTP and HTTPS apex both land on www without a redirect chain.
 */
