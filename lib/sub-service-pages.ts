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
  /** 2–3 real project slugs for the "Related projects" strip; overrides `projectDetailMatch`. */
  relatedProjectSlugs?: readonly string[];
  /** 2–3 existing blog post slugs for the page's further-reading block. */
  relatedPostSlugs?: readonly string[];
  /** Override the default "{serviceName} projects" strip heading. */
  projectsSectionTitle?: string;
  sectionCtaTitle?: string;
  ctaTitle: string;
  ctaDescription: string;
  /** Additional crawlable images shown below the overview image. */
  supportImages?: readonly { path: string; alt: string; caption?: string }[];
};

export const HDPE_DAM_LINING_PAGE: SubServicePageConfig = {
  slug: "hdpe-dam-lining",
  title: "HDPE Dam Lining & Geomembrane Liners South Africa | Damtech",
  description:
    "HDPE dam lining supplied and installed: UV-resistant 1 mm–2 mm geomembrane liners for farm dams, reservoirs and mining ponds. Welded seams. Free quote.",
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
    "High-density polyethylene (HDPE) is the preferred geomembrane for large farm dams, irrigation storage and mining containment in South Africa. Its low permeability, UV resistance and weldable seams create a continuous barrier that greatly reduces seepage through sandy soils and fractured clay, protecting water you cannot afford to lose during droughts or load-shedding.",
  benefits: [
    "Very low seepage when welded and anchored correctly",
    "UV-stabilised grades formulated for exposed South African conditions",
    "1 mm, 1.5 mm and 2 mm options for depth and puncture risk",
    "Heat-welded seams designed to match the strength of the parent sheet",
    "20–30 year typical service life on agricultural dams (conditions apply)",
    "Supplier-backed material warranty where stated in the quotation",
  ],
  specsHeading: "HDPE liner specifications",
  specs: [
    { label: "Thickness options", value: "1 mm, 1.5 mm and 2 mm" },
    { label: "Best applications", value: "Earth dams, mining ponds, irrigation storage" },
    { label: "Typical service life", value: "Typically 20–30 years*" },
    { label: "Seam method", value: "Hot-wedge or extrusion welding" },
    { label: "Warranty", value: "Supplier-backed on qualifying materials, where stated in the quotation" },
  ],
  sections: [
    {
      id: "hdpe-benefits",
      heading: "Why HDPE for Farm and Mining Dams",
      paragraphs: [
        "On permeable soils, HDPE geomembrane is generally more effective than clay sealing or paint-on coatings. It tolerates settlement better than rigid systems, resists most agricultural water chemistry, and can be patched or extended when dams are enlarged. On mining and industrial sites, thicker 1.5 mm and 2 mm sheets are used where maintenance traffic or rocky subgrades increase puncture risk.",
        "Compared to PVC, HDPE is stiffer and more resistant to UV and chemical attack, and is available in heavier thicknesses — usually the better choice when the dam surface area is measured in thousands of square metres and downtime from leaks is costly.",
      ],
    },
    {
      id: "hdpe-process",
      heading: "Our HDPE Installation Process",
      paragraphs: [
        "We start with site assessment: dam dimensions, batter slopes, inlet/outlet positions and soil conditions. The subgrade is cleared of rock, graded and compacted; geotextile underlay is used on stony ground. Liner panels are laid and field-welded, and seams are tested (air-pressure or vacuum, depending on the weld type) before anchor trenches are backfilled.",
        "Pipe penetrations, overflow structures and crest anchoring are detailed to manufacturer standards. After flooding, we inspect high-stress zones and document as-built panel layout for your maintenance records.",
      ],
    },
  ],
  faqs: [
    {
      question: "What thickness HDPE liner do I need for my farm dam?",
      answer:
        "Most farm dams use 1 mm or 1.5 mm HDPE depending on depth, slope and whether livestock access the water. Deeper dams, mining ponds or rocky subgrades often warrant 1.5 mm or 2 mm. We recommend thickness after assessing your dam, not from a catalogue default.",
    },
    {
      question: "How long does HDPE dam lining last?",
      answer:
        "Correctly installed UV-stable HDPE typically performs for 20–30 years on agricultural dams, depending on thickness, UV exposure, water chemistry, anchoring quality and whether animals or machinery contact the liner. This is a typical range, not a guarantee. Damtech confirms the relevant supplier specifications for each quoted system.",
    },
    {
      question: "Can HDPE line an existing earth dam?",
      answer:
        "Yes. We lower the water level, prepare exposed surfaces and install welded panels to the current profile. Minor batter reshaping may be needed on unstable walls before lining.",
    },
    {
      question: "Is HDPE better than PVC for large dams?",
      answer:
        "For large earth dams and mining ponds, HDPE is usually preferred because of its UV and chemical resistance and the heavier thicknesses available. PVC suits smaller ponds and steel tanks where flexibility and cost per square metre matter more.",
    },
  ],
  relatedLinks: [
    {
      href: "/calculators/#hdpe-pvc-material",
      label: "Estimate HDPE/PVC material → Material Calculator",
    },
    { href: "/dam-liners", label: "All Dam Lining Types" },
    { href: "/pvc-dam-lining", label: "PVC Dam Lining" },
    { href: "/farm-dam-liners", label: "Farm dam lining and earth dam liners" },
    { href: "/mining-dam-liners", label: "Mining Dam Linings" },
    { href: "/projects", label: "HDPE Project Gallery" },
    { href: "/quote", label: "Request an HDPE Dam Lining Quote" },
  ],
  projectDetailMatch: /HDPE/i,
  relatedProjectSlugs: [
    "north-west-game-lodge-hdpe-dam-lining",
    "stellenbosch-hdpe-dam-liner",
    "villiersdorp-hdpe-dam-lining",
  ],
  relatedPostSlugs: [
    "hdpe-dam-liner-benefits",
    "dam-lining-sandy-clay-soils",
    "prevent-farm-dam-liner-failure",
  ],
  sectionCtaTitle: "Need an HDPE Dam Lining Quote?",
  ctaTitle: "Get an HDPE Dam Lining Quote",
  ctaDescription:
    "Send dam dimensions, photos and intended use — we will specify thickness, seam layout and installation timeline for your site.",
};

export const PVC_DAM_LINING_PAGE: SubServicePageConfig = {
  slug: "pvc-dam-lining",
  title: "PVC Dam Lining & Pond Liners South Africa | Damtech",
  description:
    "Flexible PVC dam liners for ponds, steel tanks and small reservoirs. Supply and installation across South Africa, with practical advice on liner choice.",
  h1: "PVC Dam Lining",
  image: IMAGE_PATHS.hdpeDamLiningEarthDam,
  serviceName: "PVC Dam Lining",
  schemaOffers: [
    "550 gsm PVC liner installation",
    "850 gsm PVC liner installation (on request)",
    "Steel tank PVC lining",
    "Pond and small reservoir lining",
  ],
  parent: { href: "/dam-liners", label: "Dam Linings" },
  heroEyebrow: "Flexible · Cost-effective · Quick install",
  heroDescription:
    "PVC geomembrane for ponds, steel reservoirs and smaller dams where flexibility, handling ease and value per square metre are priorities.",
  intro:
    "PVC liners are a practical choice for smaller farm ponds, ornamental dams, steel tank interiors and cement reservoirs where HDPE’s stiffness is unnecessary. Reinforced PVC at 550 gsm as standard (850 gsm on request) balances flexibility with tear resistance and is well suited to sites with moderate UV exposure and controlled livestock access.",
  benefits: [
    "Flexible sheet conforms to irregular pond shapes",
    "Lower cost per m² on smaller surface areas",
    "Common choice for steel tank and pond lining",
    "Heat-welded or adhesive seams on prepared substrates",
    "10–15 year typical service life with correct installation (conditions apply; not a guarantee)",
    "Suitable for many agricultural water uses (confirm for drinking water)",
  ],
  specs: [
    { label: "Weight grades", value: "550 gsm standard; 850 gsm on request" },
    { label: "Best applications", value: "Ponds, steel tanks, small reservoirs" },
    { label: "Typical service life", value: "Typically 10–15 years*" },
    { label: "Seam method", value: "Heat welding or adhesive bonding" },
    { label: "Warranty", value: "Supplier-backed on qualifying materials, where stated in the quotation" },
  ],
  sections: [
    {
      heading: "Where PVC Liners Work Best",
      paragraphs: [
        "PVC works best on compact sites: lined steel reservoirs, nursery ponds, estate water features and farm dams under roughly 2 000 m², where crews can handle lighter rolls. It is also the standard 550 gsm lining included on Damtech steel reservoir builds, with 850 gsm available on request.",
        "For large earth dams with rocky subgrades or heavy UV exposure, we usually recommend HDPE instead — see our HDPE dam lining page for comparison.",
      ],
    },
    {
      heading: "PVC Installation Approach",
      paragraphs: [
        "Subgrade preparation matches HDPE projects: smooth, debris-free and compacted surfaces. Seams are welded or bonded to the manufacturer’s specification; penetrations and crest anchors are sealed before fill. We advise on cover soil or shade where long-term UV exposure would otherwise shorten liner life.",
      ],
    },
  ],
  faqs: [
    {
      question: "When should I choose PVC instead of HDPE?",
      answer:
        "PVC suits smaller ponds, steel tanks and cement reservoirs where flexibility matters and puncture loads are moderate. Large farm or mining earth dams usually warrant HDPE for its UV and chemical resistance and heavier thicknesses.",
    },
    {
      question: "What PVC weight do steel tanks use?",
      answer:
        "Damtech steel reservoirs include a 550 gsm PVC liner and bidem floor sheet as standard; 850 gsm is available on request. Tell us if the water is for human consumption so we can confirm suitability.",
    },
    {
      question: "Can PVC line an existing pond?",
      answer:
        "Yes, provided the pond can be drained and the base prepared. We assess slope stability and outlet details before quoting.",
    },
  ],
  relatedLinks: [
    {
      href: "/calculators/#hdpe-pvc-material",
      label: "Estimate HDPE/PVC material → Material Calculator",
    },
    { href: "/dam-liners", label: "All Dam Lining Types" },
    { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
    { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
    { href: "/farm-dam-liners", label: "Farm dam lining and earth dam liners" },
    { href: "/quote", label: "Request a PVC Dam Lining Quote" },
  ],
  projectDetailMatch: /HDPE|PVC|dam lining/i,
  relatedProjectSlugs: ["grabouw-hdpe-farm-dam", "centurion-hdpe-dam-liner"],
  relatedPostSlugs: [
    "dam-lining-sandy-clay-soils",
    "dam-lining-materials-environmental-impact",
  ],
  projectsSectionTitle: "Related Dam Lining Projects",
  sectionCtaTitle: "Need a PVC Dam Lining Quote?",
  ctaTitle: "Request a PVC Lining Quote",
  ctaDescription:
    "Share pond or tank dimensions and photos — we will confirm PVC grade and installation scope for your project.",
};

export const TORCH_ON_DAM_LINING_PAGE: SubServicePageConfig = {
  slug: "torch-on-dam-lining",
  title: "Torch-On Dam Lining for Cement Dams | Damtech South Africa",
  description:
    "Bitumen torch-on dam lining heat-bonded to cement and rigid dam surfaces. Repair leaking concrete dams and canals with Damtech’s torch-on systems.",
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
    "Torch-on bitumen lining bonds to prepared concrete, gunite and rigid dam structures through heat-welded laps — ideal for cement farm dams, canals and older reservoirs where a sheet geomembrane cannot anchor to earth batters alone. Damtech applicators prime substrates, lay modified bitumen membranes and detail penetrations to form a continuous waterproof layer.",
  benefits: [
    "Strong adhesion to prepared concrete and gunite",
    "Suitable for localised leak repair and full relines",
    "3 mm and 4 mm membranes for depth and traffic loads",
    "Heat-bonded laps, correctly detailed, reduce the risk of seam failure",
    "15–20 year typical service life on well-prepared substrates (conditions apply; not a guarantee)",
    "Suitable for canals, rigid tanks and cement dams",
  ],
  specs: [
    { label: "Membrane thickness", value: "3 mm and 4 mm torch-on" },
    { label: "Best applications", value: "Cement dams, canals, rigid reservoirs" },
    { label: "Typical service life", value: "Typically 15–20 years*" },
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
      heading: "Cement reservoirs, canals and farm dams",
      paragraphs: [
        "Bitumen torch-on is often used on cement reservoir walls and floors, and on canal linings, where a bonded membrane is required. On farms that includes cement dams and irrigation canals after the concrete is cleaned, primed and dried. A sheet geomembrane cannot anchor to a vertical rigid wall on its own.",
        "Reservoir repairs are quoted when a flexible bonded membrane will outperform a rigid coating. Large earth dams stay on HDPE. A property with both a cement reservoir and an earth dam is specified as two jobs, not one membrane type for both.",
      ],
    },
    {
      heading: "Application and Safety",
      paragraphs: [
        "Torch-on work is carried out by trained technicians, with fire precautions and hot-work planning around active farms and industrial yards. Surfaces are cleaned, primed and dried before the membrane is laid; overlaps and penetrations are torched to achieve a full bond. House roofs, damp walls and balconies are quoted on our home waterproofing page, not as dam lining.",
      ],
    },
  ],
  faqs: [
    {
      question: "Can torch-on lining fix a leaking cement dam?",
      answer:
        "Often, once the substrate has been assessed for soundness and moisture. Failed sections may be removed before new membrane is torched in place, and severely cracked structures may need structural repair first.",
    },
    {
      question: "Is torch-on suitable for earth dams?",
      answer:
        "Large earth dams are usually lined with HDPE geomembrane. Torch-on is reserved for rigid concrete, gunite or canal surfaces where heat-bonded adhesion is required.",
    },
    {
      question: "Do you waterproof cement reservoir walls and canal linings?",
      answer:
        "Yes. Bitumen torch-on is used on cement reservoirs and canal linings where a bonded membrane is required. Large earth dams are lined with HDPE instead — see our dam linings service.",
    },
    {
      question: "How does torch-on dam lining relate to roof waterproofing?",
      answer:
        "House roofs, damp walls and balconies are quoted as home waterproofing in Pretoria and Gauteng. Cement dams, canals and rigid reservoirs stay on this torch-on dam lining service.",
    },
  ],
  relatedLinks: [
    {
      href: "/calculators/#waterproofing-area",
      label: "Estimate waterproofing area → Waterproofing Area Calculator",
    },
    { href: "/concrete-reservoir-repair", label: "Cement reservoir repair and restoration" },
    { href: "/concrete-waterproofing", label: "Concrete waterproofing" },
    { href: "/dam-liners", label: "All Dam Lining Types" },
    { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
    { href: "/waterproofing/", label: "Home waterproofing" },
    { href: "/services", label: "All Services" },
  ],
  projectDetailMatch: /Bitumen/i,
  relatedProjectSlugs: [
    "hoedspruit-bitumen-dam-lining",
    "mpumalanga-torch-on-bitumen-concrete-dam-15m",
    "tzaneen-torch-on-bitumen-concrete-dam-18m",
  ],
  relatedPostSlugs: [
    "farm-dam-water-saving-tips",
    "farm-dam-leak-repair",
  ],
  sectionCtaTitle: "Need a Torch-On Dam Lining Quote?",
  ctaTitle: "Book a Torch-On Dam Lining Assessment",
  ctaDescription:
    "Describe your cement dam, canal or reservoir leak — we will advise on torch-on repair or reline options.",
};

export const DAM_REPAIR_SERVICES_PAGE: SubServicePageConfig = {
  slug: "dam-repair-services",
  title: "Leaking Dam Repair & Liner Repairs | Damtech South Africa",
  description:
    "Leaking dam? Damtech assesses and repairs liner punctures, failed seams and seepage on earth dams, cement dams and reservoirs. Send photos for a quote.",
  h1: "Leaking Dam Repair Services",
  image: IMAGE_PATHS.damLiningMaintenanceInspection1,
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
    "A leaking dam wastes water you cannot replace mid-season and often signals liner puncture, failed seams, crest settlement or outlet detail problems. Damtech inspects earth dams, lined reservoirs and rigid structures across South Africa, then recommends repair methods that match the failure — not a one-size-fits-all reline when a welded HDPE patch will do.",
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
    { label: "First step", value: "Photos, then a quote or site visit" },
  ],
  sections: [
    {
      id: "leak-signs",
      heading: "Signs Your Dam Is Leaking",
      paragraphs: [
        "Wet patches below the wall, an unexplained drop in water level after rain, or muddy seepage on batters often point to liner failure or a porous subgrade, not evaporation alone. On lined dams, bubbles under the membrane, exposed edges at the crest and animal damage at drinking points are common culprits. Steel and concrete reservoirs may leak at panel joints, rusted outlets or failed internal PVC lining.",
        "Early inspection is usually cheaper than emergency relining during peak irrigation. Log water levels over several still days without inflow or use to help separate evaporation from seepage.",
      ],
    },
    {
      id: "causes",
      heading: "Causes of Dam Lining Failure",
      paragraphs: [
        "UV embrittlement of exposed crest rolls, hoof traffic on unprotected batters, rocky subgrades without geotextile and poor seam welding during the original installation are frequent causes of failure on HDPE systems. PVC ponds fail at folds and penetrations. Torch-on membranes delaminate when moisture was trapped beneath the substrate or flashings were omitted at parapets.",
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
        "Patch repairs use compatible HDPE sheet and extrusion or hot-air welding, with vacuum or air-pressure testing on critical seams where practical. Full relines follow the same preparation standards as new installs: dewatering, subgrade repair, geotextile where needed, anchor trenches and outlet boots detailed to spec.",
      ],
    },
    {
      id: "maintenance",
      heading: "Maintenance Inspections",
      paragraphs: [
        "Annual crest walks, outlet checks and silt management help extend liner life. We offer inspection visits before planting or calving seasons and document findings with photos for insurance or farm records.",
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
        "Call us with photos and your location. We prioritise farms losing irrigation water mid-season; response time depends on location and crew availability.",
    },
    {
      question: "Do you repair steel tank liners too?",
      answer:
        "Yes. Failed PVC lining inside corrugated tanks, corroded outlets and panel leaks are within scope. See our reservoir lining page for steel and concrete options.",
    },
  ],
  relatedLinks: [
    {
      href: "/calculators/#leaking-dam-repair",
      label: "Try the leaking dam repair assessment → Calculator",
    },
    { href: "/dam-liners", label: "Dam Linings" },
    { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
    { href: "/reservoir-lining", label: "Reservoir Lining" },
    { href: "/quote", label: "Request a Dam Repair Quote" },
  ],
  projectDetailMatch: /HDPE|repair|leak/i,
  relatedProjectSlugs: [
    "stellenbosch-hdpe-dam-liner",
    "hoedspruit-bitumen-dam-lining",
    "mpumalanga-torch-on-bitumen-concrete-dam-15m",
  ],
  relatedPostSlugs: [
    "farm-dam-leak-repair",
    "steel-reservoir-leak-repair",
    "prevent-farm-dam-liner-failure",
  ],
  sectionCtaTitle: "Need a Leaking Dam Repair Quote?",
  ctaTitle: "Request a Leaking Dam Assessment",
  ctaDescription:
    "Describe the leak, dam size and location — we will advise on patch, repair or reline options.",
  supportImages: [
    {
      path: IMAGE_PATHS.damLiningRepairMaintenance2,
      alt: "Dam lining repair and maintenance work for water retention",
      caption: "Maintenance work on a dam lining system before repair.",
    },
    {
      path: IMAGE_PATHS.leakingDamRepairAssessment3,
      alt: "Leaking dam repair assessment and maintenance planning by Damtech",
      caption: "Leak assessment and maintenance planning for water storage structures.",
    },
  ],
};

export const RESERVOIR_LINING_PAGE: SubServicePageConfig = {
  slug: "reservoir-lining",
  title: "Reservoir Lining & Relining South Africa | Damtech",
  description:
    "Reline leaking concrete, brick and corrugated steel reservoirs with PVC, HDPE or bitumen systems. Damtech restores watertight storage across South Africa.",
  h1: "Reservoir Lining Contractors",
  image: IMAGE_PATHS.tulbaghWesternCapeSteelWaterTankProject,
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
    "Reservoirs take many forms in South Africa: corrugated galvanised steel tanks on farms, concrete farm dams, process ponds at mines and concrete storage on commercial sites. Each substrate needs a different lining approach. Damtech supplies and installs PVC inside steel tanks, HDPE on prepared earth reservoirs, and torch-on bitumen where rigid concrete walls must be bonded waterproof.",
  benefits: [
    "PVC lining standard on Damtech steel tank builds",
    "HDPE for large earth and process reservoirs",
    "Torch-on for concrete and gunite structures",
    "Relining without replacing sound steel shells",
    "Outlet boots and penetration detailing",
    "Nationwide installation crews",
  ],
  specs: [
    { label: "Steel tanks", value: "550 gsm PVC lining (850 gsm on request), 11 kL–500 kL+" },
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
        "Corrugated galvanised tanks from Damtech include PVC lining, columns, inlet/outlet and overflow as standard. Relining replaces failed PVC without scrapping sound steel. It is common when outlets corrode or when the lining has aged to the point that seams, particularly at the floor, begin to fail.",
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
        "Choose PVC for tank interiors and compact ponds; HDPE for lining areas measured in hectares; bitumen where heat-bonded adhesion to concrete is required. We inspect first rather than defaulting to one catalogue product.",
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
        "Damtech steel reservoirs, in Z275 galvanised steel or AZ150 Aluzinc, are supplied with 550 gsm PVC lining as standard, with 850 gsm available on request. The liner, not the metal coating, is the water barrier. Capacity ranges from 11 kL to 500 kL+ with optional roofs to reduce evaporation.",
    },
    {
      question: "Do you line concrete irrigation reservoirs?",
      answer:
        "Yes — typically with torch-on bitumen on prepared concrete. We assess cracks and moisture before membrane application.",
    },
  ],
  relatedLinks: [
    {
      href: "/calculators/#steel-tank-size",
      label: "Steel Water Tank Size Calculator",
    },
    {
      href: "/shop/#popular-tank-sizes",
      label: "Steel water tank sizes and prices",
    },
    { href: "/dam-liners", label: "Dam Linings" },
    { href: "/pvc-dam-lining", label: "PVC Dam Linings" },
    { href: "/dam-repair-services", label: "Leaking Dam Repair" },
  ],
  projectDetailMatch: /tank|reservoir|steel|HDPE/i,
  relatedProjectSlugs: [
    "mpumalanga-torch-on-bitumen-concrete-dam-15m",
    "tzaneen-torch-on-bitumen-concrete-dam-18m",
    "tulbagh-steel-water-tank",
  ],
  relatedPostSlugs: [
    "steel-reservoir-leak-repair",
    "steel-reservoir-maintenance",
    "reservoir-vegetation-management",
  ],
  sectionCtaTitle: "Need a Reservoir Lining Quote?",
  ctaTitle: "Request Reservoir Lining Quote",
  ctaDescription:
    "Tell us about your steel tank, concrete dam or earth reservoir — we will recommend the right lining system.",
};

export const DAM_LINING_COST_PAGE: SubServicePageConfig = {
  slug: "dam-lining-cost-south-africa",
  title: "Dam Lining Cost South Africa | What Affects Price",
  description:
    "What drives dam lining cost in South Africa: liner type and thickness, dam size, site preparation, access and installation. Request a tailored quote.",
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
    "Clients often ask for a ballpark dam lining price before sharing dam dimensions or photos. An accurate quote requires an understanding of surface area, liner grade, subgrade condition, access for equipment and whether outlets and anchor trenches need rework. Damtech provides tailored quotes after assessment; this page explains the factors so you know what to prepare.",
  benefits: [
    "Quote based on site-specific assessment",
    "Material matched to use — not cheapest roll",
    "Preparation scope included in writing",
    "Thickness options explained (1–2 mm HDPE)",
    "Travel and mobilisation quoted upfront",
    "No generic price-per-m² figures that can mislead budgets",
  ],
  specs: [
    { label: "Primary drivers", value: "Area, liner type, thickness, access" },
    { label: "HDPE", value: "Typically specified 1–2 mm for farm dams" },
    { label: "PVC", value: "550 gsm standard, 850 gsm on request" },
    { label: "Extras", value: "Geotextile, outlets, dewatering, rock fill" },
    { label: "Next step", value: "Free quote from photos; site visit on request" },
  ],
  sections: [
    {
      id: "factors",
      heading: "What Affects Dam Lining Cost?",
      paragraphs: [
        "Surface area is the starting point, but steep batters, rocky subgrades, remote access and existing water in the dam all change crew days and material waste. Outlet penetrations, anchor trenches and crest protection add detail work beyond plain field sheet. Labour and freight to a remote site in Limpopo will differ from a Gauteng farm 40 km from Pretoria.",
      ],
    },
    {
      id: "materials",
      heading: "HDPE vs PVC vs Bitumen Cost Factors",
      paragraphs: [
        "HDPE material can cost more per roll, but it is often chosen for large dams for its UV resistance, longevity and low seepage. PVC can lower material cost on small ponds and tank linings where rolls are manageable. Bitumen torch-on is priced on prepared concrete area and detail complexity — not comparable directly to m² HDPE on earth.",
      ],
    },
    {
      id: "preparation",
      heading: "Dam Size and Surface Preparation",
      paragraphs: [
        "A smooth, compacted subgrade with geotextile costs less to line than a rocky batter that needs padding and hand finishing. Dewatering, silt removal and crest regrading are often the scope items left out of low quotes, which then cause cost overruns mid-project.",
      ],
    },
    {
      id: "access",
      heading: "Access, Slopes and Anchor Trenches",
      paragraphs: [
        "Narrow farm roads, limited loader or crane reach for heavy liner rolls, and steep batters slow production compared with gently sloped dams that have good perimeter access. Anchor trenches at the crest must be specified and included; shallow trenches are a common reason liners pull loose under wind uplift or load.",
      ],
    },
    {
      id: "cheap-fails",
      heading: "Why Cheap Lining Fails",
      paragraphs: [
        "Under-specified thickness, skipped geotextile, poor welding and missing outlet boots can cause leaks within a few seasons, after which relining costs more than doing the job properly once. We quote for inspectable workmanship, not the lowest m² figure on paper.",
      ],
    },
    {
      id: "accurate-quote",
      heading: "How to Request an Accurate Quote",
      paragraphs: [
        "Send dam length and width (or surface m²), photos of batters and crest, intended use, province and whether the dam holds water now. Use our quote form or call us, and we will confirm the next steps: a site visit or a detailed estimate.",
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
        "HDPE material can cost more per m², but on large dams the total project cost should take lifespan, seepage savings and preparation into account, so PVC is not always cheaper overall.",
    },
    {
      question: "Does site visit cost extra?",
      answer:
        "Many assessments are included in our quoting process. Remote sites may include travel in the quote, and we state this upfront.",
    },
  ],
  relatedLinks: [
    {
      href: "/calculators/#dam-lining-area",
      label: "Dam Lining Area Calculator",
    },
    { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
    { href: "/pvc-dam-lining", label: "PVC Dam Linings" },
    { href: "/farm-dam-liners", label: "Farm dam lining and earth dam liners" },
    { href: "/quote", label: "Request a Quote" },
  ],
  projectDetailMatch: /HDPE|m²/i,
  relatedProjectSlugs: [
    "centurion-hdpe-dam-liner",
    "north-west-game-lodge-hdpe-dam-lining",
    "villiersdorp-hdpe-dam-lining",
  ],
  relatedPostSlugs: [
    "dam-lining-sandy-clay-soils",
    "hdpe-dam-liner-benefits",
    "prevent-farm-dam-liner-failure",
  ],
  sectionCtaTitle: "Need a Dam Lining Cost Estimate?",
  ctaTitle: "Request a Tailored Dam Lining Quote",
  ctaDescription:
    "Share dam dimensions, photos and location — we will provide a quote based on your site.",
};

export const CONCRETE_RESERVOIR_REPAIR_PAGE: SubServicePageConfig = {
  slug: "concrete-reservoir-repair",
  title: "Cement Reservoir Repair | Leaking Concrete Dams | Damtech",
  description:
    "Leaking cement reservoir or concrete dam? Damtech restores round cement dams, reservoirs and water tanks with a bonded torch-on bitumen lining. Free quote.",
  h1: "Cement Reservoir Repair & Restoration",
  image: IMAGE_PATHS.torchOnConcreteDam18mTzaneen,
  serviceName: "Cement Reservoir Repair",
  schemaOffers: [
    "Leaking cement reservoir repair",
    "Concrete dam relining with torch-on bitumen",
    "Concrete water tank waterproofing",
    "Round cement dam restoration",
    "Canal and rigid reservoir lining",
  ],
  parent: { href: "/concrete-waterproofing", label: "Concrete Waterproofing" },
  heroEyebrow: "Cement dams · Concrete reservoirs · Water tanks",
  heroDescription:
    "A cracked or seeping cement reservoir can usually be restored instead of rebuilt. Damtech prepares the concrete and lines it with a heat-bonded torch-on bitumen membrane so it holds water again.",
  intro:
    "Round cement dams and concrete reservoirs are on farms, lodges and estates across South Africa, and many of them leak. Hairline cracks, moving joints, a failed coating or a leaking pipe sleeve let water out a little at a time until the level will not hold. If the walls and floor are still structurally sound, the reservoir does not need to be demolished. Damtech cleans and primes the concrete and bonds a torch-on bitumen membrane over the floor and walls, so the membrane holds the water and the concrete only has to carry the load.",
  benefits: [
    "Restores a leaking cement reservoir without rebuilding it",
    "Membrane is heat-bonded to the primed concrete, floor and walls",
    "3 mm and 4 mm torch-on membranes",
    "Laps, corners, outlets and pipe penetrations detailed with extra layers",
    "15–20 year typical service life on well-prepared concrete (conditions apply; not a guarantee)",
    "Supplier-backed material warranty where stated in the quotation",
  ],
  specsHeading: "Cement reservoir repair at a glance",
  specs: [
    { label: "Structures", value: "Round cement dams, concrete reservoirs, water tanks, canals" },
    { label: "System", value: "Torch-on modified bitumen membrane" },
    { label: "Membrane thickness", value: "3 mm and 4 mm" },
    { label: "Typical service life", value: "Typically 15–20 years*" },
    { label: "Before lining", value: "Clean, dry, primed concrete; structural cracks repaired first" },
  ],
  sections: [
    {
      id: "why-cement-reservoirs-leak",
      heading: "Why cement reservoirs and concrete dams leak",
      paragraphs: [
        "Concrete is rigid and the ground under it is not. Seasonal movement, heat and age open cracks in the floor and at the joint where the wall meets the floor. Older plaster and cement coatings lose their bond and let water in behind them, and pipes cast through the wall often leak around the sleeve.",
        "The signs are a water level that drops when nothing is being used, wet patches or white salt stains on the outside of the wall, and green growth along a crack line. The sooner it is assessed the smaller the repair, because water moving through a crack keeps widening it.",
      ],
    },
    {
      id: "dam-sealer-or-lining",
      heading: "Dam sealer or a bonded lining?",
      paragraphs: [
        "Pour-in dam sealers and brush-on cement coatings are sold for leaking dams. They can help where seepage is slow and spread across a surface. They are a poor match for a rigid reservoir with cracks or joints that move, because a thin coating cracks again when the concrete moves.",
        "A torch-on bitumen membrane is a continuous sheet, 3 mm or 4 mm thick, bonded to the concrete and lapped at every joint. It bridges hairline cracks and moves with the structure. That is why we recommend relining when a cement reservoir has already been patched or sealed and is leaking again.",
      ],
    },
    {
      id: "how-we-restore",
      heading: "How Damtech restores a cement reservoir",
      paragraphs: [
        "We start with photos or a site visit to check that the walls and floor are sound and to find where the water is getting out. The reservoir is emptied, cleaned and left to dry. Loose plaster and failed coatings are removed, and the concrete is primed.",
        "The membrane is then torched on in planned runs across the floor and up the walls, with continuous laps. Corners, the wall-to-floor joint, outlets and pipe penetrations get extra layers, because that is where rigid reservoirs leak first. Torch-on is hot work and is done by trained applicators with fire precautions in place.",
      ],
    },
    {
      id: "when-structural-repair-comes-first",
      heading: "When structural repair comes first",
      paragraphs: [
        "A membrane waterproofs the reservoir. It does not hold a failing wall together. Wide or stepped cracks, bulging walls and exposed or rusting reinforcing steel must be repaired before lining, and we say so in the written quote before any work starts.",
        "Where the concrete is past saving, a corrugated steel reservoir with a PVC liner can be the more economical replacement. We quote that as a separate option so you can compare the two.",
      ],
    },
    {
      id: "what-we-need-to-quote",
      heading: "What we need to quote",
      paragraphs: [
        "Send the diameter (or length and width), the wall height, photos of the inside and outside, and the town. Tell us what the water is used for and whether the reservoir can be emptied. Most cement reservoir repairs can be priced from that; larger or badly cracked structures are inspected on site first.",
      ],
    },
  ],
  faqs: [
    {
      question: "Can a leaking cement reservoir be repaired without rebuilding it?",
      answer:
        "Usually, if the walls and floor are structurally sound. The concrete is cleaned, dried and primed, and a torch-on bitumen membrane is bonded over the floor and walls so the membrane holds the water. Severely cracked or unstable structures need structural repair first.",
    },
    {
      question: "Will a dam sealer fix my cement dam?",
      answer:
        "It may slow a small, spread-out seep. It is unlikely to last on cracks or joints that move, because a thin coating cracks again with the concrete. A bonded 3 mm or 4 mm torch-on membrane bridges hairline cracks and is the more durable repair for a rigid reservoir.",
    },
    {
      question: "How long does a torch-on lining last in a cement reservoir?",
      answer:
        "Typically 15–20 years on well-prepared concrete. That is a typical range, not a guarantee; it depends on the surface preparation, sun exposure and how the reservoir is used and maintained. Warranty terms are set out in the written quote.",
    },
    {
      question: "Does the reservoir have to be empty?",
      answer:
        "Yes. The concrete must be clean and dry for the primer and membrane to bond, so the reservoir is drained and dried before work starts. Tell us if stock or irrigation depends on it and we will plan the work around a temporary supply.",
    },
    {
      question: "Do you repair concrete water tanks and canals too?",
      answer:
        "Yes. The same torch-on system is used on concrete water tanks, irrigation canals and other rigid water-retaining structures. Earth dams are different: they are lined with HDPE or PVC.",
    },
    {
      question: "Which areas do you cover?",
      answer:
        "Damtech works nationwide. Completed torch-on reservoir work includes an 18 m round concrete dam near Tzaneen and a 550 m² cement dam at Hoedspruit. Send your location and photos for a quote.",
    },
  ],
  relatedLinks: [
    { href: "/concrete-waterproofing", label: "Concrete waterproofing" },
    { href: "/torch-on-dam-lining", label: "Torch-on dam lining: the system" },
    { href: "/reservoir-lining", label: "Reservoir lining and relining" },
    { href: "/dam-repair-services", label: "Leaking dam repair (lined earth dams)" },
    { href: "/steel-water-storage-tanks", label: "Steel water tanks, if replacement is cheaper" },
    {
      href: "/calculators/#waterproofing-area",
      label: "Estimate the area to be lined",
    },
  ],
  projectDetailMatch: /Bitumen/i,
  relatedProjectSlugs: [
    "tzaneen-torch-on-bitumen-concrete-dam-18m",
    "hoedspruit-bitumen-dam-lining",
  ],
  relatedPostSlugs: ["farm-dam-leak-repair", "farm-dam-water-saving-tips"],
  projectsSectionTitle: "Cement reservoir and concrete dam projects",
  sectionCtaTitle: "Leaking cement reservoir?",
  ctaTitle: "Request a Cement Reservoir Repair Quote",
  ctaDescription:
    "Send the size, photos and location of your cement reservoir or concrete dam. We will tell you whether it can be restored and what it involves.",
};

export const CONCRETE_WATERPROOFING_PAGE: SubServicePageConfig = {
  slug: "concrete-waterproofing",
  title: "Concrete Waterproofing | Reservoirs, Dams & Tanks | Damtech",
  description:
    "Concrete waterproofing for reservoirs, cement dams, water tanks, canals and retaining walls. Bonded torch-on bitumen membranes, installed in South Africa.",
  h1: "Concrete Waterproofing",
  image: IMAGE_PATHS.bitumenTorchOnWaterproofingDamtech,
  serviceName: "Concrete Waterproofing",
  schemaOffers: [
    "Concrete reservoir waterproofing",
    "Cement dam waterproofing",
    "Concrete water tank waterproofing",
    "Canal lining",
    "Retaining wall and slab waterproofing",
  ],
  parent: { href: "/services", label: "Services" },
  heroEyebrow: "Bitumen torch-on · Water-retaining concrete",
  heroDescription:
    "Damtech waterproofs concrete that has to hold water or keep it out: reservoirs, cement dams, water tanks, canals, retaining walls and slabs. We use a bonded torch-on bitumen membrane, or a liquid system where the detail calls for it.",
  intro:
    "Concrete is strong but it is not waterproof. It cracks as it cures and moves with heat and with the ground under it, and water finds every crack and joint. Waterproofing puts a continuous membrane over the concrete so the membrane, not the concrete, stops the water. Damtech's main system for concrete is a torch-on modified bitumen membrane, heat-bonded to the primed surface and lapped at every joint.",
  benefits: [
    "One contractor for reservoirs, cement dams, tanks, canals, walls and slabs",
    "Torch-on membrane bonded to primed concrete",
    "3 mm and 4 mm membranes",
    "Liquid-applied systems where torch-on does not suit the detail",
    "Written quote that names the system and why",
    "Supplier-backed material warranty where stated in the quotation",
  ],
  specsHeading: "Concrete waterproofing at a glance",
  specs: [
    { label: "Water-retaining", value: "Reservoirs, cement dams, water tanks, canals" },
    { label: "Keeping water out", value: "Retaining walls, foundations, flat concrete roofs" },
    { label: "Main system", value: "Torch-on modified bitumen, 3 mm and 4 mm" },
    { label: "Preparation", value: "Clean, dry, primed concrete" },
    { label: "Warranty", value: "Confirmed per project in the written quote" },
  ],
  sections: [
    {
      id: "what-we-waterproof",
      heading: "Concrete structures we waterproof",
      paragraphs: [
        "Most of our concrete waterproofing is on structures that hold water: round cement dams, concrete reservoirs, water tanks and irrigation canals on farms, lodges, estates and commercial sites. A leaking cement reservoir is usually restored by relining it, not rebuilt; that work has its own page.",
        "We also waterproof concrete that has to keep water out: retaining walls, foundation walls and flat concrete roof slabs. For houses, see the home waterproofing pages, which cover roofs, damp and balconies.",
      ],
    },
    {
      id: "membrane-or-coating",
      heading: "Membrane, cementitious coating or sealer?",
      paragraphs: [
        "Cementitious coatings and sealers are brushed or sprayed onto the concrete and form a thin, rigid layer. They work on sound concrete that does not move. When the concrete cracks, the coating cracks with it.",
        "A torch-on membrane is a flexible bitumen sheet, 3 mm or 4 mm thick, bonded to the surface with continuous laps. It bridges hairline cracks and tolerates movement, which is why we use it on reservoirs, dams and canals. Where there are many pipes or awkward shapes, a reinforced liquid-applied system can be the neater answer. We assess the structure and name the system in the quote.",
      ],
    },
    {
      id: "how-it-is-done",
      heading: "How concrete waterproofing is done",
      paragraphs: [
        "Preparation decides whether the system lasts. The concrete is cleaned, loose or failed material is removed, and the surface is dried and primed. The membrane is torched on with overlapped, sealed laps, and corners, joints, outlets and penetrations are detailed with extra layers.",
        "Torch-on is hot work with an open flame. It is carried out by trained applicators with fire precautions, and it is not used where the flame is a risk.",
      ],
    },
    {
      id: "cost",
      heading: "What concrete waterproofing costs",
      paragraphs: [
        "The price depends on the area, the condition of the concrete, access and how much preparation and detailing is needed, so we do not publish a rate per square metre. Send the dimensions, photos and location and you will get a written quote that sets out the work, the system and the warranty terms.",
      ],
    },
  ],
  faqs: [
    {
      question: "What is the best waterproofing for concrete that holds water?",
      answer:
        "For reservoirs, cement dams, tanks and canals we recommend a bonded torch-on bitumen membrane, because it is flexible, continuous and bridges hairline cracks. Thin rigid coatings tend to crack again when the concrete moves.",
    },
    {
      question: "Can you waterproof old or cracked concrete?",
      answer:
        "Often, once the concrete has been assessed. Hairline cracks are bridged by the membrane. Wide, stepped or moving cracks and damaged reinforcing need structural repair first, and the quote says so before work starts.",
    },
    {
      question: "Is torch-on bitumen suitable for drinking water?",
      answer:
        "Tell us if the water is for human consumption. Suitability depends on the membrane specified and any treatment or testing you require, and we confirm it in the quote rather than assume it.",
    },
    {
      question: "Do you waterproof concrete roofs and retaining walls?",
      answer:
        "Yes. Flat concrete roofs, retaining walls and foundation walls are waterproofed with torch-on or a liquid-applied system, depending on the surface. Home roofs and damp problems are quoted through our home waterproofing service.",
    },
    {
      question: "What warranty applies?",
      answer:
        "Up to 10 years supplier-backed material warranty where stated in the quotation, plus 12 months Damtech workmanship warranty from practical completion unless otherwise agreed in writing. Coverage, exclusions and maintenance requirements are confirmed per project.",
    },
  ],
  relatedLinks: [
    { href: "/concrete-reservoir-repair", label: "Cement reservoir repair and restoration" },
    { href: "/torch-on-dam-lining", label: "Torch-on dam lining" },
    { href: "/reservoir-lining", label: "Reservoir lining" },
    { href: "/waterproofing/", label: "Home waterproofing services" },
    { href: "/foundation-waterproofing/", label: "Foundation and retaining wall waterproofing" },
    { href: "/torch-on-waterproofing/", label: "Torch-on waterproofing guide" },
  ],
  projectDetailMatch: /Bitumen/i,
  relatedProjectSlugs: [
    "tzaneen-torch-on-bitumen-concrete-dam-18m",
    "hoedspruit-bitumen-dam-lining",
  ],
  projectsSectionTitle: "Concrete waterproofing projects",
  sectionCtaTitle: "Need concrete waterproofed?",
  ctaTitle: "Request a Concrete Waterproofing Quote",
  ctaDescription:
    "Tell us what the structure is, its size and location, and send photos. We will recommend a system and give you a written quote.",
};

export const SUB_SERVICE_PAGES: SubServicePageConfig[] = [
  HDPE_DAM_LINING_PAGE,
  PVC_DAM_LINING_PAGE,
  TORCH_ON_DAM_LINING_PAGE,
  DAM_REPAIR_SERVICES_PAGE,
  RESERVOIR_LINING_PAGE,
  DAM_LINING_COST_PAGE,
  CONCRETE_RESERVOIR_REPAIR_PAGE,
  CONCRETE_WATERPROOFING_PAGE,
];

export function getSubServicePage(slug: string): SubServicePageConfig | undefined {
  return SUB_SERVICE_PAGES.find((page) => page.slug === slug);
}

export function getSubServiceSlugs(): string[] {
  return SUB_SERVICE_PAGES.map((page) => page.slug);
}
