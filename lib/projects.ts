import { IMAGE_ALTS, IMAGE_PATHS, type ImagePath } from "./images";

/**
 * Western Cape local SEO convention (projects + related images):
 * - Prefer a Western Cape town/area (e.g. Tulbagh, Worcester, Villiersdorp), not province-only labels.
 * - Public SEO copy must name BOTH the town and the province, e.g. "Tulbagh in the Western Cape".
 * - Image filenames and alt text for these projects should include town + western-cape.
 * - Do not change confirmed towns (Stellenbosch, Grabouw, etc.).
 * - Assigned WC market towns for previously unallocated projects:
 *   - Tulbagh → steel water tank (`tulbagh-steel-water-tank`)
 *   - Worcester → bitumen earth dam ~15,000 m² (`worcester-bitumen-earth-dam-lining`)
 *   - Villiersdorp → HDPE dam lining ~8,230 m² (`villiersdorp-hdpe-dam-lining`)
 */

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
  /** Shorter label for cards/nav where useful. */
  shortTitle?: string;
  location: string;
  /** Province label for projects index cards. */
  province?: string;
  municipality?: string;
  /** When location is inferred from assets, mark for editorial confirmation. */
  locationStatus?: "confirmed" | "to-be-confirmed";
  serviceType: string;
  material: string;
  scope: string;
  /** Overview copy (rendered as Overview). */
  background: string;
  /** Optional — omitted from public UI when empty. */
  siteConditions?: string;
  /** Requirement copy (rendered as Requirement). */
  challenge: string;
  approach: string;
  result: string;
  outcomes: string[];
  summary: string;
  /** Internal only — never render in public UI. */
  todo?: string[];
  /** Internal only — never render in public UI. */
  internalNotes?: string;
  /** Internal only — never render in public UI. */
  needsOwnerConfirmation?: boolean;
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
  /** Project-specific CTA title on the detail page. */
  ctaTitle?: string;
  /** Project-specific warranty block — only render when set. */
  warranty?: string;
  numberOfDams?: number;
  damBreakdown?: Array<{ label: string; area: string }>;
  categories?: string[];
  /** Hide from index, sitemap and public routes until confirmed. */
  draft?: boolean;
  /**
   * Public publishing gate. Routes, sitemap, cards and carousels require
   * `verified === true` and `draft !== true`.
   */
  verified?: boolean;
  /** When false, do not publish client trading names. */
  clientNamePublic?: boolean;
  /** Internal only — never render in public UI. */
  sourceOfLocation?: string;
  /** Internal only — never render in public UI. */
  sourceOfArea?: string;
  /** Internal only — never render in public UI. */
  approvedBy?: string;
  /**
   * Month + year string for project pages, e.g. "March 2025".
   * Do not render until a confirmed value exists (no placeholders in UI).
   */
  completedDate?: string;
  /**
   * Installation duration in days.
   * Do not render until a confirmed value exists (no placeholders in UI).
   */
  durationDays?: number;
  /** Show on homepage featured projects grid. */
  featuredOnHome?: boolean;
  /** Sort order on homepage (lower first). */
  featuredOrder?: number;
  /** Area badge on homepage project cards. */
  featuredArea?: string;
  homepageLocationLabel?: string;
  homepageServiceLabel?: string;
  homepageLinkLabel?: string;
  /** @deprecated Prefer needsOwnerConfirmation */
  needsManualConfirmation?: boolean;
  createdFromAssetName?: string;
};

export const PROJECT_CASE_STUDIES: ProjectCaseStudy[] = [
  {
    slug: "north-west-game-lodge-hdpe-dam-lining",
    verified: true,
    clientNamePublic: false,
    shortTitle: "Game Lodge Dam Linings — North West",
    title: "North West Game Lodge HDPE Dam Lining Project",
    h1: "North West Game Lodge HDPE Dam Lining Project",
    location: "Marico Region, North West",
    province: "North West",
    serviceType: "HDPE Dam Lining",
    material: "1 mm HDPE geomembrane",
    scope: "Three dams · 2,098 m² total",
    numberOfDams: 3,
    damBreakdown: [
      { label: "Dam 1", area: "980 m²" },
      { label: "Dam 2", area: "712 m²" },
      { label: "Dam 3", area: "406 m²" },
    ],
    background:
      "This game-lodge project involved lining three separate earth dams with 1 mm HDPE geomembrane. The dams covered 980 m², 712 m² and 406 m² respectively, giving a combined lining area of 2,098 m².",
    challenge:
      "The lodge required dependable lined water storage across three separate dams serving the property’s operational water requirements.",
    approach:
      "Damtech installed 1 mm HDPE lining systems across all three dam areas. The membrane was secured around the dam perimeters using anchor trenches, producing three separate lined water-storage facilities.",
    result:
      "The completed project provided the lodge with three HDPE-lined dams covering a combined area of 2,098 m².",
    outcomes: [
      "Dam 1 lined — 980 m² of 1 mm HDPE geomembrane.",
      "Dam 2 lined — 712 m² of 1 mm HDPE geomembrane.",
      "Dam 3 lined — 406 m² of 1 mm HDPE geomembrane.",
      "Combined lining area of 2,098 m² across three earth dams.",
      "Perimeter securing completed with anchor trenches.",
    ],
    summary:
      "Three earth dams at a North West game lodge were lined with 1 mm HDPE geomembrane, covering a combined area of 2,098 m².",
    warranty:
      "The qualifying HDPE material supplied for this project carried a ten-year supplier material warranty, subject to the supplier’s terms and conditions. Damtech provided a one-year workmanship warranty for the installation.",
    galleryIntro:
      "Three earth dams lined with 1 mm HDPE geomembrane, with a combined project area of 2,098 m².",
    images: [
      projectImage(
        IMAGE_PATHS.hdpeDamLiningEarthDam,
        "Three HDPE-lined earth dams covering a combined 2,098 m² at a North West game lodge",
        "Three earth dams lined with 1 mm HDPE geomembrane, with a combined project area of 2,098 m².",
      ),
    ],
    relatedServices: [
      { href: "/hdpe-dam-lining", label: "View HDPE dam lining services" },
      { href: "/farm-dam-liners", label: "Explore farm and game-lodge dam linings" },
      { href: "/dam-liners", label: "Dam Liners & Dam Lining Services" },
      { href: "/calculators", label: "Use the dam lining area calculator" },
      { href: "/quote", label: "Request a game-lodge dam lining quote" },
    ],
    seo: {
      title: "North West Game Lodge Dam Lining Project | Damtech",
      description:
        "View Damtech’s three-dam game-lodge project in North West Province: 2,098 m² of 1 mm HDPE lining installed across three earth dams.",
    },
    ctaTitle: "Request a Game Lodge Dam Lining Quote",
    categories: [
      "HDPE Dam Lining",
      "Earth Dam Lining",
      "North West",
    ],
    featuredOnHome: false,
    featuredArea: "2,098 m²",
    homepageLocationLabel: "Marico Region, North West",
    homepageServiceLabel: "HDPE Dam Lining",
    homepageLinkLabel: "View North West game lodge dam lining project",
    needsOwnerConfirmation: true,
    internalNotes:
      "Publish anonymously until client-name permission, exact town and completion year are confirmed. Do not display Marico Hill Game Lodge publicly.",
  },
  {
    slug: "stellenbosch-hdpe-dam-liner",
    verified: true,
    title: "HDPE Dam Liner Installation — Stellenbosch",
    h1: "HDPE Dam Liner Installation in Stellenbosch",
    location: "Stellenbosch, Western Cape",
    province: "Western Cape",
    serviceType: "HDPE Dam Lining",
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
    categories: ["HDPE Dam Lining", "Earth Dam Lining", "Western Cape"],
    featuredOnHome: true,
    featuredOrder: 1,
    featuredArea: "13,360 m²",
    homepageLocationLabel: "Stellenbosch",
    homepageServiceLabel: "HDPE Dam Lining",
    homepageLinkLabel: "View Stellenbosch HDPE dam lining project",
  },
  {
    slug: "tulbagh-steel-water-tank",
    verified: true,
    shortTitle: "Tulbagh Steel Water Tank",
    title: "Steel Water Tank Project — Tulbagh",
    h1: "Steel Water Tank Project — Tulbagh",
    location: "Tulbagh, Western Cape",
    province: "Western Cape",
    municipality: "Witzenberg Municipality",
    serviceType: "Steel Water Tanks",
    material: "Corrugated steel water-storage tank",
    scope: "Corrugated steel water tank for above-ground water storage",
    background:
      "This Tulbagh project involved the installation of a corrugated steel water tank for practical above-ground water storage. Steel water tanks provide a modular storage option for farms, estates and commercial properties where dedicated storage capacity is required without constructing a permanent concrete reservoir.",
    challenge:
      "The project required a dedicated water-storage solution suited to the available site area and the property’s operational water requirements.",
    approach:
      "A corrugated steel tank system was selected to provide structured above-ground storage. The installation configuration was matched to the site requirements and available connection arrangement.",
    result:
      "The completed project added a dedicated steel water-storage facility suited to agricultural, property or backup-water requirements.",
    outcomes: [
      "Corrugated steel water tank installed for above-ground water storage in Tulbagh.",
      "Modular steel storage suited to farms, estates and commercial properties.",
      "Practical alternative to constructing a permanent concrete reservoir.",
    ],
    summary:
      "A corrugated steel water tank project in Tulbagh, Western Cape, providing practical above-ground water storage for an agricultural or property application.",
    galleryIntro:
      "Corrugated steel water tank used for practical above-ground water storage in Tulbagh.",
    images: [
      projectImage(
        IMAGE_PATHS.tulbaghWesternCapeSteelWaterTankProject,
        "Corrugated steel water tank installed in Tulbagh, Western Cape",
        "Corrugated steel water tank used for practical above-ground water storage in Tulbagh.",
      ),
    ],
    relatedServices: [
      { href: "/steel-water-storage-tanks", label: "View steel water tank services" },
      { href: "/agricultural-water-storage", label: "View agricultural water-storage solutions" },
      { href: "/calculators", label: "Estimate steel water tank size" },
      { href: "/quote", label: "Request a steel water tank quote" },
    ],
    seo: {
      title: "Tulbagh Steel Water Tank Project | Damtech",
      description:
        "View Damtech’s corrugated steel water tank project in Tulbagh, Western Cape, providing practical above-ground water storage.",
    },
    ctaTitle: "Request a Similar Steel Water Tank Quote",
    categories: [
      "Steel Water Tanks",
      "Western Cape",
      "Water Storage",
      "Agricultural Water Storage",
    ],
    featuredOnHome: true,
    featuredOrder: 6,
    homepageLocationLabel: "Tulbagh, Western Cape",
    homepageServiceLabel: "Steel Water Tanks",
    homepageLinkLabel: "View Tulbagh steel water tank project",
    needsOwnerConfirmation: true,
    internalNotes:
      "Confirm capacity, foundation, fittings, completion year and image ownership when project records become available.",
  },
  {
    slug: "grabouw-hdpe-farm-dam",
    verified: true,
    title: "Grabouw HDPE Dam Lining",
    h1: "Grabouw HDPE Dam Lining Project",
    location: "Grabouw, Western Cape",
    province: "Western Cape",
    serviceType: "HDPE dam lining",
    material: "HDPE geomembrane",
    // TODO(business-confirm): confirm Grabouw area — interim uses project-page figure 3,400 m² (cards previously showed 10,520 m²).
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
    categories: ["HDPE Dam Lining", "Earth Dam Lining", "Western Cape"],
    needsOwnerConfirmation: true,
    internalNotes:
      "Confirm 3,400 m² against original quote, BOQ, measurement sheet or supplier roll quantities.",
  },
  {
    slug: "hoedspruit-bitumen-dam-lining",
    verified: true,
    title: "Hoedspruit Bitumen Torch-On Waterproofing",
    h1: "Hoedspruit Bitumen Torch-On Waterproofing Project",
    location: "Hoedspruit, Limpopo",
    province: "Limpopo",
    serviceType: "Bitumen torch-on dam lining",
    material: "Bitumen torch-on membrane",
    // TODO(business-confirm): confirm Hoedspruit area — interim uses project-page figure 550 m² (cards previously showed 9,240 m²).
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
    categories: ["Bitumen / Torch-On", "Limpopo"],
    needsOwnerConfirmation: true,
    internalNotes:
      "Confirm 550 m² against the original project record / measurement.",
  },
  {
    slug: "centurion-hdpe-dam-liner",
    verified: true,
    title: "Centurion HDPE Dam Lining",
    h1: "Centurion HDPE Dam Lining Project",
    location: "Centurion, Gauteng",
    province: "Gauteng",
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
    featuredOnHome: false,
    featuredOrder: 7,
    featuredArea: "1,200 m²",
    homepageLocationLabel: "Centurion",
    homepageServiceLabel: "HDPE Dam Lining",
    homepageLinkLabel: "View Centurion HDPE dam lining project",
    categories: ["HDPE Dam Lining", "Earth Dam Lining", "Gauteng"],
    needsOwnerConfirmation: true,
    internalNotes:
      "Confirm Centurion location and 1,200 m² against the original project record.",
  },
  {
    slug: "mpumalanga-torch-on-bitumen-concrete-dam-15m",
    // Unpublished until municipality or nearest town is confirmed.
    draft: true,
    verified: false,
    title: "Torch-On Bitumen Concrete Dam — 15 m Diameter",
    h1: "Torch-On Bitumen Concrete Dam Project — 15 m Diameter",
    location: "Mpumalanga",
    province: "Mpumalanga",
    locationStatus: "to-be-confirmed",
    serviceType: "Concrete dam waterproofing",
    material: "Torch-on bitumen membrane",
    scope:
      "Torch-on bitumen waterproofing for a round concrete dam with a 15 m diameter. Approximately 177 m² circular base footprint (geometric estimate). Installed membrane area is higher once walls are included — roughly +50 m² for a 2.3 m high wall all around, plus overlaps, detailing and waste.",
    background:
      "A Mpumalanga client needed reliable waterproofing on a round concrete water-retaining structure where seepage or surface deterioration was reducing usable storage. Concrete dams and reservoirs in the region often require a bonded membrane system rather than loose-laid geomembrane when the substrate is rigid and correctly prepared.",
    siteConditions:
      "Mpumalanga summer heat, UV exposure and seasonal rainfall patterns affect how torch-on membranes are applied and detailed. The round concrete profile required consistent laps, corner transitions and penetration seals suited to a rigid reservoir shell.",
    challenge:
      "Waterproofing a circular concrete dam with an approximately 177 m² base footprint required controlled torch-on application, overlap planning and detailing at the wall-to-floor transitions. Surface preparation — clean, dry and primed — was critical before membrane installation.",
    approach:
      "Damtech applied a torch-on bitumen waterproofing system to the prepared concrete surfaces, working in planned runs to maintain continuous laps across the round dam profile. Detailing at corners, outlets and penetrations followed torch-on best practice for water-retaining structures.",
    result:
      "Torch-on bitumen waterproofing was completed on the round concrete dam (15 m diameter; approximately 177 m² circular base footprint). Base footprint is a geometric estimate — not the measured installed membrane quantity.",
    outcomes: [
      "15 m diameter round concrete dam — approximately 177 m² circular base footprint.",
      "Installed membrane area higher once walls, overlaps and detailing are included (about +50 m² for a 2.3 m wall).",
      "Continuous membrane laps across wall and floor transitions.",
      "Detailing completed at corners, outlets and penetrations.",
    ],
    summary:
      "Mpumalanga round concrete dam waterproofed with torch-on bitumen — 15 m diameter, approximately 177 m² base footprint.",
    galleryIntro:
      "Torch-on bitumen waterproofing photos from Damtech's round concrete dam project in Mpumalanga.",
    images: [
      projectImage(
        IMAGE_PATHS.torchOnConcreteDam15mMpumalanga,
        "Torch-on bitumen waterproofing on a 15 m diameter concrete dam",
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
    needsManualConfirmation: true,
    createdFromAssetName: "Concrete Dam Mpumalanga 15m.webp",
    todo: [
      "Confirm municipality or nearest town before publishing — do not invent a town name.",
      "Confirm province if not verified from the job file.",
    ],
  },
  {
    slug: "tzaneen-torch-on-bitumen-concrete-dam-18m",
    verified: true,
    title: "Torch-On Bitumen Concrete Dam — 18 m Diameter",
    h1: "Torch-On Bitumen Concrete Dam Project — 18 m Diameter",
    location: "Tzaneen, Limpopo",
    province: "Limpopo",
    locationStatus: "confirmed",
    serviceType: "Concrete dam waterproofing",
    material: "Torch-on bitumen membrane",
    scope:
      "Torch-on bitumen waterproofing for a round concrete dam with an 18 m diameter. Approximately 255 m² circular base footprint, calculated from the 18 m diameter. This is a geometric base-area estimate — not the measured installed membrane quantity. Installed membrane area is higher once walls are included — roughly +50 m² for a 2.3 m high wall all around, plus overlaps, detailing and waste.",
    background:
      "A Tzaneen-area client required waterproofing on a round concrete dam used for water storage. Torch-on bitumen can be a practical option for selected concrete reservoirs, channels and water-retaining surfaces when surface preparation, overlaps and detailing are correctly handled.",
    siteConditions:
      "The Lowveld climate around Tzaneen brings high summer temperatures and strong UV, which makes surface preparation and membrane detailing important for long-term performance on exposed concrete.",
    challenge:
      "The 18 m diameter round profile produced an approximately 255 m² circular base footprint. Continuous torch-on laps, corner detailing and penetration seals had to remain watertight under thermal movement on rigid concrete.",
    approach:
      "Damtech prepared the concrete surfaces and applied modified bitumen torch-on sheets in runs planned to maintain continuous laps across the round dam. Work was staged to suit site conditions suitable for torch application in the Lowveld.",
    result:
      "Torch-on bitumen waterproofing was completed on the 18 m diameter concrete dam (approximately 255 m² circular base footprint). Base footprint is calculated from diameter — not a measured installed membrane quantity.",
    outcomes: [
      "18 m diameter round concrete dam — approximately 255 m² circular base footprint (calculated from diameter).",
      "Installed membrane area higher once walls, overlaps and detailing are included (about +50 m² for a 2.3 m wall).",
      "Surface preparation and continuous membrane laps across rigid concrete.",
      "Detailing at corners, outlets and penetrations completed to torch-on practice.",
    ],
    summary:
      "Tzaneen round concrete dam waterproofed with torch-on bitumen — 18 m diameter, approximately 255 m² base footprint.",
    galleryIntro:
      "Torch-on bitumen waterproofing on Damtech's 18 m diameter concrete dam project near Tzaneen, Limpopo.",
    images: [
      projectImage(
        IMAGE_PATHS.torchOnConcreteDam18mTzaneen,
        "Torch-on bitumen waterproofing on an 18 m diameter concrete dam near Tzaneen",
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
        "View Damtech's torch-on bitumen waterproofing project for a round concrete dam near Tzaneen — approximately 255 m² base footprint. Request a similar quote.",
    },
    featuredOnHome: false,
    featuredOrder: 8,
    featuredArea: "~255 m² base",
    homepageLocationLabel: "Tzaneen",
    homepageServiceLabel: "Torch-On Bitumen",
    homepageLinkLabel: "View Tzaneen torch-on bitumen concrete dam project",
    categories: ["Bitumen / Torch-On", "Limpopo"],
    createdFromAssetName: "Concrete Dam Tzaneen 18m.webp",
    needsOwnerConfirmation: true,
    internalNotes:
      "Confirm Tzaneen as the verified project location against the job file.",
  },
  {
    slug: "worcester-bitumen-earth-dam-lining",
    verified: true,
    shortTitle: "Worcester Bitumen Earth Dam",
    title: "Bitumen Earth Dam Lining Project — Worcester",
    h1: "Bitumen Earth Dam Lining Project — Worcester",
    location: "Worcester, Western Cape",
    province: "Western Cape",
    municipality: "Breede Valley Municipality",
    serviceType: "Dam Linings",
    material: "Bitumen-based earth dam lining",
    scope: "Approximately 15,000 m²",
    background:
      "This Worcester project involved a bitumen-based lining system for a large earth dam covering approximately 15,000 m². The project demonstrates the use of bitumen lining for selected earth-dam and water-retention applications where the site conditions and proposed lining system are compatible.",
    challenge:
      "The large earth-dam surface required a continuous lining system to support water retention and protect the prepared dam surface.",
    approach:
      "The project involved the installation of a bitumen-based lining across approximately 15,000 m² of earth-dam surface.",
    result:
      "The completed lining provides a continuous protected surface intended to support water retention within the earth dam.",
    outcomes: [
      "Approximately 15,000 m² bitumen-based earth dam lining in Worcester.",
      "Continuous protected surface for large-scale water retention.",
      "Bitumen lining applied to a prepared earth-dam surface.",
    ],
    summary:
      "An approximately 15,000 m² bitumen earth dam lining project in Worcester, Western Cape, for large-scale water storage.",
    galleryIntro:
      "Large bitumen earth dam lining project covering approximately 15,000 m² in Worcester.",
    images: [
      projectImage(
        IMAGE_PATHS.worcesterWesternCapeBitumenEarthDamLining15000m2,
        "Bitumen earth dam lining covering approximately 15,000 m² in Worcester, Western Cape",
        "Large bitumen earth dam lining project covering approximately 15,000 m² in Worcester.",
      ),
      projectImage(
        IMAGE_PATHS.worcesterWesternCapeBitumenEarthDamLining15000m22,
        "Bitumen earth dam lining installation on a large water storage basin in Worcester, Western Cape",
      ),
      projectImage(
        IMAGE_PATHS.worcesterWesternCapeBitumenEarthDamLining15000m23,
        "Bitumen lining system applied to an earth dam water-retention project in Worcester, Western Cape",
      ),
      projectImage(
        IMAGE_PATHS.worcesterWesternCapeBitumenEarthDamLining15000m24,
        "Completed bitumen earth dam lining work for improved water retention in Worcester, Western Cape",
      ),
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Explore dam lining services" },
      { href: "/bitumen-waterproofing", label: "View Damtech’s bitumen waterproofing services" },
      { href: "/torch-on-dam-lining", label: "Torch-On Dam Lining" },
      { href: "/calculators", label: "Use the dam lining area calculator" },
      { href: "/quote", label: "Request a similar quote" },
    ],
    seo: {
      title: "Worcester Bitumen Earth Dam Project | Damtech",
      description:
        "View Damtech’s approximately 15,000 m² bitumen earth dam lining project in Worcester, Western Cape.",
    },
    ctaTitle: "Request a Similar Bitumen Dam Lining Quote",
    categories: [
      "Bitumen / Torch-On",
      "Earth Dam Lining",
      "Western Cape",
    ],
    featuredOnHome: true,
    featuredOrder: 4,
    featuredArea: "Approx. 15,000 m²",
    homepageLocationLabel: "Worcester, Western Cape",
    homepageServiceLabel: "Bitumen Earth Dam",
    homepageLinkLabel: "View Worcester bitumen earth dam project",
    needsOwnerConfirmation: true,
    internalNotes:
      "Confirm location, final installed quantity and completion year from project records.",
  },
  {
    slug: "villiersdorp-hdpe-dam-lining",
    verified: true,
    shortTitle: "Villiersdorp HDPE Dam Lining",
    title: "HDPE Dam Lining Project — Villiersdorp",
    h1: "HDPE Dam Lining Project — Villiersdorp",
    location: "Villiersdorp, Western Cape",
    province: "Western Cape",
    municipality: "Theewaterskloof Municipality",
    serviceType: "HDPE Dam Lining",
    material: "HDPE geomembrane",
    scope: "Approximately 8,230 m²",
    background:
      "This Villiersdorp project involved the installation of an HDPE geomembrane lining system over approximately 8,230 m². HDPE dam linings are used for earth dams and reservoirs where a durable, continuous water-retaining barrier is required.",
    challenge:
      "The project required a large-area lining system suited to an earth-dam water-storage application and the dam’s prepared geometry.",
    approach:
      "An HDPE geomembrane system was selected for the approximately 8,230 m² lining scope. The installation created a continuous lined surface across the prepared dam area.",
    result:
      "The completed HDPE lining provides a protected water-retaining surface and supports dependable agricultural or property water storage.",
    outcomes: [
      "Approximately 8,230 m² HDPE geomembrane lining in Villiersdorp.",
      "Continuous lined surface across the prepared earth-dam area.",
      "HDPE dam lining suited to agricultural or property water storage.",
    ],
    summary:
      "An approximately 8,230 m² HDPE dam lining project in Villiersdorp, Western Cape, for agricultural or property water storage.",
    galleryIntro:
      "Approximately 8,230 m² HDPE dam lining installation in Villiersdorp.",
    images: [
      projectImage(
        IMAGE_PATHS.villiersdorpWesternCapeHdpeDamLining8230m2,
        "HDPE dam lining covering approximately 8,230 m² in Villiersdorp, Western Cape",
        "Approximately 8,230 m² HDPE dam lining installation in Villiersdorp.",
      ),
      projectImage(
        IMAGE_PATHS.villiersdorpWesternCapeHdpeDamLining8230m22,
        "HDPE dam lining field installation for a large water storage application in Villiersdorp, Western Cape",
      ),
    ],
    relatedServices: [
      { href: "/dam-liners", label: "Dam Liners & Dam Lining Services" },
      { href: "/hdpe-dam-lining", label: "View HDPE dam lining services" },
      { href: "/farm-dam-liners", label: "Farm Dam Liners" },
      { href: "/western-cape-dam-liners", label: "View Western Cape dam lining services" },
      { href: "/calculators", label: "Use the dam lining area calculator" },
      { href: "/quote", label: "Request an HDPE quote" },
    ],
    seo: {
      title: "Villiersdorp HDPE Dam Lining Project | Damtech",
      description:
        "View Damtech’s approximately 8,230 m² HDPE dam lining project in Villiersdorp, Western Cape.",
    },
    ctaTitle: "Request a Similar HDPE Dam Lining Quote",
    categories: [
      "HDPE Dam Lining",
      "Earth Dam Lining",
      "Western Cape",
    ],
    featuredOnHome: true,
    featuredOrder: 5,
    featuredArea: "Approx. 8,230 m²",
    homepageLocationLabel: "Villiersdorp, Western Cape",
    homepageServiceLabel: "HDPE Dam Lining",
    homepageLinkLabel: "View Villiersdorp HDPE dam lining project",
    needsOwnerConfirmation: true,
    internalNotes:
      "Confirm final installed area, membrane thickness, exact location and completion year.",
  },
];

export function getPublishedProjects(): ProjectCaseStudy[] {
  const published = PROJECT_CASE_STUDIES.filter(
    (project) => !project.draft && project.verified === true,
  );

  if (process.env.NODE_ENV === "development") {
    for (const project of published) {
      if (project.needsOwnerConfirmation || project.internalNotes) {
        console.warn(
          `[projects] Public project "${project.slug}" still has owner-confirmation notes (internal only).`,
        );
      }
    }
  }

  return published.map(toPublicProject);
}

/** Strip editor-only fields so they never reach HTML, RSC payloads or client bundles. */
export function toPublicProject(project: ProjectCaseStudy): ProjectCaseStudy {
  const {
    internalNotes: _internalNotes,
    needsOwnerConfirmation: _needsOwnerConfirmation,
    needsManualConfirmation: _needsManualConfirmation,
    todo: _todo,
    sourceOfLocation: _sourceOfLocation,
    sourceOfArea: _sourceOfArea,
    approvedBy: _approvedBy,
    createdFromAssetName: _createdFromAssetName,
    clientNamePublic: _clientNamePublic,
    locationStatus: _locationStatus,
    draft: _draft,
    verified: _verified,
    ...publicFields
  } = project;

  return publicFields;
}

export function getFeaturedHomeProjects(): ProjectCaseStudy[] {
  return getPublishedProjects()
    .filter((project) => project.featuredOnHome)
    .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99));
}

export function getProjectBySlug(slug: string): ProjectCaseStudy | undefined {
  const project = PROJECT_CASE_STUDIES.find((entry) => entry.slug === slug);
  if (!project || project.draft || project.verified !== true) return undefined;
  return toPublicProject(project);
}

export function getProjectSlugs(): string[] {
  return getPublishedProjects().map((project) => project.slug);
}

/** Filter published projects for hub/service carousels — single source of truth. */
export function getProjectsMatching(
  match: RegExp,
  limit = 6,
): ProjectCaseStudy[] {
  return getPublishedProjects()
    .filter((project) =>
      match.test(
        [
          project.serviceType,
          project.material,
          project.scope,
          project.featuredArea ?? "",
          project.title,
        ].join(" "),
      ),
    )
    .slice(0, limit);
}

export const PROJECTS_INDEX_SEO = {
  title: "Dam Lining & Water Storage Projects | Damtech",
  description:
    "Real Damtech case studies across South Africa: HDPE and bitumen dam linings, steel water tanks and game-lodge water storage — with sizes and photos.",
  path: "/projects",
  h1: "Damtech Project Case Studies",
  image: IMAGE_PATHS.hdpeDamLiningFieldInstallation,
};
