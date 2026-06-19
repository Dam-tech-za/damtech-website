import type { CreateMetadataInput } from "./seo";
import { createMetadata } from "./seo";
import { IMAGE_PATHS } from "./images";

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
  | "author"
  | "quote";

export type PageSeoEntry = {
  title: string;
  description: string;
  path: string;
  h1: string;
  image?: string;
  serviceName?: string;
  noIndex?: boolean;
};

export const PAGE_SEO: Record<StaticPageKey, PageSeoEntry> = {
  home: {
    title: "Dam Liners & Steel Water Tanks | Damtech South Africa",
    description:
      "Damtech supplies and installs HDPE and PVC dam liners, corrugated steel reservoirs and bitumen waterproofing for farms, mines and properties across South Africa. Request a free quote.",
    path: "/",
    h1: "Dam Lining & Water Storage Solutions in South Africa",
    image: IMAGE_PATHS.damtechWaterStorageHero,
  },
  about: {
    title: "About Damtech | Dam Lining & Waterproofing Experts",
    description:
      "Learn about Damtech, a South African contractor providing dam liners, steel water tanks and waterproofing solutions for farms, mines and commercial properties.",
    path: "/about-us-waterproofing-company",
    h1: "About Damtech",
    image: IMAGE_PATHS.damtechContractors,
  },
  services: {
    title: "Dam Lining & Water Storage Services | Damtech South Africa",
    description:
      "Damtech provides HDPE and PVC dam liners, corrugated steel water tanks, reservoir lining, leaking dam repair and bitumen waterproofing across South Africa. Request a free quote.",
    path: "/services",
    h1: "Dam Lining, Water Storage & Waterproofing Services",
    serviceName: "Dam Lining and Water Storage Services",
    image: IMAGE_PATHS.hdpeDamLinerEarthDam,
  },
  "dam-liners": {
    title: "HDPE & PVC Dam Liners | Damtech South Africa",
    description:
      "Protect your earth dam or reservoir with HDPE, PVC and torch-on dam liners. Damtech installs durable geomembrane lining for farms, mines and ponds across South Africa.",
    path: "/dam-liners",
    h1: "HDPE, PVC & Torch-On Dam Liners",
    serviceName: "HDPE Dam Liner Installation",
    image: IMAGE_PATHS.hdpeDamLinerInstallationLimpopo,
  },
  "steel-tanks": {
    title: "Corrugated Steel Water Tanks | Damtech South Africa",
    description:
      "Corrugated galvanised steel water tanks with PVC lining from 11 kL to 500 kL+. Damtech supplies and installs farm, mine and rural water storage tanks nationwide.",
    path: "/steel-water-storage-tanks",
    h1: "Corrugated Steel Water Tanks",
    serviceName: "Corrugated Steel Water Tank Installation",
    image: IMAGE_PATHS.corrugatedSteelWaterTank,
  },
  bitumen: {
    title: "Bitumen Waterproofing Contractors | Damtech South Africa",
    description:
      "Torch-on, self-adhesive and liquid bitumen waterproofing for roofs, foundations, reservoirs and retaining walls across South Africa. Request a free inspection.",
    path: "/bitumen-waterproofing",
    h1: "Bitumen Waterproofing for Roofs, Foundations & Reservoirs",
    serviceName: "Bitumen Waterproofing",
    image: IMAGE_PATHS.bitumenWaterproofingRoof,
  },
  faq: {
    title: "Dam Liner & Waterproofing FAQ | Damtech",
    description:
      "Answers to common questions about dam liners, zinc reservoirs, waterproofing warranties, maintenance and leak repair from the Damtech team.",
    path: "/waterproofing-and-dam-liners",
    h1: "Dam Liner & Waterproofing FAQ",
    image: IMAGE_PATHS.hdpeDamLinerEarthDam,
  },
  contact: {
    title: "Contact Damtech | Dam Liner & Water Storage Quotes",
    description:
      "Contact Damtech for HDPE dam liners, steel water tanks, reservoir lining, leak repairs and waterproofing services across South Africa.",
    path: "/contact",
    h1: "Contact Damtech",
    image: IMAGE_PATHS.hdpeDamLinerEarthDam,
  },
  blog: {
    title: "Dam Liner & Water Storage Guides | Damtech Blog",
    description:
      "Practical guides on dam liners, leaking dam repairs, borehole integration, steel reservoirs and water storage for South African farms and properties.",
    path: "/blog",
    h1: "Dam Liner & Water Storage Guides",
    image: IMAGE_PATHS.damtechWaterStorageHero,
  },
  quote: {
    title: "Request a Quote | Damtech Dam Liners & Water Storage",
    description:
      "Request a free quote for HDPE dam lining, PVC liners, corrugated steel water tanks, leaking dam repair or bitumen waterproofing from Damtech.",
    path: "/quote",
    h1: "Request a Free Quote",
    image: IMAGE_PATHS.hdpeDamLinerEarthDam,
  },
  category: {
    title: "Dam Liner Guides | Damtech Blog",
    description:
      "Articles on farm dam liners, leak repair, steel reservoirs and water storage for South African agriculture.",
    path: "/category/uncategorized",
    h1: "Dam Liner Guides",
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
    href: "/dam-repair-services",
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