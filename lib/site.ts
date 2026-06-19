/** Canonical site origin (non-www). Set `NEXT_PUBLIC_SITE_URL` in Vercel → Production. */
import { SITE_URL } from "./site-url";

export { SITE_URL };

function resolveSiteOrigin(): string {
  return SITE_URL;
}

export const siteConfig = {
  name: "Damtech",
  domain: resolveSiteOrigin(),
  defaultTitle: "Dam Liners & Steel Water Tanks | Damtech South Africa",
  defaultDescription:
    "Damtech installs HDPE and PVC dam liners, corrugated steel reservoirs and bitumen waterproofing for farms, mines and properties across South Africa. Request a free quote.",
  defaultOgDescription:
    "Expert dam lining, reservoir and waterproofing contractors serving farms, mines and properties nationwide.",
  defaultTwitterTitle: "Damtech – Dam Liners & Water Storage Solutions",
  defaultTwitterDescription:
    "HDPE and PVC dam liners, steel tanks and waterproofing. Free quotes across South Africa.",
  phone: "+27 82 853 1026",
  email: "info@dam-tech.co.za",
  location: "South Africa",
} as const;

/** E.164 tel link for the business phone. */
export const phoneTel = siteConfig.phone.replace(/\s/g, "");

/** WhatsApp click-to-chat (no + prefix in wa.me path). */
export const whatsAppUrl = "https://wa.me/27828531026";

export type NavLink = {
  href: string;
  label: string;
};

export const OFFICES = [
  { name: "Head Office — Pretoria", phone: "+27 (0) 82 853 1026" },
  { name: "Regional Office — Western Cape", phone: "+27 (0) 82 853 1026" },
] as const;

/** Desktop header navigation (quote button is separate). */
export const HEADER_NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/dam-liners", label: "Dam Liners" },
  { href: "/steel-water-storage-tanks", label: "Steel Tanks" },
  { href: "/bitumen-waterproofing", label: "Waterproofing" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

/** @deprecated Use HEADER_NAV_LINKS */
export const NAV_LINKS = HEADER_NAV_LINKS;

export const FOOTER_SERVICE_LINKS: NavLink[] = [
  { href: "/dam-liners", label: "Dam Liners" },
  { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
  { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
  { href: "/services", label: "All Services" },
];

export const FOOTER_COMPANY_LINKS: NavLink[] = [
  { href: "/about-us-waterproofing-company", label: "About Damtech" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/waterproofing-and-dam-liners", label: "FAQ" },
];

/** @deprecated Use FOOTER_SERVICE_LINKS and FOOTER_COMPANY_LINKS */
export const FOOTER_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  ...FOOTER_SERVICE_LINKS,
  ...FOOTER_COMPANY_LINKS,
  { href: "/quote", label: "Request a Quote" },
];

export const SERVICE_LINKS = [
  { href: "/dam-liners", label: "Dam Liners (HDPE, PVC, Torch-On)" },
  { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
  { href: "/steel-water-storage-tanks", label: "Steel Water Storage Tanks" },
  { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
  { href: "/services", label: "All Services" },
  { href: "/dam-repair-services", label: "Leaking Dam Repair" },
  { href: "/reservoir-lining", label: "Reservoir Lining" },
  { href: "/waterproofing-and-dam-liners", label: "FAQ" },
] as const;

export const PROJECTS = [
  {
    href: "/projects/hartswater-hdpe-dam-liner",
    location: "Hartswater",
    detail: "HDPE Dam Liner — 3,472 m²",
  },
  {
    href: "/projects/grabouw-hdpe-farm-dam",
    location: "Grabouw",
    detail: "HDPE Dam Liner — 10,520 m²",
  },
  {
    href: "/projects/hoedspruit-bitumen-dam-lining",
    location: "Hoedspruit",
    detail: "Bitumen Torch-On — 9,240 m²",
  },
  {
    href: "/projects/hdpe-dam-liner-installation",
    location: "Stellenbosch",
    detail: "HDPE Dam Liner — 13,360 m²",
  },
  {
    href: "/projects/corrugated-steel-water-tank-installation",
    location: "Witbank",
    detail: "Steel Water Tanks — 6 × 60 kL",
  },
] as const;

/** Paths disallowed in robots.txt — must not be listed in sitemap.xml. */
export const ROBOTS_DISALLOW_PATHS = [
  "/thank-you/",
  "/_next/",
  "/api/",
  "/category/",
  "/author/",
] as const;

/** Indexable static routes for sitemap generation. */
export const INDEXABLE_STATIC_PATHS = [
  "/",
  "/about-us-waterproofing-company",
  "/services",
  "/dam-liners",
  "/steel-water-storage-tanks",
  "/bitumen-waterproofing",
  "/waterproofing-and-dam-liners",
  "/blog",
  "/contact",
  "/quote",
  "/projects",
  "/pretoria-dam-liners",
  "/johannesburg-dam-liners",
  "/limpopo-dam-liners",
  "/mpumalanga-dam-liners",
  "/western-cape-dam-liners",
  "/farm-dam-liners",
  "/mining-dam-liners",
  "/agricultural-water-storage",
  "/hdpe-dam-lining",
  "/pvc-dam-lining",
  "/torch-on-dam-lining",
  "/dam-repair-services",
  "/reservoir-lining",
  "/dam-lining-cost-south-africa",
] as const;
