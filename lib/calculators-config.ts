import type { ComponentType, SVGProps } from "react";
import {
  BuildingIcon,
  DropletIcon,
  FileTextIcon,
  LayersIcon,
  ReservoirIcon,
  SearchIcon,
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
      { name: "topLength", label: "Top length", type: "number", unit: "m", placeholder: "e.g. 40", helperText: "Length across the top of the dam basin." },
      { name: "topWidth", label: "Top width", type: "number", unit: "m", placeholder: "e.g. 25" },
      { name: "bottomLength", label: "Bottom length", type: "number", unit: "m", placeholder: "e.g. 30" },
      { name: "bottomWidth", label: "Bottom width", type: "number", unit: "m", placeholder: "e.g. 18" },
      { name: "depth", label: "Depth", type: "number", unit: "m", placeholder: "e.g. 3", helperText: "Average water depth from bottom to freeboard line." },
      { name: "sideSlope", label: "Side slope", type: "number", unit: ":1", placeholder: "e.g. 2", helperText: "Horizontal run per 1 m vertical (e.g. 2:1)." },
      { name: "freeboard", label: "Freeboard allowance", type: "number", unit: "m", placeholder: "e.g. 0.5", defaultValue: "0.5" },
      { name: "overlap", label: "Overlap allowance", type: "number", unit: "m", placeholder: "e.g. 0.3", defaultValue: "0.3" },
      { name: "anchorTrench", label: "Anchor trench allowance", type: "number", unit: "m", placeholder: "e.g. 1", defaultValue: "1" },
      { name: "wastage", label: "Wastage percentage", type: "number", unit: "%", placeholder: "e.g. 10", defaultValue: "10" },
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
      { name: "topLength", label: "Dam top length", type: "number", unit: "m", placeholder: "e.g. 40" },
      { name: "topWidth", label: "Dam top width", type: "number", unit: "m", placeholder: "e.g. 25" },
      { name: "depth", label: "Average depth", type: "number", unit: "m", placeholder: "e.g. 3" },
      {
        name: "materialType",
        label: "Material type",
        type: "select",
        defaultValue: "hdpe",
        options: [
          { value: "hdpe", label: "HDPE geomembrane" },
          { value: "pvc", label: "PVC geomembrane" },
        ],
      },
      { name: "thickness", label: "Liner thickness (placeholder)", type: "number", unit: "mm", placeholder: "e.g. 1.0", helperText: "Final thickness confirmed during quote." },
      { name: "overlap", label: "Overlap allowance", type: "number", unit: "m", defaultValue: "0.3" },
      { name: "anchorTrench", label: "Anchor trench allowance", type: "number", unit: "m", defaultValue: "1" },
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
      { name: "dailyRequirement", label: "Daily water requirement", type: "number", unit: "litres", placeholder: "e.g. 15000" },
      { name: "demandNotes", label: "People, animals or irrigation demand", type: "text", placeholder: "e.g. 50 cattle + household", helperText: "Helps contextualise your storage need." },
      { name: "backupDays", label: "Backup storage days", type: "number", unit: "days", placeholder: "e.g. 3", defaultValue: "3" },
      { name: "safetyFactor", label: "Safety factor", type: "number", unit: "×", placeholder: "e.g. 1.2", defaultValue: "1.2", helperText: "Allowance for evaporation, leaks or peak demand." },
      {
        name: "tankType",
        label: "Preferred tank type",
        type: "select",
        defaultValue: "corrugated",
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
      { name: "dailyDemand", label: "Daily water demand", type: "number", unit: "litres", placeholder: "e.g. 20000" },
      { name: "daysPerYear", label: "Days per year in use", type: "number", unit: "days", placeholder: "e.g. 365", defaultValue: "365" },
      { name: "landSize", label: "Land size (optional)", type: "number", unit: "ha", placeholder: "e.g. 50" },
      {
        name: "usageType",
        label: "Usage type",
        type: "select",
        defaultValue: "farm",
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
      { name: "landSize", label: "Land size", type: "number", unit: "ha", placeholder: "e.g. 120" },
      {
        name: "useCase",
        label: "Use case",
        type: "select",
        defaultValue: "irrigation",
        options: [
          { value: "irrigation", label: "Crop irrigation" },
          { value: "grazing", label: "Grazing / livestock" },
          { value: "lodge", label: "Game lodge" },
          { value: "mining", label: "Mining support" },
          { value: "landscape", label: "Commercial landscape" },
        ],
      },
      { name: "waterIntensity", label: "Water intensity (placeholder)", type: "number", unit: "m³/ha", placeholder: "e.g. 5000", helperText: "Placeholder — final intensity confirmed per crop and climate." },
      { name: "seasonalFactor", label: "Seasonal demand factor", type: "number", unit: "×", placeholder: "e.g. 1.3", defaultValue: "1.0", helperText: "Adjust for dry-season peaks." },
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
        options: [
          { value: "general", label: "General / mixed crops" },
          { value: "citrus", label: "Citrus" },
          { value: "vineyard", label: "Vineyard" },
          { value: "vegetables", label: "Vegetables" },
          { value: "pasture", label: "Pasture / fodder" },
          { value: "orchard", label: "Orchard" },
        ],
      },
      { name: "area", label: "Irrigated area", type: "number", unit: "ha", placeholder: "e.g. 15" },
      { name: "cropWaterReq", label: "Crop water requirement / ET (placeholder)", type: "number", unit: "mm", placeholder: "e.g. 600", helperText: "Placeholder for crop evapotranspiration (ETc)." },
      { name: "effectiveRainfall", label: "Effective rainfall", type: "number", unit: "mm/year", placeholder: "e.g. 350" },
      { name: "irrigationEfficiency", label: "Irrigation efficiency", type: "number", unit: "%", placeholder: "e.g. 75", defaultValue: "75", helperText: "Accounts for distribution and application losses." },
      { name: "irrigationPeriod", label: "Irrigation period", type: "number", unit: "days", placeholder: "e.g. 180", defaultValue: "180" },
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
      { name: "catchmentArea", label: "Roof / catchment area", type: "number", unit: "m²", placeholder: "e.g. 500" },
      { name: "annualRainfall", label: "Annual rainfall", type: "number", unit: "mm/year", placeholder: "e.g. 650" },
      { name: "runoffCoefficient", label: "Runoff coefficient", type: "number", unit: "×", placeholder: "e.g. 0.85", defaultValue: "0.85", helperText: "Typical roof: 0.8–0.95; bare ground lower." },
      { name: "annualDemand", label: "Annual demand (optional)", type: "number", unit: "litres", placeholder: "e.g. 500000" },
      { name: "storageDays", label: "Storage days required", type: "number", unit: "days", placeholder: "e.g. 30", defaultValue: "30" },
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
      { name: "length", label: "Length", type: "number", unit: "m", placeholder: "e.g. 25" },
      { name: "width", label: "Width", type: "number", unit: "m", placeholder: "e.g. 12" },
      { name: "layers", label: "Number of layers", type: "number", unit: "layers", placeholder: "e.g. 2", defaultValue: "2" },
      { name: "upstandHeight", label: "Upstand height", type: "number", unit: "m", placeholder: "e.g. 0.3", defaultValue: "0.3" },
      { name: "overlap", label: "Overlap percentage", type: "number", unit: "%", placeholder: "e.g. 10", defaultValue: "10" },
      { name: "wastage", label: "Wastage percentage", type: "number", unit: "%", placeholder: "e.g. 10", defaultValue: "10" },
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
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "unknown", label: "Not sure" },
        ],
      },
      { name: "damAge", label: "Dam / liner age", type: "text", placeholder: "e.g. 12 years" },
      {
        name: "existingLiner",
        label: "Existing liner type",
        type: "select",
        defaultValue: "hdpe",
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
      { name: "siteLocation", label: "Site location", type: "text", placeholder: "e.g. Grabouw, Western Cape" },
      { name: "damSize", label: "Approximate dam size", type: "text", placeholder: "e.g. 40 m × 25 m × 3 m deep" },
      {
        name: "serviceRequired",
        label: "Service required",
        type: "select",
        defaultValue: "dam-lining",
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
      "You should collect the top length and width, bottom length and width, depth, side slope information, freeboard allowance and any anchor trench requirements if known.",
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
