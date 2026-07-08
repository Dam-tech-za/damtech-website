import type { ServiceFaqItem, ServiceSection } from "@/lib/service-pages-content";
import { IMAGE_PATHS } from "@/lib/images";

export type SubServiceSpec = {
  label: string;
  value: string;
};

export type SubServicePageConfig = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  image: string;
  serviceName: string;
  schemaOffers: readonly string[];
  parent: { href: string; label: string };
  heroEyebrow: string;
  heroDescription: string;
  intro: string;
  benefits: readonly string[];
  specs: readonly SubServiceSpec[];
  specsHeading?: string;
  sections: ServiceSection[];
  faqs: ServiceFaqItem[];
  relatedLinks: readonly { href: string; label: string }[];
  projectDetailMatch: RegExp;
  ctaTitle: string;
  ctaDescription: string;
};

export const HDPE_DAM_LINING_PAGE: SubServicePageConfig = {
  slug: "hdpe-dam-lining",
  title: "HDPE Dam Lining | Geomembrane Installation South Africa",
  description:
    "HDPE geomembrane dam lining for farm dams, mining ponds and irrigation reservoirs. 1 mm–2 mm supply and professional installation across South Africa. Free quote.",
  h1: "HDPE Dam Lining",
  image: IMAGE_PATHS.hdpeDamLiningFieldInstallation,
  serviceName: "HDPE Dam Lining",
  schemaOffers: [
    "1 mm HDPE liner installation",
    "1.5 mm HDPE liner installation",
    "2 mm HDPE liner installation",
    "HDPE dam re-lining and repair",
    "Geomembrane seam welding and testing",
  ],
  parent: { href: "/dam-liners", label: "Dam Linings" },
  heroEyebrow: "Geomembrane · UV-stable · Low seepage",
  heroDescription:
    "Durable HDPE geomembrane solutions for large earth dams, farm reservoirs and mining ponds — supplied and installed by Damtech across South Africa.",
  intro:
    "High-density polyethylene (HDPE) is the preferred geomembrane for large farm dams, irrigation storage and mining containment in South Africa. Its low permeability, UV resistance and weldable seams create a continuous barrier that stops seepage through sandy soils and fractured clay — protecting water you cannot afford to lose during droughts or load-shedding.",
  benefits: [
    "Near-zero seepage when welded and anchored correctly",
    "UV-stabilised grades rated for exposed South African conditions",
    "1 mm, 1.5 mm and 2 mm options for depth and puncture risk",
    "Heat-welded seams stronger than the parent sheet",
    "20–30 year service life on typical farm dam applications",
    "10-year material warranty on qualifying installations",
  ],
  specsHeading: "HDPE liner specifications",
  specs: [
    { label: "Thickness options", value: "1 mm, 1.5 mm and 2 mm" },
    { label: "Best applications", value: "Earth dams, mining ponds, irrigation storage" },
    { label: "Typical lifespan", value: "20–30 years" },
    { label: "Seam method", value: "Hot-wedge or extrusion welding" },
    { label: "Warranty", value: "Supplier-backed on qualifying materials" },
  ],
  sections: [
    {
      id: "hdpe-benefits",
      heading: "Why HDPE for Farm and Mining Dams",
      paragraphs: [
        "HDPE geomembrane outperforms clay sealing and paint-on coatings on permeable soils. It tolerates settlement better than rigid systems, resists most agricultural water chemistry, and can be patched or extended when dams are enlarged. On mining and industrial sites, thicker 1.5 mm and 2 mm sheets handle puncture risk where maintenance traffic or rocky subgrades are present.",
        "Compared to PVC, HDPE is stiffer and more puncture-resistant — the right choice when dam surface area is measured in thousands of square metres and downtime from leaks is costly.",
      ],
    },
    {
      id: "hdpe-process",
      heading: "Our HDPE Installation Process",
      paragraphs: [
        "We start with site assessment: dam dimensions, batter slopes, inlet/outlet positions and soil conditions. The subgrade is cleared of rock, graded and compacted; geotextile underlay is used on stony ground. Liner panels are laid, field-welded and vacuum- or air-tested at seams before anchor trenches are backfilled.",
        "Pipe penetrations, overflow structures and crest anchoring are detailed to manufacturer standards. After flooding, we inspect high-stress zones and document as-built panel layout for your maintenance records.",
      ],
    },
  ],
  faqs: [
    {
      question: "What thickness HDPE liner do I need for my farm dam?",
      answer:
        "Most farm dams use 1 mm or 1.5 mm HDPE depending on depth, slope and whether livestock access the water. Deeper dams, mining ponds or rocky subgrades often warrant 1.5 mm or 2 mm. We recommend thickness after measuring your dam — not from a catalogue default.",
    },
    {
      question: "How long does HDPE dam lining last?",
      answer:
        "Correctly installed UV-stable HDPE typically performs 20–30 years on agricultural dams. Lifespan depends on exposure, water chemistry, anchoring quality and whether animals or machinery contact the liner.",
    },
    {
      question: "Can HDPE line an existing earth dam?",
      answer:
        "Yes. We lower the water level, prepare exposed surfaces and install welded panels to the current profile. Minor batter reshaping may be needed on unstable walls before lining.",
    },
    {
      question: "Is HDPE better than PVC for large dams?",
      answer:
        "For large earth dams and mining ponds, HDPE is usually preferred because of puncture resistance and lower permeability. PVC suits smaller ponds and steel tanks where flexibility and cost per square metre matter more.",
    },
  ],
  relatedLinks: [
    { href: "/dam-liners", label: "All Dam Lining Types" },
    { href: "/pvc-dam-lining", label: "PVC Dam Lining" },
    { href: "/farm-dam-liners", label: "Farm Dam Linings" },
    { href: "/mining-dam-liners", label: "Mining Dam Linings" },
    { href: "/projects", label: "HDPE Project Gallery" },
  ],
  projectDetailMatch: /HDPE/i,
  ctaTitle: "Get an HDPE Dam Lining Quote",
  ctaDescription:
    "Send dam dimensions, photos and intended use — we will specify thickness, seam layout and installation timeline for your site.",
};

export const PVC_DAM_LINING_PAGE: SubServicePageConfig = {
  slug: "pvc-dam-lining",
  title: "PVC Dam Linings | Pond, Tank & Reservoir Lining",
  description:
    "Flexible PVC liners for ponds, steel tanks and small reservoirs. Damtech supplies and installs PVC lining systems for agricultural and water storage applications across South Africa.",
  h1: "PVC Dam Linings",
  image: IMAGE_PATHS.hdpeDamLiningEarthDam,
  serviceName: "PVC Dam Lining",
  schemaOffers: [
    "550 gsm PVC liner installation",
    "750 gsm PVC liner installation",
    "850 gsm PVC liner installation",
    "Steel tank PVC lining",
    "Pond and small reservoir lining",
  ],
  parent: { href: "/dam-liners", label: "Dam Linings" },
  heroEyebrow: "Flexible · Cost-effective · Quick install",
  heroDescription:
    "PVC geomembrane for ponds, steel reservoirs and smaller dams where flexibility, handling ease and value per square metre are priorities.",
  intro:
    "PVC liners are a practical choice for smaller farm ponds, ornamental dams, steel tank interiors and cement reservoirs where HDPE’s stiffness is unnecessary. Reinforced PVC at 550–850 gsm balances flexibility with tear resistance — well suited to sites with moderate UV exposure and controlled livestock access.",
  benefits: [
    "Flexible sheet conforms to irregular pond shapes",
    "Lower cost per m² on smaller surface areas",
    "Common choice for steel tank and pond lining",
    "Heat-welded or adhesive seams on prepared substrates",
    "10–15 year lifespan with correct installation",
    "Compatible with many agricultural water uses",
  ],
  specs: [
    { label: "Weight grades", value: "550 gsm, 750 gsm and 850 gsm" },
    { label: "Best applications", value: "Ponds, steel tanks, small reservoirs" },
    { label: "Typical lifespan", value: "10–15 years" },
    { label: "Seam method", value: "Heat welding or adhesive bonding" },
    { label: "Warranty", value: "Supplier-backed on qualifying materials" },
  ],
  sections: [
    {
      heading: "Where PVC Liners Work Best",
      paragraphs: [
        "PVC excels on compact sites: lined steel reservoirs, nursery ponds, estate water features and farm dams under roughly 2 000 m² where crews can handle lighter rolls. It is also used inside corrugated tanks as the standard 850 gsm lining included on Damtech steel reservoir builds.",
        "For large earth dams with rocky subgrades or heavy UV exposure, we usually recommend HDPE instead — see our HDPE dam lining page for comparison.",
      ],
    },
    {
      heading: "PVC Installation Approach",
      paragraphs: [
        "Subgrade preparation matches HDPE projects: smooth, debris-free and compacted surfaces. Seams are welded or bonded per manufacturer spec; penetrations and crest anchors are sealed before fill. We advise on cover soil or shade where long-term UV exposure would otherwise shorten liner life.",
      ],
    },
  ],
  faqs: [
    {
      question: "When should I choose PVC instead of HDPE?",
      answer:
        "PVC suits smaller ponds, steel tanks and cement reservoirs where flexibility matters and puncture loads are moderate. Large farm or mining earth dams usually warrant HDPE for puncture and UV performance.",
    },
    {
      question: "What PVC weight do steel tanks use?",
      answer:
        "Damtech steel reservoirs include an 850 gsm PVC liner and bidem floor sheet as standard. Tell us if water is for human consumption so we can confirm suitability.",
    },
    {
      question: "Can PVC line an existing pond?",
      answer:
        "Yes, provided the pond can be drained and the base prepared. We assess slope stability and outlet details before quoting.",
    },
  ],
  relatedLinks: [
    { href: "/dam-liners", label: "All Dam Lining Types" },
    { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
    { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
    { href: "/farm-dam-liners", label: "Farm Dam Linings" },
  ],
  projectDetailMatch: /PVC|HDPE/i,
  ctaTitle: "Request a PVC Lining Quote",
  ctaDescription:
    "Share pond or tank dimensions and photos — we will confirm PVC grade and installation scope for your project.",
};

export const TORCH_ON_DAM_LINING_PAGE: SubServicePageConfig = {
  slug: "torch-on-dam-lining",
  title: "Torch-On Dam Lining – Cement Dams & Canals | Damtech",
  description:
    "Bitumen torch-on dam lining for cement dams, canals and rigid reservoirs. Heat-bonded waterproof membranes installed across South Africa. Free site assessment.",
  h1: "Torch-On Dam Lining",
  image: IMAGE_PATHS.bitumenTorchOnWaterproofingDamtech,
  serviceName: "Torch-On Dam Lining",
  schemaOffers: [
    "3 mm torch-on dam lining",
    "4 mm torch-on dam lining",
    "Cement dam leak repair",
    "Canal and rigid reservoir lining",
    "Bitumen membrane overlay on prepared concrete",
  ],
  parent: { href: "/dam-liners", label: "Dam Linings" },
  heroEyebrow: "Heat-bonded · Cement dams · Leak repair",
  heroDescription:
    "Torch-on bitumen membranes for cement dams, canals and rigid reservoirs — bonded waterproofing where HDPE sheet lining is not the right fit.",
  intro:
    "Torch-on bitumen lining bonds to prepared concrete, gunite and rigid dam structures through heat-welded laps — ideal for cement farm dams, canals and older reservoirs where a sheet geomembrane cannot anchor to earth batters alone. Damtech applicators prime substrates, lay modified bitumen membranes and detail penetrations for a continuous waterproof barrier.",
  benefits: [
    "Strong adhesion to prepared concrete and gunite",
    "Effective for localized leak repair and full relines",
    "3 mm and 4 mm membranes for depth and traffic loads",
    "Heat-welded laps reduce seam failure risk",
    "15–20 year service life on well-prepared substrates",
    "Suitable for canals, rigid tanks and cement dams",
  ],
  specs: [
    { label: "Membrane thickness", value: "3 mm and 4 mm torch-on" },
    { label: "Best applications", value: "Cement dams, canals, rigid reservoirs" },
    { label: "Typical lifespan", value: "15–20 years" },
    { label: "Application", value: "Torch-bonded to primed substrate" },
    { label: "Related service", value: "Roof and foundation waterproofing" },
  ],
  sections: [
    {
      heading: "Torch-On vs HDPE for Dams",
      paragraphs: [
        "Earth dams with soil batters are lined with HDPE or PVC sheet geomembrane. Cement or gunite structures — including some farm dams, irrigation canals and process reservoirs — are better served by torch-on bitumen that bonds directly to the rigid surface. We inspect first and recommend the system that matches structure type, not habit.",
      ],
    },
    {
      heading: "Application and Safety",
      paragraphs: [
        "Torch-on work is carried out by trained technicians with fire precautions and hot-work planning around active farms and industrial yards. Surfaces are cleaned, primed and dried before membrane runs; overlaps and penetrations are torched to full bond. For roofs and foundations using the same technology, see our bitumen waterproofing service.",
      ],
    },
  ],
  faqs: [
    {
      question: "Can torch-on lining fix a leaking cement dam?",
      answer:
        "Often yes, after the substrate is assessed for soundness and moisture. Failed sections may be removed before new membrane is torched in place. Severely cracked structures may need structural repair first.",
    },
    {
      question: "Is torch-on suitable for earth dams?",
      answer:
        "Large earth dams are usually lined with HDPE geomembrane. Torch-on is reserved for rigid concrete, gunite or canal surfaces where heat-bonded adhesion is required.",
    },
    {
      question: "How does torch-on dam lining relate to roof waterproofing?",
      answer:
        "The same modified bitumen technology applies to flat roofs and dam walls. Our bitumen waterproofing team handles both — one point of contact for membranes on your property.",
    },
  ],
  relatedLinks: [
    { href: "/dam-liners", label: "All Dam Lining Types" },
    { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
    { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
    { href: "/services", label: "All Services" },
  ],
  projectDetailMatch: /Bitumen/i,
  ctaTitle: "Book a Torch-On Dam Lining Assessment",
  ctaDescription:
    "Describe your cement dam, canal or reservoir leak — we will advise on torch-on repair or reline options.",
};

export const DAM_REPAIR_SERVICES_PAGE: SubServicePageConfig = {
  slug: "dam-repair-services",
  title: "Leaking Dam Repair Services | Damtech South Africa",
  description:
    "Damtech repairs leaking dams, failed liners and water storage systems using HDPE patching, relining and practical site-specific repair methods. Request an assessment.",
  h1: "Leaking Dam Repair Services",
  image: IMAGE_PATHS.hdpeDamLiningEarthDam,
  serviceName: "Leaking Dam Repair",
  schemaOffers: [
    "HDPE liner patch welding",
    "Dam leak assessment and survey",
    "Partial and full dam relining",
    "Outlet and penetration repairs",
    "Torch-on bitumen leak repair",
  ],
  parent: { href: "/services", label: "Services" },
  heroEyebrow: "Leak assessment · Patch & reline · Nationwide",
  heroDescription:
    "Practical repair for leaking farm dams, failed geomembrane liners and water storage systems — assessed on site before we recommend patch, overlay or full reline.",
  intro:
    "A leaking dam wastes water you cannot replace mid-season and often signals liner puncture, failed seams, crest settlement or outlet detail problems. Damtech inspects earth dams, lined reservoirs and rigid structures across South Africa, then recommends repair methods that match the failure — not a one-size-fits-all reline when a welded HDPE patch will hold.",
  benefits: [
    "On-site or photo-based leak assessment",
    "HDPE patch welding for localised punctures",
    "Torch-on repair for cement dams and canals",
    "Outlet, pipe boot and anchor trench remediation",
    "Maintenance inspections before irrigation season",
    "Upgrade paths when repair is no longer economical",
  ],
  specs: [
    { label: "Repair types", value: "Patch, overlay, partial reline, full reline" },
    { label: "Liner systems", value: "HDPE, PVC, torch-on bitumen" },
    { label: "Typical causes", value: "UV damage, puncture, seam failure, settlement" },
    { label: "Service area", value: "Nationwide South Africa" },
    { label: "First step", value: "Free assessment where applicable" },
  ],
  sections: [
    {
      id: "leak-signs",
      heading: "Signs Your Dam Is Leaking",
      paragraphs: [
        "Wet patches below the wall, unexplained water-level drop after rain, or muddy seepage on batters often point to liner failure or porous subgrade — not evaporation alone. On lined dams, bubbles under the membrane, exposed edges at the crest or animal damage at drinking points are common culprits. Steel and concrete reservoirs may leak at panel joints, rusted outlets or failed internal PVC lining.",
        "Early inspection is cheaper than emergency relining during peak irrigation. Log water levels over several still days without inflow or use to separate evaporation from seepage.",
      ],
    },
    {
      id: "causes",
      heading: "Causes of Dam Lining Failure",
      paragraphs: [
        "UV embrittlement on crest rolls left exposed, hoof traffic on unprotected batters, rocky subgrades without geotextile, and poor seam welding during original install are frequent causes on HDPE systems. PVC ponds fail at folds and penetrations. Torch-on membranes delaminate when moisture was trapped beneath the substrate or flashings were omitted at parapets.",
      ],
    },
    {
      id: "repair-vs-replace",
      heading: "Repair vs Replacement",
      paragraphs: [
        "Localised punctures on sound HDPE are often patch-welded after the area is cleaned and dried. Widespread UV cracking, multiple seam failures or subgrade collapse usually justify full relining after the embankment is stabilised. We explain trade-offs clearly so you can budget for the right scope.",
      ],
    },
    {
      id: "patching",
      heading: "HDPE Patching and Relining",
      paragraphs: [
        "Patch repairs use compatible HDPE sheet and extrusion or hot-air welding with vacuum or spark testing on critical seams. Full relines follow the same preparation standards as new installs: dewatering, subgrade repair, geotextile where needed, anchor trenches and outlet boots detailed to spec.",
      ],
    },
    {
      id: "maintenance",
      heading: "Maintenance Inspections",
      paragraphs: [
        "Annual crest walks, outlet checks and silt management extend liner life. We offer inspection visits before planting or calving seasons and document findings with photos for insurance or farm records.",
      ],
    },
  ],
  faqs: [
    {
      question: "Can you fix a leak without draining the entire dam?",
      answer:
        "Sometimes partial drawdown is enough to reach the damaged zone. Full dewatering is required for large relines or subgrade work. We advise after assessing water level, access and urgency.",
    },
    {
      question: "How quickly can you respond to an urgent leak?",
      answer:
        "Call us with photos and location — we prioritise farms losing irrigation water mid-season and can often mobilise patch crews within days depending on province and crew availability.",
    },
    {
      question: "Do you repair steel tank liners too?",
      answer:
        "Yes. Failed PVC lining inside corrugated tanks, rusted outlets and panel leaks are within scope. See our reservoir lining page for steel and concrete options.",
    },
  ],
  relatedLinks: [
    { href: "/dam-liners", label: "Dam Linings" },
    { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
    { href: "/reservoir-lining", label: "Reservoir Lining" },
    { href: "/services", label: "All Services" },
  ],
  projectDetailMatch: /HDPE|repair|leak/i,
  ctaTitle: "Request a Leaking Dam Assessment",
  ctaDescription:
    "Describe the leak, dam size and location — we will advise on patch, repair or reline options.",
};

export const RESERVOIR_LINING_PAGE: SubServicePageConfig = {
  slug: "reservoir-lining",
  title: "Reservoir Lining Contractors | Damtech South Africa",
  description:
    "Reservoir lining and relining for steel, concrete and farm water storage systems. Damtech installs PVC, HDPE and bitumen lining solutions nationwide.",
  h1: "Reservoir Lining Contractors",
  image: IMAGE_PATHS.corrugatedSteelWaterTank,
  serviceName: "Reservoir Lining",
  schemaOffers: [
    "Steel reservoir PVC lining",
    "Concrete reservoir bitumen lining",
    "HDPE lining for earth reservoirs",
    "Reservoir relining and leak repair",
    "Outlet and penetration detailing",
  ],
  parent: { href: "/services", label: "Services" },
  heroEyebrow: "Steel · Concrete · Farm reservoirs",
  heroDescription:
    "Line or reline steel, concrete and farm reservoirs with PVC, HDPE or bitumen systems matched to structure, water chemistry and how the reservoir is used.",
  intro:
    "Reservoirs take many forms in South Africa — corrugated galvanised steel tanks on farms, concrete farm dams, process ponds at mines and flat-roofed storage on commercial sites. Each substrate needs a different lining approach. Damtech supplies and installs PVC inside steel tanks, HDPE on prepared earth reservoirs, and torch-on bitumen where rigid concrete walls must be bonded waterproof.",
  benefits: [
    "PVC lining standard on Damtech steel tank builds",
    "HDPE for large earth and process reservoirs",
    "Torch-on for concrete and gunite structures",
    "Relining without replacing sound steel shells",
    "Outlet boots and penetration detailing",
    "Nationwide installation crews",
  ],
  specs: [
    { label: "Steel tanks", value: "850 gsm PVC lining, 11 kL–500 kL+" },
    { label: "Concrete", value: "3–4 mm torch-on bitumen" },
    { label: "Earth reservoirs", value: "HDPE 1–2 mm geomembrane" },
    { label: "Service area", value: "South Africa nationwide" },
    { label: "Related", value: "Dam linings and steel tank supply" },
  ],
  sections: [
    {
      id: "options",
      heading: "Reservoir Lining Options",
      paragraphs: [
        "PVC is flexible, cost-effective inside steel shells and smaller ponds. HDPE suits large surface areas and exposed earth batters with UV-stable grades. Bitumen torch-on bonds to primed concrete where sheet geomembrane cannot anchor to vertical rigid walls alone.",
      ],
    },
    {
      id: "steel",
      heading: "Steel Reservoirs",
      paragraphs: [
        "Corrugated galvanised tanks from Damtech include PVC lining, columns, inlet/outlet and overflow as standard. Relining replaces failed PVC without scrapping sound steel — common when outlets corrode or lining ages past weld integrity at the floor seam.",
      ],
    },
    {
      id: "concrete",
      heading: "Concrete Reservoirs",
      paragraphs: [
        "Farm cement dams, irrigation canals and commercial water-retaining structures often receive torch-on bitumen after crack repair and moisture testing. HDPE may line earth embankments surrounding concrete walls where a hybrid system is required.",
      ],
    },
    {
      id: "comparison",
      heading: "PVC, HDPE and Bitumen Comparison",
      paragraphs: [
        "Choose PVC for tank interiors and compact ponds; HDPE for hectares-scale lining; bitumen where heat-bonded adhesion to concrete is mandatory. We inspect first rather than defaulting to one catalogue product.",
      ],
    },
    {
      id: "reline",
      heading: "Repair and Relining",
      paragraphs: [
        "Failed internal liners, delaminated torch-on and outlet leaks are repaired or fully relined after substrate assessment. Pair reservoir work with our leaking dam repair service when earth dams and tanks share one water system.",
      ],
    },
  ],
  faqs: [
    {
      question: "Can you reline an existing steel tank?",
      answer:
        "Yes, when the shell is structurally sound. We remove or overlay failed PVC, repair rusted outlets where needed, and commission with a water test.",
    },
    {
      question: "What liner goes inside a new corrugated steel tank?",
      answer:
        "Damtech steel reservoirs are supplied with 850 gsm PVC lining as standard. Capacity ranges from 11 kL to 500 kL+ with optional roofs to reduce evaporation.",
    },
    {
      question: "Do you line concrete irrigation reservoirs?",
      answer:
        "Yes — typically with torch-on bitumen on prepared concrete. We assess cracks and moisture before membrane application.",
    },
  ],
  relatedLinks: [
    { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
    { href: "/dam-liners", label: "Dam Linings" },
    { href: "/pvc-dam-lining", label: "PVC Dam Linings" },
    { href: "/dam-repair-services", label: "Leaking Dam Repair" },
  ],
  projectDetailMatch: /tank|reservoir|steel|HDPE/i,
  ctaTitle: "Request Reservoir Lining Quote",
  ctaDescription:
    "Tell us about your steel tank, concrete dam or earth reservoir — we will recommend the right lining system.",
};

export const DAM_LINING_COST_PAGE: SubServicePageConfig = {
  slug: "dam-lining-cost-south-africa",
  title: "Dam Lining Cost South Africa | HDPE & PVC Pricing Factors",
  description:
    "Understand dam lining cost factors in South Africa, including liner type, dam size, site preparation, thickness, access and installation requirements. Request a tailored quote.",
  h1: "Dam Lining Cost in South Africa",
  image: IMAGE_PATHS.hdpeLinedFarmReservoirCattle,
  serviceName: "Dam Lining Cost Guidance",
  schemaOffers: [
    "HDPE dam lining quotation",
    "PVC pond lining quotation",
    "Site preparation assessment",
    "Thickness and material recommendation",
    "Nationwide installation quote",
  ],
  parent: { href: "/dam-liners", label: "Dam Linings" },
  heroEyebrow: "Transparent quoting · No hidden shortcuts",
  heroDescription:
    "Dam lining cost depends on liner type, dam size, site access and preparation — not a single price per square metre. Here is what drives your quote.",
  intro:
    "Clients often ask for a ballpark dam lining price before sharing dam dimensions or photos. Honest quoting in South Africa requires understanding surface area, liner grade, subgrade condition, access for equipment and whether outlets and anchor trenches need rework. Damtech provides tailored quotes after assessment — this page explains the factors so you know what to prepare.",
  benefits: [
    "Quote based on site-specific assessment",
    "Material matched to use — not cheapest roll",
    "Preparation scope included in writing",
    "Thickness options explained (1–2 mm HDPE)",
    "Travel and mobilisation quoted upfront",
    "No published guesswork that misleads budgets",
  ],
  specs: [
    { label: "Primary drivers", value: "Area, liner type, thickness, access" },
    { label: "HDPE", value: "Typically specified 1–2 mm for farm dams" },
    { label: "PVC", value: "550–850 gsm for ponds and tanks" },
    { label: "Extras", value: "Geotextile, outlets, dewatering, rock fill" },
    { label: "Next step", value: "Free quote with photos or site visit" },
  ],
  sections: [
    {
      id: "factors",
      heading: "What Affects Dam Lining Cost?",
      paragraphs: [
        "Surface area is the starting point, but steep batters, rocky subgrades, remote access and existing water in the dam all change crew days and material waste. Outlet penetrations, anchor trenches and crest protection add detail work beyond plain field sheet. Labour and freight to Limpopo differ from a Gauteng farm 40 km from Pretoria.",
      ],
    },
    {
      id: "materials",
      heading: "HDPE vs PVC vs Bitumen Cost Factors",
      paragraphs: [
        "HDPE costs more per roll but often wins on large dams because of lifespan and seepage control. PVC lowers material cost on small ponds and tank linings where rolls are manageable. Bitumen torch-on is priced on prepared concrete area and detail complexity — not comparable directly to m² HDPE on earth.",
      ],
    },
    {
      id: "preparation",
      heading: "Dam Size and Surface Preparation",
      paragraphs: [
        "A smooth, compacted subgrade with geotextile costs less to line than a rocky batter that needs padding and hand finishing. Dewatering, silt removal and crest regrading are often the hidden scope items in cheap quotes that fail mid-project.",
      ],
    },
    {
      id: "access",
      heading: "Access, Slopes and Anchor Trenches",
      paragraphs: [
        "Narrow farm roads, crane reach for steel coils, and 1:1 batters slow production versus shallow farm dams with good perimeter access. Anchor trenches at the crest must be specified and included — cutting them shallow is a common reason liners pull out under full head.",
      ],
    },
    {
      id: "cheap-fails",
      heading: "Why Cheap Lining Fails",
      paragraphs: [
        "Under-specified thickness, skipped geotextile, poor welding and no outlet boots produce leaks within seasons — then relining costs more than doing it properly once. We quote for inspectable workmanship, not the lowest m² number on paper.",
      ],
    },
    {
      id: "accurate-quote",
      heading: "How to Request an Accurate Quote",
      paragraphs: [
        "Send dam length and width (or surface m²), photos of batters and crest, intended use, province and whether the dam holds water now. Use our quote form or call — we respond within one business day with next steps for site visit or detailed estimate.",
      ],
    },
  ],
  faqs: [
    {
      question: "Can you give a price per square metre over the phone?",
      answer:
        "We avoid published m² rates because they mislead without thickness, access and preparation context. Share dimensions and photos for a tailored quote.",
    },
    {
      question: "Is HDPE always more expensive than PVC?",
      answer:
        "HDPE material can cost more per m², but on large dams the total project cost must include lifespan, seepage savings and preparation — PVC is not always cheaper overall.",
    },
    {
      question: "Does site visit cost extra?",
      answer:
        "Many assessments are included in our quoting process. Remote sites may include travel in the quote — we state this upfront.",
    },
  ],
  relatedLinks: [
    { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
    { href: "/pvc-dam-lining", label: "PVC Dam Linings" },
    { href: "/farm-dam-liners", label: "Farm Dam Linings" },
    { href: "/quote", label: "Request a Quote" },
  ],
  projectDetailMatch: /HDPE|m²/i,
  ctaTitle: "Request a Tailored Dam Lining Quote",
  ctaDescription:
    "Share dam dimensions, photos and location — we will provide an accurate quote based on your site.",
};

export const SUB_SERVICE_PAGES: SubServicePageConfig[] = [
  HDPE_DAM_LINING_PAGE,
  PVC_DAM_LINING_PAGE,
  TORCH_ON_DAM_LINING_PAGE,
  DAM_REPAIR_SERVICES_PAGE,
  RESERVOIR_LINING_PAGE,
  DAM_LINING_COST_PAGE,
];

export function getSubServicePage(slug: string): SubServicePageConfig | undefined {
  return SUB_SERVICE_PAGES.find((page) => page.slug === slug);
}

export function getSubServiceSlugs(): string[] {
  return SUB_SERVICE_PAGES.map((page) => page.slug);
}
