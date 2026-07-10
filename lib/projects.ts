import { IMAGE_ALTS, IMAGE_PATHS, type ImagePath } from "./images";

export type ProjectImage = {
  src: string;
  alt: string;
  caption?: string;
};

function projectImage(
  path: ImagePath,
  alt?: string,
  caption?: string,
): ProjectImage {
  return { src: path, alt: alt ?? IMAGE_ALTS[path], caption };
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
  /** Project-specific gallery section intro (below hero). */
  galleryIntro?: string;
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
    location: "Rustenburg, North West",
    serviceType: "HDPE dam lining",
    material: "1 mm HDPE geomembrane",
    scope:
      "Supply and installation of 1 mm HDPE geomembrane across three earth dams (Dam 1, Dam 2 and Dam 3) for Marico Hill Game Lodge (Pty) Ltd — 2,098 m² total.",
    background:
      "Marico Hill Game Lodge (Pty) Ltd near Rustenburg depends on dependable dam water for wildlife, fire protection and lodge operations. Three earth dams on the property needed improved retention through the Bushveld dry season, when borehole top-up and rainfall capture are both costly if seepage losses remain unchecked.",
    siteConditions:
      "The site sits in warm North West Bushveld conditions with seasonal rainfall and extended dry periods. Wildlife uses the dam margins, so edge protection and crest anchoring had to suit animal traffic once the liners were installed. Each dam required vegetation, root and organic material cleared, with profiles trimmed into smooth, uniform side slopes before lining.",
    challenge:
      "All three dams needed subgrade compaction and inspection to remove sharp objects and voids before liner deployment. The combined 2,098 m² footprint had to be lined while coordinating safe access around active lodge operations and wildlife movement on the property.",
    approach:
      "Damtech cleared vegetation, roots and organic material from each basin, trimmed and shaped dam profiles, and compacted subgrades before liner placement. 1 mm HDPE panels were deployed to each dam profile and joined with extrusion and wedge welding into continuous watertight seams, with crest anchoring completed to manufacturer practice.",
    result:
      "Installation was completed on 5 March 2026 and signed off on 18 March 2026. Dam 1 (980 m²), Dam 2 (712 m²) and Dam 3 (406 m²) were lined with 1 mm HDPE geomembrane — 2,098 m² in total — creating continuous barriers designed to reduce seepage and stabilise stored volume through the dry season.",
    outcomes: [
      "2,098 m² of 1 mm HDPE installed across three lodge dams (980 m² + 712 m² + 406 m²).",
      "Thermally welded extrusion and wedge seams forming continuous watertight membranes.",
      "Vegetation clearance, profiling and subgrade preparation completed on all three basins.",
      "Crest anchoring and edge detailing suited to Bushveld wildlife pressure at the waterline.",
      "Signed off 18 March 2026 with supplier-backed material warranty on qualifying materials where applicable.",
    ],
    summary:
      "Marico Hill Game Lodge — three Rustenburg dams lined with 2,098 m² of 1 mm HDPE for improved water retention.",
    galleryIntro:
      "HDPE dam lining installation photos from the Marico Hill Game Lodge project near Rustenburg — three earth dams lined with 1 mm geomembrane in March 2026.",
    images: [
      projectImage(
        IMAGE_PATHS.hdpeDamLiningEarthDam,
        "HDPE dam linings installed on a North West game lodge earth dam",
      ),
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Linings" },
      { href: "/farm-dam-liners", label: "Farm Dam Linings" },
      { href: "/mining-dam-liners", label: "Mining & Game Lodge Dams" },
      { href: "/contact", label: "Contact" },
    ],
    seo: {
      title: "Marico Hill Game Lodge Dam Lining Project | Damtech",
      description:
        "View Damtech's Marico Hill Game Lodge dam lining project — 2,098 m² of HDPE dam lining across three Rustenburg lodge dams.",
    },
  },
  {
    slug: "hdpe-dam-liner-installation",
    title: "HDPE Dam Liner Installation — Stellenbosch",
    h1: "HDPE Dam Liner Installation in Stellenbosch",
    location: "Stellenbosch, Western Cape",
    serviceType: "HDPE dam lining",
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
    galleryIntro:
      "Field installation photos from Damtech's 13,360 m² HDPE dam lining project in Stellenbosch, Western Cape.",
    images: [
      projectImage(
        IMAGE_PATHS.hdpeDamLiningFieldInstallation,
        "HDPE dam linings installed on a Stellenbosch farm earth dam",
      ),
      projectImage(
        IMAGE_PATHS.hdpeDamLiningAfterGeotextile,
        "HDPE dam linings being installed on a Stellenbosch farm reservoir",
      ),
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Linings" },
      { href: "/western-cape-dam-liners", label: "Western Cape Dam Linings" },
      { href: "/agricultural-water-storage", label: "Agricultural Water Storage" },
    ],
    seo: {
      title: "HDPE Dam Lining Stellenbosch Project | Damtech South Africa",
      description:
        "View Damtech's Stellenbosch HDPE dam lining project — 13,360 m² of farm water storage lining in the Western Cape.",
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
    galleryIntro:
      "Steel water tank installation photos from Damtech's Witbank project — six 60 kL corrugated galvanised reservoirs with PVC lining.",
    images: [
      projectImage(
        IMAGE_PATHS.corrugatedSteelWaterTank,
        "Corrugated steel water tank for farm, mine and commercial water storage",
      ),
      projectImage(
        IMAGE_PATHS.corrugatedSteelWaterTankSite2,
        "Corrugated steel water tank installation on a prepared site in Mpumalanga",
      ),
    ],
    relatedServices: [
      { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
      { href: "/mpumalanga-dam-liners", label: "Mpumalanga Water Storage" },
      { href: "/mining-dam-liners", label: "Mining Dam Linings" },
    ],
    seo: {
      title: "Steel Water Tank Installation Witbank | Damtech South Africa",
      description:
        "View Damtech's Witbank steel water tank project — six 60 kL corrugated steel reservoirs for Mpumalanga water storage.",
    },
  },
  {
    slug: "grabouw-hdpe-farm-dam",
    title: "Grabouw HDPE Dam Lining",
    h1: "Grabouw HDPE Dam Lining Project",
    location: "Grabouw, Western Cape",
    serviceType: "HDPE dam lining",
    material: "HDPE geomembrane",
    scope: "3,400 m² HDPE liner installation for agricultural water storage.",
    background:
      "A Grabouw fruit-farming operation relied on a farm dam for irrigation through the dry summer months in the Elgin / Grabouw valley. Seepage and embankment soils that were not naturally watertight reduced the effective storage the farm could carry from winter rainfall into the critical irrigation window for orchards.",
    siteConditions:
      "Valley terrain produced variable batter angles and a basin profile shaped by historical earthworks. Seasonal runoff from mountain catchments refills the dam in winter; summer drawdown is steady as irrigation runs. Stony batters and softer floor material required careful benching and protection before liner deployment.",
    challenge:
      "The 3,400 m² footprint required seam planning across the embankment area without creating stressed folds at slope changes. Seasonal level variation meant anchor zones and freeboard detail had to tolerate repeated wet/dry cycles at the crest.",
    approach:
      "Damtech completed subgrade preparation on the basin and batters, removing puncture risks and grading transitions smooth enough for HDPE contact. Panels were laid and welded in a sequence that kept active seams accessible for testing. Anchoring at the crest and around penetrations was completed before refill was authorised. High-wear sections at typical waterline heights received additional protection suited to farm access patterns.",
    result:
      "3,400 m² of HDPE liner was installed, giving the farm a continuous barrier against seepage losses and more predictable irrigation storage through the production season.",
    outcomes: [
      "3,400 m² HDPE installed on a valley farm dam in the Grabouw district.",
      "Seepage losses reduced on a dam critical to orchard irrigation scheduling.",
      "Embankment detailing completed for seasonal water-level movement.",
      "Project aligned with Western Cape winter-fill / summer-drawdown cycle.",
    ],
    summary:
      "Grabouw farm dam lined with 3,400 m² HDPE to protect irrigation reserves in the Western Cape fruit belt.",
    galleryIntro:
      "Before-and-after photos from Damtech's 3,400 m² HDPE farm dam lining project in Grabouw, Western Cape.",
    images: [
      projectImage(
        IMAGE_PATHS.grabouwHdpeDamLiningAfter,
        "Large HDPE dam lining installation for water storage in Grabouw",
        "After HDPE dam lining installation",
      ),
      projectImage(
        IMAGE_PATHS.grabouwHdpeDamLiningBefore,
        "Farm dam in Grabouw before HDPE dam lining installation",
        "Before HDPE dam lining installation",
      ),
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Linings" },
      { href: "/western-cape-dam-liners", label: "Western Cape Dam Linings" },
      { href: "/farm-dam-liners", label: "Farm Dam Linings" },
    ],
    seo: {
      title: "Grabouw HDPE Dam Lining Project | Damtech South Africa",
      description:
        "View Damtech's Grabouw HDPE dam lining project, a 3,400 m² dam lining and water storage installation.",
    },
  },
  {
    slug: "hoedspruit-bitumen-dam-lining",
    title: "Hoedspruit Bitumen Torch-On Waterproofing",
    h1: "Hoedspruit Bitumen Torch-On Waterproofing Project",
    location: "Hoedspruit, Limpopo",
    serviceType: "Bitumen torch-on dam lining",
    material: "Bitumen torch-on membrane",
    scope: "550 m² bitumen torch-on lining for cement / structured dam waterproofing.",
    background:
      "A Hoedspruit-area client needed to waterproof a rigid dam structure in the Lowveld heat — a common requirement on older cement or gunite farm and commercial dams where flexible HDPE profile lining is not the right fit for the prepared surface. Reliable retention supports agricultural and operational water use through long dry spells typical of the Olifants valley climate.",
    siteConditions:
      "Hoedspruit experiences high summer temperatures and strong UV, which stress exposed waterproofing if surfaces are not prepared and detailed correctly. The dam's rigid cement or gunite walls and floor required adhesion-focused membrane work rather than loose-laid geomembrane.",
    challenge:
      "Torch-on application over the 550 m² dam surface demanded controlled overlap, corner detailing and penetration seals that stay watertight under thermal movement. Surface preparation — clean, dry and primed — determines whether the membrane bonds or fails within seasons.",
    approach:
      "Damtech applied modified bitumen torch-on sheets in runs planned to maintain continuous laps across walls and floor transitions. Details at corners, outlets and any penetrations received extra layers where the specification required. Work was staged to manage heat and wind conditions suitable for torch application in the Lowveld.",
    result:
      "550 m² of torch-on bitumen lining was completed, improving water retention on the structured dam for agricultural and operational use in a low-rainfall district.",
    outcomes: [
      "550 m² bitumen torch-on membrane installed on rigid dam surfaces.",
      "Continuous waterproofing layer suited to Hoedspruit heat and dry seasons.",
      "Detail work at corners and penetrations completed to torch-on practice.",
      "Improved retention for stored water used in farm and operational schedules.",
    ],
    summary:
      "Hoedspruit structured dam waterproofed with 550 m² bitumen torch-on lining for Lowveld water storage.",
    galleryIntro:
      "Bitumen torch-on waterproofing photos from Damtech's 550 m² Hoedspruit dam lining project in Limpopo.",
    images: [
      projectImage(
        IMAGE_PATHS.bitumenEarthDamWaterproofing,
        "Bitumen torch-on waterproofing project completed by Damtech in Hoedspruit",
      ),
      projectImage(
        IMAGE_PATHS.bitumenEarthDamWaterproofing2,
        "Completed bitumen torch-on waterproofing repair after Damtech installation",
        "After bitumen torch-on waterproofing",
      ),
    ],
    relatedServices: [
      { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
      { href: "/limpopo-dam-liners", label: "Limpopo Dam Linings" },
      { href: "/dam-liners", label: "Dam Linings" },
    ],
    seo: {
      title: "Hoedspruit Bitumen Torch-On Waterproofing Project | Damtech",
      description:
        "View Damtech's Hoedspruit bitumen torch-on waterproofing project, a 550 m² waterproofing solution for water-retaining infrastructure.",
    },
  },
  {
    slug: "centurion-hdpe-dam-liner",
    title: "Centurion HDPE Dam Lining",
    h1: "Centurion HDPE Dam Lining Project",
    location: "Centurion, Gauteng",
    serviceType: "HDPE dam lining",
    material: "HDPE geomembrane",
    scope: "1,200 m² HDPE dam liner for farm water storage in the Centurion / Pretoria corridor.",
    background:
      "A Centurion-area client relied on a farm dam for irrigation and stock water on the Gauteng Highveld fringe. The basin was losing stored water to permeable soils — unacceptable where summer demand peaks and borehole top-up is costly between storm events.",
    siteConditions:
      "Centurion sits on the Highveld between Johannesburg and Pretoria with warm summers, afternoon thunderstorms and dry winter spells. Farm dams on the urban fringe often serve smallholdings and peri-urban agriculture where storage efficiency directly affects operating cost.",
    challenge:
      "At 1,200 m² the dam was a focused footprint but no less critical: variable subgrades increase puncture risk without preparation and underlay where specified. Anchoring had to suit a profile used for seasonal drawdown and irrigation withdrawal rather than a permanent full pool.",
    approach:
      "Damtech prepared the basin, installed HDPE with welded seams across the 1,200 m² footprint, and completed crest anchoring suited to the dam's operating levels. Seams were checked before refill. The scope focused on eliminating seepage through the floor and lower batters where permeable soils caused the highest losses.",
    result:
      "1,200 m² of HDPE liner was installed, helping the client retain irrigation water that would otherwise have been lost to seepage through the dam basin.",
    outcomes: [
      "1,200 m² HDPE liner installed on a Centurion-area farm dam.",
      "Seepage through permeable dam soils addressed with continuous geomembrane.",
      "Improved storage efficiency for irrigation on the Gauteng Highveld fringe.",
      "Installation completed without requiring full dam reconstruction.",
    ],
    summary:
      "Centurion farm dam lined with 1,200 m² HDPE to protect irrigation water in Gauteng.",
    galleryIntro:
      "HDPE dam lining photos from Damtech's 1,200 m² Centurion farm dam project in Gauteng.",
    images: [
      projectImage(
        IMAGE_PATHS.hartswaterHdpeDamLiningProject,
        "HDPE dam lining project completed by Damtech in Centurion, Gauteng",
      ),
      projectImage(
        IMAGE_PATHS.hdpeDamLiningBeforeInstallation,
        "Earth dam basin prepared before HDPE dam lining installation",
        "Before HDPE dam lining installation",
      ),
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Linings" },
      { href: "/pretoria-dam-liners", label: "Pretoria Dam Linings" },
      { href: "/agricultural-water-storage", label: "Agricultural Water Storage" },
    ],
    seo: {
      title: "Centurion HDPE Dam Lining Project | Damtech South Africa",
      description:
        "View Damtech's Centurion HDPE dam lining project, a 1,200 m² water storage and leak-prevention solution in Gauteng.",
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
  title: "Damtech Projects | Dam Linings, Waterproofing & Water Storage Work",
  description:
    "View Damtech project examples including HDPE dam linings, bitumen waterproofing and water storage projects completed for South African clients.",
  path: "/projects",
  h1: "Damtech Project Case Studies",
  image: IMAGE_PATHS.hdpeDamLiningFieldInstallation,
};
