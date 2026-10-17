import { Hero } from "@/components/Hero";
import { PageSeo } from "@/components/PageSeo";
import { ProcessStepsSection } from "@/components/ProcessStepsSection";
import { SectionCta } from "@/components/SectionCta";
import { SiteSection } from "@/components/SiteSection";
import {
  RelatedPageLinks,
  ServiceFaqSection,
  ServiceProseSections,
} from "@/components/ServicePageSections";
import { createPageMetadata, PAGE_SEO } from "@/lib/pages";
import {
  CheckCircleIcon,
  FileTextIcon,
  LayersIcon,
  SearchIcon,
} from "@/components/icons/StrokeIcons";
import type { ProcessStep } from "@/lib/process-steps";
import type { ServiceFaqItem, ServiceSection } from "@/lib/service-pages-content";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";

const seo = PAGE_SEO.waterproofing;

export const metadata = createPageMetadata(seo);

const AREA = "Pretoria and Gauteng";

const SECTIONS = [
  {
    id: "roof-waterproofing",
    heading: "Roof waterproofing",
    paragraphs: [
      "A leaking roof usually shows up after a Highveld storm: a stain on the ceiling, a drip into a cupboard, or water tracking along a beam. Damtech waterproofs house roofs in Pretoria and the rest of Gauteng, including tiled roofs, concrete slabs and metal sheets.",
      "We look at the roof covering, flashings, outlets and any old coating before we recommend a repair or a new membrane. You get a free assessment and written quote. We do not publish a rate per square metre, because every roof is different.",
    ],
  },
  {
    id: "flat-roofs",
    heading: "Flat roofs and parapets",
    paragraphs: [
      "Flat concrete roofs and box gutters hold water when outlets block or the falls are too flat. Parapet walls crack at the corners, and water then runs down inside the plaster.",
      "We prepare the slab, open failed laps, and waterproof the parapet upstands, flashings and outlets so rain is carried off the roof instead of into the wall.",
    ],
  },
  {
    id: "damp",
    heading: "Damp proofing and rising damp",
    paragraphs: [
      "Damp walls are not always a roof leak. Rising damp leaves a tide mark low on interior walls, blistered paint and a musty smell, often where the damp-proof course has failed or garden soil sits against the plaster.",
      "We trace whether the moisture is rising from the ground, coming through a retaining wall, or entering from a leaking pipe or roof. The written quote says what we will treat and what still needs a builder or plumber.",
    ],
  },
  {
    id: "balconies",
    heading: "Balconies and showers",
    paragraphs: [
      "Balconies and shower floors leak into the room below when the membrane under the tiles has failed, or when the waste and door threshold were never sealed.",
      "We inspect the screed, outlets and upstands. Where the tiles have to come up, we say so before any work starts. The same free assessment and written quote covers balconies, planters and shower floors.",
    ],
  },
  {
    id: "leak-detection",
    heading: "Leak detection",
    paragraphs: [
      "Not every wet ceiling has a hole you can see. Water can travel along a slab, a conduit or a parapet and appear metres away from the entry point.",
      "We check the roof, walls, balconies and plumbing penetrations, and we tell you if the leak is a waterproofing failure or something a plumber should fix first. Leak detection is part of the assessment, not a separate priced product on this page.",
    ],
  },
] satisfies ServiceSection[];

const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    id: "call",
    step: 1,
    title: "Tell us about the leak",
    description:
      "Phone, WhatsApp or the quote form. Say where the house is in Pretoria or Gauteng, and send photos of the stain, roof or damp wall.",
    Icon: FileTextIcon,
  },
  {
    id: "assessment",
    step: 2,
    title: "Free assessment",
    description:
      "We inspect the roof, parapets, damp walls, balcony or shower and find where the water is getting in.",
    Icon: SearchIcon,
  },
  {
    id: "quote",
    step: 3,
    title: "Written quote",
    description:
      "You receive a free assessment and written quote that sets out the work, the system we recommend, and the warranty terms.",
    Icon: LayersIcon,
  },
  {
    id: "work",
    step: 4,
    title: "Waterproofing and handover",
    description:
      "We prepare the surface, install the system, and leave the area weather-tight. Warranty: 10-year manufacturer's material warranty where stated, plus 12 months workmanship.",
    Icon: CheckCircleIcon,
  },
];

const FAQS: ServiceFaqItem[] = [
  {
    question: "Do you waterproof homes in Pretoria and Gauteng?",
    answer:
      "Yes. We waterproof houses, townhouses and small residential buildings in Pretoria, Centurion, Johannesburg and the rest of Gauteng. Farm dams and cement reservoirs are a separate service.",
  },
  {
    question: "Can you stop a leaking roof without rebuilding it?",
    answer:
      "Often yes, once we know the covering is sound. Failed coatings, open laps and cracked parapets can be repaired. A badly saturated or structurally unsafe slab may need a builder before we waterproof it. That is confirmed in the written quote.",
  },
  {
    question: "What is the difference between a roof leak and rising damp?",
    answer:
      "A roof leak usually appears after rain and can show high on a wall or ceiling. Rising damp sits low on the wall and stays damp in dry weather. We check both during the free assessment so the wrong repair is not quoted.",
  },
  {
    question: "Do you waterproof balconies and showers?",
    answer:
      "Yes. We assess balcony slabs, door thresholds, shower floors and wastes. If tiles must be lifted, the written quote says so before work starts.",
  },
  {
    question: "How do you find the source of a leak?",
    answer:
      "We inspect the likely entry points: roof covering, outlets, parapets, balconies, showers and pipe penetrations. If the water is from a burst pipe rather than a failed membrane, we say so.",
  },
  {
    question: "What warranty do you give?",
    answer:
      "10-year manufacturer's material warranty where stated, plus 12 months workmanship.",
  },
];

const SERVICE_TYPES = [
  "Roof waterproofing",
  "Damp proofing",
  "Leak detection",
] as const;

export default function WaterproofingPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Waterproofing", path: seo.path },
  ];

  return (
    <>
      <PageSeo
        breadcrumbs={breadcrumbs}
        schemas={[
          ...SERVICE_TYPES.map((serviceType) =>
            createServiceSchema({
              name: serviceType,
              serviceType,
              description: seo.description,
              path: seo.path,
              areaServed: AREA,
            }),
          ),
          createFaqPageSchema(FAQS),
        ]}
      />
      <Hero
        compact
        showActions={false}
        eyebrow="Pretoria · Gauteng · Homes"
        title={seo.h1}
        description="We waterproof leaking roofs, flat roofs, parapets, damp walls, balconies and showers for homeowners in Pretoria and Gauteng. Ask for a free assessment and written quote."
        breadcrumbs={breadcrumbs}
      />
      <ServiceProseSections sections={SECTIONS} />
      <ProcessStepsSection
        steps={PROCESS_STEPS}
        title="How our process works"
        intro="From the first photo to the written quote, you know what we found and what we recommend before any work starts."
      />
      <SiteSection>
        <SectionCta
          title="Book a free assessment"
          description="Tell us about the leaking roof or damp wall. We will arrange a free assessment and written quote for your home in Pretoria or Gauteng. Warranty: 10-year manufacturer's material warranty where stated, plus 12 months workmanship."
          primaryHref="/quote/"
          primaryLabel="Request a written quote"
          secondaryHref="/torch-on-dam-lining/"
          secondaryLabel="Cement dam lining"
        />
      </SiteSection>
      <ServiceFaqSection
        faqs={FAQS}
        heading="FAQs"
        intro="Straight answers for homeowners. Dam lining and steel tanks are quoted separately."
      />
      <RelatedPageLinks
        heading="Related services"
        links={[
          { href: "/torch-on-dam-lining/", label: "Torch-on dam lining" },
          { href: "/dam-liners/", label: "Dam liners" },
          { href: "/quote/", label: "Request a written quote" },
          { href: "/contact/", label: "Contact Damtech" },
        ]}
      />
    </>
  );
}
