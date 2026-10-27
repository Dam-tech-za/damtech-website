import type { Metadata } from "next";
import {
  CheckCircleIcon,
  FileTextIcon,
  LayersIcon,
  SearchIcon,
} from "@/components/icons/StrokeIcons";
import type { ProcessStep } from "@/lib/process-steps";
import { createMetadata } from "@/lib/seo";
import type { ServiceFaqItem, ServiceSection } from "@/lib/service-pages-content";

export type ResidentialComparison = {
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string>[];
  note?: string;
};

export type ResidentialRelatedLink = { href: string; label: string };

export type ResidentialPageConfig = {
  slug: string;
  kind: "service" | "regional" | "guide";
  title: string;
  description: string;
  h1: string;
  /** Shorter label for the breadcrumb trail (defaults to h1). */
  breadcrumbLabel?: string;
  heroEyebrow: string;
  heroDescription: string;
  intro?: string;
  sections: ServiceSection[];
  comparison?: ResidentialComparison;
  processIntro?: string;
  process?: readonly ProcessStep[];
  faqs: ServiceFaqItem[];
  related: readonly ResidentialRelatedLink[];
  /** Service schema entries — one Service node each. */
  serviceTypes: readonly string[];
  areaServed: string;
  /** Office ids for a regional LocalBusiness schema (OFFICES in lib/site.ts). */
  officeIds?: readonly string[];
  /** A SERVICE_OPTIONS value so the quote form pre-selects the right service. */
  quoteService: string;
  ctaTitle?: string;
  ctaDescription?: string;
  /** Explanatory diagram section shown after the prose sections. */
  causesDiagram?: "roof-leaks";
};

/** Pre-selects the residential service on the public quote form. */
export function residentialQuoteHref(service: string): string {
  return `/quote/?service=${encodeURIComponent(service)}`;
}

/** Shared residential enquiry → assessment → quote → work process. */
export const RESIDENTIAL_PROCESS_STEPS: readonly ProcessStep[] = [
  {
    id: "call",
    step: 1,
    title: "Tell us about the problem",
    description:
      "Phone, WhatsApp or the quote form. Tell us where the house is and send photos of the stain, roof, damp wall or leak.",
    Icon: FileTextIcon,
  },
  {
    id: "assessment",
    step: 2,
    title: "Site assessment",
    description:
      "We inspect the roof, parapets, damp walls, balcony, foundation or retaining wall and find where the water is getting in. Free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond; elsewhere we confirm the call-out fee before we visit.",
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

const QUOTE_SERVICE = "Roof / home waterproofing";

// ---------------------------------------------------------------------------
// Service pages
// ---------------------------------------------------------------------------

const ROOF_WATERPROOFING: ResidentialPageConfig = {
  slug: "roof-waterproofing",
  kind: "service",
  title: "Roof Waterproofing & Roof Leak Repair for Homes | Damtech",
  description:
    "Roof leak repair and flat roof waterproofing for homes in Betty's Bay, Kleinmond, Pringle Bay, Hermanus and Grabouw, plus Pretoria. Written quotes.",
  h1: "Roof Waterproofing and Leak Repair for Homes",
  breadcrumbLabel: "Roof waterproofing",
  heroEyebrow: "Flat roofs · Parapets · Leak repair",
  heroDescription:
    "We waterproof and repair leaking house roofs — flat concrete slabs, parapets and flashings, and selected tiled and metal roofs — from Rooi-Els, Betty's Bay and Kleinmond to Hermanus and Grabouw, and in Pretoria. Send photos for a written quote.",
  intro:
    "Most roof leaks show up after the first heavy storm of the season, whether that is a winter north-wester on the coast or a summer thunderstorm on the Highveld: a stain on the ceiling, a drip into a cupboard, or water tracking along a beam. The right repair depends on the roof covering and where the water is really getting in, so we assess before we quote and we do not publish a rate per square metre — every roof is different.",
  sections: [
    {
      id: "flat-concrete-roofs",
      heading: "Flat concrete slab roofs",
      paragraphs: [
        "Flat concrete roofs leak when the waterproofing layer ages, when outlets block and water ponds, or when movement cracks the screed and parapet upstands. Acrylic paint on its own rarely fixes an active leak — blistering and flaking usually mean moisture is already trapped under the coating.",
        "We prepare the slab, open and re-seal failed laps and details, and install a membrane suited to the roof: a torch-on modified-bitumen system where a robust bonded membrane is needed, or a reinforced liquid system where the shape, access or a no-flame requirement makes that the better choice. Outlets, upstands and penetrations are detailed so water is carried off the roof instead of into the structure.",
      ],
    },
    {
      id: "parapets-flashings",
      heading: "Parapets, flashings and outlets",
      paragraphs: [
        "A surprising number of 'roof' leaks actually enter at the edges: cracked parapet copings, failed wall-to-roof flashings, and blocked or undersized outlets. Water then runs down inside the plaster, often appearing on a wall metres from the real entry point.",
        "We waterproof parapet upstands and copings, re-detail flashings where the roof meets a wall, and clear or correct outlets and overflows so the roof drains properly. On many homes this targeted work solves the leak without re-doing the whole roof.",
      ],
    },
    {
      id: "tiled-metal-roofs",
      heading: "Tiled and metal roofs",
      paragraphs: [
        "Pitched tiled and metal-sheet roofs are shed roofs, not waterproofed surfaces — they rely on overlap, flashing and underlay to keep water out. On these roofs the fix is usually repair and re-detailing (ridge and valley flashings, cracked tiles, corroded sheets, failed fastener seals, missing underlay), not a coating poured over the whole roof.",
        "A moving metal roof also expands and contracts, so any membrane or coating used on laps and flashings has to tolerate that movement. We assess substrate compatibility first and tell you honestly whether a selected membrane or coating is appropriate, or whether the right answer is roofing repair rather than waterproofing.",
      ],
    },
    {
      id: "repair-vs-replace",
      heading: "Repair or re-waterproof?",
      paragraphs: [
        "Not every roof needs a full strip-and-replace. We check for failed laps, blocked outlets, cracked parapets and trapped moisture under old paint, then set out repair or overlay options matched to the budget and the remaining life of the roof.",
        "Where the deck is badly saturated or structurally unsound, we say so — that may need a builder before waterproofing. The written quote states what we will do, what we will not, and what still needs another trade.",
      ],
    },
    {
      id: "maintenance",
      heading: "Preventative maintenance",
      paragraphs: [
        "Most roof failures start small: a lifting lap, a blocked outlet, a hairline crack at a parapet. Clearing outlets before the rainy season and re-sealing details early is far cheaper than repairing ceilings, cornices and stock after a leak.",
        "We can inspect an existing roof, flag what needs attention, and quote routine maintenance so minor problems are fixed before they become interior damage.",
      ],
    },
  ],
  faqs: [
    {
      question: "Can you stop a leaking roof without rebuilding it?",
      answer:
        "Often yes, once we confirm the roof covering is sound. Failed coatings, open laps, cracked parapets and blocked outlets can usually be repaired or overlaid. A badly saturated or structurally unsafe slab may need a builder first; that is confirmed in the written quote.",
    },
    {
      question: "Is torch-on or a liquid system better for my flat roof?",
      answer:
        "It depends on the roof. Torch-on modified bitumen gives a robust bonded membrane for many flat concrete roofs; a reinforced liquid system suits complex shapes, tight access or where open flame is not appropriate. We assess the roof and recommend the system in the quote rather than applying one product to everything.",
    },
    {
      question: "Will acrylic roof paint fix my leak?",
      answer:
        "Acrylic coatings can work as a reflective, UV-stable top layer on a sound surface, but on their own they rarely stop an active leak. If paint is blistering or flaking, moisture is usually already trapped underneath. The waterproofing layer has to be addressed first.",
    },
    {
      question: "Do you waterproof tiled and metal roofs?",
      answer:
        "We repair and re-detail tiled and metal roofs — flashings, ridges, valleys, cracked tiles, corroded sheets and fastener seals — and apply selected membranes or coatings only where the substrate suits them. On a moving metal roof, we check compatibility before recommending anything.",
    },
    {
      question: "How long will the work last?",
      answer:
        "That depends on the system, the roof and maintenance. The written quote sets out the warranty: up to 10 years supplier-backed material warranty where stated, plus 12 months workmanship. We do not promise a permanently leak-free roof — no honest contractor can.",
    },
    {
      question: "Which areas do you cover?",
      answer:
        "The Overstrand around our Betty's Bay base (Rooi-Els, Pringle Bay, Betty's Bay, Kleinmond, Hermanus, Gansbaai and nearby towns) and inland to Grabouw, plus Pretoria, Centurion and the rest of Gauteng. Site assessments are free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond.",
    },
  ],
  related: [
    { href: "/foundation-waterproofing/", label: "Foundation & damp-proofing" },
    { href: "/torch-on-waterproofing/", label: "Torch-on waterproofing guide" },
    {
      href: "/waterproofing-membranes-and-coatings/",
      label: "Membranes vs coatings guide",
    },
    { href: "/waterproofing-overstrand/", label: "Waterproofing in Betty's Bay" },
    { href: "/waterproofing-kleinmond/", label: "Waterproofing in Kleinmond" },
    { href: "/waterproofing-hermanus/", label: "Waterproofing in Hermanus" },
    { href: "/waterproofing-pringle-bay/", label: "Waterproofing in Pringle Bay & Rooi-Els" },
    { href: "/waterproofing-gansbaai/", label: "Waterproofing in Gansbaai" },
    { href: "/waterproofing-grabouw/", label: "Waterproofing in Grabouw" },
    { href: "/waterproofing-pretoria/", label: "Waterproofing in Pretoria" },
    { href: "/waterproofing/", label: "All home waterproofing" },
  ],
  serviceTypes: [
    "Roof waterproofing",
    "Flat roof waterproofing",
    "Roof leak repair",
  ],
  areaServed:
    "Betty's Bay, Kleinmond, Pringle Bay, Rooi-Els, Hermanus and Grabouw (Overstrand and Overberg, Western Cape); Pretoria and Gauteng",
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Request a roof waterproofing quote",
  causesDiagram: "roof-leaks",
};

const FOUNDATION_WATERPROOFING: ResidentialPageConfig = {
  slug: "foundation-waterproofing",
  kind: "service",
  title: "Damp Proofing & Foundation Waterproofing | Damtech",
  description:
    "Damp-proofing and foundation waterproofing for homes: rising damp, retaining and foundation walls and below-ground damp in Pretoria and the Overstrand.",
  h1: "Foundation Waterproofing & Damp-Proofing",
  breadcrumbLabel: "Foundation & damp-proofing",
  heroEyebrow: "Rising damp · Retaining walls · Below ground",
  heroDescription:
    "We trace and treat damp and water ingress at the base of the house — rising damp, foundation and retaining walls, and below-ground areas — in Pretoria, Gauteng and the Overstrand. Send photos for a written quote.",
  intro:
    "Damp at the bottom of a wall is not always a roof leak. Rising damp, a failed damp-proof course, soil banked against the plaster, or water pushing through a retaining or foundation wall all look similar from inside. We first work out where the moisture is coming from, because the wrong repair on the wrong cause simply moves the problem.",
  sections: [
    {
      id: "waterproofing-vs-damp",
      heading: "Waterproofing is not the same as damp-proofing",
      paragraphs: [
        "Waterproofing keeps liquid water out of the building envelope — roofs, balconies, retaining walls, below-ground areas. Damp-proofing deals with moisture moving through materials: a damp-proof course (DPC) in a wall or a damp-proof membrane (DPM) under a floor that stops ground moisture rising into the structure.",
        "Getting the two confused wastes money. A coating over rising damp traps moisture and makes it worse; a DPC does nothing for water being pushed through a retaining wall under pressure. We identify which problem you actually have before recommending a treatment.",
      ],
    },
    {
      id: "rising-damp",
      heading: "Rising damp",
      paragraphs: [
        "Rising damp shows as a tide mark low on interior walls, blistered paint, salt deposits and a musty smell, and it stays damp even in dry weather. It usually means the damp-proof course has failed or was bridged — often by garden soil, a paved path or a flower bed built up against the wall.",
        "Treatment depends on the cause: lowering soil levels and improving drainage where the DPC is simply bridged, or installing a remedial damp-proof course where it has failed, followed by replacing salt-contaminated plaster. We explain what we will treat and what still needs a builder or landscaper.",
      ],
    },
    {
      id: "retaining-walls",
      heading: "Retaining and foundation walls",
      paragraphs: [
        "A retaining wall holds back soil, and soil holds water. Without waterproofing and drainage on the retaining side, water builds up and pushes through to the exposed face, staining and eroding the finish and, over time, loading the wall.",
        "Where it can be accessed, we waterproof the retaining (soil) side and make sure sub-soil drainage carries water away, rather than only painting the visible face. On foundation walls we treat penetrating damp where moisture is moving through the masonry near ground level.",
      ],
    },
    {
      id: "below-ground",
      heading: "Below-ground and basement areas",
      paragraphs: [
        "Below-ground walls and basements face hydrostatic pressure — standing groundwater pushing against the structure — which is a different problem from surface damp. The ideal is positive-side waterproofing applied to the outside face during construction; on existing homes that is not always accessible, so a suitable negative-side or cementitious system may be used instead.",
        "Below-ground waterproofing is specialised and site-specific. We assess what is realistically achievable on your home and are clear about the limits before quoting, rather than promising a dry basement we cannot guarantee.",
      ],
    },
    {
      id: "signs",
      heading: "Signs it is time to call",
      paragraphs: [
        "Tide marks low on a wall, bubbling or flaking paint near the floor, white salt crystals (efflorescence), a persistent musty smell, damp patches on a retaining wall after rain, or a basement that smells or feels wet — these point to damp or below-ground water rather than a roof leak.",
        "The earlier damp is traced, the cheaper it is to fix: left alone it rots skirtings, lifts finishes and damages plaster across a whole wall.",
      ],
    },
  ],
  faqs: [
    {
      question: "What is the difference between a roof leak and rising damp?",
      answer:
        "A roof leak usually appears after rain and can show high on a wall or ceiling. Rising damp sits low on the wall, leaves a tide mark and salts, and stays damp in dry weather. We check both during the assessment so the wrong repair is not quoted.",
    },
    {
      question: "Can you cure rising damp with a coating?",
      answer:
        "No — sealing the inside face usually traps moisture and pushes the damp higher. Rising damp is treated at the cause: removing what bridges the damp-proof course, improving drainage, or installing a remedial DPC, then replacing salt-contaminated plaster.",
    },
    {
      question: "Do you waterproof retaining walls?",
      answer:
        "Yes, where the retaining (soil) side can be accessed. Waterproofing the exposed face alone rarely lasts, because water is pushing from behind. Effective treatment waterproofs the retaining side and drains water away from the wall.",
    },
    {
      question: "Can you guarantee a dry basement?",
      answer:
        "Below-ground waterproofing is site-specific and depends on groundwater, access and the existing structure. We assess what is realistically achievable and set out the limits in the quote rather than promising a result we cannot stand behind.",
    },
    {
      question: "Which areas do you cover?",
      answer:
        "Pretoria, Centurion, Johannesburg and the rest of Gauteng, and the Overstrand around Betty's Bay (Betty's Bay, Kleinmond, Hermanus, Gansbaai and nearby towns).",
    },
  ],
  related: [
    { href: "/roof-waterproofing/", label: "Roof waterproofing" },
    {
      href: "/waterproofing-membranes-and-coatings/",
      label: "Membranes vs coatings guide",
    },
    { href: "/waterproofing-pretoria/", label: "Waterproofing in Pretoria" },
    { href: "/waterproofing-overstrand/", label: "Waterproofing in the Overstrand" },
    { href: "/waterproofing/", label: "All home waterproofing" },
  ],
  serviceTypes: [
    "Damp proofing",
    "Foundation waterproofing",
    "Retaining wall waterproofing",
  ],
  areaServed: "Pretoria and Gauteng; Overstrand, Western Cape",
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Request a damp-proofing quote",
};

// ---------------------------------------------------------------------------
// Regional pages
// ---------------------------------------------------------------------------

const WATERPROOFING_PRETORIA: ResidentialPageConfig = {
  slug: "waterproofing-pretoria",
  kind: "regional",
  title: "Waterproofing Contractors Pretoria & Centurion | Damtech",
  description:
    "Home waterproofing in Pretoria, Centurion and the eastern suburbs: leaking roofs, flat roofs, parapets, damp walls and retaining walls. Written quotes.",
  h1: "Waterproofing in Pretoria and Centurion",
  breadcrumbLabel: "Pretoria",
  heroEyebrow: "Pretoria · Centurion · Gauteng homes",
  heroDescription:
    "Damtech waterproofs homes across Pretoria and Centurion — leaking roofs, flat concrete roofs, parapets, damp walls and retaining walls. Send photos for a written quote, from a business with a Gauteng base.",
  intro:
    "Damtech works from a Pretoria base, so we assess and waterproof homes across Pretoria, Centurion and the surrounding Tshwane suburbs — including the eastern areas such as Garsfontein, Faerie Glen, Moreleta Park, Menlyn, Silver Lakes, Irene, Brooklyn, Hatfield and Montana. This is an operating base, not a walk-in office.",
  sections: [
    {
      id: "highveld-weather",
      heading: "Why Highveld homes leak",
      paragraphs: [
        "Pretoria sits on the Highveld, where rain arrives as intense summer thunderstorms between roughly October and March, often with hail, and then stops almost entirely for the dry winter. A roof can look fine for months and then leak heavily in a single storm when a blocked outlet or a hairline crack is overwhelmed by a sudden downpour.",
        "The same climate is hard on waterproofing: strong year-round UV bakes exposed membranes and coatings, and the big day-to-night temperature swing makes roofs expand and contract, working at laps, parapets and flashings. Systems used here have to tolerate that movement and UV, which is why we assess the specific roof before recommending one.",
      ],
    },
    {
      id: "common-pretoria-problems",
      heading: "Common problems on Pretoria homes",
      paragraphs: [
        "On flat concrete roofs we most often find ponding at blocked outlets, cracked parapet copings and aged or over-painted waterproofing that has started to blister. On pitched tiled roofs the usual culprits are cracked tiles, failed ridge and valley flashings and perished underlay.",
        "At ground level, soil and garden beds built up against walls bridge the damp-proof course and cause rising damp, and retaining walls on sloped Pretoria East stands push water through to the house side when they were never waterproofed or drained on the soil side.",
      ],
    },
    {
      id: "pretoria-services",
      heading: "What we do for Pretoria homeowners",
      paragraphs: [
        "Roof waterproofing and leak repair on flat concrete, tiled and metal roofs; parapet, flashing and outlet detailing; damp-proofing and rising-damp treatment; and retaining and foundation wall waterproofing. We recommend a torch-on, liquid or coating system to suit each roof rather than applying one product everywhere.",
        "Every job starts with photos or an on-site assessment (we confirm the call-out fee first) and a written quote. We do not publish a rate per square metre because a Garsfontein flat roof, a Centurion townhouse parapet and a Moreleta Park retaining wall are genuinely different jobs.",
      ],
    },
    {
      id: "pretoria-process",
      heading: "Getting a quote in Pretoria",
      paragraphs: [
        "Send photos of the stain, roof or damp wall by WhatsApp or the quote form and tell us the suburb. We arrange an assessment, find where the water is getting in, and give you a written quote that names the system and the warranty terms before any work starts.",
      ],
    },
  ],
  faqs: [
    {
      question: "Which Pretoria areas do you cover?",
      answer:
        "Pretoria and Centurion and the surrounding Tshwane suburbs, including Pretoria East areas such as Garsfontein, Faerie Glen, Moreleta Park, Menlyn, Silver Lakes, Irene, Brooklyn, Hatfield and Montana, and nearby parts of Gauteng.",
    },
    {
      question: "Do you have an office I can visit in Pretoria?",
      answer:
        "We work from a Pretoria base and come to you for the assessment — it is a service-area operating base, not a walk-in branch. Quotes are arranged by phone, WhatsApp or the online form.",
    },
    {
      question: "My flat roof only leaks in heavy summer storms. Why?",
      answer:
        "Highveld storms drop a lot of water quickly. A blocked outlet, shallow fall or a small crack that copes with light rain gets overwhelmed in a downpour, so the leak appears only in the worst storms. We look for exactly those weak points.",
    },
    {
      question: "Can you treat rising damp and retaining walls too?",
      answer:
        "Yes. As well as roofs we treat rising damp and waterproof retaining and foundation walls — common on sloped Pretoria East stands where retaining walls were not waterproofed or drained on the soil side.",
    },
    {
      question: "What does it cost?",
      answer:
        "It depends on the roof or wall and the system needed, so we quote from photos or after a site assessment. Warranty terms — up to 10 years supplier-backed material warranty where stated, plus 12 months workmanship — are set out in the written quote.",
    },
  ],
  related: [
    { href: "/roof-waterproofing/", label: "Roof waterproofing" },
    { href: "/foundation-waterproofing/", label: "Foundation & damp-proofing" },
    { href: "/torch-on-waterproofing/", label: "Torch-on waterproofing guide" },
    { href: "/waterproofing/", label: "All home waterproofing" },
    { href: "/contact/", label: "Contact Damtech" },
  ],
  serviceTypes: ["Roof waterproofing", "Damp proofing"],
  areaServed: "Pretoria and Gauteng",
  officeIds: ["pretoria"],
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Request a quote in Pretoria",
  ctaDescription:
    "Tell us about the leaking roof or damp wall and send photos. We quote from your photos or confirm the call-out fee before a site visit to your home in Pretoria or Centurion. Up to 10 years supplier-backed material warranty where stated in the quotation, plus 12 months workmanship.",
};

const WATERPROOFING_OVERSTRAND: ResidentialPageConfig = {
  slug: "waterproofing-overstrand",
  kind: "regional",
  title: "Waterproofing Betty's Bay | Roof Leaks & Salt Damp | Damtech",
  description:
    "Leaking flat roofs, salt damp and wind-driven rain repaired for homes in Betty's Bay, from Stony Point to Silversands. Free site assessments.",
  h1: "Waterproofing in Betty's Bay",
  breadcrumbLabel: "Betty's Bay",
  heroEyebrow: "Betty's Bay · Stony Point · Silversands · Free assessments",
  heroDescription:
    "Damtech is based in Betty's Bay. We waterproof leaking flat roofs, walls hit by wind-driven rain, salt damp and salt-exposed flashings and gutters across Betty's Bay. Site assessments here are free, followed by a written quote.",
  intro:
    "Damtech has an operating base in Betty's Bay, on the Kogelberg coast of the Overstrand in the Western Cape — not a Cape Town suburb. We work across Betty's Bay, from Stony Point and the penguin colony to Silversands and the lakes, and site assessments here are free. Neighbouring towns have their own pages: Pringle Bay and Rooi-Els, Kleinmond, Hermanus, Gansbaai and Grabouw. It is a service-area base, not a walk-in office.",
  sections: [
    {
      id: "coastal-climate",
      heading: "Why coastal homes fail differently",
      paragraphs: [
        "The Overstrand is a winter-rainfall area: most rain falls between roughly May and August, frequently driven sideways by strong north-west fronts. Wind-driven rain behaves differently from the vertical Highveld downpour — it is pushed horizontally into parapets, window heads, wall junctions and under flashings, so leaks here often enter through the walls and details rather than straight down through the roof.",
        "Because of this, we inspect the walls, window surrounds and flashings as carefully as the roof itself. A coastal roof that sheds vertical rain perfectly can still let wind-driven rain in at a poorly detailed junction.",
      ],
    },
    {
      id: "salt-air",
      heading: "Salt air, metal and maintenance",
      paragraphs: [
        "Salt-laden coastal air corrodes metal faster than inland air. Flashings, fasteners, gutters, downpipes and metal roof sheets near the sea rust and perish sooner, and corroded flashings and fixings are a common source of coastal leaks long before the roof covering itself fails.",
        "We check metal details for corrosion, re-seal and re-detail where needed, and recommend finishes and maintenance intervals suited to a salt environment. On the coast, regular inspection is not optional — it is how you avoid an expensive failure.",
      ],
    },
    {
      id: "overstrand-services",
      heading: "What we do along the coast",
      paragraphs: [
        "Roof waterproofing and leak repair; parapet, flashing and junction detailing where wind-driven rain enters; damp-proofing of walls holding coastal moisture; and retaining and foundation wall waterproofing on the many sloped coastal stands.",
        "Every job starts with an on-site assessment (free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond; elsewhere we confirm the call-out fee first) and a written quote naming the system and warranty. We recommend the system to suit the house and its exposure rather than applying one product to every roof.",
      ],
    },
    {
      id: "holiday-homes",
      heading: "Holiday homes and absent owners",
      paragraphs: [
        "Many Betty's Bay houses are holiday homes, empty for weeks at a time, so a leak that starts in a June front may not be discovered until the owner returns and finds damaged ceilings and mould. Catching failed flashings and blocked outlets before the winter rains is especially worthwhile here.",
        "If you live in Gauteng or Cape Town, we can check the house between visits, send photos and a written quote, and carry out the work while you are away. Every job comes with before-and-after photos.",
      ],
    },
  ],
  faqs: [
    {
      question: "Which Overstrand towns do you cover?",
      answer:
        "From our Betty's Bay base we cover Betty's Bay, Pringle Bay, Rooi-Els, Kleinmond, Hermanus, Onrus, Vermont, Gansbaai, Stanford and De Kelders, and inland to Grabouw and the Elgin valley. Site assessments are free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond.",
    },
    {
      question: "Is the Overstrand part of Cape Town?",
      answer:
        "No. The Overstrand is a coastal municipality in the Overberg region of the Western Cape, east of Cape Town around Betty's Bay, Kleinmond, Hermanus and Gansbaai. We work from a base in the area itself.",
    },
    {
      question: "Why does rain come in through my walls, not the roof?",
      answer:
        "Coastal rain is often driven sideways by strong winter fronts, so it is pushed into parapets, window heads and wall junctions rather than falling straight onto the roof. We inspect the walls and details as well as the roof to find where wind-driven rain gets in.",
    },
    {
      question: "Does sea air really affect waterproofing?",
      answer:
        "Yes. Salt air corrodes flashings, fasteners, gutters and metal roof sheets faster than inland, and corroded metal details are a frequent source of coastal leaks. We check and re-detail metalwork and advise on finishes and maintenance for a salt environment.",
    },
    {
      question: "Can you work on my holiday home while I'm away?",
      answer:
        "Yes. We can assess the house between visits, send a written quote, and complete the work in your absence with photos of what was done — useful for the many Overstrand homes that stand empty through the rainy season.",
    },
  ],
  related: [
    { href: "/roof-waterproofing/", label: "Roof waterproofing" },
    { href: "/foundation-waterproofing/", label: "Foundation & damp-proofing" },
    {
      href: "/waterproofing-membranes-and-coatings/",
      label: "Membranes vs coatings guide",
    },
    { href: "/waterproofing-pringle-bay/", label: "Waterproofing in Pringle Bay & Rooi-Els" },
    { href: "/waterproofing-kleinmond/", label: "Waterproofing in Kleinmond" },
    { href: "/waterproofing-hermanus/", label: "Waterproofing in Hermanus" },
    { href: "/waterproofing-gansbaai/", label: "Waterproofing in Gansbaai" },
    { href: "/waterproofing-grabouw/", label: "Waterproofing in Grabouw" },
    { href: "/waterproofing/", label: "All home waterproofing" },
  ],
  serviceTypes: ["Roof waterproofing", "Damp proofing"],
  areaServed: "Betty's Bay, Overstrand, Western Cape",
  officeIds: ["western-cape"],
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Book a free assessment in Betty's Bay",
  ctaDescription:
    "Tell us about the leaking roof or damp wall. Site assessments in Betty's Bay are free, followed by a written quote. Up to 10 years supplier-backed material warranty where stated in the quotation, plus 12 months workmanship.",
};

// ---------------------------------------------------------------------------
// Overstrand town pages (Oct 2026). Each page is written for its own town.
// REAL JOB + BEFORE/AFTER PHOTOS: none exist yet for these towns. Do not add
// a case study, project or photo until a real one is supplied; then add it as
// a section on the matching page (see docs/branding/damtech-photography-requirements.md).
// ---------------------------------------------------------------------------

const WARRANTY_LINE =
  "Up to 10 years supplier-backed material warranty where stated in the quotation, plus 12 months workmanship.";

function townRelated(exclude: string): readonly ResidentialRelatedLink[] {
  const links: ResidentialRelatedLink[] = [
    { href: "/waterproofing-overstrand/", label: "Waterproofing in Betty's Bay" },
    { href: "/waterproofing-pringle-bay/", label: "Waterproofing in Pringle Bay & Rooi-Els" },
    { href: "/waterproofing-kleinmond/", label: "Waterproofing in Kleinmond" },
    { href: "/waterproofing-hermanus/", label: "Waterproofing in Hermanus" },
    { href: "/waterproofing-gansbaai/", label: "Waterproofing in Gansbaai" },
    { href: "/waterproofing-grabouw/", label: "Waterproofing in Grabouw" },
  ];
  return [
    { href: "/roof-waterproofing/", label: "Roof waterproofing" },
    { href: "/foundation-waterproofing/", label: "Foundation & damp-proofing" },
    ...links.filter((link) => !link.href.includes(exclude)),
    { href: "/waterproofing/", label: "All home waterproofing" },
  ];
}

const WATERPROOFING_PRINGLE_BAY: ResidentialPageConfig = {
  slug: "waterproofing-pringle-bay",
  kind: "regional",
  title: "Waterproofing Pringle Bay & Rooi-Els | Damtech",
  description:
    "Roof leaks, salt damp and wind-driven rain fixed for homes in Pringle Bay, Rooi-Els and Hangklip. Free site assessments from our Betty's Bay base.",
  h1: "Waterproofing in Pringle Bay and Rooi-Els",
  breadcrumbLabel: "Pringle Bay & Rooi-Els",
  heroEyebrow: "Pringle Bay · Rooi-Els · Hangklip · Free assessments",
  heroDescription:
    "Houses on the Hangklip peninsula take wind and salt from two sides. We repair leaking flat roofs, salt damp and wind-driven rain in Pringle Bay and Rooi-Els. Site assessments here are free.",
  intro:
    "Pringle Bay and Rooi-Els sit on the exposed tip of the Kogelberg coast, around Hangklip, with the mountain behind and the sea on both sides. We are a short drive away in Betty's Bay, so site assessments here are free.",
  sections: [
    {
      id: "pringle-bay-wind",
      heading: "Wind-driven rain on an exposed point",
      paragraphs: [
        "Winter fronts reach Pringle Bay and Rooi-Els with nothing to slow them down. Rain is driven sideways into sea-facing walls, sliding doors, window heads and the joint where a flat roof meets the parapet. Many 'roof leaks' here are really wall and junction leaks.",
        "We check the weather side of the house first, then the roof, and the written quote names each entry point we found.",
      ],
    },
    {
      id: "pringle-bay-salt-damp",
      heading: "Salt damp and corroded metal",
      paragraphs: [
        "Salt carried in the wind settles on walls and in plaster. Combined with damp, it causes salt damp: white crystals, powdery plaster and paint that keeps blistering. The same salt eats through gutters, flashings and fixings far faster than inland.",
        "We treat the damp at its source and replace or re-detail corroded flashings with materials that suit a salt environment.",
      ],
    },
    {
      id: "pringle-bay-away",
      heading: "Holiday homes and owners in Gauteng",
      paragraphs: [
        "Many houses in Pringle Bay and Rooi-Els belong to owners who live in Gauteng or Cape Town and visit a few times a year. We can check the house before winter or after a big storm, send you photos, and quote any repairs so you do not arrive to wet ceilings.",
        "Every job comes with before-and-after photos, so you can see what was done without being there.",
      ],
    },
  ],
  faqs: [
    {
      question: "Is the site assessment free in Pringle Bay and Rooi-Els?",
      answer: `Yes. Site assessments are free in Pringle Bay, Rooi-Els, Betty's Bay and Kleinmond. You receive a written quote afterwards. ${WARRANTY_LINE}`,
    },
    {
      question: "Can you check my house while I'm in Gauteng?",
      answer:
        "Yes. We can inspect the house, send you photos and a written quote, and do the work while you are away, with before-and-after photos when it is finished.",
    },
    {
      question: "What is salt damp?",
      answer:
        "Salt damp is damp carrying salts into walls and plaster. The salts crystallise as the wall dries, leaving white deposits and powdery, flaking plaster. Painting over it does not last; the moisture source has to be treated first.",
    },
  ],
  related: townRelated("pringle-bay"),
  serviceTypes: ["Roof waterproofing", "Damp proofing", "Leak detection"],
  areaServed: "Pringle Bay, Rooi-Els and Hangklip, Overstrand, Western Cape",
  officeIds: ["western-cape"],
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Book a free assessment in Pringle Bay or Rooi-Els",
  ctaDescription: `Tell us about the leaking roof or damp wall and send a few photos. Site assessments in Pringle Bay and Rooi-Els are free, followed by a written quote. ${WARRANTY_LINE}`,
};

const WATERPROOFING_KLEINMOND: ResidentialPageConfig = {
  slug: "waterproofing-kleinmond",
  kind: "regional",
  title: "Waterproofing Kleinmond | Roof Leaks & Damp | Damtech",
  description:
    "Leaking flat roofs, rising and salt damp and wind-driven rain repaired for homes in Kleinmond, Palmiet and Heuningkloof. Free site assessments.",
  h1: "Waterproofing in Kleinmond",
  breadcrumbLabel: "Kleinmond",
  heroEyebrow: "Kleinmond · Palmiet · Heuningkloof · Free assessments",
  heroDescription:
    "From the Palmiet river mouth to Heuningkloof, Kleinmond homes deal with winter fronts, lagoon-side moisture and salt air. We fix leaking roofs and damp walls, and site assessments in Kleinmond are free.",
  intro:
    "Kleinmond lies between the Kogelberg mountains, the Palmiet River and the sea, just along the R44 from our Betty's Bay base. Houses here get the sea on one side and moist air off the lagoon and river on the other.",
  sections: [
    {
      id: "kleinmond-flat-roofs",
      heading: "Leaking flat roofs after the first winter fronts",
      paragraphs: [
        "Flat roofs and box gutters are common on Kleinmond houses. When an outlet blocks with leaves or sand, water ponds and finds every tired lap and crack. The first north-westers of winter are usually when the stains appear.",
        "We clear and correct outlets, open and re-seal failed laps, and waterproof the roof with a torch-on or liquid-applied system suited to it.",
      ],
    },
    {
      id: "kleinmond-damp",
      heading: "Rising damp and salt damp near the lagoon",
      paragraphs: [
        "Low-lying stands near the lagoon and houses on sandy ground can hold moisture against the walls all winter. Bubbling paint low on the wall, a tide mark, white salts and swollen skirtings point to rising damp or salt damp, often where garden beds or paving sit above the damp-proof course.",
        "We confirm whether the moisture is rising, coming through the wall from outside or leaking from a pipe before we recommend damp-proofing.",
      ],
    },
    {
      id: "kleinmond-away",
      heading: "For owners who live in Gauteng",
      paragraphs: [
        "If your Kleinmond house is a holiday home, we can check it before the rainy season or after a storm and send you photos and a quote. Work done while you are away is documented with before-and-after photos.",
      ],
    },
  ],
  faqs: [
    {
      question: "Is the assessment really free in Kleinmond?",
      answer: `Yes. Site assessments are free in Kleinmond, Betty's Bay, Pringle Bay and Rooi-Els. You receive a written quote afterwards. ${WARRANTY_LINE}`,
    },
    {
      question: "Is it rising damp or a roof leak?",
      answer:
        "Rising damp sits low on the wall, leaves a tide mark and salts, and stays damp in dry weather. A roof or wall leak shows after rain and can appear higher up. We check both before quoting.",
    },
    {
      question: "Do you cover Palmiet and Heuningkloof?",
      answer:
        "Yes, all of Kleinmond including Palmiet and Heuningkloof, and the stretch towards Betty's Bay.",
    },
  ],
  related: townRelated("kleinmond"),
  serviceTypes: ["Roof waterproofing", "Damp proofing", "Leak detection"],
  areaServed: "Kleinmond, Palmiet and Heuningkloof, Overstrand, Western Cape",
  officeIds: ["western-cape"],
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Book a free assessment in Kleinmond",
  ctaDescription: `Tell us about the leaking roof or damp wall and send a few photos. Site assessments in Kleinmond are free, followed by a written quote. ${WARRANTY_LINE}`,
};

const WATERPROOFING_HERMANUS: ResidentialPageConfig = {
  slug: "waterproofing-hermanus",
  kind: "regional",
  title: "Waterproofing Hermanus | Roofs, Balconies & Damp | Damtech",
  description:
    "Leaking flat roofs, balconies and salt damp waterproofed in Hermanus, Onrus, Vermont, Sandbaai, Voëlklip and Westcliff. Written quotes.",
  h1: "Waterproofing in Hermanus",
  breadcrumbLabel: "Hermanus",
  heroEyebrow: "Hermanus · Onrus · Vermont · Sandbaai · Voëlklip",
  heroDescription:
    "Flat roofs, sea-facing balconies, parapets and damp walls in Hermanus and its suburbs. Send photos for a quote; a site assessment in Hermanus is quoted upfront.",
  intro:
    "From Westcliff and Northcliff to Voëlklip and Eastcliff, and along the coast to Sandbaai, Onrus, Vermont and Fisherhaven, many Hermanus houses are built for the view: flat roofs, parapets, big windows and balconies over living space. Those are exactly the details where coastal leaks start.",
  sections: [
    {
      id: "hermanus-balconies",
      heading: "Balconies and roof decks that leak into the room below",
      paragraphs: [
        "A sea-facing balcony above a bedroom has to keep out wind-driven rain at the door threshold, the drain and the upstand behind the tiles. When the membrane under the tiles fails, water shows on the ceiling below, sometimes metres from where it got in.",
        "We inspect falls, outlets, thresholds and upstands and tell you before any work starts whether tiles have to come up.",
      ],
    },
    {
      id: "hermanus-salt",
      heading: "Salt air, parapets and flashings",
      paragraphs: [
        "Salt-laden air corrodes flashings, fixings, gutters and balustrade bases quickly, and cracked parapet copings let water track down inside the walls. Combined with damp, salt also causes salt damp: flaking plaster and white crystals on interior walls.",
        "We re-detail parapets and flashings, waterproof flat roofs with a system suited to the roof, and treat salt damp at its source.",
      ],
    },
    {
      id: "hermanus-owners",
      heading: "Complexes, holiday lets and owners in Gauteng",
      paragraphs: [
        "We quote for individual owners, trustees and managing agents, and keep building work another trade must do separate in the written quote. If you live in Gauteng, we can check your Hermanus home, send photos and a quote, and send before-and-after photos when the work is done.",
      ],
    },
  ],
  faqs: [
    {
      question: "Is the site assessment free in Hermanus?",
      answer:
        "No. In Hermanus we quote from your photos, or quote the site assessment upfront before we visit. Free assessments are limited to Betty's Bay, Pringle Bay, Rooi-Els and Kleinmond, close to our base.",
    },
    {
      question: "My balcony leaks into the room below. Do the tiles have to come up?",
      answer:
        "Not always. Some balcony leaks come from the drain, threshold or upstand and can be fixed without lifting tiles. If the membrane under the tiles has failed, the quote says so before work starts.",
    },
    {
      question: "Do you work in Onrus, Vermont, Sandbaai and Fisherhaven?",
      answer:
        "Yes. We cover Hermanus and the surrounding suburbs, from Fisherhaven and Hawston through Vermont, Onrus and Sandbaai to Voëlklip.",
    },
  ],
  related: townRelated("hermanus"),
  serviceTypes: ["Roof waterproofing", "Balcony waterproofing", "Damp proofing"],
  areaServed: "Hermanus, Onrus, Vermont, Sandbaai, Fisherhaven and Hawston, Overstrand, Western Cape",
  officeIds: ["western-cape"],
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Request a waterproofing quote in Hermanus",
  ctaDescription: `Tell us about the leak and send photos of the roof, balcony or damp wall. We quote from photos or quote the site assessment upfront. ${WARRANTY_LINE}`,
};

const WATERPROOFING_GANSBAAI: ResidentialPageConfig = {
  slug: "waterproofing-gansbaai",
  kind: "regional",
  title: "Waterproofing Gansbaai & De Kelders | Damtech",
  description:
    "Roof leaks, salt damp and wind-driven rain fixed for exposed homes in Gansbaai, De Kelders, Kleinbaai, Franskraal and Pearly Beach. Written quotes.",
  h1: "Waterproofing in Gansbaai and De Kelders",
  breadcrumbLabel: "Gansbaai",
  heroEyebrow: "Gansbaai · De Kelders · Kleinbaai · Franskraal",
  heroDescription:
    "Exposed coastal houses take the full force of winter fronts and salt spray. We trace and repair roof leaks, wind-driven rain and salt damp in Gansbaai and along the coast. The site assessment is quoted upfront.",
  intro:
    "On the De Kelders cliffs and the open coast at Kleinbaai, Franskraal and Pearly Beach there is little shelter from winter fronts or summer wind. Houses here need roofs, flashings and walls detailed for wind and salt, not just for rain.",
  sections: [
    {
      id: "gansbaai-exposure",
      heading: "Lifted roof edges, wind and salt spray",
      paragraphs: [
        "Strong wind lifts roof edges and drives rain into parapets, window frames and wall junctions, and the salt it carries corrodes metal flashings, gutters and fixings. Lifted edges and corroded flashings are among the most common leak points here.",
        "We secure and re-detail edges, flashings and parapets, and choose membranes and finishes that suit a high-exposure, salt-laden site.",
      ],
    },
    {
      id: "gansbaai-damp",
      heading: "Salt damp in older cottages",
      paragraphs: [
        "Older cottages may have no effective damp-proof course, or one bridged by later plaster, paving or garden beds. Damp low on the walls, flaking paint and salts that return after every repaint are the result.",
        "We confirm the cause first, then quote damp-proofing and wall treatment that deals with it, not just a new coat of paint.",
      ],
    },
    {
      id: "gansbaai-away",
      heading: "Houses left empty through winter",
      paragraphs: [
        "Plenty of houses along this coast stand empty for months. For owners in Gauteng or elsewhere we can inspect before winter, send photos and a quote, and complete repairs with before-and-after photos so you know the house is sound.",
      ],
    },
  ],
  faqs: [
    {
      question: "Is the site assessment free in Gansbaai?",
      answer:
        "No. We quote from your photos or quote the site assessment upfront. Free assessments are limited to Betty's Bay, Pringle Bay, Rooi-Els and Kleinmond, close to our base.",
    },
    {
      question: "Why do my flashings and gutters rust so quickly?",
      answer:
        "Salt spray on the open coast corrodes metal much faster than inland. We re-detail with suitable materials and recommend a maintenance interval for your exposure.",
    },
    {
      question: "My paint keeps peeling at the bottom of the wall. Why?",
      answer:
        "That is usually rising damp or salt damp, or soil and paving above the damp-proof course. Repainting will not fix it; the moisture source has to be treated first.",
    },
  ],
  related: townRelated("gansbaai"),
  serviceTypes: ["Roof waterproofing", "Damp proofing"],
  areaServed: "Gansbaai, De Kelders, Kleinbaai, Franskraal and Pearly Beach, Overstrand, Western Cape",
  officeIds: ["western-cape"],
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Request a waterproofing quote in Gansbaai",
  ctaDescription: `Tell us about the leak or damp problem and send photos. We quote from photos or quote the site assessment upfront. ${WARRANTY_LINE}`,
};

const WATERPROOFING_GRABOUW: ResidentialPageConfig = {
  slug: "waterproofing-grabouw",
  kind: "regional",
  title: "Waterproofing Grabouw & Elgin | Roofs & Damp | Damtech",
  description:
    "Rising damp, leaking roofs and overflowing gutters fixed for homes and farm buildings in Grabouw, Elgin and Botrivier. Written quotes.",
  h1: "Waterproofing in Grabouw and the Elgin Valley",
  breadcrumbLabel: "Grabouw",
  heroEyebrow: "Grabouw · Elgin · Botrivier",
  heroDescription:
    "Cold, wet Elgin valley winters keep walls damp for weeks and overload gutters and flat-roof outlets. We waterproof homes and farm buildings in Grabouw and Elgin. Send photos for a quote; the site assessment is quoted upfront.",
  intro:
    "Grabouw and the Elgin valley are inland, but the valley gets a lot of winter rain and cold, misty mornings with little sun to dry things out. Damtech already works here: we lined a 3,400 m² farm dam in the Grabouw district.",
  sections: [
    {
      id: "grabouw-damp",
      heading: "Rising damp and walls that never dry out",
      paragraphs: [
        "Long, wet winters keep walls and slabs damp. Rising damp, damp patches behind cupboards and mould in corners are common where a damp-proof course has failed or soil is banked against the walls, especially on older farmhouses and cottages.",
        "We find the moisture source first and quote damp-proofing, wall treatment or drainage changes that deal with it.",
      ],
    },
    {
      id: "grabouw-gutters",
      heading: "Overflowing gutters, valleys and flat-roof outlets",
      paragraphs: [
        "Heavy winter rain and leaves from orchards and gardens overwhelm gutters, valleys and outlets. Many 'roof' leaks here are really blocked or undersized gutters backing water under flashings, or ponding on a flat roof with a blocked outlet.",
        "We repair and waterproof flat roofs and parapets, re-detail flashings and valleys, and recommend outlet and gutter changes where they are undersized.",
      ],
    },
    {
      id: "grabouw-farms",
      heading: "Farm buildings, dams and owners who live away",
      paragraphs: [
        "On farms we waterproof the roofs and walls of houses, offices and stores, and line farm dams for irrigation (see our Overberg dam lining page). For owners who live in Gauteng or Cape Town, we can inspect, send photos and a quote, and document finished work with before-and-after photos.",
      ],
    },
  ],
  faqs: [
    {
      question: "Is the site assessment free in Grabouw?",
      answer:
        "No. We quote from your photos or quote the site assessment upfront. Free assessments are limited to Betty's Bay, Pringle Bay, Rooi-Els and Kleinmond, close to our base.",
    },
    {
      question: "Have you worked in the area before?",
      answer:
        "Yes. Damtech installed 3,400 m² of HDPE lining on a farm dam in the Grabouw district; the project is in our projects section.",
    },
    {
      question: "Why does my house stay damp all winter?",
      answer:
        "Long wet spells with little sun keep walls damp, and a failed or bridged damp-proof course lets ground moisture rise. We confirm the cause before quoting damp-proofing.",
    },
  ],
  related: [
    { href: "/overberg-dam-liners/", label: "Overberg dam lining" },
    { href: "/projects/grabouw-hdpe-farm-dam/", label: "Grabouw farm dam project" },
    ...townRelated("grabouw"),
  ],
  serviceTypes: ["Roof waterproofing", "Damp proofing"],
  areaServed: "Grabouw, Elgin and Botrivier, Overberg, Western Cape",
  officeIds: ["western-cape"],
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Request a waterproofing quote in Grabouw",
  ctaDescription: `Tell us about the leak or damp problem and send photos. We quote from photos or quote the site assessment upfront. ${WARRANTY_LINE}`,
};

// ---------------------------------------------------------------------------
// Technical guides
// ---------------------------------------------------------------------------

const TORCH_ON_WATERPROOFING: ResidentialPageConfig = {
  slug: "torch-on-waterproofing",
  kind: "guide",
  title: "Torch-On Waterproofing for Homes | How It Works | Damtech",
  description:
    "A guide to torch-on bitumen waterproofing for house roofs: where it suits, how it is installed, its limits, and when a liquid system is better instead.",
  h1: "Torch-On Waterproofing for Homes",
  breadcrumbLabel: "Torch-on guide",
  heroEyebrow: "Guide · Modified bitumen membranes",
  heroDescription:
    "What torch-on waterproofing is, where it works well on house roofs, and where another system is the better choice — explained for homeowners, with no obligation.",
  intro:
    "Torch-on is one of the most common waterproofing systems on flat and low-pitch concrete roofs in South Africa. This guide explains what it is, where it suits a home, how it is installed and where a liquid system or roofing repair is the better answer. For cement dams, reservoirs and canals, see our separate torch-on dam lining service — that is a different application.",
  sections: [
    {
      id: "what-is-torch-on",
      heading: "What torch-on waterproofing is",
      paragraphs: [
        "Torch-on uses sheets of modified-bitumen membrane — bitumen reinforced with a polymer (APP or SBS) and a carrier — that are rolled out and bonded to a primed surface by heating the underside with a gas torch so it melts and sticks down. Seams are overlapped and torched so the whole roof becomes one continuous, bonded membrane.",
        "The membrane comes in plain and mineral-finished grades; a mineral or protective finish, or an over-coating, is used where the membrane is exposed to sun so UV does not degrade it over time.",
      ],
    },
    {
      id: "where-it-suits",
      heading: "Where torch-on works well",
      paragraphs: [
        "Torch-on suits flat and low-pitch concrete slab roofs, box gutters and concrete balconies — surfaces that are rigid, can take a bonded sheet, and sometimes hold standing water. Because it is bonded across the whole area and is robust underfoot, it handles ponding and light foot traffic better than a thin coating.",
        "It is a membrane system, not a cosmetic coating: it addresses the waterproofing layer itself rather than just sealing the surface.",
      ],
    },
    {
      id: "installation",
      heading: "How it is installed",
      paragraphs: [
        "The surface is cleaned, any failed material removed, and the substrate primed and allowed to dry — preparation is what decides whether the system lasts. The membrane is then torched down with continuous overlaps, and corners, upstands, outlets and penetrations are detailed with extra layers so the vulnerable points stay watertight.",
        "Torch-on is hot work: it uses an open flame, so it is carried out by trained applicators with the right fire precautions. That also means it is not suitable everywhere — see below.",
      ],
    },
    {
      id: "limits",
      heading: "Where torch-on is not the right choice",
      paragraphs: [
        "On pitched tiled and metal roofs, torch-on is generally not appropriate — those roofs shed water by overlap and flashing and need repair, not a bonded membrane poured over them. A moving metal roof also flexes too much for a rigid torch-on sheet.",
        "Where open flame is a risk (near combustible materials, timber structures or in tight spaces), a self-adhesive membrane or a reinforced liquid system is safer. Complex shapes, lots of penetrations or detailing-heavy areas are often better served by a liquid-applied system. We assess the roof and recommend accordingly rather than defaulting to one method.",
      ],
    },
  ],
  faqs: [
    {
      question: "How long does torch-on waterproofing last?",
      answer:
        "On a well-prepared surface and with the right UV protection and maintenance, quality torch-on systems give many years of service. Actual life depends on exposure, foot traffic and upkeep. The warranty for your specific job is set out in the written quote.",
    },
    {
      question: "Is torch-on the same as the torch-on used on dams?",
      answer:
        "It uses the same family of modified-bitumen technology, but the application is different. On homes it waterproofs flat concrete roofs and balconies; on cement dams and reservoirs it lines rigid water-retaining structures. Those are quoted separately — see our torch-on dam lining service.",
    },
    {
      question: "Is torch-on safe to use on my house?",
      answer:
        "Applied by trained technicians with proper fire precautions, yes. Where open flame would be a risk — near timber or combustible materials, or in a confined space — we use a self-adhesive membrane or a liquid system instead.",
    },
    {
      question: "Can torch-on go over my existing waterproofing?",
      answer:
        "Sometimes, if the existing surface is sound and compatible. Often failed material has to be removed first. We assess the substrate and say in the quote whether an overlay is suitable or the old system must come off.",
    },
  ],
  related: [
    { href: "/roof-waterproofing/", label: "Roof waterproofing" },
    {
      href: "/waterproofing-membranes-and-coatings/",
      label: "Membranes vs coatings guide",
    },
    { href: "/torch-on-dam-lining/", label: "Torch-on dam lining (cement dams)" },
    { href: "/waterproofing/", label: "All home waterproofing" },
  ],
  serviceTypes: ["Torch-on waterproofing"],
  areaServed: "Pretoria and Gauteng; Overstrand, Western Cape",
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Not sure which system you need?",
  ctaDescription:
    "Send photos of your roof and we will assess it and recommend the right waterproofing system in a free written quote — torch-on, liquid or repair.",
};

const MEMBRANES_AND_COATINGS: ResidentialPageConfig = {
  slug: "waterproofing-membranes-and-coatings",
  kind: "guide",
  title: "Waterproofing Membranes vs Coatings Compared | Damtech",
  description:
    "Torch-on and liquid waterproofing systems, liquid rubber and acrylic coatings compared: what each suits, and its strengths and limits for your home.",
  h1: "Waterproofing Membranes and Coatings Compared",
  breadcrumbLabel: "Membranes vs coatings",
  heroEyebrow: "Guide · Choosing a system",
  heroDescription:
    "A plain-language comparison of the main home waterproofing systems — torch-on and self-adhesive membranes, reinforced liquid systems, liquid rubber and acrylic coatings — so you know what the quote is recommending and why.",
  intro:
    "There is no single best waterproofing system — there is a best system for a particular roof, wall or detail. This guide explains the main options used on South African homes, what each suits and where each falls short, so the recommendation in your written quote makes sense. Any of these is only confirmed for your home after an on-site assessment.",
  sections: [
    {
      id: "membranes-vs-coatings",
      heading: "Membranes versus coatings",
      paragraphs: [
        "A membrane is a continuous waterproofing layer — a bonded sheet (torch-on, self-adhesive) or a reinforced liquid built up with a fabric to a real thickness. It is the waterproofing itself. A coating is a thinner applied film, often acrylic, that is usually a reflective, UV-stable protective or top layer rather than a stand-alone waterproofing system.",
        "The common and expensive mistake is treating a coating as a cure for an active leak. A plain acrylic roof paint over a failing flat roof looks good briefly, then blisters as trapped moisture pushes through. On a surface with real water ingress, you need a membrane system; a coating has its place as protection and detailing, not as the whole solution.",
      ],
    },
    {
      id: "systems",
      heading: "The main systems",
      paragraphs: [
        "Torch-on modified bitumen: a bonded sheet membrane for flat concrete roofs and balconies, robust and good with ponding, installed with heat. Self-adhesive bitumen: a peel-and-stick membrane for areas where open flame is not appropriate. Reinforced liquid systems (acrylic or polyurethane with an embedded fabric): liquid-applied but built up with reinforcement for a true membrane, excellent for complex shapes, upstands and detailing. Liquid rubber / bituminous emulsion: a flexible liquid coating useful on gutters, flashings and detailing. Acrylic and elastomeric roof coatings: reflective, UV-stable top layers over a sound substrate, and over membranes for protection.",
      ],
    },
    {
      id: "matching",
      heading: "Matching the system to the job",
      paragraphs: [
        "A flat concrete roof that ponds water is a different problem from a moving metal-sheet roof, which is different again from a below-ground wall under hydrostatic pressure. The flat roof may suit a torch-on or reinforced liquid membrane; the metal roof needs flexible detailing at laps and flashings and often repair rather than a poured membrane; the below-ground wall needs a system designed for water pressure, ideally on the positive (outside) face.",
        "This is why we assess first and specify per surface. A good waterproofing quote often names more than one system for one house — a membrane on the flat roof, flexible detailing on the metal lean-to, a coating as UV protection — because each area needs the right answer.",
      ],
    },
  ],
  comparison: {
    title: "Home waterproofing systems at a glance",
    columns: [
      { key: "system", label: "System" },
      { key: "suits", label: "Best suited to" },
      { key: "strengths", label: "Strengths" },
      { key: "limits", label: "Limits" },
    ],
    rows: [
      {
        system: "Torch-on modified bitumen",
        suits: "Flat/low-pitch concrete roofs, box gutters, concrete balconies",
        strengths: "Robust bonded membrane; handles ponding and light traffic",
        limits: "Hot work (open flame); not for pitched tile/metal or moving roofs",
      },
      {
        system: "Self-adhesive bitumen",
        suits: "Flat areas where open flame is not appropriate",
        strengths: "No flame; clean, controlled application",
        limits: "Needs very good surface prep; detailing still required",
      },
      {
        system: "Reinforced liquid (acrylic/PU + fabric)",
        suits: "Complex shapes, upstands, balconies, detailing-heavy roofs",
        strengths: "Seamless; forms a true membrane around penetrations",
        limits: "Thickness and reinforcement must be applied correctly",
      },
      {
        system: "Liquid rubber / bituminous emulsion",
        suits: "Gutters, flashings, localised detailing and repairs",
        strengths: "Flexible; good for awkward details and touch-ups",
        limits: "A detailing and repair aid, not a whole-roof membrane",
      },
      {
        system: "Acrylic / elastomeric coating",
        suits: "Sound surfaces and over membranes as a top layer",
        strengths: "Reflective, UV-stable protection; tidy finish",
        limits: "Not a cure for active leaks on its own",
      },
    ],
    note: "This table is a general guide. The system(s) suitable for your home are confirmed in a written quote after an on-site assessment — more than one may be specified for different areas of the same house.",
  },
  faqs: [
    {
      question: "Which waterproofing system is best?",
      answer:
        "There is no single best system — it depends on the surface. A flat concrete roof, a moving metal roof and a below-ground wall each need a different approach. We assess the specific roof or wall and recommend the right system (or systems) in the quote.",
    },
    {
      question: "Is liquid rubber better than torch-on?",
      answer:
        "Neither is universally better. Torch-on is a robust bonded membrane for flat concrete roofs; liquid systems suit complex shapes, detailing and no-flame situations. The best choice depends on the roof, the access and the detailing involved.",
    },
    {
      question: "Can a roof coating fix my leak?",
      answer:
        "A coating is usually a protective, UV-stable top layer, not a stand-alone cure for an active leak. On a leaking roof the waterproofing membrane has to be addressed first; a coating then protects it. Used alone over a failing roof, a coating tends to blister.",
    },
    {
      question: "Will you use the same system across my whole house?",
      answer:
        "Not necessarily. A good quote often specifies different systems for different areas — a membrane on the flat roof, flexible detailing on a metal section, a coating for UV protection — because each surface needs the right answer.",
    },
  ],
  related: [
    { href: "/torch-on-waterproofing/", label: "Torch-on waterproofing guide" },
    { href: "/roof-waterproofing/", label: "Roof waterproofing" },
    { href: "/foundation-waterproofing/", label: "Foundation & damp-proofing" },
    { href: "/waterproofing/", label: "All home waterproofing" },
  ],
  serviceTypes: ["Waterproofing systems and products"],
  areaServed: "Pretoria and Gauteng; Overstrand, Western Cape",
  quoteService: QUOTE_SERVICE,
  ctaTitle: "Want a system recommended for your home?",
  ctaDescription:
    "Send photos of the roof or wall and we will assess it and recommend the right system in a free written quote.",
};

export const RESIDENTIAL_WATERPROOFING_PAGES: readonly ResidentialPageConfig[] = [
  ROOF_WATERPROOFING,
  FOUNDATION_WATERPROOFING,
  WATERPROOFING_PRETORIA,
  WATERPROOFING_OVERSTRAND,
  WATERPROOFING_PRINGLE_BAY,
  WATERPROOFING_KLEINMOND,
  WATERPROOFING_HERMANUS,
  WATERPROOFING_GANSBAAI,
  WATERPROOFING_GRABOUW,
  TORCH_ON_WATERPROOFING,
  MEMBRANES_AND_COATINGS,
];

export const RESIDENTIAL_WATERPROOFING_SLUGS: readonly string[] =
  RESIDENTIAL_WATERPROOFING_PAGES.map((page) => page.slug);

const BY_SLUG = new Map(
  RESIDENTIAL_WATERPROOFING_PAGES.map((page) => [page.slug, page]),
);

export function getResidentialPage(
  slug: string,
): ResidentialPageConfig | undefined {
  return BY_SLUG.get(slug);
}

/** Page metadata (title, description, canonical) for a residential route. */
export function residentialMetadata(page: ResidentialPageConfig): Metadata {
  return createMetadata({
    title: page.title,
    description: page.description,
    path: `/${page.slug}`,
  });
}
