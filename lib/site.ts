export const siteConfig = {
  name: "Damtech",
  domain: "https://dam-tech.co.za",
  defaultTitle:
    "Dam Liners, Steel Water Tanks & Waterproofing | Damtech South Africa",
  defaultDescription:
    "Expert dam liner, corrugated steel tank and bitumen waterproofing contractors serving farms and properties across South Africa.",
  phone: "+27 82 853 1026",
  email: "info@dam-tech.co.za",
  location: "South Africa",
} as const;

/** E.164 tel link for the business phone. */
export const phoneTel = siteConfig.phone.replace(/\s/g, "");

export const OFFICES = [
  { name: "Head Office — Pretoria", phone: "+27 (0) 82 853 1026" },
  { name: "Regional Office — Western Cape", phone: "+27 (0) 82 853 1026" },
] as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dam-liners", label: "Dam Liners" },
  { href: "/steel-water-storage-tanks", label: "Steel Tanks" },
  { href: "/bitumen-waterproofing", label: "Waterproofing" },
  {
    href: "/bitumen-waterproofing-services-and-more",
    label: "Services",
  },
  { href: "/about-us-waterproofing-company", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/quote", label: "Get a Quote" },
] as const;

export const SERVICE_LINKS = [
  { href: "/dam-liners", label: "Dam Liners (HDPE, PVC, Torch-On)" },
  { href: "/steel-water-storage-tanks", label: "Steel Water Storage Tanks" },
  { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
  {
    href: "/bitumen-waterproofing-services-and-more",
    label: "All Services",
  },
  { href: "/waterproofing-and-dam-liners", label: "FAQ" },
] as const;

export const BLOG_LINKS = [
  { href: "/blog", label: "Latest Articles" },
  { href: "/category/uncategorized", label: "Uncategorized" },
  {
    href: "/author/infodam-tech-co-za",
    label: "Author: Tiaan",
  },
] as const;

export const PROJECTS = [
  { location: "Hartswater", detail: "HDPE Dam Liner — 3,472 m²" },
  { location: "Grabouw", detail: "HDPE Dam Liner — 10,520 m²" },
  { location: "Hoedspruit", detail: "Bitumen Torch-On Dam Liner — 9,240 m²" },
  { location: "Stellenbosch", detail: "HDPE Dam Liner — 13,360 m²" },
  { location: "Bloemfontein", detail: "HDPE Dam Liner — 8,760 m²" },
  { location: "Witbank", detail: "Steel Water Tanks — 6 × 60 kL" },
] as const;

/** Indexable static routes for sitemap generation. */
export const INDEXABLE_STATIC_PATHS = [
  "/",
  "/about-us-waterproofing-company",
  "/bitumen-waterproofing-services-and-more",
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
] as const;
