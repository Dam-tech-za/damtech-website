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
  /** When location is inferred from assets, mark for editorial confirmation. */
  locationStatus?: "confirmed" | "to-be-confirmed";
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
  /** Show on homepage featured projects grid. */
  featuredOnHome?: boolean;
  /** Sort order on homepage (lower first). */
  featuredOrder?: number;
  /** Area badge on homepage project cards. */
  featuredArea?: string;
  homepageLocationLabel?: string;
  homepageServiceLabel?: string;
  homepageLinkLabel?: string;
  needsManualConfirmation?: boolean;
  createdFromAssetName?: string;
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
    slug: "western-cape-steel-water-tank",
    title: "Western Cape Steel Water Tank Project",
    h1: "Western Cape Steel Water Tank Project",
    location: "Western Cape",
    locationStatus: "to-be-confirmed",
    serviceType: "Steel Water Tanks",
    material: "Corrugated steel water tank",
    scope:
      "Corrugated steel water tank solution for practical above-ground water storage in the Western Cape region.",
    background:
      "Damtech supplied a corrugated steel water tank solution for practical water storage in the Western Cape region. Steel water tanks are suited to farms, estates, commercial properties and backup water-storage applications where durable above-ground storage is required.",
    siteConditions:
      "This Western Cape steel water tank project supports reliable above-ground water storage for agricultural, residential estate or commercial use. Corrugated steel water tanks provide a practical option where clients need modular storage capacity, faster installation and a durable water-retaining structure.",
    challenge:
      "The project required a practical water-storage solution suited to site access, storage demand and local environmental conditions.",
    approach:
      "Damtech used a steel water tank solution to provide structured above-ground water storage. Final tank size, foundation requirements and fittings should be confirmed according to site conditions and the client's water demand.",
    result:
      "The completed water-storage solution provides a practical steel tank option for reliable water storage in the Western Cape region.",
    outcomes: [
      "Corrugated steel water tank supplied for above-ground water storage.",
      "Practical solution for farms, estates and commercial properties in the Western Cape.",
      "Modular steel storage suited to site access and installation timelines.",
      "Supplier-backed material terms where applicable on qualifying materials.",
    ],
    summary:
      "Damtech supplied a corrugated steel water tank solution for practical water storage in the Western Cape region.",
    galleryIntro:
      "Corrugated steel water tank installed for practical water storage in the Western Cape region.",
    images: [
      projectImage(
        IMAGE_PATHS.westernCapeSteelWaterTankProject,
        "Round corrugated steel water tank for water storage in the Western Cape",
        "Corrugated steel water tank installed for practical water storage in the Western Cape region.",
      ),
    ],
    relatedServices: [
      { href: "/steel-water-storage-tanks", label: "Steel Water Tanks" },
      { href: "/calculators", label: "Water Storage Calculators" },
      { href: "/reservoir-lining", label: "Reservoir Lining" },
      { href: "/quote", label: "Request a Quote" },
    ],
    seo: {
      title: "Western Cape Steel Water Tank Project | Damtech",
      description:
        "View Damtech's Western Cape steel water tank project for practical water storage. Request a similar corrugated steel water tank quote in South Africa.",
    },
    featuredOnHome: true,
    featuredOrder: 6,
    homepageLocationLabel: "Western Cape",
    homepageServiceLabel: "Steel Water Tanks",
    homepageLinkLabel: "View Western Cape steel water tank project",
    needsManualConfirmation: true,
    todo: [
      "Confirm exact project location within the Western Cape region.",
      "Confirm final tank size, foundation requirements and fittings when site details are available.",
    ],
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
        IMAGE_PATHS.hdpeDamLiningBeforeInstallation,
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
    featuredOnHome: true,
    featuredOrder: 2,
    featuredArea: "3,400 m²",
    homepageLocationLabel: "Grabouw",
    homepageServiceLabel: "HDPE Dam Lining",
    homepageLinkLabel: "View Grabouw HDPE dam lining project",
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
    featuredOnHome: true,
    featuredOrder: 3,
    featuredArea: "550 m²",
    homepageLocationLabel: "Hoedspruit",
    homepageServiceLabel: "Bitumen Torch-On",
    homepageLinkLabel: "View Hoedspruit bitumen torch-on waterproofing project",
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
    featuredOnHome: true,
    featuredOrder: 1,
    featuredArea: "1,200 m²",
    homepageLocationLabel: "Centurion",
    homepageServiceLabel: "HDPE Dam Lining",
    homepageLinkLabel: "View Centurion HDPE dam lining project",
  },
  {
    slug: "mpumalanga-torch-on-bitumen-concrete-dam-15m",
    title: "Torch-On Bitumen Concrete Dam — 15 m Diameter",
    h1: "Torch-On Bitumen Concrete Dam Project — 15 m Diameter",
    location: "Mpumalanga",
    locationStatus: "confirmed",
    serviceType: "Concrete dam waterproofing",
    material: "Torch-on bitumen membrane",
    scope:
      "Torch-on bitumen waterproofing for a round concrete dam with an estimated 15 m diameter and approximately 177 m² surface area.",
    background:
      "A Mpumalanga client needed reliable waterproofing on a round concrete water-retaining structure where seepage or surface deterioration was reducing usable storage. Concrete dams and reservoirs in the region often require a bonded membrane system rather than loose-laid geomembrane when the substrate is rigid and correctly prepared.",
    siteConditions:
      "Mpumalanga summer heat, UV exposure and seasonal rainfall patterns affect how torch-on membranes are applied and detailed. The round concrete profile required consistent laps, corner transitions and penetration seals suited to a rigid reservoir shell.",
    challenge:
      "Waterproofing a circular concrete dam surface of approximately 177 m² required controlled torch-on application, overlap planning and detailing at the wall-to-floor transitions. Surface preparation — clean, dry and primed — was critical before membrane installation.",
    approach:
      "Damtech applied a torch-on bitumen waterproofing system to the prepared concrete surfaces, working in planned runs to maintain continuous laps across the round dam profile. Detailing at corners, outlets and penetrations followed torch-on best practice for water-retaining structures.",
    result:
      "Torch-on bitumen waterproofing was completed on the round concrete dam with an estimated 15 m diameter (approximately 177 m² calculated surface area), improving water retention on the structure.",
    outcomes: [
      "Torch-on bitumen waterproofing on a round concrete dam — 15 m diameter, ~177 m².",
      "Continuous membrane laps across wall and floor transitions.",
      "Detailing completed at corners, outlets and penetrations.",
      "Improved water retention on a rigid concrete reservoir structure.",
    ],
    summary:
      "Mpumalanga round concrete dam waterproofed with torch-on bitumen — 15 m diameter, approximately 177 m².",
    galleryIntro:
      "Torch-on bitumen waterproofing photos from Damtech's round concrete dam project in Mpumalanga.",
    images: [
      projectImage(
        IMAGE_PATHS.torchOnConcreteDam15mMpumalanga,
        "Torch-on bitumen waterproofing on a 15 m diameter concrete dam in Mpumalanga",
        "Torch-on bitumen waterproofing applied to a round concrete dam structure.",
      ),
    ],
    relatedServices: [
      { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
      { href: "/dam-repair-services", label: "Leaking Dam Repair" },
      { href: "/calculators", label: "Waterproofing Area Calculator" },
      { href: "/quote", label: "Request a Similar Quote" },
    ],
    seo: {
      title: "Torch-On Bitumen Concrete Dam Project | Damtech",
      description:
        "View Damtech's torch-on bitumen waterproofing project for a round concrete dam in Mpumalanga. Request a similar waterproofing or concrete reservoir lining quote.",
    },
    createdFromAssetName: "Concrete Dam Mpumalanga 15m.webp",
  },
  {
    slug: "tzaneen-torch-on-bitumen-concrete-dam-18m",
    title: "Torch-On Bitumen Concrete Dam — 18 m Diameter",
    h1: "Torch-On Bitumen Concrete Dam Project — 18 m Diameter",
    location: "Tzaneen, Limpopo",
    locationStatus: "confirmed",
    serviceType: "Concrete dam waterproofing",
    material: "Torch-on bitumen membrane",
    scope:
      "Torch-on bitumen waterproofing for a round concrete dam with an 18 m diameter and approximately 255 m² surface area.",
    background:
      "A Tzaneen-area client required waterproofing on a round concrete dam used for water storage. Torch-on bitumen can be a practical option for selected concrete reservoirs, channels and water-retaining surfaces when surface preparation, overlaps and detailing are correctly handled.",
    siteConditions:
      "The Lowveld climate around Tzaneen brings high summer temperatures and strong UV, which makes surface preparation and membrane detailing important for long-term performance on exposed concrete.",
    challenge:
      "The 18 m diameter round profile produced an estimated 255 m² waterproofing footprint. Continuous torch-on laps, corner detailing and penetration seals had to remain watertight under thermal movement on rigid concrete.",
    approach:
      "Damtech prepared the concrete surfaces and applied modified bitumen torch-on sheets in runs planned to maintain continuous laps across the round dam. Work was staged to suit site conditions suitable for torch application in the Lowveld.",
    result:
      "Approximately 255 m² of torch-on bitumen waterproofing was completed on the 18 m diameter concrete dam, supporting improved water retention on the structure.",
    outcomes: [
      "18 m diameter round concrete dam — approximately 255 m² torch-on bitumen waterproofing.",
      "Surface preparation and continuous membrane laps across rigid concrete.",
      "Detailing at corners, outlets and penetrations completed to torch-on practice.",
      "Improved retention for stored water in a Lowveld water storage application.",
    ],
    summary:
      "Tzaneen round concrete dam waterproofed with torch-on bitumen — 18 m diameter, approximately 255 m².",
    galleryIntro:
      "Torch-on bitumen waterproofing on Damtech's 18 m diameter concrete dam project near Tzaneen, Limpopo.",
    images: [
      projectImage(
        IMAGE_PATHS.torchOnConcreteDam18mTzaneen,
        "Torch-on bitumen waterproofing on an 18 m diameter concrete dam",
        "Torch-on bitumen waterproofing applied to a round concrete dam structure.",
      ),
    ],
    relatedServices: [
      { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
      { href: "/reservoir-lining", label: "Reservoir Lining" },
      { href: "/calculators", label: "Waterproofing Area Calculator" },
      { href: "/quote", label: "Request a Similar Quote" },
    ],
    seo: {
      title: "Torch-On Bitumen Concrete Dam Project | Damtech",
      description:
        "View Damtech's torch-on bitumen waterproofing project for a round concrete dam near Tzaneen. Request a similar waterproofing or concrete reservoir lining quote.",
    },
    featuredOnHome: true,
    featuredOrder: 4,
    featuredArea: "255 m²",
    homepageLocationLabel: "Tzaneen",
    homepageServiceLabel: "Torch-On Bitumen",
    homepageLinkLabel: "View Tzaneen torch-on bitumen concrete dam project",
    createdFromAssetName: "Concrete Dam Tzaneen 18m.webp",
  },
  {
    slug: "western-cape-bitumen-earth-dam-lining-15000m2",
    title: "Western Cape Bitumen Earth Dam Lining — 15,000 m²",
    h1: "Western Cape Bitumen Earth Dam Lining Project — 15,000 m²",
    location: "Western Cape",
    locationStatus: "to-be-confirmed",
    serviceType: "Bitumen earth dam lining",
    material: "Bitumen lining / waterproofing system",
    scope:
      "Approximately 15,000 m² bitumen earth dam lining for water retention and leak prevention in the Western Cape region.",
    background:
      "This Western Cape bitumen earth dam lining project involved lining a large earth dam or water storage basin to improve water retention and reduce seepage risk. Bitumen systems can be considered for selected dam lining, repair or waterproofing applications depending on site conditions, substrate, detailing and long-term performance requirements.",
    siteConditions:
      "Large earth dam profiles in the Western Cape require systematic surface preparation, controlled detailing at transitions and practical sequencing across a wide footprint. Project location is listed by region — exact site details can be updated once confirmed.",
    challenge:
      "At approximately 15,000 m², the lined footprint required careful planning of surface preparation, membrane runs, overlaps and anchor detailing across a large earth dam basin without compromising continuity at slopes and penetrations.",
    approach:
      "Damtech applied a bitumen-based lining or waterproofing system suited to the earth dam application, with surface preparation and detailing completed to support water retention across the project footprint. Area taken from source filename — confirm measured area before publishing if required.",
    result:
      "Bitumen earth dam lining work was completed across an estimated 15,000 m² footprint, supporting improved water retention on the Western Cape earth dam application.",
    outcomes: [
      "Approximately 15,000 m² bitumen earth dam lining for water retention in the Western Cape.",
      "Surface preparation and detailing across a large earth dam footprint.",
      "Bitumen system suited to selected earth dam lining applications.",
      "Supplier-backed material warranty where applicable on qualifying materials.",
    ],
    summary:
      "Western Cape bitumen earth dam lining project — approximately 15,000 m² for water retention and leak prevention.",
    galleryIntro:
      "Bitumen earth dam lining installation photos from Damtech's Western Cape water retention project.",
    images: [
      projectImage(
        IMAGE_PATHS.westernCapeBitumenEarthDamLining15000m2,
        "Western Cape bitumen earth dam lining project for water retention and leak prevention by Damtech",
        "Bitumen lining system used for a Western Cape earth dam water-retention project.",
      ),
      projectImage(
        IMAGE_PATHS.westernCapeBitumenEarthDamLining15000m22,
        "Bitumen earth dam lining installation on a large Western Cape water storage basin",
      ),
      projectImage(
        IMAGE_PATHS.westernCapeBitumenEarthDamLining15000m23,
        "Bitumen lining system applied to a Western Cape earth dam water-retention project",
      ),
      projectImage(
        IMAGE_PATHS.westernCapeBitumenEarthDamLining15000m24,
        "Completed bitumen earth dam lining work for improved water retention in the Western Cape",
      ),
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Liners & Dam Lining Services" },
      { href: "/bitumen-waterproofing", label: "Bitumen Waterproofing" },
      { href: "/torch-on-dam-lining", label: "Torch-On Dam Lining" },
      { href: "/western-cape-dam-liners", label: "Dam Linings Western Cape" },
      { href: "/calculators", label: "Dam Lining Area Calculator" },
      { href: "/quote", label: "Request a Similar Quote" },
    ],
    seo: {
      title: "Western Cape Bitumen Earth Dam Lining Project | Damtech",
      description:
        "View Damtech's Western Cape bitumen earth dam lining project for water retention and leak prevention. Request a similar dam lining quote in the Western Cape.",
    },
    featuredOnHome: true,
    featuredOrder: 5,
    featuredArea: "15,000 m²",
    homepageLocationLabel: "Western Cape",
    homepageServiceLabel: "Bitumen Earth Dam",
    homepageLinkLabel: "View Western Cape bitumen earth dam project",
    needsManualConfirmation: true,
    createdFromAssetName: "Bitumen Earth Dam 15000m.webp",
    todo: [
      "Confirm exact project location within the Western Cape region.",
      "Area taken from source filename — confirm measured area if required.",
    ],
  },
  {
    slug: "western-cape-hdpe-dam-lining-8230m2",
    title: "Western Cape HDPE Dam Lining — 8,230 m²",
    h1: "Western Cape HDPE Dam Lining Project — 8,230 m²",
    location: "Western Cape",
    locationStatus: "to-be-confirmed",
    serviceType: "HDPE dam lining",
    material: "HDPE geomembrane",
    scope:
      "Approximately 8,230 m² HDPE dam lining for water storage and leak prevention in the Western Cape region.",
    background:
      "This Western Cape HDPE dam lining project involved lining an earth dam or water storage basin to improve water retention and reduce seepage risk. HDPE dam linings are commonly used for farms, estates, game lodges and commercial water storage in the Western Cape where long-term durability, UV resistance and welded seams are important.",
    siteConditions:
      "Large geomembrane deployments in the Western Cape require systematic subgrade preparation, seam planning and crest anchoring across a wide footprint. Project location is listed by region — exact site details can be updated once confirmed.",
    challenge:
      "At approximately 8,230 m², the project required coordinated subgrade preparation, panel layout and welded seam continuity across the dam basin without stressing HDPE at slope transitions or penetrations.",
    approach:
      "Damtech prepared the dam profile, deployed HDPE panels and completed heat-welded seams with crest anchoring suited to the operating water levels. Area taken from source filename — confirm measured area before publishing if required.",
    result:
      "Approximately 8,230 m² of HDPE dam lining was installed, creating a continuous geomembrane barrier designed to reduce seepage and stabilise stored volume in the Western Cape region.",
    outcomes: [
      "Approximately 8,230 m² HDPE dam lining for water storage and leak prevention in the Western Cape.",
      "Welded seams and crest anchoring across a large earth dam footprint.",
      "Subgrade preparation and panel deployment suited to exposed earth dam conditions.",
      "Supplier-backed material warranty where applicable on qualifying materials.",
    ],
    summary:
      "Western Cape HDPE dam lining project — approximately 8,230 m² for water storage and leak prevention.",
    galleryIntro:
      "HDPE dam lining installation photos from Damtech's Western Cape water storage project.",
    images: [
      projectImage(
        IMAGE_PATHS.westernCapeHdpeDamLining8230m2,
        "Western Cape HDPE dam lining project covering approximately 8,230 m² by Damtech",
        "HDPE dam lining installation for a large Western Cape water storage application.",
      ),
      projectImage(
        IMAGE_PATHS.westernCapeHdpeDamLining8230m22,
        "HDPE dam lining field installation for a large Western Cape water storage application",
      ),
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Liners & Dam Lining Services" },
      { href: "/hdpe-dam-lining", label: "HDPE Dam Lining" },
      { href: "/reservoir-lining", label: "Reservoir Lining" },
      { href: "/western-cape-dam-liners", label: "Dam Linings Western Cape" },
      { href: "/calculators", label: "Dam Lining Area Calculator" },
      { href: "/quote", label: "Request a Similar Quote" },
    ],
    seo: {
      title: "Western Cape HDPE Dam Lining Project 8,230 m² | Damtech",
      description:
        "View Damtech's Western Cape HDPE dam lining project for water storage and leak prevention. Request a similar HDPE dam lining quote in the Western Cape.",
    },
    needsManualConfirmation: true,
    createdFromAssetName: "HDPE 8230m.webp",
    todo: [
      "Confirm exact project location within the Western Cape region.",
      "Area taken from source filename — confirm measured area if required.",
    ],
  },
];

export function getFeaturedHomeProjects(): ProjectCaseStudy[] {
  return PROJECT_CASE_STUDIES.filter((project) => project.featuredOnHome).sort(
    (a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99),
  );
}

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
