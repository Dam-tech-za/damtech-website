import type { FAQItem } from "@/components/FAQ";

export type FaqCategory = {
  id: string;
  eyebrow: string;
  title: string;
  items: readonly FAQItem[];
};

/** Canonical FAQ content for /faq/ — single source for visible Q&A and FAQPage schema. */
export const FAQ_CATEGORIES: readonly FaqCategory[] = [
  {
    id: "dam-liners-linings",
    eyebrow: "DAM LINERS & LININGS",
    title: "Dam Liners and Dam Linings",
    items: [
      {
        question: "What are dam liners?",
        answer:
          "Dam liners are flexible geomembrane or membrane sheets installed inside earth dams, ponds and reservoirs to reduce seepage. In South Africa, dam liners and dam linings usually refer to the same waterproofing work — HDPE, PVC or bitumen torch-on systems supplied and installed by a contractor such as Damtech.",
      },
      {
        question: "What are dam linings?",
        answer:
          "Dam linings are the completed waterproof lining work inside a dam or reservoir — including site preparation, membrane supply, welding or bonding, anchoring and handover. Damtech installs HDPE, PVC and bitumen dam linings for farms, mines, game lodges and commercial water storage across South Africa.",
      },
      {
        question: "What is the difference between dam liners and dam linings?",
        answer:
          "On South African farms and mine sites, the terms are often used interchangeably for the same geomembrane product and installation. Dam liners usually describes the sheet material; dam linings describes the installed waterproof system. Damtech specifies and installs both using the same preparation, welding and anchoring standards.",
      },
      {
        question: "What causes a dam to lose water?",
        answer:
          "Farm and earth dams lose water through seepage into permeable soils, leaks at outlets or embankments, evaporation, and sometimes cracked or unsealed subgrades. Unlined dams on sandy or fractured soils can lose a large share of stored volume. A properly specified dam lining addresses seepage; inspection helps separate seepage from evaporation or fitting leaks.",
      },
    ],
  },
  {
    id: "hdpe-pvc",
    eyebrow: "HDPE & PVC",
    title: "HDPE and PVC Dam Liners",
    items: [
      {
        question: "What is the difference between HDPE and PVC dam liners?",
        answer:
          "HDPE is a stiff, UV-resistant geomembrane suited to larger earth dams, mining ponds and long-term farm storage. PVC is more flexible and often used for smaller ponds, steel tanks and detail work. Choice depends on dam size, depth, soil, sun exposure and how water will be used — Damtech assesses each site before recommending a liner.",
      },
      {
        question: "How long do HDPE dam liners last?",
        answer:
          "Correctly installed UV-stable HDPE dam liners typically perform 20–30 years on agricultural dams, depending on thickness, exposure, water chemistry, anchoring quality and whether livestock or machinery contact the liner. Maintenance inspections help catch edge wear or outlet issues early.",
      },
      {
        question: "Hoe lank hou ’n HDPE damvoering?",
        answer:
          "’n Goed geïnstalleerde UV-stabiele HDPE damvoering hou gewoonlik 20–30 jaar op tipiese plaasdamme, afhangende van dikte, blootstelling, waterchemie en hoe die dam gebruik word. Onderhoud en gereelde inspeksies help om probleme vroeg op te spoor.",
      },
      {
        question: "Wat is die verskil tussen HDPE en PVC damvoering?",
        answer:
          "HDPE is stywer en meer UV-bestand — ideaal vir groter aardamme en mynpoele. PVC is buigbaarder en word dikwels op kleiner damme en staaldamme gebruik. Damtech beveel die regte materiaal aan nadat ons die dam, grond en gebruik beoordeel het.",
      },
    ],
  },
  {
    id: "waterproofing",
    eyebrow: "WATERPROOFING",
    title: "Waterproofing and Bitumen Torch-On",
    items: [
      {
        question: "Do you offer bitumen torch-on waterproofing?",
        answer:
          "Yes. Damtech supplies and installs bitumen torch-on waterproofing for roofs, foundations, retaining walls, parapets and rigid dams or reservoirs. We also handle leak prevention, inspections and maintenance on farms, mines and commercial properties.",
      },
      {
        question:
          "Can you assist with waterproofing for a roof or foundation that is already constructed?",
        answer:
          "Yes. Our waterproofing team assesses existing roofs and foundations and applies bitumen torch-on, self-adhesive membrane or liquid detailing with minimal disruption where practical.",
      },
      {
        question: "What causes paint to flake off or make bubbles?",
        answer:
          "Common causes include trapped moisture beneath the coating, poor surface preparation, incompatible paints, application issues and underlying cracks or deteriorating substrates. The waterproofing membrane layer — not paint alone — must be addressed for lasting leak prevention.",
      },
    ],
  },
  {
    id: "steel-tanks",
    eyebrow: "STEEL TANKS",
    title: "Steel Water Tanks",
    items: [
      {
        question: "Do you supply steel water tanks?",
        answer:
          "Yes. Damtech supplies and installs corrugated galvanised steel water tanks and reservoirs from 11 kL to 500 kL+, with PVC lining, columns, inlet/outlet fittings and optional roofs for farms, mines, estates and commercial yards.",
      },
      {
        question: "How long does it take to install a zinc reservoir?",
        answer:
          "Installation time depends on tank size, site access and base preparation. A standard corrugated steel reservoir often takes several days once civils are ready, including assembly, lining and commissioning. Remote sites may need extra lead time for transport.",
      },
      {
        question: "What is the lifespan of a zinc reservoir?",
        answer:
          "A well-built galvanised steel reservoir with proper PVC lining and maintenance can last 20–30 years or more. Lifespan depends on water chemistry, roof protection, base stability and scheduled inspections.",
      },
    ],
  },
  {
    id: "repairs",
    eyebrow: "LEAK REPAIR",
    title: "Leaking Dam Repairs",
    items: [
      {
        question: "Can Damtech repair a leaking farm dam?",
        answer:
          "Yes. Damtech inspects liners, outlets and embankments and recommends patch repairs, section relining or full relining depending on liner condition, UV degradation and the cost of repeated call-outs versus replacement.",
      },
      {
        question: "When should a leaking dam be repaired?",
        answer:
          "Inspect when you see wet patches below the wall, unexplained water-level drops after rain, or seepage that wastes pumping costs. Early puncture or seam repairs are usually cheaper than emergency relines during irrigation season.",
      },
      {
        question: "What is included in your preventative maintenance services?",
        answer:
          "Preventative maintenance can include inspection of roofs, dams and reservoirs, standard bitumen touch-ups where applicable, and reporting on wear, leaks and fittings before they become major failures. Scope is confirmed per site.",
      },
    ],
  },
  {
    id: "warranty",
    eyebrow: "WARRANTY",
    title: "Warranty and Supplier-Backed Materials",
    items: [
      {
        question: "What warranty applies to supplied materials?",
        answer:
          "Selected HDPE, PVC, bitumen and waterproofing materials supplied by Damtech may carry a supplier-backed material warranty where applicable. Warranty terms depend on the qualifying material, supplier conditions, correct use, site conditions and approved installation requirements. We confirm applicable material warranty details in each quote.",
      },
      {
        question: "Does the supplier-backed material warranty cover installation?",
        answer:
          "Supplier-backed material warranties apply only to qualifying supplied materials where applicable and are subject to the relevant supplier’s terms, site conditions, correct use and approved installation requirements. Installation or workmanship cover is not automatically included unless separately agreed in writing.",
      },
      {
        question: "Is the material warranty supplier-backed?",
        answer:
          "On qualifying installations, HDPE, PVC and bitumen materials may carry supplier-backed warranties where applicable. Coverage and exclusions are set by the material supplier; Damtech confirms the applicable material warranty details in each quote.",
      },
    ],
  },
  {
    id: "quotes",
    eyebrow: "QUOTES",
    title: "Quotes and Site Inspections",
    items: [
      {
        question: "Do you inspect sites before quoting?",
        answer:
          "Yes. Dam linings and waterproofing usually need photos or a site visit for an accurate quote. For standard steel tanks we can often estimate from diameter and height. Submit our quote form with location and approximate dimensions and we will arrange an inspection where needed.",
      },
      {
        question: "Do you offer quotes without a site visit?",
        answer:
          "For standard steel tanks we can estimate from diameter and height. Dam linings and waterproofing usually need photos or a visit to quote accurately. Start via our quote form with location, approximate dimensions and how water will be used.",
      },
      {
        question: "Can you work with my earthworks contractor on a new dam?",
        answer:
          "Yes. We specify subgrade finish, batters and anchor trenches so civils and lining align. Early coordination avoids rework when the dam is already full or the irrigation window is closing.",
      },
    ],
  },
  {
    id: "service-areas",
    eyebrow: "SERVICE AREAS",
    title: "Service Areas in South Africa",
    items: [
      {
        question: "Which areas in South Africa do you service?",
        answer:
          "Damtech works nationwide across South Africa, including Gauteng, Western Cape, Limpopo, Mpumalanga, North West, Free State, Northern Cape and KwaZulu-Natal. We serve farms, mines, game lodges and commercial properties — contact us with your location for a site-specific quote.",
      },
      {
        question: "Do you offer waterproofing for farms and mines?",
        answer:
          "Yes. We provide bitumen torch-on waterproofing for roofs, foundations, retaining walls and rigid dams on farms, mines and commercial properties, plus leak prevention, inspections and maintenance for water-retaining structures.",
      },
      {
        question: "Wat is damvoering?",
        answer:
          "Damvoering is die proses om ’n dam of reservoir met HDPE, PVC of bitumen te voer sodat water nie deur die grond wegsypel nie. Damtech installeer damvoering op plaasdamme, mynpoele en kommersiële waterberging regoor Suid-Afrika.",
      },
    ],
  },
] as const;

export const ALL_SITE_FAQS: readonly FAQItem[] = FAQ_CATEGORIES.flatMap(
  (category) => category.items,
);
