import type { CreateMetadataInput } from "./seo";
import { createMetadata } from "./seo";

export type StaticPageKey =
  | "home"
  | "about"
  | "services"
  | "dam-liners"
  | "steel-tanks"
  | "bitumen"
  | "faq"
  | "contact"
  | "blog"
  | "category"
  | "author";

export type PageSeoEntry = {
  /** Full browser/OG title (include brand where appropriate). */
  title: string;
  description: string;
  path: string;
  /** Visible H1 on the page (one per route). */
  h1: string;
  /** Open Graph / Twitter image path under /public. */
  image?: string;
  /** Short name for Service JSON-LD (service pages only). */
  serviceName?: string;
  noIndex?: boolean;
};

/** SEO metadata for static routes — unique titles and descriptions per page. */
export const PAGE_SEO: Record<StaticPageKey, PageSeoEntry> = {
  home: {
    title: "Dam Liners, Steel Water Tanks & Waterproofing | Damtech South Africa",
    description:
      "Expert dam liner, corrugated steel tank and bitumen waterproofing contractors serving farms and properties across South Africa. Request a free quote.",
    path: "/",
    h1: "Leaders In Dam Liners And Water Storage Solutions",
    image: "/images/damtech-dam-liners-water-storage-solutions.webp",
  },
  about: {
    title: "About Damtech | Dam Lining & Waterproofing Experts",
    description:
      "Learn about Damtech — 30+ years installing HDPE dam liners, steel water reservoirs and bitumen waterproofing for agricultural and commercial clients nationwide.",
    path: "/about-us-waterproofing-company",
    h1: "About Our Company",
    image: "/images/damtech-waterproofing-dam-liner-specialists.webp",
  },
  services: {
    title: "Dam Liners, Water Tanks & Waterproofing Services | Damtech",
    description:
      "Full water storage and protection services: HDPE dam liners, corrugated steel tanks, bitumen waterproofing, leak repair and preventative maintenance.",
    path: "/bitumen-waterproofing-services-and-more",
    h1: "Dam Liners, Water Tanks & Waterproofing Services",
    serviceName: "Dam Liners, Water Tanks & Waterproofing",
    image: "/images/hdpe-dam-liner-farm-water-storage.webp",
  },
  "dam-liners": {
    title: "HDPE Dam Liners & Dam Lining Contractors | Damtech",
    description:
      "Professional HDPE, PVC and bitumen torch-on dam liner supply and installation for farm dams, earth dams and reservoirs across South Africa.",
    path: "/dam-liners",
    h1: "Quality Dam Liners For Every Application",
    serviceName: "HDPE Dam Liner Installation",
    image: "/images/hdpe-dam-liner-farm-water-storage.webp",
  },
  "steel-tanks": {
    title: "Corrugated Steel Water Tanks | Damtech South Africa",
    description:
      "Corrugated galvanised steel water tanks from 11 kL to 500 kL+, supplied with PVC lining. Built for farms, game reserves and rural water storage.",
    path: "/steel-water-storage-tanks",
    h1: "Corrugated Steel Water Tanks",
    serviceName: "Corrugated Steel Water Tank Installation",
    image: "/images/corrugated-steel-water-tank-installation.webp",
  },
  bitumen: {
    title: "Bitumen Waterproofing Specialists | Damtech",
    description:
      "Bitumen torch-on, self-adhesive and liquid waterproofing for roofs, foundations, retaining walls and reservoirs. Installed by Damtech specialists.",
    path: "/bitumen-waterproofing",
    h1: "Bitumen Waterproofing",
    serviceName: "Bitumen Waterproofing",
    image: "/images/bitumen-waterproofing-roof-reservoir-repair.webp",
  },
  faq: {
    title: "Dam Liner & Waterproofing FAQ | Damtech",
    description:
      "Answers to common questions about dam liners, zinc reservoirs, waterproofing warranties, maintenance and leak repair from the Damtech team.",
    path: "/waterproofing-and-dam-liners",
    h1: "Dam Liner & Waterproofing FAQ",
    image: "/images/hdpe-dam-liner-farm-water-storage.webp",
  },
  contact: {
    title: "Contact Damtech | Request a Dam Liner Quote",
    description:
      "Request a free dam liner or waterproofing quote. Contact Damtech by phone, email or our online form — serving clients across South Africa.",
    path: "/contact",
    h1: "Contact Damtech",
    image: "/images/hdpe-dam-liner-farm-water-storage.webp",
  },
  blog: {
    title: "Damtech Blog | Dam Liners & Water Storage Guides",
    description:
      "Practical articles on farm dam liners, steel reservoir maintenance, leak repair, borehole integration and water storage for South African agriculture.",
    path: "/blog",
    h1: "Damtech Blog",
    image: "/images/damtech-dam-liners-water-storage-solutions.webp",
  },
  category: {
    title: "Uncategorized Archives | Damtech",
    description:
      "Archive of Damtech articles on farm dam liners, waterproofing and water storage.",
    path: "/category/uncategorized",
    h1: "Uncategorized",
    noIndex: true,
  },
  author: {
    title: "Tiaan, Author at Damtech",
    description: "Articles written by Tiaan for Damtech on dam liners and water storage.",
    path: "/author/infodam-tech-co-za",
    h1: "Tiaan",
    noIndex: true,
  },
};

export const FAQ_ITEMS = [
  {
    question:
      "Can you assist with waterproofing for a roof or foundation that is already constructed?",
    answer:
      "Yes, our waterproofing systems include existing structures. Our team will assess the current condition of your roof or foundation and determine the best approach to apply bitumen or liquid rubber waterproofing with minimal disruption.",
  },
  {
    question: "How long does it take to install a zinc reservoir?",
    answer:
      "The installation time for a zinc reservoir varies depending on its size and complexity. Generally, a standard 250 kL reservoir installation can take between 3 to 5 days, including order placement, site preparation, construction and commissioning.",
  },
  {
    question: "What is the lifespan of a zinc reservoir?",
    answer:
      "A well-constructed reservoir, when maintained properly, can last 20 to 30 years or more. The lifespan depends on environmental conditions, usage, lining and maintenance.",
  },
  {
    question: "What is included in your preventative maintenance services?",
    answer:
      "Our preventative maintenance services include a free inspection, standard preventative bitumen waterproofing and necessary repairs. We check for wear, leaks and potential future issues before they become significant problems.",
  },
  {
    question: "What causes paint to flake off or make bubbles?",
    answer:
      "Common causes include trapped moisture beneath the paint, poor surface preparation, low-quality or incompatible paints, application issues, and underlying structural problems such as cracks or deteriorating materials.",
  },
  {
    question: "Do you offer any warranties on your services?",
    answer:
      "Yes, all of our services include a free 10-year warranty on the materials used.",
  },
] as const;

export const CONTACT_SERVICES = [
  {
    title: "Dam Liners",
    description: "HDPE, PVC and Bitumen Torch-On lining for farm dams and reservoirs.",
    href: "/dam-liners",
  },
  {
    title: "Steel Water Tanks",
    description: "Corrugated galvanised steel reservoirs from 11 kL to 500 kL+.",
    href: "/steel-water-storage-tanks",
  },
  {
    title: "Bitumen Waterproofing",
    description: "Roof, foundation and retaining wall waterproofing solutions.",
    href: "/bitumen-waterproofing",
  },
  {
    title: "Leak Repair & Maintenance",
    description: "Inspections, repairs and preventative maintenance for roofs and dams.",
    href: "/bitumen-waterproofing-services-and-more",
  },
] as const;

/** Build Next.js metadata from a static page SEO entry. */
export function createPageMetadata(
  seo: PageSeoEntry,
  overrides?: Partial<CreateMetadataInput>,
) {
  return createMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    image: seo.image,
    noIndex: seo.noIndex,
    ...overrides,
  });
}