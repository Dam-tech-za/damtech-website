import { IMAGE_PATHS } from "./images";
import {
  AGRICULTURAL_STORAGE_SCHEMA_OFFERS,
  MINING_LINERS_SCHEMA_OFFERS,
  SERVICES_HUB_SCHEMA_OFFERS,
} from "./service-pages-content";

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
  /** Offer names for Service JSON-LD; defaults to dam lining offers. */
  schemaOffers?: readonly string[];
  intro: string;
  climate: string;
  soil: string;
  irrigation: string;
  sectors: string;
  waterStorage: string;
  services: string[];
  faqs: LocalFaqItem[];
  relatedProjects: Array<{ href: string; label: string }>;
  relatedLocations: Array<{ href: string; label: string }>;
};

export const LOCAL_LANDING_PAGES: LocalLandingPage[] = [
  {
    slug: "pretoria-dam-liners",
    title: "Dam Linings Pretoria | HDPE, PVC & Water Storage | Damtech",
    description:
      "Damtech provides HDPE and PVC dam linings, waterproofing, steel water tanks and reservoir lining for farms, estates and commercial properties in Pretoria and Gauteng.",
    h1: "Dam Linings in Pretoria",
    heroDescription:
      "Serving Pretoria, Centurion, Hammanskraal and the greater Tshwane metro with HDPE dam linings, reservoir repairs and steel water tanks for farms, estates and commercial sites.",
    image: IMAGE_PATHS.hdpeDamLiningEarthDam,
    serviceName: "Dam Lining Installation — Pretoria",
    intro:
      "Pretoria sits on the Highveld at roughly 1,300 m elevation — a city where thunderstorms can dump summer rain in hours, yet winter days stay dry for weeks. That pattern favours farm dams and estate ponds as storage, but iron-rich soils around Bronkhorstspruit and clay-loam belts near the Apies catchment often seep unless lined. Peri-urban smallholdings along the N1 and R21 corridor increasingly rely on boreholes with municipal supply as backup, which makes on-site retention a practical priority rather than an optional upgrade.",
    climate:
      "Tshwane receives most rainfall between October and March, with frequent afternoon convection and hail risk on exposed embankments. Mean annual precipitation is moderate by national standards, but evaporation on open dams remains significant through hot September and October before the rains. Frost is occasional on low-lying paddocks west of the city, which can stress unprotected outlet pipes and floating intake lines if not planned during installation.",
    soil:
      "North and east of Pretoria, reddish-brown Hutton-derived soils and shallow clay over weathered granite are common on smallholdings. These soils shrink and swell seasonally — liner anchor trenches must accommodate slight ground movement without stressing HDPE at the crest. Rocky quartzite outcrops appear on ridges around the Magaliesberg fringe; there geotextile underlay and careful benching before liner deployment are standard Damtech practice.",
    irrigation:
      "Centre-pivot and hose-irrigation blocks on maize, vegetables and turf farms west of Pretoria need dependable summer reserves when borehole yield dips. Estate landscaping and equestrian properties irrigate from balancing dams that must hold water between municipal restriction periods. Where electricity is interrupted, stored volume — not instantaneous pump rate — determines whether irrigation schedules survive load-shedding.",
    sectors:
      "Agriculture on the city fringe includes mixed livestock, hay production and emerging berry tunnels. Game breeding and wildlife estates north of Pretoria line drinking dams for eland, wildebeest and cattle. Commercial clients include nurseries, light industrial yards with dust-suppression needs, and schools or lodges with fire-water reserves. Mining is less dominant here than on the West Rand, but quarry and borrow-pit water management still appears on the urban edge.",
    waterStorage:
      "Clients typically need to capture storm runoff in earth dams, retain borehole water through dry winters, and reduce dependence on Rand Water restrictions. HDPE lining stops seepage through porous embankments; corrugated steel tanks suit tight sites where a dam footprint is impossible. Concrete reservoir waterproofing protects stored water quality where tanks or canals feed irrigation networks.",
    services: [
      "HDPE and PVC dam lining supply and installation",
      "Corrugated steel tanks for compact peri-urban sites",
      "Bitumen waterproofing for concrete reservoirs and slab roofs",
      "Leak detection, patch repair and crest anchor refurbishment",
    ],
    faqs: [
      {
        question: "Do you install dam linings in Pretoria and Centurion?",
        answer:
          "Yes. Damtech works across Gauteng including Pretoria, Centurion, Cullinan and Hammanskraal. Share dam dimensions, photos and intended water use when requesting a quote.",
      },
      {
        question: "Which dam lining suits Highveld clay that cracks in winter?",
        answer:
          "HDPE with proper anchor design handles seasonal soil movement on larger dams. PVC can suit smaller ponds and steel tanks. We inspect crest soils and batter angles before specifying thickness.",
      },
      {
        question: "Can you line a dam while keeping some water for livestock?",
        answer:
          "Partial drawdown is often possible. We plan phased installation for drinking dams so stock water can be maintained from a temporary trough or secondary dam where available.",
      },
      {
        question: "Are steel tanks practical on smallholdings with no dam space?",
        answer:
          "Yes. Modular galvanised tanks from 11 kL upward fit behind farmhouses and along fence lines. They pair well with boreholes when a full earth dam is not feasible on title-deed setbacks.",
      },
    ],
    relatedProjects: [
      {
        href: "/projects/centurion-hdpe-dam-liner",
        label: "Centurion HDPE farm dam",
      },
      {
        href: "/projects/stellenbosch-hdpe-dam-liner",
        label: "Stellenbosch HDPE dam lining",
      },
    ],
    relatedLocations: [
      { href: "/johannesburg-dam-liners", label: "Johannesburg" },
      { href: "/farm-dam-liners", label: "Farm dam linings" },
      { href: "/agricultural-water-storage", label: "Agricultural water storage" },
      { href: "/mpumalanga-dam-liners", label: "Mpumalanga" },
    ],
  },
  {
    slug: "johannesburg-dam-liners",
    title: "Dam Linings Johannesburg | HDPE, PVC & Reservoir Solutions | Damtech",
    description:
      "Damtech provides HDPE and PVC dam linings, waterproofing, steel water tanks and reservoir lining for farms, mines and commercial properties in Johannesburg and Gauteng.",
    h1: "Dam Linings in Johannesburg",
    heroDescription:
      "Johannesburg, the West Rand and East Rand rely on Damtech for dam linings, steel reservoir farms and waterproofing where municipal pressure, mining landscapes and industrial compliance intersect.",
    image: IMAGE_PATHS.tulbaghWesternCapeSteelWaterTankProject,
    serviceName: "Dam Lining Installation — Johannesburg",
    intro:
      "Johannesburg’s water story is defined by demand exceeding local supply, legacy mining landscapes and development pushing agriculture and industry onto the same dolomitic fringe. Properties on the West Rand near Krugersdorp and Randfontein often store process and irrigation water on disturbed ground. On the East Rand, logistics hubs and agribusiness packhouses need tanks and lined ponds where space is measured in metres, not hectares.",
    climate:
      "The Witwatersrand Highveld shares Pretoria’s summer-rain pattern but urban heat island effects raise evaporation on open dams near Roodepoort and Alberton. Sudden hailstorms can damage unroofed steel tanks if access for maintenance is neglected. Winter is dry; springs that feed minor catchments run low by August, so stored volume carried over from summer storms matters for winter irrigation.",
    soil:
      "Dolomitic compartments underlie large parts of the West Rand — sinkhole risk and groundwater sensitivity mean some sites cannot use earth dams at all, pushing clients toward steel tanks on engineered pads. Deep sandy soils near the Vaal fringe drain quickly without lining. Mine tailings footprints require geotextile protection and compacted subgrades before any geomembrane is laid; sharp metalliferous gravel must not contact HDPE directly.",
    irrigation:
      "Maize and vegetable farms on the city’s outskirts irrigate from dams that must survive municipal throttling. Nurseries and turf farms on the East Rand run tight schedules — a seeping dam mid-season forces expensive borehole hours. Industrial irrigation is less common, but dust suppression on mine stockpiles and construction sites uses stored water on timed sprays that cannot afford pump downtime.",
    sectors:
      "Mining support services, aggregate quarries and coal-related logistics dominate lined containment demand west of Johannesburg. Agribusiness — poultry, piggeries and mixed cropping — lines farm dams and installs steel backup tanks. Commercial estates, schools and warehouses waterproof flat roofs and line fire reservoirs. Game farms on the urban edge share livestock and wildlife watering needs similar to Bushveld properties but on smaller, more regulated footprints.",
    waterStorage:
      "Stored water buffers Rand Water restrictions, supports dust suppression when boreholes are shared across shifts, and provides fire reserves where municipal pressure is weak at ridge-top developments. Multi-tank steel farms allow phased expansion as yards grow. HDPE-lined process dams help operators manage stormwater and recycle wash water without uncontrolled seepage toward dolomitic aquifers.",
    services: [
      "HDPE lining for earth and process dams on disturbed ground",
      "Steel tank farms for industrial and agricultural yards",
      "Bitumen torch-on for concrete fire and process reservoirs",
      "Leak repair on ageing corrugated and concrete storage",
    ],
    faqs: [
      {
        question: "Can Damtech line dams near active mining or quarry sites?",
        answer:
          "Yes, subject to site safety and access rules. We assess water chemistry, embankment stability and whether geotextile or thicker HDPE is needed on compacted mine pads.",
      },
      {
        question: "Are steel tanks better on dolomitic land where dams are restricted?",
        answer:
          "Often yes. Tanks on engineered sand bases reduce groundwater interaction compared with excavated earth dams. We help size tanks against daily use and refill rates.",
      },
      {
        question: "Do you waterproof industrial roofs on the East Rand?",
        answer:
          "Yes. Bitumen torch-on and maintenance programmes cover leaking slab roofs on warehouses and agricultural stores — common before summer rains.",
      },
      {
        question: "How fast can tanks be installed for a logistics yard?",
        answer:
          "Lead times depend on fabrication and civils. Once a level base is ready, modular steel assembly typically completes within days per tank. Share yard layout for a programme estimate.",
      },
    ],
    relatedProjects: [
      {
        href: "/steel-water-storage-tanks",
        label: "Steel water tanks",
      },
      {
        href: "/projects/centurion-hdpe-dam-liner",
        label: "Centurion HDPE farm dam",
      },
    ],
    relatedLocations: [
      { href: "/pretoria-dam-liners", label: "Pretoria" },
      { href: "/mining-dam-liners", label: "Mining dam linings" },
      { href: "/mpumalanga-dam-liners", label: "Mpumalanga" },
      { href: "/steel-water-storage-tanks", label: "Steel water tanks" },
    ],
  },
  {
    slug: "limpopo-dam-liners",
    title: "Dam Linings Limpopo | Farm & Game Reserve Lining | Damtech",
    description:
      "Damtech provides HDPE and PVC dam linings, waterproofing, reservoir lining and steel water tanks for farms, citrus estates and game reserves in Limpopo.",
    h1: "Dam Linings for Limpopo Farms & Game Reserves",
    heroDescription:
      "Hoedspruit, Tzaneen, Phalaborwa and the Limpopo Lowveld and Bushveld — Damtech installs dam linings built for heat, wildlife pressure and long dry seasons.",
    image: IMAGE_PATHS.bitumenTorchOnWaterproofingDamtech,
    serviceName: "Dam Lining Installation — Limpopo",
    intro:
      "Limpopo stretches from misty Letaba citrus valleys to hot Bushveld game reserves along the Kruger western fence. Rainfall varies sharply: Tzaneen can record generous summer totals while Hoedspruit and the Olifants valley see prolonged dry spells. Farm dams and lodge reservoirs are the backbone of irrigation and wildlife water — unlined basins in sandy granite soils can lose water faster than managers realise until borehole bills spike.",
    climate:
      "Lowveld districts endure high summer temperatures often above 35 °C, driving evaporation on open dams. Rainfall is strongly seasonal; October to March carries most annual volume, yet multi-week dry gaps mid-season are normal. Frost is rare in the valley but foothill farms above Tzaneen see occasional cold snaps that affect pipe layouts. UV exposure on exposed liner crests is intense — material selection and cover where possible matter on multi-year performance.",
    soil:
      "Granite sands dominate much of the Bushveld, with low natural cohesion and high permeability without lining. Basalt plains near Phalaborwa and alluvial pockets along the Letaba and Olifants rivers offer different subgrade preparation needs. Game paths along dam toes compact soils but also expose liner edges — anchor design and rock-fill protection zones are routine on lodge projects.",
    irrigation:
      "Citrus and mango estates schedule micro-irrigation and sprinkler blocks from farm dams that must hold through September and October before reliable storms return. Avocado and macadamia orchards on slopes above Tzaneen cannot afford seepage on high-value blocks. Cattle posts and community schemes pump from lined dams into trough lines; when levels drop from leakage, herds concentrate at remaining points and accelerate bank erosion.",
    sectors:
      "Fruit export estates, cattle ranching, game tourism and hunting lodges form the core client base. Phalaborwa-area mining and smelter support services require process-water containment adjacent to agricultural land. Emerging irrigation schemes along canal networks line balancing dams to reduce losses before water reaches pivot points.",
    waterStorage:
      "Lodge operators need reliable wildlife water holes and fire reserves through drought years that suppress tourism grazing. Farmers need every pumped litre from the Crocodile and Olifants catchments retained for packout schedules. Cement dams on older citrus farms often suit bitumen torch-on refurbishment; new earth storage on sandy ranches typically moves to HDPE.",
    services: [
      "HDPE earth dam lining for farms and lodges",
      "Bitumen torch-on refurbishment of cement dams",
      "Leak repair and crest protection on existing reservoirs",
      "Steel tanks for lodge backup and pump stations",
    ],
    faqs: [
      {
        question: "What dam lining works best in hot Lowveld conditions?",
        answer:
          "HDPE offers strong UV resistance for large earth dams. Bitumen torch-on suits rigid cement dams with prepared surfaces. We match material to structure type, not just temperature alone.",
      },
      {
        question: "Do you work on game lodge dams with hippo or buffalo pressure?",
        answer:
          "We plan fencing, access routes and protected batter zones. Animal pressure is a design input — share which species use the dam so anchoring and edge protection can be planned.",
      },
      {
        question: "Can you line cement irrigation dams near Tzaneen?",
        answer:
          "Yes. Many older citrus dams are gunite or concrete — torch-on bitumen or alternative membranes may apply after surface prep. HDPE is used on adjacent earth storage where profiles suit flexible liner.",
      },
      {
        question: "When should Limpopo farmers schedule lining work?",
        answer:
          "Low-water months before main summer rains are ideal. Citrus estates often target post-harvest windows. Book early — installer availability tightens before rainy season.",
      },
    ],
    relatedProjects: [
      {
        href: "/projects/hoedspruit-bitumen-dam-lining",
        label: "Hoedspruit bitumen dam lining",
      },
    ],
    relatedLocations: [
      { href: "/mpumalanga-dam-liners", label: "Mpumalanga" },
      { href: "/farm-dam-liners", label: "Farm dam linings" },
      { href: "/mining-dam-liners", label: "Mining dam linings" },
      { href: "/agricultural-water-storage", label: "Agricultural water storage" },
    ],
  },
  {
    slug: "mpumalanga-dam-liners",
    title: "Dam Linings Mpumalanga | HDPE & Steel Water Tanks | Damtech",
    description:
      "Damtech provides HDPE dam linings, steel water tanks, waterproofing and reservoir lining for farms, forestry and mining applications across Mpumalanga.",
    h1: "Dam Linings & Steel Water Tanks in Mpumalanga",
    heroDescription:
      "From eMalahleni coal-belt yards to Lowveld sugar and Komatiland forestry — Damtech delivers lining and steel tank solutions for Mpumalanga’s mixed industrial and agricultural economy.",
    image: IMAGE_PATHS.tulbaghWesternCapeSteelWaterTankProject,
    serviceName: "Water Storage Solutions — Mpumalanga",
    schemaOffers: SERVICES_HUB_SCHEMA_OFFERS,
    intro:
      "Mpumalanga divides cleanly into a cool Highveld grassland — Witbank, Middelburg, Ermelo — and a subtropical Lowveld corridor toward Nelspruit and Malelane. Coal mining, steel-related industry and power generation cluster on the Highveld; sugar, citrus and forestry dominate the east. Both zones store water differently: earth dams feed irrigation and process circuits, while steel tank farms serve compact mine and mill yards where dams are impractical on leased land.",
    climate:
      "Highveld sites see summer thunderstorms, winter frost and moderate evaporation. Lowveld districts mirror Limpopo heat with higher humidity near sugar mills. Forestry catchments in Sabie and Graskop receive orographic rain but soils drain quickly on slopes — storage dams at valley toes must hold through dry August weeks when fire risk peaks in pine stands.",
    soil:
      "Coal-mining disturbed ground around eMalahleni requires engineered pads and geotextile before HDPE deployment — subsidence and acid-forming shales are site-specific risks assessed before quoting. Highveld sandy loams suit farm dams when lined. Lowveld granite sands seep freely. Forestry roads and skid sites generate sediment that must be kept off liner subgrades during construction.",
    irrigation:
      "Sugar-cane farms irrigate from farm dams and canal offtakes — seepage directly reduces tonnes per hectare when ratoon stress hits in dry cycles. Forestry irrigation is less intensive but nursery and fire-fighting reserves need reliable ponds. Mine plants use stored water for wash bays, coal suppression and boiler make-up; interrupted supply stops shifts.",
    sectors:
      "Coal mining and associated logistics drive process-water dams and multi-tank steel yards. Sugar mills and cane growers line farm dams and repair ageing concrete storage. Timber growers and sawmills store fire and process water. Cattle and game farms on the Highveld fringe share Bushveld-style drinking dam needs with smaller herd densities.",
    waterStorage:
      "Operators need compliant containment, irrigation reserves through El Niño drought years, and modular tank capacity that can relocate when mine layouts change. Damtech supplies corrugated steel water tanks for compact mine and mill yards where dams are impractical on leased land — see our steel water tank project examples for configuration ideas.",
    services: [
      "HDPE lining for irrigation and process dams",
      "Corrugated steel tank supply and grouped installation",
      "Reservoir leak repair and cement dam refurbishment",
      "Bitumen waterproofing for plant concrete structures",
    ],
    faqs: [
      {
        question: "Does Damtech supply steel water tanks in Mpumalanga?",
        answer:
          "Yes. Damtech supplies and installs steel water tanks across South Africa, including Mpumalanga. See our Steel water tanks in the Western Cape for an example configuration, or request a quote for your site.",
      },
      {
        question: "Can dam linings be installed on mining-related dams?",
        answer:
          "We review water chemistry, embankment stability and safety protocols before recommending HDPE thickness and underlay. Active sites need coordinated access plans.",
      },
      {
        question: "Do you line irrigation dams for sugar farms in the Lowveld?",
        answer:
          "Yes. Earth dams feeding cane irrigation benefit from HDPE where sandy soils seep. Scheduling around harvest and burn cycles is planned with farm managers.",
      },
      {
        question: "Are steel tanks suitable when mine leases prohibit new earthworks?",
        answer:
          "Modular tanks on compacted bases are often the fastest compliant option. Capacities scale in 60 kL steps and similar standard sizes.",
      },
    ],
    relatedProjects: [
      {
        href: "/steel-water-storage-tanks",
        label: "Steel water tanks",
      },
    ],
    relatedLocations: [
      { href: "/mining-dam-liners", label: "Mining dam linings" },
      { href: "/johannesburg-dam-liners", label: "Johannesburg" },
      { href: "/limpopo-dam-liners", label: "Limpopo" },
      { href: "/steel-water-storage-tanks", label: "Steel water tanks" },
    ],
  },
  {
    slug: "western-cape-dam-liners",
    title: "Western Cape Dam Liners & Dam Lining Services | Damtech",
    description:
      "Damtech supplies and installs HDPE, PVC and torch-on dam liners for farms, estates and water storage projects across the Western Cape. Request a site-specific quote.",
    h1: "Dam Liners & Dam Linings in the Western Cape",
    heroDescription:
      "Wine, fruit and livestock farms from the Boland to the Overberg rely on Damtech dam linings to keep scarce summer water in farm dams for irrigation and stock.",
    image: IMAGE_PATHS.grabouwHdpeDamLiningAfter,
    serviceName: "HDPE Dam Lining Installation — Western Cape",
    intro:
      "Western Cape agriculture operates under some of the country’s tightest water scrutiny. Winter cold fronts fill dams between June and August; summers are dry, windy and unforgiving on open water. Farmers in Stellenbosch, Franschhoek, Grabouw and the Swartland cannot treat seepage as acceptable losses — many dams sit on sandstone-derived soils and weathered granite that drink water year-round without a visible leak on the surface.",
    climate:
      "Mediterranean rainfall dominates: wet winters, dry summers. Berg wind events raise evaporation on east-facing dams in the Boland. Snow melt from peaks contributes late-spring flow in some catchments, but licensed abstraction caps mean stored winter volume must last through berry and grape ripening. Climate variability since 2015 has made lining projects a standard capital item rather than a discretionary repair.",
    soil:
      "Table Mountain Group sandstones and granite saprolite produce shallow, stony profiles on slopes — dam basins often need benching and geotextile before HDPE. Alluvial floors in valleys offer better natural sealing but still benefit from lining when irrigation security is critical. Wind-blown sand accumulates in dam corners; maintenance access after installation helps keep outlets clear.",
    irrigation:
      "Vineyards use deficit irrigation schedules tied to dam level — seepage forces either curtailment or expensive alternate sources during véraison. Apple and pear orchards in Grabouw run sprinklers and micro systems from farm dams that must survive the February heat. Livestock farms on wheat stubble country store drinking water for sheep through dry months when pans evaporate completely.",
    sectors:
      "Wine and juice grapes, deciduous fruit, olives, livestock and equine properties dominate lining demand. Rural lifestyle estates line ornamental and fire dams. Packhouses and cold stores occasionally need waterproofed roofs and lined balancing ponds — secondary to farm dam work but part of integrated site water plans.",
    waterStorage:
      "The economic case for HDPE is retaining licensed winter allocation inside the dam footprint. Damtech has completed large installations in Stellenbosch and Grabouw documented in our projects section — farmers use those references when sizing expectations for their own catchments.",
    services: [
      "Large-area HDPE farm dam lining",
      "PVC lining for ponds and estate water features",
      "Steel tanks where dam expansion is constrained by licence or terrain",
      "Liner inspection, patch repair and outlet refurbishment",
    ],
    faqs: [
      {
        question: "Do you have Western Cape project experience?",
        answer:
          "Yes. Damtech has completed HDPE installations including large farm dams in Stellenbosch and Grabouw documented in our projects section.",
      },
      {
        question: "When is the best time to line a farm dam in the Cape?",
        answer:
          "Late summer into autumn, when levels are lowest after irrigation drawdown and before winter refill. Align with farm work windows after harvest where possible.",
      },
      {
        question: "Will lining affect my water-use registration?",
        answer:
          "Lining improves retention of water you are already licensed to store — it does not increase entitlement. Consult your water advisor on reporting; we focus on the physical containment scope.",
      },
      {
        question: "Can steep valley dams be lined safely?",
        answer:
          "Yes, with batters prepared to stable angles and anchor trenches at the crest. Steep sites need careful panel layout — share survey or photos for planning.",
      },
    ],
    relatedProjects: [
      {
        href: "/projects/stellenbosch-hdpe-dam-liner",
        label: "Stellenbosch HDPE dam lining",
      },
      {
        href: "/projects/grabouw-hdpe-farm-dam",
        label: "Grabouw farm dam lining",
      },
      {
        href: "/projects/worcester-bitumen-earth-dam-lining",
        label: "Worcester bitumen earth dam",
      },
      {
        href: "/projects/villiersdorp-hdpe-dam-lining",
        label: "Villiersdorp HDPE dam lining",
      },
      {
        href: "/projects/tulbagh-steel-water-tank",
        label: "Tulbagh steel water tank",
      },
      {
        href: "/steel-water-storage-tanks",
        label: "Steel water tanks",
      },
    ],
    relatedLocations: [
      { href: "/farm-dam-liners", label: "Farm dam linings" },
      { href: "/agricultural-water-storage", label: "Agricultural water storage" },
      { href: "/calculators", label: "Use the dam lining area calculator" },
      { href: "/quote", label: "Request a Western Cape quote" },
      { href: "/dam-liners", label: "Dam Liners overview" },
    ],
  },
  {
    slug: "farm-dam-liners",
    title: "Farm Dam Linings | HDPE & PVC South Africa | Damtech",
    description:
      "Protect irrigation, livestock and borehole water storage with farm dam linings installed by Damtech. HDPE and PVC lining solutions for farms across South Africa.",
    h1: "Farm Dam Linings",
    heroDescription:
      "Stop losing irrigation and livestock water to seepage. Damtech installs farm dam linings matched to soil type, herd pressure, pivot schedules and how you actually use stored water.",
    image: IMAGE_PATHS.grabouwHdpeDamLiningAfter,
    serviceName: "Farm Dam Lining Installation",
    intro:
      "A farm dam is often the largest capital asset on a property after land itself — yet many remain unlined on soils that were never watertight. South African producers face municipal cost pressure, load-shedding that stops borehole pumps mid-irrigation, and drought cycles that make every megalitre in January worth more than the same megalitre in June. Lining is how you keep winter rain and borehole top-up available for cattle, pivots and packhouses without rebuilding the entire embankment.",
    climate:
      "No single climate applies nationally. Summer-rainfall maize areas lose water to seepage before autumn planting moisture is secured. Winter-rainfall Cape farms bank licensed winter inflow for six dry months. Bushveld properties see evaporation and wildlife traffic simultaneously. Liner spec must match sun exposure, frost risk at altitude, and whether the dam dries completely each year or holds a permanent pool.",
    soil:
      "Karoo shale weathers into fissured beds that seep along planes. Highveld clay swells when wet and cracks when dry — anchor trenches need detail that allows slight movement without tearing HDPE. Bushveld sands drain within hours of a storm if unlined. Laterite and ironstone gravels puncture thin liners without geotextile protection. A farm dam lining is only as good as the subgrade and anchor design behind it.",
    irrigation:
      "Centre pivots draw dam levels down fast during heatwaves — farmers notice seepage as inability to complete a full circle rather than as a visible leak. Drip and micro systems need cleaner water than muddy seepage dams provide; lining plus basic silt control improves emitter life. Orchard blocks scheduled around flowering cannot pause because the dam failed to hold spring top-up from boreholes.",
    sectors:
      "Commercial grain, fruit, sugar and livestock enterprises line primary irrigation dams. Game farmers line drinking dams for antelope and cattle with fencing and batter protection. Smallholders with a single earth dam often see the fastest payback because one asset serves house, tunnel and stock. Dairies and piggeries link lined farm dams to backup steel tanks near parlours.",
    waterStorage:
      "Farm dam linings reduce the largest avoidable loss after evaporation on porous soils. Many clients pair a lined earth dam with a steel reservoir near the homestead for household and critical stock water. Damtech quotes HDPE for large catchments, PVC for ponds and tanks, and bitumen where an old cement farm dam still has sound walls.",
    services: [
      "HDPE lining for large farm earth dams",
      "PVC for ponds, turkey nests and small reservoirs",
      "Bitumen torch-on for cement farm dams",
      "Leak survey, patch welding and crest repairs",
    ],
    faqs: [
      {
        question: "How much water can a farm dam lining save?",
        answer:
          "Savings depend on soil permeability and dam size. Lining removes most seepage losses — often the biggest controllable loss after evaporation on sandy or fissured dams.",
      },
      {
        question: "Can existing farm dams be lined without rebuilding?",
        answer:
          "Usually yes. Water is lowered, the bed prepared, and HDPE or alternative liners installed over the current profile. Severely eroded walls may need reshaping first.",
      },
      {
        question: "Will cattle damage an HDPE liner?",
        answer:
          "Uncontrolled access can puncture slopes. We recommend drinking zones, rock protection and fencing where herds press the waterline. Design considers stock pressure you describe.",
      },
      {
        question: "How does lining interact with borehole top-up?",
        answer:
          "Lining keeps pumped water in the dam instead of losing it to the ground. Many farms pump overnight into a lined dam, then irrigate by day when Eskom schedules allow.",
      },
    ],
    relatedProjects: [
      { href: "/projects/grabouw-hdpe-farm-dam", label: "Grabouw farm dam" },
      { href: "/projects/stellenbosch-hdpe-dam-liner", label: "Stellenbosch dam lining" },
      { href: "/projects/centurion-hdpe-dam-liner", label: "Centurion farm dam" },
    ],
    relatedLocations: [
      { href: "/western-cape-dam-liners", label: "Dam Linings Western Cape" },
      { href: "/limpopo-dam-liners", label: "Limpopo" },
      { href: "/agricultural-water-storage", label: "Agricultural water storage" },
      { href: "/dam-liners", label: "Dam linings overview" },
    ],
  },
  {
    slug: "mining-dam-liners",
    title: "Mining Dam Linings & Process Water Containment | Damtech",
    description:
      "HDPE dam linings for mining and industrial process-water containment in South Africa. Lining solutions for seepage control and regulatory water management.",
    h1: "Mining Dam Linings & Process Water Containment",
    heroDescription:
      "Contain process, storm and runoff water on mining and industrial sites with HDPE lining designed for puncture protection, chemical compatibility review and long service life.",
    image: IMAGE_PATHS.hdpeDamLiningEarthDam,
    serviceName: "Mining Dam Lining Installation",
    schemaOffers: MINING_LINERS_SCHEMA_OFFERS,
    intro:
      "Mining and quarrying move earth, expose groundwater paths and concentrate water in dams that were never part of the original landscape. Whether coal on the Mpumalanga Highveld, platinum on the Bushveld or aggregate in Gauteng, operators store process water, storm runoff and sometimes attenuation volumes that cannot be allowed to seep unchecked. HDPE geomembrane is the default barrier — but thickness, underlay and leak detection must follow site-specific review, not catalogue defaults.",
    climate:
      "Highveld mines see summer storm peaks that can overtop poorly sized freeboard if silt has reduced capacity. Lowveld operations face heat and UV on exposed geomembrane until cover soil or ballast is placed. Dry seasons stress recycling circuits — every cubic metre lost to seepage is another megalitre pumped or trucked in.",
    soil:
      "Disturbed overburden settles for years; liner subgrades must be compacted lifts, not scraped spoil. Acid-generating material and metalliferous fines require separation from liner contact — geotextile and sometimes bentonite amended layers appear in engineer specs. Rocky cuttings demand cushion geotextile to prevent puncture during settlement.",
    irrigation:
      "Mining clients rarely irrigate crops, but water scheduling still matters: process plants need steady make-up, dust suppression lines need pressure at shift start, and heap or stockpile sprays run on timers. Storage dams buffer between reclamation cycles. Seepage shows up as unplanned make-up water cost and compliance questions, not wilted maize.",
    sectors:
      "Coal washing and stockyard operations, platinum and chrome concentrator support, quarry dewatering ponds, ash and slurry containment, and industrial minerals processing all use lined containment. Contractors building mine infrastructure often subcontract lining to specialists once civils reach subgrade-ready state.",
    waterStorage:
      "Containment supports water recycling, storm attenuation and audit-ready storage volumes. Steel tanks supplement earth dams where footprint is tight on active pits or plants. Damtech coordinates with environmental and civil teams on anchor detail, outlet penetrations and inspection access.",
    services: [
      "HDPE lining for process and stormwater dams",
      "Subgrade preparation and geotextile supply",
      "Leak survey and repair on existing lined facilities",
      "Steel tanks for supplementary process storage",
    ],
    faqs: [
      {
        question: "Is HDPE suitable for mining process water?",
        answer:
          "HDPE has broad chemical resistance, but each site needs water chemistry review. Share available analysis when requesting a specification — we do not guess compatibility.",
      },
      {
        question: "Can Damtech work around active operations?",
        answer:
          "Yes, with agreed access windows, safety inductions and phased panel deployment. Early engagement with mine planning reduces downtime conflicts.",
      },
      {
        question: "Do you install leak detection or only geomembrane?",
        answer:
          "Our core scope is supply and installation of lining systems. Secondary leak detection layers or monitoring are scoped when specified by your engineer.",
      },
      {
        question: "What documentation do you provide on completion?",
        answer:
          "Handover typically includes seam records and installation notes appropriate to the project. Formal as-built packages are agreed in the quote when required.",
      },
    ],
    relatedProjects: [
      {
        href: "/steel-water-storage-tanks",
        label: "Steel water tanks",
      },
      {
        href: "/projects/hoedspruit-bitumen-dam-lining",
        label: "Hoedspruit lined storage",
      },
    ],
    relatedLocations: [
      { href: "/mpumalanga-dam-liners", label: "Mpumalanga" },
      { href: "/johannesburg-dam-liners", label: "Johannesburg" },
      { href: "/steel-water-storage-tanks", label: "Steel water tanks" },
      { href: "/dam-liners", label: "Dam linings" },
    ],
  },
  {
    slug: "agricultural-water-storage",
    title: "Agricultural Water Storage Solutions | Damtech South Africa",
    description:
      "Agricultural water storage with HDPE dam linings and steel water tanks. Integrated solutions for irrigation, livestock and borehole backup across South Africa.",
    h1: "Agricultural Water Storage Solutions",
    heroDescription:
      "Plan farm water security with lined earth dams, steel reservoirs and maintenance — integrated storage for irrigation, livestock and borehole backup.",
    image: IMAGE_PATHS.damtechWaterStorageHero,
    serviceName: "Agricultural Water Storage",
    schemaOffers: AGRICULTURAL_STORAGE_SCHEMA_OFFERS,
    intro:
      "Single-dam thinking leaves farms exposed. A typical resilient layout combines catchment storage in a lined earth dam, pressurised or clean water in a steel tank near the homestead, and borehole pumping timed around load-shedding. Agricultural water storage is not only about volume — it is about where water sits in the system when pivots start, when calving season peaks, and when municipal supply throttles back.",
    climate:
      "Rainfall region dictates strategy. Summer-rainfall grain farms fill between October and January and spend stored water through May. Winter-rainfall producers must retain nearly a year of irrigation need from three wet months. Bushveld game farms hold permanent pools for wildlife through six dry months. Each pattern changes how much storage, what liner type, and whether roofs on steel tanks are worth the capital.",
    soil:
      "Catchment soils determine natural yield and seepage. Sandy catchments fill quickly but seep without HDPE. Clay catchments hold better unlined but still fail on fissured beds. Integrated planning looks at both the dam basin and the tank pad — steel tanks need level compacted bases independent of dam geology.",
    irrigation:
      "Storage must match peak daily irrigation demand, not average rainfall. A pivot that needs a fixed megalitre per day cannot run from a dam that seeped half its winter fill before October. Borehole-linked systems need storage sized for nights of pumping when power is available. Packhouses and tunnels often need a smaller clean reserve isolated from muddy farm dam water.",
    sectors:
      "Fruit, wine, sugar, grain, livestock and game operations all use different withdrawal rates but share the need for predictable storage. Agribusiness with multiple titles may centralise storage in one lined dam and distribute via pipelines. Emerging farmers consolidating smallholdings often upgrade one shared dam before adding tanks at each homestead.",
    waterStorage:
      "Damtech helps clients sequence projects: line the primary dam first, add steel backup where drinking or household security matters, waterproof cement reservoirs feeding tunnels, and maintain roofs before summer leaks ruin stored hay. Our regional pages cover Western Cape, Limpopo and Gauteng specifics; our projects show real farm and industrial outcomes.",
    services: [
      "HDPE farm dam lining",
      "Corrugated steel irrigation reservoirs",
      "Planning borehole-linked storage layouts",
      "Leak repair and preventative maintenance",
    ],
    faqs: [
      {
        question: "Should I choose a dam lining or steel tank first?",
        answer:
          "Large catchments favour lined earth dams. Steel tanks suit smaller volumes, elevated sites or phased expansion. Many farms line the main dam first, then add tanks near critical uses.",
      },
      {
        question: "Can Damtech assist with both dams and tanks on one farm?",
        answer:
          "Yes. We quote integrated scopes or phased work — dam lining now, tanks when civils are ready.",
      },
      {
        question: "How do steel tanks help during load-shedding?",
        answer:
          "Tanks store water pumped when power is available, so irrigation or stock lines can draw while borehole pumps are offline.",
      },
      {
        question: "Do you advise on water licensing?",
        answer:
          "We install physical storage. Licensing and entitlement remain with your water consultant or authority — we align capacity with the storage you are permitted to develop.",
      },
    ],
    relatedProjects: [
      { href: "/projects/stellenbosch-hdpe-dam-liner", label: "Stellenbosch HDPE dam" },
      { href: "/projects/grabouw-hdpe-farm-dam", label: "Grabouw farm dam" },
      { href: "/steel-water-storage-tanks", label: "Steel water tanks" },
    ],
    relatedLocations: [
      { href: "/farm-dam-liners", label: "Farm dam linings" },
      { href: "/western-cape-dam-liners", label: "Dam Linings Western Cape" },
      { href: "/calculators", label: "Plan water storage with Damtech’s calculators" },
      { href: "/pretoria-dam-liners", label: "Pretoria" },
      { href: "/limpopo-dam-liners", label: "Limpopo" },
    ],
  },
];

export function getLocalPageBySlug(slug: string): LocalLandingPage | undefined {
  return LOCAL_LANDING_PAGES.find((page) => page.slug === slug);
}

export function getLocalPageSlugs(): string[] {
  return LOCAL_LANDING_PAGES.map((page) => page.slug);
}
