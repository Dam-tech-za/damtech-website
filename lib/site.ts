/** Canonical site origin (www). Set `NEXT_PUBLIC_SITE_URL` in Vercel → Production. */
import { SITE_URL } from "./site-url";

export { SITE_URL };

function resolveSiteOrigin(): string {
  return SITE_URL;
}

export const siteConfig = {
  name: "Damtech",
  domain: resolveSiteOrigin(),
  defaultTitle:
    "Dam Liners & Steel Water Tanks | Damtech South Africa",
  defaultDescription:
    "Damtech installs HDPE and PVC dam liners, corrugated steel water tanks and bitumen waterproofing for farms, mines and estates across South Africa. Free quotes and site inspections.",
  defaultOgDescription:
    "Damtech installs HDPE and PVC dam liners, corrugated steel water tanks and bitumen waterproofing for farms, mines and estates across South Africa. Free quotes and site inspections.",
  defaultOgTitle:
    "Dam Liners & Steel Water Tanks | Damtech South Africa",
  defaultTwitterTitle:
    "Dam Liners & Steel Water Tanks | Damtech South Africa",
  defaultTwitterDescription:
    "Damtech installs HDPE and PVC dam liners, corrugated steel water tanks and bitumen waterproofing for farms, mines and estates across South Africa. Free quotes and site inspections.",
  phone: "+27 82 853 1026",
  email: "info@dam-tech.co.za",
  location: "South Africa",
} as const;

/** E.164 tel link for the business phone. */
export const phoneTel = siteConfig.phone.replace(/\s/g, "");

/** WhatsApp click-to-chat (no + prefix in wa.me path). */
export const whatsAppUrl = "https://wa.me/27828531026";

/** Social profiles for Organization JSON-LD `sameAs` — matches the live site. */
export const SOCIAL_LINKS = [
  "https://www.facebook.com/profile.php?id=100063672332953",
  "https://www.linkedin.com/company/dam-tec/",
] as const;

/** Schema.org-format opening hours — matches the live site's LocalBusiness listing. */
export const BUSINESS_HOURS =
  "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday 09:00-17:00";

/** Search Console ownership token. Override via env if re-verifying under a new property. */
export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ||
  "aLSxHIbJjQvqWMlqoUV0gYoBNXu2UL7N4USs2hb0Igk";

/** Google Tag Manager container — same container used on the live site. */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-M5RQM6JW";

/** Meta (Facebook) Pixel ID — same pixel used on the live site. */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1955529471712055";

/** Provinces Damtech serves — used in LocalBusiness schema `areaServed`. */
export const SERVICE_AREA_PROVINCES = [
  "Gauteng",
  "Western Cape",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Free State",
  "KwaZulu-Natal",
] as const;

/** Blog author for visible bylines and Article/BlogPosting schema. */
export const BLOG_AUTHOR = {
  name: "Damtech Team",
  path: "/about-us-waterproofing-company",
} as const;

// TODO(business-confirm): confirm Betty's Bay is the designated head office before deploy.
export const OFFICES = [
  {
    id: "western-cape",
    name: "Head Office — Betty's Bay, Western Cape",
    phone: siteConfig.phone,
    googleBusinessProfileUrl: "https://share.google/Xbvr3S0ksWMMyIEuL",
    address: {
      streetAddress: "2484 Anglers Rd",
      suburb: "Betty's Bay",
      city: "Betty's Bay",
      province: "Western Cape",
      postalCode: "7141",
      country: "South Africa",
    },
  },
  {
    id: "pretoria",
    name: "Regional Office — Pretoria (Villieria), Gauteng",
    phone: siteConfig.phone,
    googleBusinessProfileUrl: "https://share.google/NxSGti3zXVB01SI3Z",
    address: {
      streetAddress: "926, 33rd Avenue",
      suburb: "Villieria",
      city: "Pretoria",
      province: "Gauteng",
      postalCode: "0186",
      country: "South Africa",
    },
  },
] as const;

/** Google Maps embed for the head office (no API key required). */
export const HEAD_OFFICE_MAP_EMBED_URL =
  "https://maps.google.com/maps?q=2484+Anglers+Rd,+Betty's+Bay,+7141,+South+Africa&hl=en&z=15&output=embed";

export type Office = (typeof OFFICES)[number];

export function formatOfficeLocality(
  address: Extract<Office, { address: object }>["address"],
): string {
  const { suburb, city } = address;
  return suburb && suburb !== city ? `${suburb}, ${city}` : city;
}

export function formatOfficeAddressLines(office: Office): string[] {
  if ("address" in office && office.address) {
    const { streetAddress, postalCode, province } = office.address;
    return [
      `${streetAddress}`,
      `${formatOfficeLocality(office.address)} ${postalCode}`,
      province,
    ];
  }
  return [];
}

export const HEAD_OFFICE = OFFICES[0];

/** Towns and districts named on regional service pages — contact page “Areas we work in”. */
export const CONTACT_SERVICE_AREAS = {
  "Western Cape": [
    "Betty's Bay",
    "Stellenbosch",
    "Franschhoek",
    "Grabouw",
    "Swartland",
    "Boland",
    "Overberg",
  ],
  Gauteng: [
    "Pretoria",
    "Centurion",
    "Johannesburg",
    "Hammanskraal",
    "Cullinan",
    "Roodepoort",
    "Alberton",
  ],
} as const;

export type NavLink = {
  href: string;
  label: string;
};

/** Services header dropdown — crawlable real `<a>` links (desktop + mobile). */
export const SERVICES_DROPDOWN_LINKS: NavLink[] = [
  { href: "/dam-liners", label: "Dam Liners & Dam Lining Services" },
  { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
  { href: "/pvc-dam-lining", label: "PVC Dam Lining" },
  { href: "/torch-on-dam-lining", label: "Torch-On Dam Lining" },
  { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
  { href: "/bitumen-waterproofing", label: "Waterproofing" },
  { href: "/reservoir-lining", label: "Reservoir Lining" },
  { href: "/dam-repair-services", label: "Leaking Dam Repair" },
  { href: "/farm-dam-liners", label: "Farm Dam Liners" },
  { href: "/mining-dam-liners", label: "Mining Dam Liners" },
  { href: "/western-cape-dam-liners", label: "Western Cape Dam Liners" },
];

/** @deprecated Prefer SERVICES_DROPDOWN_LINKS (Dam Liners hub is included there). */
export const DAM_LINERS_DROPDOWN_LINKS: NavLink[] = SERVICES_DROPDOWN_LINKS.filter(
  (link) =>
    link.href === "/hdpe-dam-lining" ||
    link.href === "/pvc-dam-lining" ||
    link.href === "/torch-on-dam-lining" ||
    link.href === "/farm-dam-liners" ||
    link.href === "/mining-dam-liners" ||
    link.href === "/western-cape-dam-liners",
);

export type HeaderNavItem =
  | { type: "link"; href: string; label: string }
  | {
      type: "dropdown";
      label: string;
      href: string;
      children: readonly NavLink[];
      /**
       * Optional hub row above children. Pass `null` to omit (Services list
       * already starts with Dam Liners; the parent link still points to /services).
       */
      hubLabel?: string | null;
    };

/** Desktop + mobile header navigation (quote button is separate). */
export const HEADER_NAV_ITEMS: HeaderNavItem[] = [
  { type: "link", href: "/", label: "Home" },
  {
    type: "dropdown",
    label: "Services",
    href: "/services",
    hubLabel: null,
    children: SERVICES_DROPDOWN_LINKS,
  },
  { type: "link", href: "/projects", label: "Projects" },
  { type: "link", href: "/calculators", label: "Calculators" },
  { type: "link", href: "/blog", label: "Blog" },
  { type: "link", href: "/contact", label: "Contact" },
];

/** Flat nav links for legacy consumers. */
export const HEADER_NAV_LINKS: NavLink[] = HEADER_NAV_ITEMS.flatMap((item) =>
  item.type === "link"
    ? [{ href: item.href, label: item.label }]
    : [{ href: item.href, label: item.label }, ...item.children],
);

/** @deprecated Use HEADER_NAV_ITEMS */
export const NAV_LINKS = HEADER_NAV_LINKS;

export const FOOTER_SERVICE_LINKS: NavLink[] = [
  { href: "/dam-liners", label: "Dam Liners & Dam Lining Services" },
  { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
  { href: "/pvc-dam-lining", label: "PVC Dam Lining" },
  { href: "/torch-on-dam-lining", label: "Torch-On Dam Lining" },
  { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
  { href: "/bitumen-waterproofing", label: "Waterproofing" },
  { href: "/reservoir-lining", label: "Reservoir Lining" },
  { href: "/dam-repair-services", label: "Leaking Dam Repair" },
  { href: "/farm-dam-liners", label: "Farm Dam Liners" },
  { href: "/mining-dam-liners", label: "Mining Dam Liners" },
  { href: "/western-cape-dam-liners", label: "Western Cape Dam Liners" },
];

export const FOOTER_COMPANY_LINKS: NavLink[] = [
  { href: "/about-us-waterproofing-company", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/calculators", label: "Calculators" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/quote", label: "Request a Quote" },
];

/** @deprecated Use FOOTER_SERVICE_LINKS and FOOTER_COMPANY_LINKS */
export const FOOTER_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  ...FOOTER_SERVICE_LINKS,
  ...FOOTER_COMPANY_LINKS,
  { href: "/quote", label: "Request a Quote" },
];

export const SERVICE_LINKS = [
  { href: "/dam-liners", label: "Dam Linings (HDPE, PVC, Torch-On)" },
  { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
  { href: "/steel-water-storage-tanks", label: "Steel Water Storage Tanks" },
  { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
  { href: "/services", label: "All Services" },
  { href: "/dam-repair-services", label: "Leaking Dam Repair" },
  { href: "/reservoir-lining", label: "Reservoir Lining" },
  { href: "/faq", label: "FAQ" },
] as const;

export const PROJECTS = [
  {
    href: "/projects/centurion-hdpe-dam-liner",
    location: "Centurion",
    detail: "HDPE Dam Lining — 1,200 m²",
  },
  {
    href: "/projects/grabouw-hdpe-farm-dam",
    location: "Grabouw",
    detail: "HDPE Dam Lining — 3,400 m²",
  },
  {
    href: "/projects/hoedspruit-bitumen-dam-lining",
    location: "Hoedspruit",
    detail: "Bitumen Torch-On — 550 m²",
  },
  {
    href: "/projects/stellenbosch-hdpe-dam-liner",
    location: "Stellenbosch",
    detail: "HDPE Dam Lining — 13,360 m²",
  },
  {
    href: "/projects/tulbagh-steel-water-tank",
    location: "Tulbagh, Western Cape",
    detail: "Steel Water Tanks",
  },
] as const;

/** Paths disallowed in robots.txt — must not be listed in sitemap.xml. */
export const ROBOTS_DISALLOW_PATHS = [
  "/thank-you/",
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
  "/faq",
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
  "/calculators",
] as const;
