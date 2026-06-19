export type LocalFaqItem = {
  question: string;
  answer: string;
};

export type LocalLandingPage = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  heroDescription: string;
  image: string;
  serviceName: string;
  intro: string;
  useCase: string;
  terrain: string;
  industry: string;
  waterNeed: string;
  services: string[];
  faqs: LocalFaqItem[];
};

const STANDARD_LINKS = [
  { href: "/dam-liners", label: "Dam Liners" },
  { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
  { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
  { href: "/contact", label: "Contact" },
  { href: "/quote", label: "Request a Quote" },
] as const;

export const LOCAL_LANDING_PAGES: LocalLandingPage[] = [
  {
    slug: "pretoria-dam-liners",
    title: "Pretoria Dam Liners & Water Storage | Damtech",
    description:
      "HDPE and PVC dam liners, steel tanks and waterproofing in Pretoria and Gauteng. Damtech supplies and installs farm and commercial water-storage solutions.",
    h1: "Dam Liners & Water Storage in Pretoria",
    heroDescription:
      "Serving Pretoria, Centurion and surrounding Gauteng with HDPE dam liners, reservoir repairs and steel water tanks for farms, estates and commercial sites.",
    image: "/images/hdpe-dam-liner-farm-water-storage.webp",
    serviceName: "Dam Liner Installation — Pretoria",
    intro:
      "Pretoria’s mix of established farms, smallholdings and expanding commercial developments creates steady demand for reliable earth dam and reservoir lining. Seasonal thunderstorms can fill dams quickly, but iron-rich soils and clay pockets often allow seepage without a proper liner.",
    useCase:
      "Typical Pretoria projects include irrigation dams on smallholdings, livestock water storage on peri-urban farms, and lined balancing dams for estates and light industrial sites that harvest rainwater.",
    terrain:
      "The Highveld around Pretoria features clay-loam soils, quartzite ridges and areas of shallow weathered rock. Liner selection must account for ground movement, puncture risk on prepared subgrades and UV exposure on exposed embankments.",
    industry:
      "Agriculture, game breeding, equestrian properties and commercial landscaping irrigation are common clients in the greater Tshwane area.",
    waterNeed:
      "Clients need to retain borehole and stormwater in earth dams through dry winters, reduce municipal dependence and protect stored water quality for livestock and irrigation.",
    services: [
      "HDPE and PVC dam liner supply and installation",
      "Corrugated steel tanks for compact sites",
      "Bitumen waterproofing for concrete reservoirs and roofs",
      "Leak detection and reservoir repair",
    ],
    faqs: [
      {
        question: "Do you install dam liners in Pretoria and Centurion?",
        answer:
          "Yes. Damtech works across Gauteng including Pretoria, Centurion and surrounding districts. Contact us with your dam dimensions for a site-specific quote.",
      },
      {
        question: "Which liner is best for Highveld clay soils?",
        answer:
          "HDPE is often preferred for large earth dams because it handles ground movement and offers excellent UV resistance. PVC can suit smaller ponds and steel tanks. We assess your soil and dam profile on site.",
      },
    ],
  },
  {
    slug: "johannesburg-dam-liners",
    title: "Johannesburg Dam Liners & Reservoir Solutions | Damtech",
    description:
      "Dam liner contractors in Johannesburg and Gauteng — HDPE lining, steel water tanks and waterproofing for farms, mines and commercial water storage.",
    h1: "Dam Liners & Reservoir Solutions in Johannesburg",
    heroDescription:
      "Johannesburg and West Rand clients rely on Damtech for dam liners, tank installations and waterproofing where water security and compliance matter.",
    image: "/images/corrugated-steel-water-tank-installation.webp",
    serviceName: "Dam Liner Installation — Johannesburg",
    intro:
      "Johannesburg’s water pressures — municipal restrictions, mining legacy landscapes and rapid development on the urban edge — make on-site water storage a practical priority rather than a luxury.",
    useCase:
      "Projects range from agricultural dams on the West Rand to steel reservoirs at logistics and industrial yards, and waterproofing of concrete fire and process-water structures.",
    terrain:
      "Surrounding areas include dolomitic land, disturbed mine footprints and deep sandy soils. Each demands different subgrade preparation, geotextile protection and anchoring detail.",
    industry:
      "Mining support services, agribusiness on the city fringe, commercial estates and industrial facilities frequently require lined storage or tank farms.",
    waterNeed:
      "Stored water buffers load-shedding pump downtime, supplements restricted municipal supply and supports dust suppression and process water on industrial sites.",
    services: [
      "HDPE lining for earth and process dams",
      "Steel tank farms for industrial yards",
      "Bitumen torch-on for concrete structures",
      "Leak repair on existing reservoirs",
    ],
    faqs: [
      {
        question: "Can Damtech line dams near Johannesburg industrial sites?",
        answer:
          "Yes. We assess water chemistry, access and safety requirements for industrial and mining-related storage. Share your site details when requesting a quote.",
      },
      {
        question: "Are steel tanks suitable where dam space is limited?",
        answer:
          "Corrugated steel reservoirs are ideal when footprint is constrained. Capacities from 11 kL to 500 kL+ can be configured with PVC lining and optional roofs.",
      },
    ],
  },
  {
    slug: "limpopo-dam-liners",
    title: "Limpopo Dam Liners | Farm & Game Reserve Lining | Damtech",
    description:
      "Dam liners in Limpopo for farms, citrus estates and game reserves. HDPE and bitumen lining to reduce seepage in warm, low-rainfall districts.",
    h1: "Dam Liners for Limpopo Farms & Game Reserves",
    heroDescription:
      "Hoedspruit, Tzaneen and the wider Limpopo Lowveld and Bushveld — Damtech installs liners that stand up to heat, wildlife and long dry seasons.",
    image: "/images/bitumen-waterproofing-roof-reservoir-repair.webp",
    serviceName: "Dam Liner Installation — Limpopo",
    intro:
      "Limpopo’s agricultural and tourism economies depend on dependable farm dams and lodge reservoirs. Low seasonal rainfall and high evaporation make seepage control essential.",
    useCase:
      "Citrus and mango irrigation dams, game-lodge wildlife water holes, cattle posts and community agricultural schemes commonly require new HDPE installs or bitumen refurbishment of cement dams.",
    terrain:
      "Granite sandy soils, basalt plains and alluvial river pockets each influence liner choice. Wildlife traffic near dam edges requires protective detailing and fencing where needed.",
    industry:
      "Fruit farming, game tourism, cattle ranching and emerging irrigation schemes dominate water-storage needs in the province.",
    waterNeed:
      "Reliable stored water supports irrigation scheduling through dry months, maintains game water points and reduces costly borehole pumping.",
    services: [
      "HDPE earth dam lining",
      "Bitumen torch-on for cement dams",
      "Leak repair on existing reservoirs",
      "Steel tanks for lodge and farm backup storage",
    ],
    faqs: [
      {
        question: "What liner works best in hot Limpopo conditions?",
        answer:
          "HDPE offers strong UV resistance for large earth dams. Bitumen torch-on suits rigid cement structures. We recommend materials based on dam type, size and exposure.",
      },
      {
        question: "Do you work on game lodge dams?",
        answer:
          "Yes. Lodge dams often need liners that handle fluctuating levels and animal activity. We plan access, anchoring and protection zones during installation.",
      },
    ],
  },
  {
    slug: "mpumalanga-dam-liners",
    title: "Mpumalanga Dam Liners & Steel Tanks | Damtech",
    description:
      "Dam liners and steel water tanks in Mpumalanga for farms, forestry and mining. HDPE lining and reservoir installation across the Highveld and Lowveld.",
    h1: "Dam Liners & Steel Tanks in Mpumalanga",
    heroDescription:
      "From Witbank coal-belt operations to Lowveld sugar and forestry irrigation — Damtech delivers lining and tank solutions built for Mpumalanga conditions.",
    image: "/images/corrugated-steel-water-tank-installation.webp",
    serviceName: "Water Storage Solutions — Mpumalanga",
    intro:
      "Mpumalanga combines intensive agriculture, forestry and mining activity with variable rainfall between the Highveld and Lowveld. Both earth dams and steel tank farms play a role in water security.",
    useCase:
      "Forestry irrigation dams, sugar-cane farm storage, mining process-water dams and multi-tank steel installations for operational yards are typical Damtech engagements in the province.",
    terrain:
      "Highveld grassland with shallow soils transitions to rugged Lowveld valleys. Mining-disturbed ground may need engineered subgrades before liner deployment.",
    industry:
      "Mining, sugar, forestry, cattle and mixed crop farming drive demand for lined storage and modular steel reservoirs.",
    waterNeed:
      "Operations need compliant process-water containment, irrigation reserves through dry spells and backup storage when borehole yield drops.",
    services: [
      "HDPE dam lining for irrigation and process dams",
      "Corrugated steel tank supply and installation",
      "Reservoir leak repair and relining",
      "Bitumen waterproofing for concrete structures",
    ],
    faqs: [
      {
        question: "Has Damtech installed tanks in Witbank / eMalahleni?",
        answer:
          "Yes. We have supplied and installed multiple 60 kL steel tanks in the Witbank area for on-site water storage. Contact us for similar configurations.",
      },
      {
        question: "Can liners be installed on mining-related dams?",
        answer:
          "We assess water chemistry, embankment stability and safety requirements before recommending HDPE or alternative lining approaches.",
      },
    ],
  },
  {
    slug: "western-cape-dam-liners",
    title: "Western Cape Dam Liners | Agricultural Lining | Damtech",
    description:
      "HDPE dam liners in the Western Cape for vineyards, fruit farms and livestock. Reduce seepage on farm dams in Stellenbosch, Grabouw and rural districts.",
    h1: "Dam Liners for the Western Cape",
    heroDescription:
      "Wine, fruit and livestock farms across the Western Cape trust Damtech for HDPE dam lining that protects scarce summer water for irrigation and stock.",
    image: "/images/blog/hdpe-dam-liner-installation-farm-dam.webp",
    serviceName: "HDPE Dam Liner Installation — Western Cape",
    intro:
      "Western Cape agriculture faces well-documented water constraints. Farm dams are central to capturing winter rainfall and managing irrigation through dry, windy summers.",
    useCase:
      "Vineyard and orchard irrigation dams, livestock dams on grain and livestock farms, and estate storage in mountainous valleys are common lining projects.",
    terrain:
      "Mountain catchments, sandstone-derived soils and alluvial valley floors each present different subgrade preparation needs. Wind exposure on ridgeline dams increases evaporation pressure on stored water.",
    industry:
      "Wine, deciduous fruit, livestock and mixed cropping dominate lining demand, alongside rural lifestyle and equine properties.",
    waterNeed:
      "Farmers need every winter litre retained for summer irrigation. HDPE lining materially reduces seepage through porous soils and weathered rock.",
    services: [
      "Large-area HDPE farm dam lining",
      "PVC lining for ponds and smaller reservoirs",
      "Steel tanks where dam expansion is not feasible",
      "Maintenance and leak repair on existing liners",
    ],
    faqs: [
      {
        question: "Do you have Western Cape project experience?",
        answer:
          "Yes. Damtech has completed HDPE installations including large farm dams in Stellenbosch (13,360 m²) and Grabouw (10,520 m²). See our projects section for examples.",
      },
      {
        question: "When is the best time to line a farm dam in the Cape?",
        answer:
          "Installation is easiest when water levels are low, typically late summer into autumn. Plan ahead so lining is complete before the winter refill season.",
      },
    ],
  },
  {
    slug: "farm-dam-liners",
    title: "Farm Dam Liners South Africa | HDPE & PVC | Damtech",
    description:
      "Farm dam liners across South Africa — HDPE, PVC and bitumen options to stop seepage, protect irrigation water and support livestock on agricultural properties.",
    h1: "Farm Dam Liners for South African Agriculture",
    heroDescription:
      "Stop losing irrigation and livestock water to seepage. Damtech installs farm dam liners tailored to soil type, dam size and how you use stored water.",
    image: "/images/blog/bonsmara-cattle-beside-hdpe-lined-farm-dam.webp",
    serviceName: "Farm Dam Liner Installation",
    intro:
      "Unlined farm dams can lose significant water through seepage and poor embankment soils — water that farmers cannot afford to waste during drought or municipal restrictions.",
    useCase:
      "Cattle and game watering dams, centre-pivot irrigation storage, orchard and vineyard dams, and backup storage linked to boreholes are all common applications.",
    terrain:
      "South African farms span sandy Bushveld, heavy clay Highveld, Karoo shale and Cape sandstone. Liner thickness, underlay and anchoring vary accordingly.",
    industry:
      "Commercial agriculture, game farming and mixed smallholder operations benefit from lining that extends the useful life of existing earth dams without rebuilding.",
    waterNeed:
      "Retain winter rainfall, reduce borehole pumping costs and maintain livestock welfare with dependable on-farm water through dry months.",
    services: [
      "HDPE lining for large farm earth dams",
      "PVC for ponds and smaller reservoirs",
      "Bitumen torch-on for cement farm dams",
      "Leak repair and liner patch work",
    ],
    faqs: [
      {
        question: "How much water can a farm dam liner save?",
        answer:
          "Savings depend on soil permeability and dam size. Lining eliminates most seepage losses — often the largest avoidable loss after evaporation on porous dams.",
      },
      {
        question: "Can existing farm dams be lined without rebuilding?",
        answer:
          "In most cases yes. We drain or lower water levels, prepare the bed and install HDPE or alternative liners over the prepared profile.",
      },
    ],
  },
  {
    slug: "mining-dam-liners",
    title: "Mining Dam Liners & Process Water Containment | Damtech",
    description:
      "HDPE dam liners for mining and industrial process-water containment in South Africa. Lining solutions for seepage control and regulatory water management.",
    h1: "Mining Dam Liners & Process Water Containment",
    heroDescription:
      "Contain process and stormwater on mining and industrial sites with HDPE lining engineered for chemical resistance, puncture protection and long service life.",
    image: "/images/hdpe-dam-liner-farm-water-storage.webp",
    serviceName: "Mining Dam Liner Installation",
    intro:
      "Mining and heavy industrial operations require dependable containment for process water, runoff and storage dams. Seepage can affect compliance, neighbouring land and operational continuity.",
    useCase:
      "Process-water dams, stormwater attenuation ponds, heap-leach related containment and refurbishment of existing earth structures are typical applications.",
    terrain:
      "Disturbed overburden, compacted pads and rocky cuttings demand geotextile protection, careful compaction and sometimes thicker HDPE grades.",
    industry:
      "Coal, quarrying, metals processing and industrial minerals operations use lined containment as part of water management plans.",
    waterNeed:
      "Containment protects groundwater, supports recycling of process water and provides auditable storage capacity for environmental management.",
    services: [
      "HDPE lining for process and stormwater dams",
      "Subgrade preparation and geotextile supply",
      "Leak survey and repair on existing lined dams",
      "Steel tanks for supplementary process storage",
    ],
    faqs: [
      {
        question: "Is HDPE suitable for mining process water?",
        answer:
          "HDPE offers broad chemical resistance, but water chemistry must be reviewed for each site. Share analysis data when requesting a specification.",
      },
      {
        question: "Can Damtech work around active operations?",
        answer:
          "We plan installation phases around site access, safety protocols and production schedules. Early engagement helps align timelines.",
      },
    ],
  },
  {
    slug: "agricultural-water-storage",
    title: "Agricultural Water Storage Solutions | Damtech South Africa",
    description:
      "Agricultural water storage with HDPE dam liners and steel tanks. Integrated solutions for irrigation, livestock and borehole backup across South Africa.",
    h1: "Agricultural Water Storage Solutions",
    heroDescription:
      "Combine earth dams, steel reservoirs and waterproofing into a practical water-security plan for South African farms and agribusiness.",
    image: "/images/damtech-dam-liners-water-storage-solutions.webp",
    serviceName: "Agricultural Water Storage",
    intro:
      "Modern farms need more than a single dam — they need a storage strategy that links boreholes, rainfall harvest, irrigation scheduling and livestock supply through dry years.",
    useCase:
      "Integrated systems may include a primary lined irrigation dam, steel backup tanks near paddocks, and waterproofed cement reservoirs for packhouse or dairy use.",
    terrain:
      "From irrigated Lowveld fruit belts to dryland livestock regions, storage design must match rainfall patterns, soil permeability and pumping infrastructure.",
    industry:
      "Fruit, grain, livestock, sugar and mixed irrigation agriculture all benefit from reduced seepage and modular steel capacity where earth dams are impractical.",
    waterNeed:
      "Secure summer irrigation, maintain stock water during drought and buffer borehole downtime during load-shedding.",
    services: [
      "HDPE farm dam lining",
      "Corrugated steel irrigation reservoirs",
      "Borehole-linked storage planning",
      "Leak repair and preventative maintenance",
    ],
    faqs: [
      {
        question: "Should I choose a dam liner or steel tank for my farm?",
        answer:
          "Large catchment areas suit earth dams with HDPE lining. Steel tanks work well for smaller volumes, elevated sites or phased expansion. We help size the right option.",
      },
      {
        question: "Can Damtech assist with both dams and tanks on one farm?",
        answer:
          "Yes. Many clients combine lined farm dams with steel backup tanks. We quote each element based on your integrated water plan.",
      },
    ],
  },
];

export function getLocalPageBySlug(slug: string): LocalLandingPage | undefined {
  return LOCAL_LANDING_PAGES.find((page) => page.slug === slug);
}

export function getLocalPageSlugs(): string[] {
  return LOCAL_LANDING_PAGES.map((page) => page.slug);
}

export const LOCAL_PAGE_LINKS = STANDARD_LINKS;
