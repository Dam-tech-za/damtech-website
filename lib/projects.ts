export type ProjectImage = {
  src: string;
  alt: string;
};

export type ProjectCaseStudy = {
  slug: string;
  title: string;
  h1: string;
  location: string;
  serviceType: string;
  material: string;
  scope: string;
  challenge: string;
  solution: string;
  result: string;
  summary: string;
  /** Mark sections that need client-supplied detail before launch. */
  todo?: string[];
  images: ProjectImage[];
  relatedServices: Array<{
    href: string;
    label: string;
  }>;
  seo: {
    title: string;
    description: string;
  };
};

export const PROJECT_CASE_STUDIES: ProjectCaseStudy[] = [
  {
    slug: "marico-hill-game-lodge-dam-lining",
    title: "Marico Hill Game Lodge Dam Lining",
    h1: "Marico Hill Game Lodge Dam Lining Project",
    location: "North West Province",
    serviceType: "HDPE dam liner installation",
    material: "HDPE geomembrane",
    scope:
      "Supply and installation of an HDPE liner for a game-lodge earth dam used for wildlife water supply and fire protection.",
    challenge:
      "TODO: Confirm lodge dam dimensions, substrate condition and seasonal water-level variation. Replace this placeholder with verified site notes from project records.",
    solution:
      "Damtech prepared the dam bed, deployed HDPE liner material suited to UV exposure and wildlife traffic zones, and welded seams for a continuous waterproof barrier.",
    result:
      "TODO: Add verified m² installed, completion date and post-installation water-retention outcome once confirmed with the client.",
    summary:
      "Game lodge earth dam lined with HDPE to improve water retention for wildlife and operational reserves.",
    todo: ["Confirm exact location name", "Add final m² and liner thickness", "Add client-approved photos"],
    images: [
      {
        src: "/images/hdpe-dam-liner-farm-water-storage.webp",
        alt: "HDPE dam liner installation for agricultural water storage dam",
      },
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Liners" },
      { href: "/farm-dam-liners", label: "Farm Dam Liners" },
      { href: "/contact", label: "Contact" },
    ],
    seo: {
      title: "Marico Hill Game Lodge Dam Lining Project | Damtech",
      description:
        "HDPE dam liner installation for a North West game lodge earth dam — improving water retention for wildlife and lodge operations.",
    },
  },
  {
    slug: "hdpe-dam-liner-installation",
    title: "HDPE Dam Liner Installation — Stellenbosch",
    h1: "HDPE Dam Liner Installation in Stellenbosch",
    location: "Stellenbosch, Western Cape",
    serviceType: "HDPE dam liner installation",
    material: "HDPE geomembrane (1.5 mm)",
    scope: "13,360 m² HDPE dam liner supply and installation for farm water storage.",
    challenge:
      "Large surface area with variable embankment profiles required careful subgrade preparation and controlled liner deployment to avoid folds and stress points.",
    solution:
      "Damtech completed site preparation, deployed HDPE panels with heat-welded seams, and anchored edges to create a durable waterproof membrane across the full dam footprint.",
    result:
      "13,360 m² HDPE liner installed, reducing seepage losses and improving reliable irrigation and livestock water availability.",
    summary:
      "Large-scale HDPE earth dam lining project in the Western Cape wine and agricultural region.",
    images: [
      {
        src: "/images/hdpe-dam-liner-farm-water-storage.webp",
        alt: "HDPE dam liner installed on a farm earth dam",
      },
      {
        src: "/images/blog/hdpe-dam-liner-installation-farm-dam.webp",
        alt: "HDPE dam liner installation for agricultural water storage in South Africa",
      },
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Liners" },
      { href: "/western-cape-dam-liners", label: "Western Cape Dam Liners" },
      { href: "/agricultural-water-storage", label: "Agricultural Water Storage" },
    ],
    seo: {
      title: "HDPE Dam Liner Installation Stellenbosch | Damtech Project",
      description:
        "13,360 m² HDPE dam liner installed in Stellenbosch — a Damtech earth dam lining project for reliable farm water storage in the Western Cape.",
    },
  },
  {
    slug: "corrugated-steel-water-tank-installation",
    title: "Corrugated Steel Water Tank Installation — Witbank",
    h1: "Corrugated Steel Water Tank Installation in Witbank",
    location: "Witbank (eMalahleni), Mpumalanga",
    serviceType: "Steel water storage tank supply and installation",
    material: "Corrugated galvanised steel with PVC lining",
    scope: "Six corrugated steel reservoirs at 60 kL capacity each for on-site water storage.",
    challenge:
      "The site required multiple modular tanks with consistent lining quality, level foundations and coordinated installation within an active operational environment.",
    solution:
      "Damtech supplied galvanised steel tanks with PVC lining, prepared foundations and completed installation of six 60 kL units configured for the client's water-management plan.",
    result:
      "Six 60 kL steel tanks commissioned, providing scalable stored water capacity alongside existing supply infrastructure.",
    summary:
      "Multi-tank corrugated steel reservoir installation for industrial water storage in Mpumalanga.",
    images: [
      {
        src: "/images/corrugated-steel-water-tank-installation.webp",
        alt: "Corrugated steel water tank installed for farm water storage",
      },
      {
        src: "/images/blog/corrugated-steel-reservoir-leak-repair-maintenance.webp",
        alt: "Corrugated steel reservoir maintenance and leak repair",
      },
    ],
    relatedServices: [
      { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
      { href: "/mpumalanga-dam-liners", label: "Mpumalanga Water Storage" },
      { href: "/mining-dam-liners", label: "Mining Dam Liners" },
    ],
    seo: {
      title: "Steel Water Tank Installation Witbank | Damtech Project",
      description:
        "Six 60 kL corrugated steel water tanks installed in Witbank — Damtech reservoir supply and installation for Mpumalanga water storage.",
    },
  },
  {
    slug: "grabouw-hdpe-farm-dam",
    title: "Grabouw HDPE Farm Dam Lining",
    h1: "HDPE Farm Dam Lining in Grabouw",
    location: "Grabouw, Western Cape",
    serviceType: "HDPE dam liner installation",
    material: "HDPE geomembrane",
    scope: "10,520 m² HDPE liner installation for agricultural water storage.",
    challenge:
      "Steep valley terrain and seasonal runoff required robust anchoring and careful seam planning across a large embankment footprint.",
    solution:
      "Damtech prepared the subgrade, installed HDPE with welded seams and protected high-wear zones to maintain liner integrity through seasonal level changes.",
    result:
      "10,520 m² liner completed, supporting irrigation security for the farm's production schedule.",
    summary: "Western Cape farm dam lined with HDPE to reduce seepage and protect irrigation reserves.",
    images: [
      {
        src: "/images/blog/bonsmara-cattle-beside-hdpe-lined-farm-dam.webp",
        alt: "Cattle beside an HDPE-lined farm dam used for livestock water storage",
      },
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Liners" },
      { href: "/western-cape-dam-liners", label: "Western Cape Dam Liners" },
      { href: "/farm-dam-liners", label: "Farm Dam Liners" },
    ],
    seo: {
      title: "Grabouw HDPE Farm Dam Lining | Damtech Project",
      description:
        "10,520 m² HDPE dam liner installed in Grabouw for agricultural water storage — reducing seepage on a Western Cape farm dam.",
    },
  },
  {
    slug: "hoedspruit-bitumen-dam-lining",
    title: "Hoedspruit Bitumen Torch-On Dam Lining",
    h1: "Bitumen Torch-On Dam Lining in Hoedspruit",
    location: "Hoedspruit, Limpopo",
    serviceType: "Bitumen torch-on dam lining",
    material: "Bitumen torch-on membrane",
    scope: "9,240 m² bitumen torch-on lining for cement / structured dam waterproofing.",
    challenge:
      "High temperatures and extended dry seasons demanded a lining system with strong adhesion and UV resistance on prepared rigid surfaces.",
    solution:
      "Damtech applied torch-on bitumen membranes with controlled overlap and detail work at corners and penetrations for a continuous waterproof layer.",
    result:
      "9,240 m² torch-on lining completed, improving water retention for agricultural and operational use in a low-rainfall district.",
    summary:
      "Limpopo dam waterproofed with bitumen torch-on lining for reliable water retention.",
    images: [
      {
        src: "/images/bitumen-waterproofing-roof-reservoir-repair.webp",
        alt: "Bitumen waterproofing application on concrete water-retaining structure",
      },
    ],
    relatedServices: [
      { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
      { href: "/limpopo-dam-liners", label: "Limpopo Dam Liners" },
      { href: "/dam-liners", label: "Dam Liners" },
    ],
    seo: {
      title: "Hoedspruit Bitumen Dam Lining Project | Damtech",
      description:
        "9,240 m² bitumen torch-on dam lining in Hoedspruit, Limpopo — waterproofing for reliable water storage in a warm, dry climate.",
    },
  },
  {
    slug: "hartswater-hdpe-dam-liner",
    title: "Hartswater HDPE Dam Liner",
    h1: "HDPE Dam Liner Installation in Hartswater",
    location: "Hartswater, Northern Cape",
    serviceType: "HDPE dam liner installation",
    material: "HDPE geomembrane",
    scope: "3,472 m² HDPE dam liner for farm water storage in an arid agricultural district.",
    challenge:
      "Sandy soils and high evaporation rates made seepage control critical for maintaining usable stored water through dry periods.",
    solution:
      "Damtech installed HDPE with welded seams and edge anchoring suited to the dam profile and local soil conditions.",
    result:
      "3,472 m² liner installed, helping the client retain irrigation water that would otherwise be lost to seepage.",
    summary: "Northern Cape farm dam lined with HDPE to protect scarce water resources.",
    images: [
      {
        src: "/images/hdpe-dam-liner-farm-water-storage.webp",
        alt: "HDPE dam liner installation for agricultural water storage dam",
      },
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Liners" },
      { href: "/farm-dam-liners", label: "Farm Dam Liners" },
      { href: "/agricultural-water-storage", label: "Agricultural Water Storage" },
    ],
    seo: {
      title: "Hartswater HDPE Dam Liner Project | Damtech",
      description:
        "3,472 m² HDPE dam liner installed in Hartswater — farm water storage lining to reduce seepage in the Northern Cape.",
    },
  },
];

export function getProjectBySlug(slug: string): ProjectCaseStudy | undefined {
  return PROJECT_CASE_STUDIES.find((project) => project.slug === slug);
}

export function getProjectSlugs(): string[] {
  return PROJECT_CASE_STUDIES.map((project) => project.slug);
}

export const PROJECTS_INDEX_SEO = {
  title: "Damtech Projects | Dam Liners, Tanks & Waterproofing",
  description:
    "Explore Damtech installation projects across South Africa — HDPE dam liners, bitumen lining and corrugated steel water tanks for farms, lodges and industry.",
  path: "/projects",
  h1: "Our Projects",
  image: "/images/damtech-dam-liners-water-storage-solutions.webp",
};
