export type ServiceFaqItem = {
  question: string;
  answer: string;
};

/** Offer names for Service JSON-LD `hasOfferCatalog` on each service page. */
export const DAM_LINERS_SCHEMA_OFFERS = [
  "1 mm HDPE dam lining installation",
  "1.5 mm HDPE dam lining installation",
  "2 mm HDPE dam lining installation",
  "PVC dam lining installation",
  "Bitumen torch-on dam lining",
] as const;

export const STEEL_TANKS_SCHEMA_OFFERS = [
  "Corrugated steel tank supply",
  "PVC-lined reservoir installation",
  "Steel tank roof installation",
  "Reservoir leak repair and relining",
] as const;

export const SERVICES_HUB_SCHEMA_OFFERS = [
  "HDPE dam lining installation",
  "Corrugated steel water tank installation",
  "Bitumen waterproofing",
  "Leak repair and maintenance",
] as const;

export const MINING_LINERS_SCHEMA_OFFERS = [
  "HDPE mining pond lining",
  "Tailings dam geomembrane installation",
  "Process water containment lining",
  "Leak detection and liner repair",
] as const;

export const AGRICULTURAL_STORAGE_SCHEMA_OFFERS = [
  "Farm dam HDPE lining",
  "Irrigation reservoir installation",
  "Corrugated steel tank supply",
  "Borehole and dam water integration",
] as const;

export type ServiceSection = {
  heading: string;
  id?: string;
  /** Optional short label above the heading. Omit rather than repeating a generic label. */
  eyebrow?: string;
  paragraphs: string[];
};

export const DAM_LINERS_CONTENT = {
  intro:
    "Damtech supplies and installs HDPE, PVC and torch-on dam linings for earth dams, reservoirs, ponds and water storage applications across South Africa. Correctly specified geomembranes greatly reduce seepage through clay and sandy soils, help protect groundwater and keep stored water available for irrigation, livestock and firefighting when boreholes or municipal supply are under pressure.",
  sections: [
    {
      id: "why-liners",
      heading: "Why Dam Linings Matter in South Africa",
      paragraphs: [
        "Rainfall in much of the country is seasonal and unpredictable. Farmers buffer dry months by storing runoff and borehole water in farm dams, but an unlined dam on permeable soil can lose a substantial share of its volume to seepage. In Limpopo, Mpumalanga and the Western Cape, many clients combine HDPE-lined earth dams with corrugated steel tanks so irrigation and stock water continue through droughts and load-shedding.",
        "Dam linings also keep stored water separate from salts, iron and sediment in the dam floor, which matters where water is pumped to pivots, drip lines or drinking troughs. For mining and industrial sites, geomembrane lining helps meet containment requirements and reduces the risk of uncontrolled seepage into surrounding land.",
      ],
    },
    {
      heading: "Choosing the Right Dam Lining for Your Dam",
      paragraphs: [
        "HDPE geomembrane is our first choice for large farm and mining dams where UV exposure, chemical resistance and long service life matter. PVC suits smaller ponds, cement reservoirs and steel tanks where flexibility and cost per square metre are priorities. Bitumen torch-on works well on prepared cement or gunite surfaces where a heat-welded bond to the substrate is required.",
        "Thickness, seam design and anchor trench detail depend on dam depth, slope angle and whether livestock will access the water. We measure your dam, review soil conditions and recommend a lining spec before quoting — not a one-size-fits-all approach.",
      ],
    },
    {
      // TODO(business-confirm): add published price ranges only if the business confirms them in writing.
      id: "dam-lining-cost",
      heading: "What does dam lining cost?",
      paragraphs: [
        "Dam lining cost depends on project-specific factors rather than a single square-metre rate. The main drivers are lined surface area, liner thickness and material type, site access for plant and crew, surface preparation (rock removal, grading and compaction) and anchor trenching at the crest and around penetrations.",
        "Remote sites, steep batters, rocky subgrades or complex outlet detailing increase labour and preparation time. Share approximate dimensions and photos for a free quote, so that we can price the work for your dam rather than quote a generic catalogue figure.",
      ],
    },
    {
      heading: "Our Dam Lining Installation Process",
      paragraphs: [
        "Every project starts with a site visit or detailed drawings: dam capacity, freeboard, inlet/outlet positions and access for equipment. We prepare the subgrade (removing rock, grading batters and compacting where needed) and then deploy liner panels, weld them on site and test the seams.",
        "Anchoring at the crest, around pipes and at the toe is completed to manufacturer standards. Where required we install geotextile underlay for puncture protection on rocky or stony ground. After installation we flood-test or inspect before handover, and we explain simple maintenance checks you can do after seasonal rains.",
      ],
    },
    {
      heading: "Industries and Applications We Line",
      paragraphs: [
        "Agricultural clients use our dam linings on irrigation dams, cattle and game drinking dams, and balancing ponds for borehole systems. Mining and industrial sites specify HDPE for process water, runoff control and tailings-related containment. Estates, lodges and commercial nurseries line ornamental ponds and storage dams where leaks would damage landscaping or neighbouring properties.",
        "We also reline existing dams where an older PVC or bitumen membrane has reached end of life, and patch or extend linings after earthworks or dam wall upgrades.",
      ],
    },
    {
      heading: "When to Repair or Replace Dam Linings",
      paragraphs: [
        "Persistent wet patches on the downstream face of a dam wall, unexplained water-level drops and visible liner damage at the waterline are signs that action is needed. Small punctures can often be welded or patched if caught early; widespread UV embrittlement or seam failure usually means a planned reline.",
        "If you are expanding dam capacity or reshaping batters, it is often more economical to install new lining sections during that earthworks phase than to patch repeatedly afterwards. Our team can assess whether repair or full replacement is the practical route.",
      ],
    },
  ] satisfies ServiceSection[],
  faqs: [
    {
      question: "How long does an HDPE dam lining last in South Africa?",
      answer:
        "With correct installation, UV-stable HDPE typically performs for 20–30 years on farm dams. This is a typical range, not a guarantee; lifespan depends on thickness, UV exposure, water chemistry, maintenance and whether livestock or machinery contact the liner. A supplier-backed material warranty may apply on qualifying materials where stated in the quotation, subject to the supplier’s terms.",
    },
    {
      question: "Can you line an existing farm dam without rebuilding it?",
      answer:
        "Yes, in most cases. We lower the water level, prepare exposed surfaces and install liner panels to fit the current profile. Very steep or unstable walls may need minor reshaping first. Contact us with photos and approximate dimensions for an initial assessment.",
    },
    {
      question: "What is the difference between HDPE and PVC dam linings?",
      answer:
        "HDPE is stiffer, more UV- and chemical-resistant and better suited to large earth dams and mining applications. PVC is more flexible and often used in steel tanks, small ponds and cement reservoirs. We recommend based on dam size, soil and how the water will be used.",
    },
    {
      question: "Do you install dam linings outside Gauteng?",
      answer:
        "Yes. Damtech works nationally on agricultural, mining and commercial projects. Travel and mobilisation are factored into quotes for sites in Limpopo, Mpumalanga, the Western Cape and other provinces.",
    },
    {
      question: "Can a dam lining be combined with a steel reservoir?",
      answer:
        "Many clients store high-quality borehole water in a lined steel tank for household or irrigation use while keeping a larger earth dam for stock or runoff. We supply and line both — see our steel water tanks page for reservoir sizes.",
    },
  ] satisfies ServiceFaqItem[],
  relatedLinks: [
    {
      href: "/calculators/#dam-lining-area",
      label: "Estimate your liner size → Dam Lining Area Calculator",
    },
    { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
    { href: "/pvc-dam-lining", label: "PVC Dam Lining" },
    { href: "/torch-on-dam-lining", label: "Torch-On Dam Lining" },
    { href: "/farm-dam-liners", label: "Farm Dam Liners" },
    { href: "/mining-dam-liners", label: "Mining Dam Liners" },
    { href: "/western-cape-dam-liners", label: "Western Cape Dam Liners" },
    { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
    { href: "/projects", label: "Project Case Studies" },
    { href: "/faq", label: "Dam Linings FAQ" },
  ],
};

export const STEEL_TANKS_CONTENT = {
  intro:
    "Damtech provides corrugated steel water tanks and reservoirs for farms, mines, estates, game lodges and commercial water storage applications. When an earth dam is not practical — limited space, rocky ground, or the need for elevated storage — galvanised steel reservoirs give South African site managers a fast, scalable way to store borehole, municipal or harvested rainwater from roughly 11 kL to 500 kL and above.",
  sections: [
    {
      heading: "Why Choose Corrugated Steel Water Tanks",
      paragraphs: [
        "Hot-dip galvanised steel panels are well suited to harsh sun, hail and wind, and modular construction means tanks can be installed on sites where pouring concrete is slow or uneconomical. Ring heights of 1.55 m, 2.3 m and 3.05 m let you match the footprint to the available space, which is useful on dairy farms, packhouses, mines and game lodges where a taller, narrower tank fits behind a shed or against a slope.",
        "Compared to open earth dams, a roofed, lined steel reservoir reduces evaporation losses, helps keep water cleaner for irrigation systems and can be expanded as your operation grows.",
      ],
    },
    {
      heading: "Typical Applications in Agriculture and Industry",
      paragraphs: [
        "Clients use our tanks for livestock and game watering, irrigation buffer storage ahead of pivots and drip lines, firefighting reserves on remote farms, and process or dust-suppression water at mines and quarries. Borehole water is often pumped into a tank while power is available, so irrigation can continue during load-shedding when the pump would otherwise be off.",
        "Steel reservoirs also work as balancing tanks in combined borehole-and-dam systems described in our blog guides on farm water management.",
      ],
    },
    {
      heading: "Linings, Roofs and Standard Fittings",
      paragraphs: [
        "Each tank includes a 550 gsm PVC liner (850 gsm on request) and bidem floor sheet suited to agricultural and general water storage. Standard fittings include 50 mm inlet and outlet connections and overflow. Upright columns support the tank structure; optional roofs reduce evaporation, debris ingress and algae growth, which is worthwhile in hot, dusty regions.",
        "Where water chemistry or abrasion demands it, we can discuss alternative liner weights or coordinate with our HDPE team for linked earth-dam storage on the same property.",
      ],
    },
    {
      heading: "Site Preparation and Installation",
      paragraphs: [
        "A level, compacted base (typically sand or crusher dust on geotextile) is essential so the tank does not settle unevenly and stress the liner. We advise on diameter, height and position relative to pumps and pipe routes before manufacture. Most standard installations are completed within a few days once the base is ready, though lead times apply for fabrication and delivery to remote sites.",
        "We work with your contractor or our partners on civils where needed, and we remain available for liner inspections and maintenance after commissioning.",
      ],
    },
  ] satisfies ServiceSection[],
  faqs: [
    {
      question: "What sizes of steel water tanks do you supply?",
      answer:
        "Fixed-price supply-only kits are listed on this page for 10 000 L, 20 000 L, 50 000 L and 100 000 L, plus fish-pond and livestock-trough kits. We also supply corrugated galvanised tanks from approximately 11 kL up to 500 kL and larger on request, in diameters from 3 m to 17 m and a range of ring heights. See the capacity tables below or contact us for a full schedule.",
    },
    {
      question: "How long does installation take?",
      answer:
        "A typical 250 kL reservoir takes roughly 3–5 days on site once the base is prepared, including assembly, lining and commissioning. Smaller tanks can be faster; complex sites or custom fittings may need longer.",
    },
    {
      question: "Is the PVC liner suitable for drinking water?",
      answer:
        "Our standard 550 gsm PVC lining (850 gsm on request) is used for agricultural and general storage. Tell us if water is for human consumption so we can confirm suitability and any additional treatment or testing you require.",
    },
    {
      question: "Can I add a roof later?",
      answer:
        "Roofs can often be retrofitted. It is more economical to specify a roof at order stage so column loads and access are planned upfront — especially in high-evaporation areas.",
    },
  ] satisfies ServiceFaqItem[],
  relatedLinks: [
    {
      href: "/steel-water-storage-tanks/#popular-tank-sizes",
      label: "Compare all tank sizes and prices",
    },
    {
      href: "/calculators/#steel-tank-size",
      label: "Use the tank size calculator",
    },
    { href: "/dam-liners", label: "Dam Liners & Dam Lining Services" },
    { href: "/agricultural-water-storage", label: "Agricultural Water Storage" },
    { href: "/projects", label: "Tank Installation Projects" },
    { href: "/faq", label: "Reservoir FAQ" },
    { href: "/quote", label: "Request a Steel Tank Invoice" },
  ],
};

export const SERVICES_HUB_CONTENT = {
  intro:
    "Damtech is a South African contractor focused on water storage and protection: lining farm and mining dams, building corrugated steel reservoirs, and waterproofing roofs, foundations and retaining structures. The Damtech team brings more than 30 years of combined experience and combines practical site work with quality materials (HDPE geomembrane, PVC, bitumen torch-on and galvanised steel), so clients get systems suited to Highveld heat, coastal rain and bushveld dust.",
  sections: [
    {
      heading: "Waterproofing Services",
      paragraphs: [
        "Water ingress can damage stock, equipment and building fabric long before it becomes visible on a ceiling. Our waterproofing team handles bitumen torch-on and self-adhesive membranes on concrete slab roofs and metal sheets, foundation and basement walls, chimneys and parapets, and liquid-applied detailing where shapes are awkward. We also repair failed membranes and replace paint systems that were never designed as primary waterproofing.",
        "Agricultural packhouses, workshops, commercial stores and residential flat roofs across Gauteng and beyond rely on scheduled maintenance to catch laps and outlets before the summer storm season.",
      ],
    },
    {
      heading: "Dam Lining and Reservoir Repair",
      paragraphs: [
        "HDPE geomembrane is specified for large earth dams, mining ponds and irrigation storage where seepage must be kept as low as possible. PVC liners serve ponds, steel tanks and smaller reservoirs. Bitumen torch-on bonds to prepared cement dams and canals. We measure, supply and install, including subgrade preparation, welding, anchoring and testing, and we repair punctures or aged sections where a full reline is not yet required.",
      ],
    },
    {
      heading: "Corrugated Steel Reservoirs",
      paragraphs: [
        "Our galvanised steel tanks are supplied with PVC lining, structural columns, standard connections and optional roofs. Farmers use them to buffer borehole output; mines for process and dust suppression water; estates for irrigation and fire reserves. Diameters from 3 m to 17 m and multiple ring heights allow tailoring to tight sites. See our steel water tanks page for capacity tables and typical lead times.",
      ],
    },
    {
      heading: "Leak Repair and Preventative Maintenance",
      paragraphs: [
        "Leak call-outs and planned maintenance are part of keeping water assets and buildings dry. We document roof and dam conditions, prioritise safety-critical areas and quote transparently for repair versus replacement. Preventative programmes include an initial inspection (free in Rooi-Els, Pringle Bay, Betty's Bay and Kleinmond; call-out fee elsewhere), standard bitumen touch-ups and reporting so you can budget for the next season.",
        "On farms, a leaking store roof during maize delivery or a failed dam outlet before calving season costs more than the repair itself. Scheduling work in quieter months and fixing small laps before summer storms is usually the most cost-effective approach.",
      ],
    },
    {
      heading: "How We Work With You",
      paragraphs: [
        "Projects begin with a conversation — phone, email or our online quote form — followed by site assessment where needed. You receive a clear scope: materials, thicknesses, timelines and warranty terms. Our installers are employed or subcontracted specialists who understand local building practices and agricultural deadlines. After handover we remain contactable for adjustments, maintenance, additional tanks and dam extensions as your operation grows.",
        "We coordinate with earthworks contractors, pump installers and project managers on larger farm and mine jobs so lining or tank work slots into the wider programme — rather than as an afterthought once the dam is already full or the harvest window is closing.",
      ],
    },
  ] satisfies ServiceSection[],
  faqs: [
    {
      question: "Do you handle both supply and installation?",
      answer:
        "Yes. We supply materials and install with our teams, or coordinate with your earthworks contractor on dam projects. Single point of contact reduces gaps between civils and lining work.",
    },
    {
      question: "Which areas do you serve?",
      answer:
        "We work across South Africa with strong presence in Gauteng, Limpopo, Mpumalanga and the Western Cape. Remote sites are quoted with travel and mobilisation included.",
    },
    {
      question: "Can you combine dam lining and a steel tank on one farm?",
      answer:
        "Often yes. Many clients store bulk water in a lined earth dam and cleaner water in a steel reservoir. We can specify both sides of that system.",
    },
    {
      question: "What warranty do you offer?",
      answer:
        "Qualifying materials supplied by Damtech may carry a supplier-backed material warranty of up to 10 years where stated in the project quotation and subject to the relevant supplier’s terms and conditions. Damtech’s workmanship warranty is 12 months from practical completion unless a different period is stated in writing for the specific project. Warranty coverage, exclusions and maintenance requirements are confirmed in the applicable quotation or contract.",
    },
    {
      question: "Can you repair a leaking dam without a full reline?",
      answer:
        "Often yes, if damage is localised and the liner is otherwise sound. We patch HDPE, repair torch-on sections or recommend relining when UV degradation or widespread failure makes patching uneconomical.",
    },
    {
      question: "Do you line steel and concrete reservoirs?",
      answer:
        "Yes. Steel tanks are supplied with PVC lining as standard; concrete and cement dams may use bitumen torch-on or HDPE, depending on the structure and its use. See our reservoir lining page for options.",
    },
  ] satisfies ServiceFaqItem[],
};

export const SERVICES_OVERVIEW_CARDS = [
  {
    title: "HDPE & PVC Dam Linings",
    description:
      "Geomembrane lining for farm dams, mining ponds and earth reservoirs — HDPE, PVC and torch-on options.",
    href: "/dam-liners",
    cta: "Dam lining services",
  },
  {
    title: "Corrugated Steel Water Tanks",
    description:
      "Fixed-price corrugated steel water tank kits with VAT-inclusive prices, plus larger reservoirs on request.",
    href: "/steel-water-storage-tanks",
    cta: "Steel tank sizes and prices",
  },
  {
    title: "Home waterproofing",
    description:
      "Roofs, flat roofs, parapets, damp walls, balconies and showers for homes in Pretoria and Gauteng.",
    href: "/waterproofing",
    cta: "Home waterproofing",
  },
  {
    title: "Leaking Dam Repair & Maintenance",
    description:
      "Assess failed liners, patch HDPE, reline dams and maintain roofs and reservoirs before small leaks worsen.",
    href: "/dam-repair-services",
    cta: "Dam repair services",
  },
  {
    title: "Reservoir & Pond Lining",
    description:
      "Line or reline steel, concrete and farm ponds with PVC, HDPE or bitumen systems suited to the structure.",
    href: "/reservoir-lining",
    cta: "Reservoir lining",
  },
  {
    title: "Agricultural Water Storage",
    description:
      "Integrated dam, tank and irrigation storage for farms, game lodges and borehole backup systems.",
    href: "/agricultural-water-storage",
    cta: "Farm water storage",
  },
] as const;

export const SERVICES_PROCESS_STEPS = [
  {
    title: "Submit enquiry",
    text: "Call, email or use our quote form with location, photos and approximate dimensions.",
  },
  {
    title: "Site inspection",
    text: "We assess on site or from your photos — soil, slopes, access and how water will be used.",
  },
  {
    title: "Material recommendation",
    text: "HDPE, PVC, steel tank or bitumen — specified for your dam size, use and budget.",
  },
  {
    title: "Installation",
    text: "Prepared subgrades, welded seams, anchored liners and commissioned tanks or membranes.",
  },
  {
    title: "Handover",
    text: "Maintenance guidance, warranty documentation and support after project completion.",
  },
] as const;

export const FAQ_PAGE_CONTENT = {
  intro:
    "Straight answers about dam liners, dam linings, corrugated steel reservoirs and bitumen waterproofing, drawn from more than 30 years of combined team experience on South African farms, mines and commercial buildings.",
  sections: [
    {
      heading: "Dam Linings and Earth Dams",
      paragraphs: [
        "HDPE is the workhorse for large farm and mining dams: low permeability, UV resistance and long service life when welded and anchored correctly. PVC fits smaller ponds and steel tanks. Bitumen torch-on suits cement dams where the membrane must bond to a rigid substrate. Lining choice depends on dam size, soil, sun exposure and whether animals access the water — not on catalogue thickness alone.",
        "Seepage, wet patches below the wall or falling water levels after rain are signs to inspect. Early puncture repairs are cheaper than emergency relines during irrigation season.",
      ],
    },
    {
      heading: "Steel Water Tanks and Zinc Reservoirs",
      paragraphs: [
        "Corrugated galvanised tanks modularise water storage where earth dams are impractical. Standard builds include PVC lining, columns, inlet, outlet and overflow; roofs reduce evaporation in hot inland regions. Sizing should account for peak daily use, borehole refill rate and whether you need reserve for fire or load-shedding gaps.",
        "Bases must be level and compacted. Most installs finish within days once civils are ready — plan lead time for fabrication and transport to remote districts.",
      ],
    },
    {
      heading: "Waterproofing Roofs, Slabs and Foundations",
      paragraphs: [
        "Torch-on bitumen remains a proven waterproofing layer on concrete and metal when substrates are prepared and primed. Paint bubbling usually indicates moisture beneath the coating, not a colour fault, so the waterproofing layer must be addressed. We waterproof new builds and existing structures, including parapets, flashings and detail zones that are easily missed.",
      ],
    },
  ] satisfies ServiceSection[],
  extraFaqs: [
    {
      question: "Which dam lining is best for a cattle drinking dam?",
      answer:
        "HDPE of adequate thickness, with protected batters where hoof traffic is heavy. Fenced drinking areas or rock-fill protection strips reduce puncture risk. We assess slope and stock pressure on site.",
    },
    {
      question: "How do I know if my reservoir is leaking or just evaporating?",
      answer:
        "Log water levels over several still, cool days without inflow or use. Evaporation follows weather patterns, whereas a steady drop regardless of conditions often points to seepage or a fitting leak. We can inspect liners and outlets.",
    },
    {
      question: "Can you work with my earthworks contractor on a new dam?",
      answer:
        "Yes. We specify subgrade finish, batters and anchor trenches so civils and lining align. Early coordination avoids rework when the dam is already full.",
    },
    {
      question: "Do you offer quotes without a site visit?",
      answer:
        "For standard tanks we can estimate from diameter and height. Dam linings and waterproofing usually need photos or a visit to quote accurately. Start via our quote form with location and approximate dimensions.",
    },
  ] satisfies ServiceFaqItem[],
};

export const ABOUT_CONTENT = {
  intro:
    "Damtech provides dam linings, waterproofing, reservoir lining and water storage solutions for farms, mines, game lodges and commercial properties across South Africa. We install HDPE and PVC dam linings on farms and mines, build corrugated steel reservoirs, and apply bitumen waterproofing on roofs and foundations, always with an emphasis on workmanship you can inspect, not promises you cannot keep.",
  sections: [
    {
      heading: "Three Decades of Lining and Waterproofing Experience",
      paragraphs: [
        "Our teams have lined irrigation dams in the Western Cape, built steel tanks for Mpumalanga citrus farms, and repaired torch-on roofs on Gauteng commercial stores. That range helps us understand regional soils, rainfall patterns and the pressure load-shedding puts on borehole and pumping schedules, which shapes how we specify liners and tank sizes.",
      ],
    },
    {
      heading: "How We Approach Every Project",
      paragraphs: [
        "We listen first: what water you need to store, how you use it, and what has failed before. Then we recommend materials and thicknesses that fit the site, not whatever is cheapest to freight. Installation crews prepare substrates properly, weld and anchor to spec, and leave you with maintenance guidance. After handover we are still a phone call away for inspections, patches and expansions.",
      ],
    },
    {
      heading: "Sectors We Serve",
      paragraphs: [
        "Agriculture and game farming dominate our dam and tank work, but mines, estates, schools, warehouses and small commercial buildings use our waterproofing and maintenance services too. Whether you are a first-time smallholder or a mine planning containment upgrades, you get the same technical honesty on liner grade and realistic timelines.",
      ],
    },
    {
      heading: "Quality Materials and Accountable Installation",
      paragraphs: [
        "We source HDPE, PVC, bitumen membranes and galvanised steel from established suppliers. Qualifying materials may carry a supplier-backed material warranty where stated in the project quotation, subject to the supplier’s terms. Our aim is dams that hold water and roofs that stay dry long after sign-off.",
      ],
    },
  ] satisfies ServiceSection[],
  faqs: [
    {
      question: "How long has Damtech been operating?",
      answer:
        "The Damtech team brings more than 30 years of combined experience in dam lining, steel reservoirs and waterproofing across South Africa.",
    },
    {
      question: "Is Damtech only based in Gauteng?",
      answer:
        "We are active nationwide. Gauteng is a major hub, but we regularly mobilise to Limpopo, Mpumalanga, the Western Cape and other provinces for dam, tank and roofing projects.",
    },
    {
      question: "Can I visit a completed project before ordering?",
      answer:
        "Where client privacy allows, we can point you to reference sites or share case studies from our projects page. Ask when you request a quote.",
    },
  ] satisfies ServiceFaqItem[],
};
