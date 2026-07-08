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
      "HDPE & PVC dam liners, corrugated steel reservoirs and bitumen waterproofing for farms, mines and estates across South Africa. Request a free quote.",
    path: "/",
    h1: "Damtech Dam Lining & Water Storage Solutions in South Africa",
    image: IMAGE_PATHS.damtechWaterStorageHero,
  },
  about: {
    title: "About Damtech | Dam Linings & Waterproofing Contractors South Africa",
    description:
      "Learn about Damtech, a South African contractor providing dam linings, waterproofing, reservoir lining and water storage solutions for farms, mines, game lodges and commercial properties.",
    path: "/about-us-waterproofing-company",
    h1: "About Damtech",
    image: IMAGE_PATHS.damtechContractors,
  },
  services: {
    title: "Damtech Services | Dam Linings, Waterproofing & Water Storage",
    description:
      "Explore Damtech's dam linings, waterproofing, reservoir lining, leaking dam repair, steel water tanks and water storage services in South Africa.",
    path: "/services",
    h1: "Dam Lining, Water Storage & Waterproofing Services",
    serviceName: "Dam Lining and Water Storage Services",
    image: IMAGE_PATHS.hdpeDamLiningEarthDam,
  },
  "dam-liners": {
    title: "HDPE, PVC & Torch-On Dam Liners South Africa | Damtech",
    description:
      "HDPE, PVC and torch-on dam liners for earth dams, reservoirs, ponds and water storage applications across South Africa. Supplier-backed materials where applicable.",
    path: "/dam-liners",
    h1: "Dam Linings for Earth Dams, Reservoirs and Water Storage",
    serviceName: "HDPE Dam Lining",
    image: IMAGE_PATHS.hdpeDamLiningFieldInstallation,
  },
  "steel-tanks": {
    title: "Steel Water Tanks South Africa | Corrugated Reservoirs | Damtech",
    description:
      "Durable corrugated steel water tanks and reservoirs for farms, mines, estates, game lodges and commercial water storage applications.",
    path: "/steel-water-storage-tanks",
    h1: "Steel Water Tanks and Corrugated Reservoirs",
    serviceName: "Corrugated Steel Water Tank Installation",
    image: IMAGE_PATHS.corrugatedSteelWaterTank,
  },
  bitumen: {
    title: "Bitumen Waterproofing South Africa | Torch-On Systems | Damtech",
    description:
      "Professional waterproofing, bitumen torch-on systems, leak prevention and maintenance solutions for farms, mines, commercial properties and water-retaining structures.",
    path: "/bitumen-waterproofing",
    h1: "Waterproofing Services for Long-Term Protection",
    serviceName: "Bitumen Waterproofing",
    image: IMAGE_PATHS.bitumenTorchOnWaterproofingDamtech,
  },
  faq: {
    title: "Dam Linings & Waterproofing FAQ | Damtech South Africa",
    description:
      "Answers to common questions about HDPE dam linings, PVC dam linings, waterproofing, steel water tanks, supplier-backed material warranty and leaking dam repairs.",
    path: "/faq",
    h1: "Dam Linings and Waterproofing FAQ",
    image: IMAGE_PATHS.hdpeDamLiningEarthDam,
  },
  contact: {
    title: "Contact Damtech | Dam Linings & Water Storage Quotes",
    description:
      "Contact Damtech for HDPE dam linings, steel water tanks, reservoir lining, leak repairs and waterproofing services across South Africa.",
    path: "/contact",
    h1: "Contact Damtech",
    image: IMAGE_PATHS.hdpeDamLiningEarthDam,
  },
  blog: {
    title: "Dam Liner & Water Storage Guides | Damtech Blog",
    description:
      "Practical guides on dam linings, leaking dam repairs, borehole integration, steel reservoirs and water storage for South African farms and properties.",
    path: "/blog",
    h1: "Dam Lining & Water Storage Guides",
    image: IMAGE_PATHS.damtechWaterStorageHero,
  },
  quote: {
    title: "Request a Free Quote | Dam Linings & Waterproofing South Africa",
    description:
      "Request a free Damtech quote for dam linings, waterproofing, steel water tanks, reservoir lining or leaking dam repair in South Africa.",
    path: "/quote",
    h1: "Request a Free Damtech Quote",
    image: IMAGE_PATHS.hdpeDamLiningEarthDam,
  },
  category: {
    title: "Dam Lining Guides",
    description:
      "Articles on farm dam linings, leak repair, steel reservoirs and water storage for South African agriculture.",
    path: "/category/dam-liner-guides",
    h1: "Dam Lining Guides",
    noIndex: true,
  },
  author: {
    title: "Tiaan, Author at Damtech",
    description:
      "Articles written by Tiaan for Damtech on dam linings and water storage.",
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
      "Selected HDPE, PVC, bitumen and waterproofing materials supplied by Damtech may carry a supplier-backed material warranty where applicable. Warranty terms depend on the qualifying material, supplier conditions, correct use, site conditions and approved installation requirements. Installation or workmanship cover is not automatically included unless separately agreed in writing. We confirm applicable material warranty details in each quote.",
  },
] as const;

/** AI-search and buyer-intent FAQs — rendered on /faq/ and included in FAQPage schema. */
export const SEO_FAQ_ITEMS = [
  {
    question: "What are dam linings?",
    answer:
      "Dam linings are geomembrane or torch-on membranes installed on earth dams, ponds and reservoirs to prevent seepage and stabilise stored water. HDPE and PVC are common flexible linings; bitumen torch-on suits rigid cement structures. Damtech supplies and installs dam linings for farms, mines, game lodges and commercial properties across South Africa.",
  },
  {
    question: "What is the difference between HDPE and PVC dam linings?",
    answer:
      "HDPE is a tough, UV-resistant geomembrane suited to larger earth dams and long-term farm or mine storage. PVC is more flexible and often used for smaller ponds, steel tanks and detail work. Choice depends on dam size, soil, sun exposure and how the water will be used — we assess each site before recommending a lining system.",
  },
  {
    question: "When should a leaking dam be repaired?",
    answer:
      "Inspect when you see wet patches below the wall, unexplained water-level drops after rain, or seepage that wastes pumping costs. Early puncture or seam repairs are cheaper than emergency relines during irrigation season. Damtech can inspect liners, outlets and embankments and recommend repair or relining.",
  },
  {
    question: "Do you offer steel water tanks?",
    answer:
      "Yes. Damtech supplies and installs corrugated galvanised steel water tanks and reservoirs from 11 kL to 500 kL+, with PVC lining, columns, inlet/outlet fittings and optional roofs. They suit farms, mines, estates, game lodges and commercial yards where modular water storage is needed.",
  },
  {
    question: "Do you offer waterproofing for farms and mines?",
    answer:
      "Yes. We provide bitumen torch-on waterproofing for roofs, foundations, retaining walls and rigid dams on farms, mines and commercial properties. Our teams also handle leak prevention, inspections and maintenance for water-retaining structures nationwide.",
  },
  {
    question: "Is the material warranty supplier-backed?",
    answer:
      "Supplier-backed material warranties apply only to qualifying supplied materials where applicable and are subject to the relevant supplier’s terms, site conditions, correct use and approved installation requirements. Up to 10 years may apply on eligible products when installed to manufacturer specification. Installation or workmanship cover is not automatically included unless separately agreed in writing.",
  },
  {
    question: "Which areas in South Africa do you service?",
    answer:
      "Damtech works nationwide across South Africa, including Gauteng, Western Cape, Limpopo, North West, Free State, Northern Cape, Mpumalanga and KwaZulu-Natal. We serve farms, mines, game lodges and commercial properties — contact us with your location for a site-specific quote.",
  },
  {
    question: "Can Damtech inspect a site before quoting?",
    answer:
      "Yes. Dam linings and waterproofing usually need photos or a site visit for an accurate quote. For standard steel tanks we can often estimate from diameter and height. Start via our quote form with location and approximate dimensions, and we will arrange an inspection where needed.",
  },
] as const;

export const CONTACT_SERVICES = [
  {
    title: "Dam Linings",
    description:
      "HDPE, PVC and bitumen torch-on lining for farm dams and reservoirs.",
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
    description:
      "Inspections, repairs and preventative maintenance for roofs and dams.",
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
