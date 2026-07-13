import type { ComponentType, SVGProps } from "react";
import {
  BuildingIcon,
  DropletIcon,
  FileTextIcon,
  LayersIcon,
  ReservoirIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "@/components/icons/StrokeIcons";

type IconProps = SVGProps<SVGSVGElement>;

export type CalculatorFieldType =
  | "number"
  | "text"
  | "select"
  | "textarea";

export type CalculatorFieldOption = {
  value: string;
  label: string;
};

export type CalculatorField = {
  name: string;
  label: string;
  type: CalculatorFieldType;
  unit?: string;
  placeholder?: string;
  helperText?: string;
  /** Hover/focus popup explanation shown beside the label. */
  info?: string;
  /**
   * When true, the value is a Damtech planning default — shown as a
   * non-editable allowance and always applied in calculations.
   */
  fixed?: boolean;
  defaultValue?: string;
  options?: CalculatorFieldOption[];
  min?: number;
  step?: number;
};

export type CalculatorConfig = {
  id: string;
  name: string;
  shortName: string;
  bestFor: string;
  description: string;
  icon: ComponentType<IconProps>;
  fields: CalculatorField[];
  resultLabels: string[];
  resultHelp: string;
  relatedServiceHref: string;
  relatedServiceLabel: string;
};

export const CALCULATORS: CalculatorConfig[] = [
  {
    id: "dam-lining-area",
    name: "Dam Lining Area Calculator",
    shortName: "Dam Lining Area",
    bestFor: "Earth dams and reservoirs",
    description:
      "Estimate approximate dam lining material area for an earth dam, pond or reservoir before a site inspection.",
    icon: LayersIcon,
    fields: [
      {
        name: "topLength",
        label: "Top length",
        type: "number",
        unit: "m",
        placeholder: "e.g. 40",
        info: "The longer horizontal measurement across the top of the dam basin at crest level (waterline / freeboard line), measured from crest to crest.",
      },
      {
        name: "topWidth",
        label: "Top width",
        type: "number",
        unit: "m",
        placeholder: "e.g. 25",
        info: "The shorter horizontal measurement across the top of the dam basin at crest level, measured from crest to crest.",
      },
      {
        name: "bottomLength",
        label: "Bottom length",
        type: "number",
        unit: "m",
        placeholder: "e.g. 30",
        info: "The longer measurement along the flat floor of the dam (the basin bottom), not including the sloping sides. Usually shorter than the top length because the embankments slope inward.",
      },
      {
        name: "bottomWidth",
        label: "Bottom width",
        type: "number",
        unit: "m",
        placeholder: "e.g. 18",
        info: "The shorter measurement across the flat floor of the dam. Together with bottom length, this defines the lined base area before side slopes are added.",
      },
      {
        name: "depth",
        label: "Depth",
        type: "number",
        unit: "m",
        placeholder: "e.g. 3",
        info: "Vertical depth from the dam floor up to the planned freeboard line (not necessarily current water level). Use the average operating depth if the floor is uneven.",
      },
      {
        name: "sideSlope",
        label: "Side slope",
        type: "number",
        unit: ":1",
        placeholder: "e.g. 2",
        info: "How gently the embankment slopes, expressed as horizontal run per 1 m of vertical rise. Example: 2 means a 2:1 slope (2 m horizontal for every 1 m vertical). Steeper slopes use a lower number; gentler farm dams often use 2:1 or 3:1.",
      },
      {
        name: "freeboard",
        label: "Freeboard allowance",
        type: "number",
        unit: "m",
        placeholder: "e.g. 0.5",
        defaultValue: "0.5",
        info: "Extra vertical height above the normal water level kept clear for waves, surge and safe freeboard. Typical planning values are around 0.3–0.6 m unless your engineer specifies otherwise.",
      },
      {
        name: "overlap",
        label: "Overlap allowance",
        type: "number",
        unit: "m",
        defaultValue: "0.3",
        fixed: true,
        info: "Fixed Damtech planning default for panel seam overlaps. Applied automatically — not edited by customers.",
      },
      {
        name: "anchorTrench",
        label: "Anchor trench allowance",
        type: "number",
        unit: "m",
        defaultValue: "1",
        fixed: true,
        info: "Fixed Damtech planning default for crest anchor-trench embedment around the dam perimeter. Applied automatically — final trench detail is confirmed on site.",
      },
      {
        name: "wastage",
        label: "Wastage percentage",
        type: "number",
        unit: "%",
        defaultValue: "10",
        fixed: true,
        info: "Fixed Damtech planning default for cutting waste, detailing and installation contingency. Applied automatically to the material estimate.",
      },
    ],
    resultLabels: [
      "Base area",
      "Side slope area",
      "Total liner area",
      "Estimated material area (incl. overlap & wastage)",
      "Recommended next step",
    ],
    resultHelp:
      "Use this dam lining area estimate to plan material quantities before requesting a site-specific dam lining quote.",
    relatedServiceHref: "/dam-liners",
    relatedServiceLabel: "View Damtech's dam lining services",
  },
  {
    id: "hdpe-pvc-material",
    name: "HDPE / PVC Dam Lining Material Estimator",
    shortName: "HDPE / PVC Material",
    bestFor: "Comparing liner types",
    description:
      "Compare approximate HDPE or PVC dam lining material quantities for planning and quote preparation.",
    icon: LayersIcon,
    fields: [
      {
        name: "topLength",
        label: "Dam top length",
        type: "number",
        unit: "m",
        placeholder: "e.g. 40",
        info: "Crest-to-crest length across the top of the dam basin — the longer horizontal top measurement.",
      },
      {
        name: "topWidth",
        label: "Dam top width",
        type: "number",
        unit: "m",
        placeholder: "e.g. 25",
        info: "Crest-to-crest width across the top of the dam basin — the shorter horizontal top measurement.",
      },
      {
        name: "depth",
        label: "Average depth",
        type: "number",
        unit: "m",
        placeholder: "e.g. 3",
        info: "Average vertical depth of the basin used for a simplified material estimate when bottom dimensions are not yet surveyed.",
      },
      {
        name: "materialType",
        label: "Material type",
        type: "select",
        defaultValue: "hdpe",
        info: "HDPE is commonly used for exposed earth dams; PVC is often used for smaller ponds or selected covered applications. Final selection depends on exposure, puncture risk and site conditions.",
        options: [
          { value: "hdpe", label: "HDPE geomembrane" },
          { value: "pvc", label: "PVC geomembrane" },
        ],
      },
      {
        name: "thickness",
        label: "Preferred liner thickness",
        type: "number",
        unit: "mm",
        placeholder: "e.g. 1.0",
        info: "Indicative thickness for planning only (for example 1.0 mm or 1.5 mm). Damtech confirms the suitable thickness after reviewing dam size, slopes and site conditions.",
      },
      {
        name: "overlap",
        label: "Overlap allowance",
        type: "number",
        unit: "m",
        defaultValue: "0.3",
        fixed: true,
        info: "Fixed Damtech planning default for seam overlaps. Applied automatically.",
      },
      {
        name: "anchorTrench",
        label: "Anchor trench allowance",
        type: "number",
        unit: "m",
        defaultValue: "1",
        fixed: true,
        info: "Fixed Damtech planning default for crest anchoring. Final trench detail is confirmed during quote and site inspection.",
      },
    ],
    resultLabels: [
      "Estimated roll coverage",
      "Total area (m²)",
      "Material notes",
      "Next step",
    ],
    resultHelp:
      "HDPE and PVC dam liner quantities depend on roll widths, seams and site access — confirm with Damtech before ordering.",
    relatedServiceHref: "/hdpe-dam-lining",
    relatedServiceLabel: "Explore HDPE dam lining options",
  },
  {
    id: "steel-tank-size",
    name: "Steel Water Tank Size Calculator",
    shortName: "Steel Tank Size",
    bestFor: "Backup water storage",
    description:
      "Estimate required steel water tank or reservoir volume based on daily water use and backup storage days.",
    icon: ReservoirIcon,
    fields: [
      {
        name: "dailyRequirement",
        label: "Daily water requirement",
        type: "number",
        unit: "litres",
        placeholder: "e.g. 15000",
        info: "Total litres used in a typical day — household, livestock, irrigation top-up, lodge occupancy or plant demand combined.",
      },
      {
        name: "demandNotes",
        label: "People, animals or irrigation demand",
        type: "text",
        placeholder: "e.g. 50 cattle + household",
        info: "Optional notes that help Damtech interpret your litre figure (for example herd size, guest rooms or irrigation blocks).",
      },
      {
        name: "backupDays",
        label: "Backup storage days",
        type: "number",
        unit: "days",
        placeholder: "e.g. 3",
        defaultValue: "3",
        info: "How many days of supply you want to hold if borehole, municipal or river supply is interrupted. Farms often plan longer than households.",
      },
      {
        name: "safetyFactor",
        label: "Safety factor",
        type: "number",
        unit: "×",
        placeholder: "e.g. 1.2",
        defaultValue: "1.2",
        info: "Multiplier for peak demand, evaporation, minor losses or growth. 1.2 means a 20% planning buffer on top of daily use × backup days.",
      },
      {
        name: "tankType",
        label: "Preferred tank type",
        type: "select",
        defaultValue: "corrugated",
        info: "Corrugated galvanised tanks are common for farms and lodges. Choose “Not sure yet” if you want Damtech to recommend a practical option.",
        options: [
          { value: "corrugated", label: "Corrugated galvanised steel" },
          { value: "modular", label: "Modular steel reservoir" },
          { value: "unsure", label: "Not sure yet" },
        ],
      },
    ],
    resultLabels: [
      "Recommended storage volume (litres)",
      "Recommended storage volume (m³)",
      "Suggested tank size band",
      "Next step",
    ],
    resultHelp:
      "Steel water tank sizing should account for peak demand, fire reserve and site layout — Damtech can recommend a practical capacity.",
    relatedServiceHref: "/steel-water-storage-tanks",
    relatedServiceLabel: "Explore steel water tanks",
  },
  {
    id: "annual-water-requirement",
    name: "Annual Water Requirement Calculator",
    shortName: "Annual Water Demand",
    bestFor: "Farms and commercial sites",
    description:
      "Estimate annual water requirements from daily demand or land use for farms, lodges, mines and commercial properties.",
    icon: DropletIcon,
    fields: [
      {
        name: "dailyDemand",
        label: "Daily water demand",
        type: "number",
        unit: "litres",
        placeholder: "e.g. 20000",
        info: "Average litres required per day across all uses on the property (or the primary use you are planning for).",
      },
      {
        name: "daysPerYear",
        label: "Days per year in use",
        type: "number",
        unit: "days",
        placeholder: "e.g. 365",
        defaultValue: "365",
        info: "Number of days that demand applies. Use fewer than 365 for seasonal operations such as irrigation seasons or peak lodge occupancy.",
      },
      {
        name: "landSize",
        label: "Land size (optional)",
        type: "number",
        unit: "ha",
        placeholder: "e.g. 50",
        info: "Optional property size in hectares. Useful context for Damtech when comparing storage options, but not required for the annual litre calculation.",
      },
      {
        name: "usageType",
        label: "Usage type",
        type: "select",
        defaultValue: "farm",
        info: "Primary water use category. This influences the rough storage guidance shown with your annual estimate.",
        options: [
          { value: "household", label: "Household" },
          { value: "farm", label: "Farm" },
          { value: "livestock", label: "Livestock" },
          { value: "irrigation", label: "Irrigation" },
          { value: "lodge", label: "Game lodge" },
          { value: "mine", label: "Mine" },
          { value: "commercial", label: "Commercial" },
        ],
      },
    ],
    resultLabels: [
      "Annual requirement (litres)",
      "Annual requirement (m³)",
      "Rough storage recommendation",
      "Next step",
    ],
    resultHelp:
      "Annual farm water requirement estimates help size dams, steel tanks and backup storage before seasonal demand peaks.",
    relatedServiceHref: "/agricultural-water-storage",
    relatedServiceLabel: "Learn about agricultural water storage",
  },
  {
    id: "water-by-land-size",
    name: "Water Requirement by Land Size Calculator",
    shortName: "Water by Land Size",
    bestFor: "Property planning",
    description:
      "Estimate water demand based on hectares and selected land use for early storage and dam lining planning.",
    icon: BuildingIcon,
    fields: [
      {
        name: "landSize",
        label: "Land size",
        type: "number",
        unit: "ha",
        placeholder: "e.g. 120",
        info: "Total hectares you want to plan water for — irrigated blocks, grazing area or the portion of the property that drives demand.",
      },
      {
        name: "useCase",
        label: "Use case",
        type: "select",
        defaultValue: "irrigation",
        info: "How the land uses water. Intensity defaults differ for irrigation, grazing, lodges, mining support and landscape watering.",
        options: [
          { value: "irrigation", label: "Crop irrigation" },
          { value: "grazing", label: "Grazing / livestock" },
          { value: "lodge", label: "Game lodge" },
          { value: "mining", label: "Mining support" },
          { value: "landscape", label: "Commercial landscape" },
        ],
      },
      {
        name: "waterIntensity",
        label: "Water intensity",
        type: "number",
        unit: "m³/ha",
        placeholder: "e.g. 5000",
        info: "Planning figure for cubic metres of water per hectare per year. Leave blank to use Damtech’s default for the selected use case, or enter a known local figure.",
      },
      {
        name: "seasonalFactor",
        label: "Seasonal demand factor",
        type: "number",
        unit: "×",
        placeholder: "e.g. 1.3",
        defaultValue: "1.0",
        info: "Increase above 1.0 for dry-season peaks or heat stress. Example: 1.3 adds a 30% buffer to the land-based estimate.",
      },
    ],
    resultLabels: [
      "Daily estimate",
      "Monthly estimate",
      "Annual estimate",
      "Recommended solution",
    ],
    resultHelp:
      "Land-size water estimates guide whether dam linings, steel tanks or combined storage suits your property.",
    relatedServiceHref: "/farm-dam-liners",
    relatedServiceLabel: "View farm dam lining solutions",
  },
  {
    id: "irrigation-water",
    name: "Irrigation Water Requirement Calculator",
    shortName: "Irrigation Requirement",
    bestFor: "Crop planning",
    description:
      "Estimate irrigation water needs based on area, crop type, rainfall and irrigation efficiency. Designed for future FAO-style logic.",
    icon: DropletIcon,
    fields: [
      {
        name: "cropType",
        label: "Crop type",
        type: "select",
        defaultValue: "general",
        info: "Crop group used to suggest a default seasonal water need. Local climate and cultivar still matter — confirm with agronomic data where available.",
        options: [
          { value: "general", label: "General / mixed crops" },
          { value: "citrus", label: "Citrus" },
          { value: "vineyard", label: "Vineyard" },
          { value: "vegetables", label: "Vegetables" },
          { value: "pasture", label: "Pasture / fodder" },
          { value: "orchard", label: "Orchard" },
        ],
      },
      {
        name: "area",
        label: "Irrigated area",
        type: "number",
        unit: "ha",
        placeholder: "e.g. 15",
        info: "Hectares under irrigation for this estimate — not necessarily the whole farm.",
      },
      {
        name: "cropWaterReq",
        label: "Crop water requirement / ET",
        type: "number",
        unit: "mm",
        placeholder: "e.g. 600",
        info: "Seasonal crop water need in millimetres (evapotranspiration). Leave blank to use a Damtech planning default for the selected crop type.",
      },
      {
        name: "effectiveRainfall",
        label: "Effective rainfall",
        type: "number",
        unit: "mm/year",
        placeholder: "e.g. 350",
        info: "Rainfall that actually reaches the crop root zone after losses. Usually lower than total annual rainfall measured in a rain gauge.",
      },
      {
        name: "irrigationEfficiency",
        label: "Irrigation efficiency",
        type: "number",
        unit: "%",
        placeholder: "e.g. 75",
        defaultValue: "75",
        info: "How efficiently water reaches the crop. Drip systems are often higher; flood or older systems lower. Lower efficiency increases gross water needed.",
      },
      {
        name: "irrigationPeriod",
        label: "Irrigation period",
        type: "number",
        unit: "days",
        placeholder: "e.g. 180",
        defaultValue: "180",
        info: "Length of the irrigation season in days. Used to express demand over the active watering period.",
      },
    ],
    resultLabels: [
      "Net irrigation requirement",
      "Gross irrigation requirement",
      "m³ per hectare",
      "Total m³ required",
      "Next step",
    ],
    resultHelp:
      "Irrigation water requirement planning supports dam lining and water storage sizing for reliable crop supply.",
    relatedServiceHref: "/dam-liners",
    relatedServiceLabel: "View Damtech's dam lining services",
  },
  {
    id: "rainwater-harvesting",
    name: "Rainwater Harvesting / Catchment Calculator",
    shortName: "Rainwater Harvesting",
    bestFor: "Roof and catchment storage",
    description:
      "Estimate harvestable rainwater from roof or catchment area for tank or dam storage planning.",
    icon: DropletIcon,
    fields: [
      {
        name: "catchmentArea",
        label: "Roof / catchment area",
        type: "number",
        unit: "m²",
        placeholder: "e.g. 500",
        info: "Horizontal projected area that collects rain — roof footprint or graded catchment feeding your tank or dam.",
      },
      {
        name: "annualRainfall",
        label: "Annual rainfall",
        type: "number",
        unit: "mm/year",
        placeholder: "e.g. 650",
        info: "Long-term average annual rainfall for the site in millimetres. Local weather-station or municipal climate figures are suitable for planning.",
      },
      {
        name: "runoffCoefficient",
        label: "Runoff coefficient",
        type: "number",
        unit: "×",
        placeholder: "e.g. 0.85",
        defaultValue: "0.85",
        info: "Fraction of rainfall that runs off into storage. Clean metal roofs are often 0.8–0.95; bare or vegetated ground is much lower.",
      },
      {
        name: "annualDemand",
        label: "Annual demand (optional)",
        type: "number",
        unit: "litres",
        placeholder: "e.g. 500000",
        info: "Optional litres you hope to supply from harvested water each year. Helps compare yield against need.",
      },
      {
        name: "storageDays",
        label: "Storage days required",
        type: "number",
        unit: "days",
        placeholder: "e.g. 30",
        defaultValue: "30",
        info: "How many days of demand you want stored between rain events. Longer storage usually means a larger tank or lined dam.",
      },
    ],
    resultLabels: [
      "Annual harvestable water",
      "Estimated storage requirement",
      "Suggested tank / dam option",
      "Next step",
    ],
    resultHelp:
      "Rainwater harvesting estimates help decide between steel water tanks and lined catchment dams.",
    relatedServiceHref: "/steel-water-storage-tanks",
    relatedServiceLabel: "Explore steel water tanks",
  },
  {
    id: "waterproofing-area",
    name: "Waterproofing Area Calculator",
    shortName: "Waterproofing Area",
    bestFor: "Roofs and reservoirs",
    description:
      "Estimate waterproofing material area for roofs, reservoirs, channels or water-retaining structures.",
    icon: ShieldCheckIcon,
    fields: [
      {
        name: "length",
        label: "Length",
        type: "number",
        unit: "m",
        placeholder: "e.g. 25",
        info: "Longer plan dimension of the surface to be waterproofed (roof, channel or reservoir floor).",
      },
      {
        name: "width",
        label: "Width",
        type: "number",
        unit: "m",
        placeholder: "e.g. 12",
        info: "Shorter plan dimension of the surface to be waterproofed.",
      },
      {
        name: "layers",
        label: "Number of layers",
        type: "number",
        unit: "layers",
        placeholder: "e.g. 2",
        defaultValue: "2",
        info: "How many membrane layers the system uses. Torch-on systems are often two layers; confirm the specified system with Damtech.",
      },
      {
        name: "upstandHeight",
        label: "Upstand height",
        type: "number",
        unit: "m",
        placeholder: "e.g. 0.3",
        defaultValue: "0.3",
        info: "Vertical turn-up at edges, parapets or walls that must also be waterproofed. Extra material is added around the perimeter.",
      },
      {
        name: "overlap",
        label: "Overlap percentage",
        type: "number",
        unit: "%",
        defaultValue: "10",
        fixed: true,
        info: "Fixed Damtech planning default for membrane side and end laps. Applied automatically.",
      },
      {
        name: "wastage",
        label: "Wastage percentage",
        type: "number",
        unit: "%",
        defaultValue: "10",
        fixed: true,
        info: "Fixed Damtech planning default for cutting waste and detailing. Applied automatically.",
      },
    ],
    resultLabels: [
      "Waterproofing area",
      "Estimated material area",
      "Next step",
    ],
    resultHelp:
      "Waterproofing area estimates support early material planning for torch-on and bitumen systems.",
    relatedServiceHref: "/bitumen-waterproofing",
    relatedServiceLabel: "View waterproofing services",
  },
  {
    id: "leaking-dam-repair",
    name: "Leaking Dam Repair Assessment Tool",
    shortName: "Leaking Dam Repair",
    bestFor: "Inspection planning",
    description:
      "A guided decision tool to help identify whether repair, relining or inspection is likely needed for a leaking dam.",
    icon: WrenchIcon,
    fields: [
      {
        name: "waterLossRate",
        label: "Water loss rate",
        type: "select",
        defaultValue: "moderate",
        info: "How quickly water level drops when there is no significant outflow or use. Faster unexplained loss usually means higher urgency.",
        options: [
          { value: "low", label: "Slow / gradual drop" },
          { value: "moderate", label: "Noticeable weekly drop" },
          { value: "high", label: "Rapid or continuous loss" },
        ],
      },
      {
        name: "visibleDamage",
        label: "Visible tears or punctures",
        type: "select",
        defaultValue: "unknown",
        info: "Whether you can see holes, tears, seam openings or damaged patches in an existing liner.",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unknown", label: "Not sure" },
        ],
      },
      {
        name: "wetPatches",
        label: "Wet patches below dam wall",
        type: "select",
        defaultValue: "unknown",
        info: "Soft, wet or springy ground on the downstream face or toe can indicate seepage through the wall or basin.",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unknown", label: "Not sure" },
        ],
      },
      {
        name: "damAge",
        label: "Dam / liner age",
        type: "text",
        placeholder: "e.g. 12 years",
        info: "Approximate age of the dam or existing lining. Older liners may need inspection even when damage is not obvious.",
      },
      {
        name: "existingLiner",
        label: "Existing liner type",
        type: "select",
        defaultValue: "hdpe",
        info: "Current lining material if known. Unlined earth dams and aged membranes are assessed differently.",
        options: [
          { value: "hdpe", label: "HDPE" },
          { value: "pvc", label: "PVC" },
          { value: "bitumen", label: "Bitumen / torch-on" },
          { value: "none", label: "Unlined earth dam" },
          { value: "unknown", label: "Unknown" },
        ],
      },
      {
        name: "canEmpty",
        label: "Can the dam be emptied?",
        type: "select",
        defaultValue: "maybe",
        info: "Whether water can be drawn down for inspection or repair. Seasonal emptying windows often dictate repair timing.",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "maybe", label: "Maybe / seasonal" },
        ],
      },
      {
        name: "accessCondition",
        label: "Site access condition",
        type: "select",
        defaultValue: "good",
        info: "Whether plant, vehicles and crew can reach the dam safely. Limited access affects repair method and programme.",
        options: [
          { value: "good", label: "Good — machinery can reach" },
          { value: "limited", label: "Limited access" },
          { value: "difficult", label: "Difficult / remote" },
        ],
      },
    ],
    resultLabels: [
      "Urgency level",
      "Likely next step",
      "Recommended action",
    ],
    resultHelp:
      "Use this leaking dam repair assessment to prepare information before requesting a site inspection.",
    relatedServiceHref: "/dam-repair-services",
    relatedServiceLabel: "Learn about leaking dam repair",
  },
  {
    id: "project-budget",
    name: "Project Budget Preparation Tool",
    shortName: "Quote Preparation",
    bestFor: "Faster estimates",
    description:
      "Prepare basic project information so Damtech can provide a faster, more accurate dam lining or waterproofing quote.",
    icon: FileTextIcon,
    fields: [
      {
        name: "siteLocation",
        label: "Site location",
        type: "text",
        placeholder: "e.g. Grabouw, Western Cape",
        info: "Town or area of the site. Helps Damtech plan travel, freight and regional site conditions.",
      },
      {
        name: "damSize",
        label: "Approximate dam size",
        type: "text",
        placeholder: "e.g. 40 m × 25 m × 3 m deep",
        info: "Rough dimensions or area if known. Even approximate figures speed up a preliminary quote discussion.",
      },
      {
        name: "serviceRequired",
        label: "Service required",
        type: "select",
        defaultValue: "dam-lining",
        info: "The main Damtech service you need — dam linings, steel tanks, waterproofing, repair or reservoir lining.",
        options: [
          { value: "dam-lining", label: "Dam linings" },
          { value: "steel-tank", label: "Steel water tank" },
          { value: "waterproofing", label: "Waterproofing" },
          { value: "repair", label: "Leaking dam repair" },
          { value: "reservoir", label: "Reservoir lining" },
        ],
      },
      {
        name: "existingLiner",
        label: "Existing liner?",
        type: "select",
        defaultValue: "no",
        info: "Whether a liner is already installed. Relines and repairs need different preparation from a first-time lining.",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unknown", label: "Not sure" },
        ],
      },
      {
        name: "accessCondition",
        label: "Access condition",
        type: "select",
        defaultValue: "good",
        info: "Site access for vehicles and installation plant. Difficult access can affect programme and cost.",
        options: [
          { value: "good", label: "Good" },
          { value: "limited", label: "Limited" },
          { value: "difficult", label: "Difficult" },
        ],
      },
      {
        name: "photosAvailable",
        label: "Photos available?",
        type: "select",
        defaultValue: "no",
        info: "Clear site photos help Damtech assess embankments, water level and access before a site visit.",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "some", label: "Some photos" },
        ],
      },
      {
        name: "urgency",
        label: "Urgency",
        type: "select",
        defaultValue: "normal",
        info: "How soon you need work to start. Urgent leaks are prioritised differently from early planning enquiries.",
        options: [
          { value: "urgent", label: "Urgent" },
          { value: "normal", label: "Normal" },
          { value: "planning", label: "Planning stage" },
        ],
      },
      {
        name: "waterInDam",
        label: "Water currently in dam?",
        type: "select",
        defaultValue: "yes",
        info: "Whether the dam currently holds water. This affects inspection options and whether drawdown is needed before lining or repair.",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "partial", label: "Partially full" },
        ],
      },
    ],
    resultLabels: [
      "Quote readiness",
      "Missing information checklist",
      "Next step",
    ],
    resultHelp:
      "Complete project details help Damtech prepare a dam lining quote faster with fewer follow-up questions.",
    relatedServiceHref: "/quote",
    relatedServiceLabel: "Request a dam lining quote",
  },
];

export const CALCULATOR_USE_CASES = [
  {
    id: "line-dam",
    title: "I need to line an earth dam",
    description: "Estimate dam lining material area for ponds, farm dams and reservoirs.",
    calculatorId: "dam-lining-area",
    recommended: "Dam Lining Area Calculator",
  },
  {
    id: "farm-storage",
    title: "I need water storage for a farm",
    description: "Plan annual demand and steel tank sizing for reliable farm water security.",
    calculatorId: "annual-water-requirement",
    recommended: "Annual Water Requirement + Steel Tank Size",
    secondaryCalculatorId: "steel-tank-size",
  },
  {
    id: "irrigation",
    title: "I need irrigation water planning",
    description: "Estimate crop irrigation needs before sizing dams and storage.",
    calculatorId: "irrigation-water",
    recommended: "Irrigation Water Requirement",
  },
  {
    id: "leaking-dam",
    title: "I have a leaking dam",
    description: "Assess urgency and prepare for a leaking dam repair inspection.",
    calculatorId: "leaking-dam-repair",
    recommended: "Leaking Dam Repair Assessment",
  },
  {
    id: "waterproofing",
    title: "I need waterproofing material",
    description: "Estimate waterproofing area for roofs, channels and reservoirs.",
    calculatorId: "waterproofing-area",
    recommended: "Waterproofing Area Calculator",
  },
  {
    id: "faster-quote",
    title: "I want a faster quote",
    description: "Gather project details before requesting a site-specific quote.",
    calculatorId: "project-budget",
    recommended: "Project Budget Preparation Tool",
  },
] as const;

export const CALCULATOR_FAQS = [
  {
    question: "Can I use the dam lining calculator for a final quote?",
    answer:
      "No. It provides a preliminary estimate only. Final material quantities depend on site dimensions, slopes, anchor trenches, overlap, wastage, access and material specifications.",
  },
  {
    question: "What measurements do I need for a dam lining estimate?",
    answer:
      "Collect the top length and width, bottom length and width, depth and side slope. Freeboard can be adjusted if needed. Overlap, anchor trench and wastage allowances are applied automatically as Damtech planning defaults.",
  },
  {
    question: "Can the calculator estimate water requirements for a farm?",
    answer:
      "Yes, the page includes planning calculators for annual water demand, land-size based water requirements and irrigation water requirements. Final values depend on crop type, rainfall, soil conditions and irrigation efficiency.",
  },
  {
    question: "Can Damtech help if my dam is already leaking?",
    answer:
      "Yes. Use the leaking dam repair assessment tool to prepare basic information, then request a site-specific inspection or quote.",
  },
  {
    question: "Are calculator results engineering designs?",
    answer:
      "No. The calculators provide planning estimates only and do not replace engineering design, water-use approval, supplier specifications or a formal Damtech quotation.",
  },
] as const;

export const CALCULATOR_GUIDANCE_CHECKLIST = [
  "Measure length, width and depth",
  "Confirm existing liner condition",
  "Estimate annual water demand",
  "Note access constraints",
  "Take clear site photos",
  "Request a site-specific quote",
] as const;

export function getCalculatorById(id: string): CalculatorConfig | undefined {
  return CALCULATORS.find((calc) => calc.id === id);
}

export const DEFAULT_CALCULATOR_ID = CALCULATORS[0]?.id ?? "dam-lining-area";
