import { IMAGE_ALTS, IMAGE_PATHS, type ImagePath } from "./images";

export type ProjectImage = {
  src: string;
  alt: string;
};

function projectImage(path: ImagePath, alt?: string): ProjectImage {
  return { src: path, alt: alt ?? IMAGE_ALTS[path] };
}

export type ProjectCaseStudy = {
  slug: string;
  title: string;
  h1: string;
  location: string;
  serviceType: string;
  material: string;
  scope: string;
  background: string;
  siteConditions: string;
  challenge: string;
  approach: string;
  result: string;
  outcomes: string[];
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
      "Supply and installation of an HDPE liner for a game-lodge earth dam supporting wildlife water supply and operational reserves.",
    background:
      "Game lodges in the North West Bushveld depend on dependable dam water for wildlife viewing, fire protection and staff operations. Marico Hill Game Lodge required improved retention on an earth dam that was losing water through the basin soils — reducing usable volume through dry months when borehole and rainfall top-up are both costly.",
    siteConditions:
      "[TODO: Confirm exact lodge location, dam name and catchment description.] The site sits in warm Bushveld conditions with seasonal rainfall and extended dry periods. Wildlife uses the dam margin — edge protection and anchor detail must account for animal traffic once the liner is installed. [TODO: Confirm substrate type — sandy, clay or mixed — and whether the dam holds a permanent pool or seasonal drawdown.]",
    challenge:
      "[TODO: Confirm dam surface area, depth range and existing embankment condition.] The primary challenge was stopping seepage while maintaining a safe installation programme around lodge operations and wildlife movement. Without verified dimensions, we cannot publish final m² or thickness here — those figures will be added once project records are confirmed with the client.",
    approach:
      "Damtech followed our standard earth-dam workflow: drawdown or partial dewatering where agreed, removal of debris and sharp objects from the prepared bed, deployment of HDPE panels sized to the dam profile, heat-welded seams and crest anchoring to manufacturer practice. High-wear zones at the waterline were flagged for additional protection measures suitable for game activity. [TODO: Confirm liner thickness specified and whether geotextile underlay was used.]",
    result:
      "[TODO: Add verified m² installed, completion date and measured change in water retention after refill.] The lodge received a continuous HDPE barrier designed to reduce seepage losses and stabilise stored volume for wildlife and operational use through the dry season.",
    outcomes: [
      "[TODO: Confirm post-installation water-level stability over first dry season.]",
      "HDPE liner installed as a continuous waterproof membrane across the prepared dam bed.",
      "Anchoring and edge detailing planned for Bushveld wildlife pressure at the waterline.",
      "Lodge operations coordinated around phased access during installation.",
    ],
    summary:
      "North West game lodge earth dam lined with HDPE to improve water retention for wildlife and lodge operations — client details and final measurements pending confirmation.",
    todo: [
      "Confirm exact location name and dam identity",
      "Add final m² and liner thickness",
      "Add client-approved photos",
      "Verify completion date and retention outcome",
    ],
    images: [
      projectImage(
        IMAGE_PATHS.hdpeDamLinerEarthDam,
        "HDPE dam liner installation on a North West game lodge earth dam",
      ),
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Liners" },
      { href: "/farm-dam-liners", label: "Farm Dam Liners" },
      { href: "/limpopo-dam-liners", label: "Limpopo & Bushveld" },
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
    background:
      "A Stellenbosch agricultural client needed to secure winter-stored water for summer irrigation in the Boland’s Mediterranean climate. The farm dam captured licensed winter rainfall, but seepage through the basin profile reduced the volume available for vineyards and supporting livestock water during the dry season.",
    siteConditions:
      "The dam occupies a valley footprint with variable embankment slopes typical of Western Cape farm dams. Soils derived from granite and sandstone weathering can be stony on batters and softer on the basin floor. Wind exposure on open water increases evaporation pressure — lining addresses seepage, the largest avoidable loss after evaporation on this soil type.",
    challenge:
      "At 13,360 m², the lined area required systematic subgrade preparation so panels could be deployed without folds that stress HDPE over time. Embankment transitions, corner details and any outlet penetrations had to be sequenced so welded seams remained continuous and testable across the full footprint.",
    approach:
      "Damtech prepared the dam bed and batters to a smooth, debris-free profile, then deployed HDPE panels in a layout matched to the dam geometry. Seams were heat-welded and checked before anchoring at the crest and around fittings. Edge trenches secured the membrane against wind uplift and seasonal water-level movement. Work was scheduled around the farm’s drawdown window before winter refill.",
    result:
      "13,360 m² of 1.5 mm HDPE was installed, creating a continuous waterproof membrane across the farm dam. The client gained materially improved retention of winter inflow for summer irrigation scheduling and livestock supply.",
    outcomes: [
      "13,360 m² HDPE liner installed with welded seams and crest anchoring.",
      "Seepage through the basin profile addressed without full dam reconstruction.",
      "Storage aligned with Western Cape winter-fill / summer-use irrigation pattern.",
      "Farm water security improved for dry-season vineyard and stock demand.",
    ],
    summary:
      "Large-scale HDPE earth dam lining in the Stellenbosch wine and agricultural district — 13,360 m² installed for reliable farm water storage.",
    images: [
      projectImage(
        IMAGE_PATHS.hdpeDamLinerEarthDam,
        "HDPE dam liner installed on a Stellenbosch farm earth dam",
      ),
      projectImage(IMAGE_PATHS.hdpeDamLinerInstallationLimpopo),
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
    background:
      "An operational site in the Witbank / eMalahleni area needed modular stored water alongside existing supply infrastructure. Earth dams were impractical on the available footprint and timeline — grouped steel reservoirs offered scalable capacity that could be installed on prepared pads within an active yard environment.",
    siteConditions:
      "Mpumalanga Highveld conditions apply: summer storms, winter frost risk and moderate evaporation on open storage. The site required level foundations for each tank, coordinated access for delivery and assembly, and lining quality consistent across all six units so water chemistry and maintenance routines stayed uniform.",
    challenge:
      "Installing six 60 kL tanks in an operational environment meant aligning civils, delivery and assembly without disrupting daily activity. Each foundation had to be level and compacted to protect the PVC liner and steel shell. Consistent inlet, outlet and overflow detail across tanks simplified the client’s water-management plan.",
    approach:
      "Damtech supplied galvanised corrugated steel reservoirs with 850 gsm PVC lining and standard fittings. Foundations were prepared per tank footprint; panels, columns and liners were installed sequentially across the yard. Roofs and connection details were completed to the agreed scope before commissioning. The client could phase which tanks entered service first based on immediate demand.",
    result:
      "Six 60 kL steel tanks were commissioned, delivering a combined 360 kL of on-site storage configured for the client’s operational water plan.",
    outcomes: [
      "Six 60 kL corrugated steel tanks installed with PVC lining.",
      "Grouped layout supports phased use as site demand grows.",
      "Modular storage suited to Mpumalanga industrial yard constraints.",
      "Installation completed within an active operational environment.",
    ],
    summary:
      "Six 60 kL corrugated steel reservoirs installed in Witbank for industrial on-site water storage in Mpumalanga.",
    images: [
      projectImage(IMAGE_PATHS.corrugatedSteelWaterTank),
      projectImage(IMAGE_PATHS.corrugatedSteelReservoirRepair),
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
    background:
      "A Grabouw fruit-farming operation relied on a farm dam for irrigation through the dry summer months in the Elgin / Grabouw valley. Seepage and embankment soils that were not naturally watertight reduced the effective storage the farm could carry from winter rainfall into the critical irrigation window for orchards.",
    siteConditions:
      "Valley terrain produced variable batter angles and a basin profile shaped by historical earthworks. Seasonal runoff from mountain catchments refills the dam in winter; summer drawdown is steady as irrigation runs. Stony batters and softer floor material required careful benching and protection before liner deployment.",
    challenge:
      "The 10,520 m² footprint required seam planning across a large embankment area without creating stressed folds at slope changes. Seasonal level variation meant anchor zones and freeboard detail had to tolerate repeated wet/dry cycles at the crest.",
    approach:
      "Damtech completed subgrade preparation on the basin and batters, removing puncture risks and grading transitions smooth enough for HDPE contact. Panels were laid and welded in a sequence that kept active seams accessible for testing. Anchoring at the crest and around penetrations was completed before refill was authorised. High-wear sections at typical waterline heights received additional protection suited to farm access patterns.",
    result:
      "10,520 m² of HDPE liner was installed, giving the farm a continuous barrier against seepage losses and more predictable irrigation storage through the production season.",
    outcomes: [
      "10,520 m² HDPE installed on a valley farm dam in the Grabouw district.",
      "Seepage losses reduced on a dam critical to orchard irrigation scheduling.",
      "Embankment detailing completed for seasonal water-level movement.",
      "Project aligned with Western Cape winter-fill / summer-drawdown cycle.",
    ],
    summary:
      "Grabouw farm dam lined with 10,520 m² HDPE to protect irrigation reserves in the Western Cape fruit belt.",
    images: [projectImage(IMAGE_PATHS.hdpeLinedFarmReservoirCattle)],
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
    background:
      "A Hoedspruit-area client needed to waterproof a rigid dam structure in the Lowveld heat — a common requirement on older cement or gunite farm and commercial dams where flexible HDPE profile lining is not the right fit for the prepared surface. Reliable retention supports agricultural and operational water use through long dry spells typical of the Olifants valley climate.",
    siteConditions:
      "Hoedspruit experiences high summer temperatures and strong UV, which stress exposed waterproofing if surfaces are not prepared and detailed correctly. The dam’s rigid walls and floor required adhesion-focused membrane work rather than loose-laid geomembrane. [TODO: Confirm whether the structure is cement, gunite or composite if publishing further detail.]",
    challenge:
      "Torch-on application over a large 9,240 m² area demands controlled overlap, corner detailing and penetration seals that stay watertight under thermal movement. Surface preparation — clean, dry and primed — determines whether the membrane bonds or fails within seasons.",
    approach:
      "Damtech applied modified bitumen torch-on sheets in runs planned to maintain continuous laps across walls and floor transitions. Details at corners, outlets and any penetrations received extra layers where the specification required. Work was staged to manage heat and wind conditions suitable for torch application in the Lowveld.",
    result:
      "9,240 m² of torch-on bitumen lining was completed, improving water retention on the structured dam for agricultural and operational use in a low-rainfall district.",
    outcomes: [
      "9,240 m² bitumen torch-on membrane installed on rigid dam surfaces.",
      "Continuous waterproofing layer suited to Hoedspruit heat and dry seasons.",
      "Detail work at corners and penetrations completed to torch-on practice.",
      "Improved retention for stored water used in farm and operational schedules.",
    ],
    summary:
      "Hoedspruit structured dam waterproofed with 9,240 m² bitumen torch-on lining for Lowveld water storage.",
    images: [projectImage(IMAGE_PATHS.bitumenWaterproofingRoof)],
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
    background:
      "Hartswater sits in an arid agricultural district where irrigation water is scarce and borehole energy is expensive. The client’s farm dam was losing stored water to sandy, permeable soils — unacceptable in a region where dry periods are long and every refill depends on pumping or limited rainfall events.",
    siteConditions:
      "Northern Cape semi-arid conditions bring high evaporation and sandy soils with low natural sealing. Windborne dust and temperature swings stress exposed components at the dam crest. Farm dams in this district often serve irrigation blocks and livestock — storage efficiency directly affects operating cost.",
    challenge:
      "At 3,472 m² the dam was smaller than Western Cape valley projects but no less critical: sandy subgrades increase puncture risk without preparation and underlay where specified. Anchoring had to suit a profile used for seasonal drawdown and irrigation withdrawal rather than a permanent full pool.",
    approach:
      "Damtech prepared the basin, installed HDPE with welded seams across the 3,472 m² footprint, and completed crest anchoring suited to the dam’s operating levels. Seams were checked before refill. The scope focused on eliminating seepage through the floor and lower batters where sandy soils caused the highest losses.",
    result:
      "3,472 m² of HDPE liner was installed, helping the client retain irrigation water that would otherwise have been lost to seepage through the dam basin.",
    outcomes: [
      "3,472 m² HDPE liner installed in an arid Northern Cape farm setting.",
      "Seepage through sandy dam soils addressed with continuous geomembrane.",
      "Improved storage efficiency for irrigation in a water-scarce district.",
      "Installation completed without requiring full dam reconstruction.",
    ],
    summary:
      "Hartswater farm dam lined with 3,472 m² HDPE to protect scarce irrigation water in the Northern Cape.",
    images: [
      projectImage(
        IMAGE_PATHS.hdpeDamLinerInstallationLimpopo,
        "HDPE dam liner installation on a Hartswater farm dam in the Northern Cape",
      ),
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
  title: "Dam Lining & Water Storage Projects | Damtech",
  description:
    "View Damtech case studies for HDPE dam liner installations, corrugated steel water tanks and waterproofing projects completed across South Africa.",
  path: "/projects",
  h1: "Damtech Project Case Studies",
  image: IMAGE_PATHS.damtechWaterStorageHero,
};
