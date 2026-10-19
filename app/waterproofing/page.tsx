import Link from "next/link";
import { DampCausesSection } from "@/components/DampCausesSection";
import { Hero } from "@/components/Hero";
import { ResidentialEnquiryCard } from "@/components/ResidentialWaterproofingPage";
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
import type {
  ServiceFaqItem,
  ServiceSection,
} from "@/lib/service-pages-content";
import { createFaqPageSchema, createServiceSchema } from "@/lib/seo";
import { whatsAppUrl } from "@/lib/site";
import { WARRANTY_PUBLIC } from "@/lib/warranty";

const seo = PAGE_SEO.waterproofing;

export const metadata = createPageMetadata(seo);

const AREA =
  "Overstrand and Overberg, Western Cape (Betty's Bay, Kleinmond, Hermanus, Gansbaai, Grabouw); Pretoria and Gauteng";

const QUOTE_HREF = "/quote/?service=Roof+%2F+home+waterproofing";

const WARRANTY_SUMMARY = `${WARRANTY_PUBLIC.bullets[0]}, plus ${WARRANTY_PUBLIC.bullets[1].charAt(0).toLowerCase()}${WARRANTY_PUBLIC.bullets[1].slice(1)}.`;

const SECTIONS = [
  {
    id: "roof-waterproofing",
    heading: "Roof waterproofing",
    paragraphs: [
      "A leaking roof usually shows up after a winter north-wester or a Highveld storm: a stain on the ceiling, a drip into a cupboard, or water tracking along a beam. Damtech waterproofs house roofs in the Overstrand, Grabouw and Pretoria, including tiled roofs, concrete slabs and metal sheets.",
      "We look at the roof covering, flashings, outlets and any old coating before we recommend a repair or a new membrane. You get a written quote; site assessments are free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond, and elsewhere we confirm the call-out fee first. We do not publish a rate per square metre, because every roof is different.",
    ],
  },
  {
    id: "flat-roofs",
    heading: "Flat roofs and parapets",
    paragraphs: [
      "Flat concrete roofs and box gutters hold water when outlets block or the falls are too flat. Parapet walls crack at the corners, and water then runs down inside the plaster.",
      "We prepare the slab, open failed laps, and waterproof the parapet upstands, flashings and outlets so rain is carried off the roof instead of into the wall. Depending on the roof, that may be a torch-on bitumen membrane or a liquid-applied system; the written quote names the system and why it suits your roof.",
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
      "We inspect the screed, outlets and upstands. Where the tiles have to come up, we say so before any work starts. The same assessment and written quote covers balconies, planters and shower floors.",
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
  {
    id: "areas",
    heading: "Where we work",
    paragraphs: [
      "In the Western Cape we waterproof homes along the Overstrand coast, from Rooi-Els, Pringle Bay and Betty's Bay to Kleinmond, Hermanus and Gansbaai, and inland to Grabouw and the Elgin valley. Coastal houses fail differently: winter rain is driven sideways into parapets, window heads and wall junctions, and salt air corrodes flashings and gutters. Site assessments are free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond.",
      "In Gauteng we waterproof homes in Pretoria, Centurion and surrounds, where summer thunderstorms test flat roofs, parapets and box gutters. Each area has its own page below with the local details.",
    ],
  },
] satisfies ServiceSection[];

const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    id: "call",
    step: 1,
    title: "Tell us about the leak",
    description:
      "Phone, WhatsApp or the quote form. Tell us where the house is and send photos of the stain, roof or damp wall.",
    Icon: FileTextIcon,
  },
  {
    id: "assessment",
    step: 2,
    title: "Site assessment",
    description:
      "We inspect the roof, parapets, damp walls, balcony or shower and find where the water is getting in. Free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond; elsewhere we confirm the call-out fee before we visit.",
    Icon: SearchIcon,
  },
  {
    id: "quote",
    step: 3,
    title: "Written quote",
    description:
      "You receive a written quote that sets out the work, the system we recommend, and the warranty terms.",
    Icon: LayersIcon,
  },
  {
    id: "work",
    step: 4,
    title: "Waterproofing and handover",
    description:
      "We prepare the surface, install the agreed system and leave the area weather-tight. Warranty terms are confirmed in your written quote.",
    Icon: CheckCircleIcon,
  },
];

const FAQS: ServiceFaqItem[] = [
  {
    question: "Which areas do you cover?",
    answer:
      "The Overstrand and Overberg in the Western Cape (Rooi-Els, Pringle Bay, Betty's Bay, Kleinmond, Hermanus, Gansbaai and Grabouw) and Pretoria and Gauteng. Site assessments are free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond; elsewhere we quote from photos or confirm the call-out fee first.",
  },
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
      "A roof leak usually appears after rain and can show high on a wall or ceiling. Rising damp sits low on the wall and stays damp in dry weather. We check both during the assessment so the wrong repair is not quoted.",
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
    answer: `${WARRANTY_SUMMARY} Coverage, exclusions and maintenance requirements are confirmed in your written quote.`,
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
        tone="blue"
        aside={<ResidentialEnquiryCard areaServed={AREA} quoteHref={QUOTE_HREF} />}
        eyebrow="Homes · Overstrand · Overberg · Pretoria"
        title={seo.h1}
        description="We waterproof leaking roofs, flat roofs, parapets, damp walls, balconies and showers for homeowners in the Overstrand, Overberg and Pretoria. Send photos for a quote; site assessments are free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond."
        breadcrumbs={breadcrumbs}
      >
        <Link href={QUOTE_HREF} className="hero-btn-primary w-full sm:w-auto">
          Request a quote
        </Link>
        <a
          href={whatsAppUrl}
          className="hero-btn-secondary w-full sm:w-auto"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp photos of the leak
        </a>
      </Hero>
      <ServiceProseSections sections={SECTIONS} />
      <DampCausesSection quoteHref={QUOTE_HREF} />
      <ProcessStepsSection
        steps={PROCESS_STEPS}
        title="How our process works"
        intro="From the first photo to the written quote, you know what we found and what we recommend before any work starts."
      />
      <SiteSection>
        <SectionCta
          title="Request a quote or site assessment"
          description={`Tell us about the leaking roof or damp wall and send photos. Site assessments are free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond; elsewhere we quote from your photos or confirm the call-out fee before a visit. ${WARRANTY_SUMMARY}`}
          primaryHref={QUOTE_HREF}
          primaryLabel="Request a written quote"
          secondaryHref="/contact/"
          secondaryLabel="Call or email Damtech"
        />
      </SiteSection>
      <ServiceFaqSection
        faqs={FAQS}
        heading="FAQs"
        intro="Straight answers for homeowners. Dam lining and steel tanks are quoted separately."
      />
      <SiteSection>
        <RelatedPageLinks
          heading="Home waterproofing services and areas"
          links={[
            { href: "/roof-waterproofing/", label: "Roof waterproofing" },
            {
              href: "/foundation-waterproofing/",
              label: "Foundation & damp-proofing",
            },
            {
              href: "/waterproofing-overstrand/",
              label: "Waterproofing in Betty's Bay",
            },
            { href: "/waterproofing-pringle-bay/", label: "Waterproofing in Pringle Bay & Rooi-Els" },
            { href: "/waterproofing-kleinmond/", label: "Waterproofing in Kleinmond" },
            { href: "/waterproofing-hermanus/", label: "Waterproofing in Hermanus" },
            { href: "/waterproofing-gansbaai/", label: "Waterproofing in Gansbaai" },
            { href: "/waterproofing-grabouw/", label: "Waterproofing in Grabouw" },
            { href: "/waterproofing-pretoria/", label: "Waterproofing in Pretoria" },
            {
              href: "/torch-on-waterproofing/",
              label: "Torch-on waterproofing guide",
            },
            {
              href: "/waterproofing-membranes-and-coatings/",
              label: "Membranes vs coatings guide",
            },
          ]}
        />
      </SiteSection>
    </>
  );
}
