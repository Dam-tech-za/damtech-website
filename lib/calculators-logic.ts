/**
 * Damtech Calculator Hub — v1 calculation logic.
 * Pure functions only; no React or DOM access.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type CalculatorInputValue = string | number | undefined | null;

export type CalculatorInputs = Record<string, CalculatorInputValue>;

export type CalculatorResult = {
  values: Record<string, string | number>;
  warnings?: string[];
  assumptions?: string[];
  nextStep?: string;
};

export type CalculatorError = {
  error: string;
  fieldErrors?: Record<string, string>;
};

export type CalculatorOutput = CalculatorResult | CalculatorError;

// ─── Constants ─────────────────────────────────────────────────────────────

export const GLOBAL_DISCLAIMER =
  "These results are preliminary planning estimates only. Final quantities and recommendations must be confirmed by Damtech after reviewing site dimensions, material specifications, access, site conditions and project requirements.";

export const TANK_SIZE_BANDS = [
  11_000, 25_000, 50_000, 75_000, 100_000, 150_000, 200_000, 250_000, 500_000,
  1_000_000,
] as const;

export const RUNOFF_COEFFICIENTS = {
  roof: 0.85,
  metalRoof: 0.9,
  tileRoof: 0.8,
  concrete: 0.75,
  compactedGround: 0.5,
  bareGround: 0.35,
  mixedCatchment: 0.6,
} as const;

export const CROP_ET_DEFAULTS_MM: Record<string, number> = {
  general: 650,
  citrus: 850,
  vineyard: 650,
  vegetables: 550,
  pasture: 900,
  orchard: 800,
};

export const LAND_INTENSITY_M3_PER_HA: Record<string, number> = {
  irrigation: 6_500,
  grazing: 250,
  lodge: 1_200,
  mining: 2_500,
  landscape: 3_500,
};

export const USAGE_STORAGE_GUIDANCE: Record<
  string,
  { backupDaysMin: number; backupDaysMax: number; recommendation: string; label: string }
> = {
  household: {
    label: "household",
    backupDaysMin: 3,
    backupDaysMax: 7,
    recommendation:
      "Short-term backup storage is usually tank-based unless demand is high.",
  },
  farm: {
    label: "farm",
    backupDaysMin: 30,
    backupDaysMax: 90,
    recommendation:
      "Farm storage often uses a combination of lined dams and steel tanks.",
  },
  livestock: {
    label: "livestock",
    backupDaysMin: 7,
    backupDaysMax: 30,
    recommendation:
      "Livestock demand should allow for heat, herd size and trough reliability.",
  },
  irrigation: {
    label: "irrigation",
    backupDaysMin: 30,
    backupDaysMax: 120,
    recommendation:
      "Irrigation storage is usually better planned around seasonal demand and dam capacity.",
  },
  lodge: {
    label: "game lodge",
    backupDaysMin: 7,
    backupDaysMax: 30,
    recommendation:
      "Game lodges often need reliable backup storage due to remote access and peak occupancy.",
  },
  mine: {
    label: "mine",
    backupDaysMin: 7,
    backupDaysMax: 60,
    recommendation:
      "Mining water storage should be confirmed against operational, environmental and compliance requirements.",
  },
  commercial: {
    label: "commercial",
    backupDaysMin: 3,
    backupDaysMax: 21,
    recommendation:
      "Commercial sites usually require a tank or reservoir sized around continuity risk.",
  },
};

export const HDPE_MATERIAL_NOTE =
  "HDPE is typically selected for exposed dam linings where UV resistance, seam welding and long-term durability are important. Thickness and supplier specification must be confirmed for the site.";

export const PVC_MATERIAL_NOTE =
  "PVC is flexible and useful in selected lining applications, but material selection must consider exposure, installation conditions, puncture risk and supplier warranty terms.";

export const HDPE_ROLL_WIDTH_M = 7;
export const PVC_ROLL_WIDTH_M = 4;

const CROP_ET_WARNING =
  "Crop water requirements vary significantly by region, season, cultivar, soil and irrigation system. Confirm values with local agronomic data.";

const LAND_SIZE_WARNING =
  "Land-size water estimates are broad planning figures. Actual demand depends on stocking rate, crop type, rainfall, soil, irrigation method, occupancy and operating patterns.";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const numberFormatter = new Intl.NumberFormat("en-ZA", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const litreFormatter = new Intl.NumberFormat("en-ZA", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function parseNumber(value: CalculatorInputValue): number {
  if (value === undefined || value === null || value === "") return NaN;
  const num = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(num) ? num : NaN;
}

export function isPositiveNumber(value: CalculatorInputValue): boolean {
  const num = parseNumber(value);
  return Number.isFinite(num) && num > 0;
}

export function isNonNegativeNumber(value: CalculatorInputValue): boolean {
  const num = parseNumber(value);
  return Number.isFinite(num) && num >= 0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percentToFactor(percent: number): number {
  return percent / 100;
}

export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat("en-ZA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatM2(value: number): string {
  return `${numberFormatter.format(value)} m²`;
}

export function formatM3(value: number): string {
  return `${numberFormatter.format(value)} m³`;
}

export function formatLitres(value: number): string {
  return `${litreFormatter.format(Math.round(value))} litres`;
}

export function formatKL(value: number): string {
  const kl = value / 1000;
  return kl >= 1000
    ? `${formatNumber(kl / 1000, 1)} ML`
    : `${formatNumber(kl, kl % 1 === 0 ? 0 : 1)} kL`;
}

export function litresToM3(litres: number): number {
  return litres / 1000;
}

export function m3ToLitres(m3: number): number {
  return m3 * 1000;
}

export function mmHaToM3(mm: number, hectares: number): number {
  return mm * hectares * 10;
}

export function m2MmToLitres(areaM2: number, rainfallMm: number): number {
  return areaM2 * rainfallMm;
}

export function roundUpToBand(value: number, bands: readonly number[]): number {
  const match = bands.find((band) => band >= value);
  return match ?? bands[bands.length - 1]!;
}

export function safeText(value: CalculatorInputValue): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function validationError(fieldErrors: Record<string, string>): CalculatorError {
  return {
    error: "Please check the highlighted fields before calculating.",
    fieldErrors,
  };
}

function success(
  values: Record<string, string | number>,
  options?: {
    warnings?: string[];
    assumptions?: string[];
    nextStep?: string;
  },
): CalculatorResult {
  const assumptions = options?.assumptions ?? [];
  if (!assumptions.includes(GLOBAL_DISCLAIMER)) {
    assumptions.push(GLOBAL_DISCLAIMER);
  }
  return {
    values,
    warnings: options?.warnings,
    assumptions,
    nextStep: options?.nextStep,
  };
}

function getTankBandText(bandLitres: number): string {
  if (bandLitres <= 25_000) return "Small storage band: up to 25 kL";
  if (bandLitres <= 100_000) return "Medium storage band: 50 kL – 100 kL";
  if (bandLitres <= 250_000) return "Large storage band: 150 kL – 250 kL";
  if (bandLitres <= 500_000) return "Large reservoir band: 250 kL – 500 kL";
  return "High-volume storage: 500 kL+ — request a site-specific design discussion";
}

function parseDamAgeYears(value: CalculatorInputValue): number | null {
  const text = safeText(value);
  if (!text) return null;
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseNumber(match[1]) : null;
}

// ─── Calculator 1: Dam Lining Area ───────────────────────────────────────────

export function calculateDamLiningArea(inputs: CalculatorInputs): CalculatorOutput {
  const topLength = parseNumber(inputs.topLength);
  const topWidth = parseNumber(inputs.topWidth);
  const bottomLength = parseNumber(inputs.bottomLength);
  const bottomWidth = parseNumber(inputs.bottomWidth);
  const depth = parseNumber(inputs.depth);
  const sideSlope = parseNumber(inputs.sideSlope);
  const freeboard = parseNumber(inputs.freeboard);
  const overlap = parseNumber(inputs.overlap);
  const anchorTrench = parseNumber(inputs.anchorTrench);
  const wastage = parseNumber(inputs.wastage);

  const fieldErrors: Record<string, string> = {};

  if (!isPositiveNumber(inputs.topLength))
    fieldErrors.topLength = "Top length must be greater than 0.";
  if (!isPositiveNumber(inputs.topWidth))
    fieldErrors.topWidth = "Top width must be greater than 0.";
  if (!isPositiveNumber(inputs.bottomLength))
    fieldErrors.bottomLength = "Bottom length must be greater than 0.";
  if (!isPositiveNumber(inputs.bottomWidth))
    fieldErrors.bottomWidth = "Bottom width must be greater than 0.";
  if (!isPositiveNumber(inputs.depth)) fieldErrors.depth = "Depth must be greater than 0.";
  if (!isNonNegativeNumber(inputs.sideSlope))
    fieldErrors.sideSlope = "Side slope must be 0 or greater.";
  if (!isNonNegativeNumber(inputs.freeboard))
    fieldErrors.freeboard = "Freeboard allowance must be 0 or greater.";
  if (!isNonNegativeNumber(inputs.overlap))
    fieldErrors.overlap = "Overlap allowance must be 0 or greater.";
  if (!isNonNegativeNumber(inputs.anchorTrench))
    fieldErrors.anchorTrench = "Anchor trench allowance must be 0 or greater.";
  if (!Number.isFinite(wastage) || wastage < 0 || wastage > 40)
    fieldErrors.wastage = "Wastage must be between 0% and 40%.";

  if (bottomLength > topLength || bottomWidth > topWidth) {
    const msg =
      "Bottom dimensions should normally be smaller than or equal to top dimensions for an earth dam basin.";
    if (bottomLength > topLength) fieldErrors.bottomLength = msg;
    if (bottomWidth > topWidth) fieldErrors.bottomWidth = msg;
  }

  if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors);

  const linedDepth = depth + freeboard;
  const baseArea = bottomLength * bottomWidth;
  const slopeLength = Math.sqrt(
    linedDepth ** 2 + (sideSlope * linedDepth) ** 2,
  );
  const avgLongLength = (topLength + bottomLength) / 2;
  const avgShortWidth = (topWidth + bottomWidth) / 2;
  const longSideArea = 2 * avgLongLength * slopeLength;
  const shortSideArea = 2 * avgShortWidth * slopeLength;
  const sideSlopeArea = longSideArea + shortSideArea;
  const rawLinerArea = baseArea + sideSlopeArea;
  const topPerimeter = 2 * (topLength + topWidth);
  const overlapArea = topPerimeter * overlap;
  const anchorArea = topPerimeter * anchorTrench;
  const areaBeforeWastage = rawLinerArea + overlapArea + anchorArea;
  const materialArea = areaBeforeWastage * (1 + wastage / 100);

  const warnings: string[] = [];
  if (sideSlope < 1.5) {
    warnings.push(
      "Side slope is steep. Confirm constructability and liner installation requirements.",
    );
  }
  if (depth > 6) {
    warnings.push(
      "Deep dams may require more detailed engineering and installation review.",
    );
  }
  if (materialArea > 10_000) {
    warnings.push(
      "Large projects should be verified from survey dimensions or drone measurements.",
    );
  }

  const nextStep =
    "Use this as a preliminary planning estimate only. Damtech should confirm the final dam lining area after checking slopes, anchor trenches, overlaps, site access and material specification.";

  return success(
    {
      "Base area": formatM2(baseArea),
      "Side slope area": formatM2(sideSlopeArea),
      "Total liner area": formatM2(rawLinerArea),
      "Estimated material area (incl. overlap & wastage)": formatM2(materialArea),
      "Recommended next step": nextStep,
    },
    { warnings, nextStep },
  );
}

// ─── Calculator 2: HDPE / PVC Material ───────────────────────────────────────

export function calculateHdpePvcMaterial(inputs: CalculatorInputs): CalculatorOutput {
  const topLength = parseNumber(inputs.topLength);
  const topWidth = parseNumber(inputs.topWidth);
  const depth = parseNumber(inputs.depth);
  const materialType = safeText(inputs.materialType) || "hdpe";
  const thickness = parseNumber(inputs.thickness);
  const overlap = parseNumber(inputs.overlap);
  const anchorTrench = parseNumber(inputs.anchorTrench);

  const fieldErrors: Record<string, string> = {};

  if (!isPositiveNumber(inputs.topLength))
    fieldErrors.topLength = "Dam top length must be greater than 0.";
  if (!isPositiveNumber(inputs.topWidth))
    fieldErrors.topWidth = "Dam top width must be greater than 0.";
  if (!isPositiveNumber(inputs.depth)) fieldErrors.depth = "Average depth must be greater than 0.";
  if (!["hdpe", "pvc"].includes(materialType))
    fieldErrors.materialType = "Select HDPE or PVC material type.";
  if (!isNonNegativeNumber(inputs.overlap))
    fieldErrors.overlap = "Overlap allowance must be 0 or greater.";
  if (!isNonNegativeNumber(inputs.anchorTrench))
    fieldErrors.anchorTrench = "Anchor trench allowance must be 0 or greater.";

  const thicknessText = safeText(inputs.thickness);
  if (thicknessText && (!Number.isFinite(thickness) || thickness <= 0 || thickness > 3)) {
    fieldErrors.thickness = "Thickness must be between 0 and 3 mm if provided.";
  }

  if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors);

  const sheetLength = topLength + 2 * depth + 2 * anchorTrench + 2 * overlap;
  const sheetWidth = topWidth + 2 * depth + 2 * anchorTrench + 2 * overlap;
  const totalArea = sheetLength * sheetWidth;

  const preferredRollWidth =
    materialType === "hdpe" ? HDPE_ROLL_WIDTH_M : PVC_ROLL_WIDTH_M;
  const rollCount = Math.ceil(sheetWidth / preferredRollWidth);

  const warnings: string[] = [];
  if (depth > topWidth / 2) {
    warnings.push(
      "Depth appears high compared with width. Confirm dimensions before relying on this estimate.",
    );
  }
  if (materialType === "hdpe" && thicknessText && thickness < 0.75) {
    warnings.push(
      "Confirm whether the selected thickness is suitable for exposed dam lining conditions.",
    );
  }

  const materialNote = materialType === "hdpe" ? HDPE_MATERIAL_NOTE : PVC_MATERIAL_NOTE;

  const rollCoverage = `Planning layout: approximately ${rollCount} roll widths of ${preferredRollWidth} m across × ${formatNumber(sheetLength)} m long. Confirm actual roll width and seam layout with supplier.`;

  const nextStep =
    "Use this estimate to prepare a quote request. Damtech should confirm final material type, thickness, roll layout, seam overlaps and anchor details.";

  return success(
    {
      "Estimated roll coverage": rollCoverage,
      "Total area (m²)": formatM2(totalArea),
      "Material notes": materialNote,
      "Next step": nextStep,
    },
    {
      warnings,
      assumptions: [
        "Roll width and layout are planning figures only and not a supplier commitment.",
        GLOBAL_DISCLAIMER,
      ],
      nextStep,
    },
  );
}

// ─── Calculator 3: Steel Tank Size ───────────────────────────────────────────

export function calculateSteelTankSize(inputs: CalculatorInputs): CalculatorOutput {
  const dailyRequirement = parseNumber(inputs.dailyRequirement);
  const backupDays = parseNumber(inputs.backupDays);
  const safetyFactor = parseNumber(inputs.safetyFactor);
  const tankType = safeText(inputs.tankType) || "corrugated";

  const fieldErrors: Record<string, string> = {};

  if (!isPositiveNumber(inputs.dailyRequirement))
    fieldErrors.dailyRequirement = "Daily water requirement must be greater than 0.";
  if (!Number.isFinite(backupDays) || backupDays <= 0 || backupDays > 365)
    fieldErrors.backupDays = "Backup storage days must be between 1 and 365.";
  if (!Number.isFinite(safetyFactor) || safetyFactor < 1 || safetyFactor > 3)
    fieldErrors.safetyFactor = "Safety factor must be between 1 and 3.";
  if (!["corrugated", "modular", "unsure"].includes(tankType))
    fieldErrors.tankType = "Select a valid tank type.";

  if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors);

  const requiredLitres = dailyRequirement * backupDays * safetyFactor;
  const requiredM3 = litresToM3(requiredLitres);
  const bandLitres = roundUpToBand(requiredLitres, TANK_SIZE_BANDS);

  const warnings: string[] = [];
  if (backupDays < 3) {
    warnings.push(
      "Backup period is short. Consider whether outages, pump downtime or delivery delays require a larger reserve.",
    );
  }
  if (safetyFactor < 1.1) {
    warnings.push(
      "A low safety factor may not allow for peak demand, losses or operational variation.",
    );
  }

  let bandText: string;
  if (requiredLitres > 1_000_000) {
    bandText =
      "High-volume storage above 1,000 kL. Consider phased steel reservoirs, lined dams or a combined storage system after site review.";
  } else {
    bandText = `Plan around at least ${formatKL(bandLitres)} of storage. ${getTankBandText(bandLitres)}. Confirm final tank sizing against demand pattern, site access and reserve requirements.`;
  }

  const nextStep =
    "Confirm the daily demand, backup period, fire reserve if applicable, foundation conditions and site access before selecting a final steel water tank.";

  return success(
    {
      "Recommended storage volume (litres)": formatLitres(requiredLitres),
      "Recommended storage volume (m³)": formatM3(requiredM3),
      "Suggested tank size band": bandText,
      "Next step": nextStep,
    },
    { warnings, nextStep },
  );
}

// ─── Calculator 4: Annual Water Requirement ──────────────────────────────────

export function calculateAnnualWaterRequirement(
  inputs: CalculatorInputs,
): CalculatorOutput {
  const dailyDemand = parseNumber(inputs.dailyDemand);
  const daysPerYear = parseNumber(inputs.daysPerYear);
  const landSize = parseNumber(inputs.landSize);
  const usageType = safeText(inputs.usageType) || "farm";

  const fieldErrors: Record<string, string> = {};

  if (!isPositiveNumber(inputs.dailyDemand))
    fieldErrors.dailyDemand = "Daily water demand must be greater than 0.";
  if (!Number.isFinite(daysPerYear) || daysPerYear <= 0 || daysPerYear > 366)
    fieldErrors.daysPerYear = "Days per year must be between 1 and 366.";
  if (safeText(inputs.landSize) && !isNonNegativeNumber(inputs.landSize))
    fieldErrors.landSize = "Land size must be 0 or greater if provided.";
  if (!USAGE_STORAGE_GUIDANCE[usageType])
    fieldErrors.usageType = "Select a valid usage type.";

  if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors);

  const annualLitres = dailyDemand * daysPerYear;
  const annualM3 = litresToM3(annualLitres);
  const guidance = USAGE_STORAGE_GUIDANCE[usageType]!;

  const storageRecommendation = `For ${guidance.label} use, a practical backup planning range is usually ${guidance.backupDaysMin}–${guidance.backupDaysMax} days, but final storage depends on demand pattern, rainfall, supply reliability and site conditions. ${guidance.recommendation}`;

  const assumptions: string[] = [];
  if (safeText(inputs.landSize) && landSize > 0) {
    assumptions.push(
      "Land size was used as context only in this calculator. Use the land-size calculator for hectare-based demand.",
    );
  }

  const nextStep =
    "Use this as a demand estimate. Damtech can help translate annual demand into a dam lining, steel water tank or combined water storage option.";

  return success(
    {
      "Annual requirement (litres)": formatLitres(annualLitres),
      "Annual requirement (m³)": formatM3(annualM3),
      "Rough storage recommendation": storageRecommendation,
      "Next step": nextStep,
    },
    { assumptions, nextStep },
  );
}

// ─── Calculator 5: Water by Land Size ────────────────────────────────────────

export function calculateWaterByLandSize(inputs: CalculatorInputs): CalculatorOutput {
  const landSize = parseNumber(inputs.landSize);
  const useCase = safeText(inputs.useCase) || "irrigation";
  const waterIntensityInput = parseNumber(inputs.waterIntensity);
  const seasonalFactor = parseNumber(inputs.seasonalFactor);

  const fieldErrors: Record<string, string> = {};

  if (!isPositiveNumber(inputs.landSize))
    fieldErrors.landSize = "Land size must be greater than 0.";
  if (!LAND_INTENSITY_M3_PER_HA[useCase])
    fieldErrors.useCase = "Select a valid use case.";
  if (safeText(inputs.waterIntensity) && !isPositiveNumber(inputs.waterIntensity))
    fieldErrors.waterIntensity = "Water intensity must be greater than 0 if provided.";
  if (!Number.isFinite(seasonalFactor) || seasonalFactor <= 0 || seasonalFactor > 3)
    fieldErrors.seasonalFactor = "Seasonal demand factor must be between 0 and 3.";

  if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors);

  const intensity =
    safeText(inputs.waterIntensity) && waterIntensityInput > 0
      ? waterIntensityInput
      : LAND_INTENSITY_M3_PER_HA[useCase]!;

  const annualM3 = landSize * intensity * seasonalFactor;
  const monthlyM3 = annualM3 / 12;
  const dailyM3 = annualM3 / 365;
  const dailyLitres = m3ToLitres(dailyM3);

  let recommendedSolution: string;
  if (annualM3 < 500) {
    recommendedSolution =
      "Tank-based storage may be sufficient, depending on supply reliability and peak demand.";
  } else if (annualM3 <= 5_000) {
    recommendedSolution =
      "A combined steel water tank and small lined storage option may be practical.";
  } else {
    recommendedSolution =
      "A lined dam, reservoir or combined storage system should be assessed for this scale.";
  }

  recommendedSolution +=
    " Use this as a broad planning estimate only. Demand depends heavily on land use, rainfall, crop, livestock density and operating pattern.";

  return success(
    {
      "Daily estimate": `${formatM3(dailyM3)} / day (${formatLitres(dailyLitres)} / day)`,
      "Monthly estimate": formatM3(monthlyM3),
      "Annual estimate": formatM3(annualM3),
      "Recommended solution": recommendedSolution,
    },
    {
      warnings: [LAND_SIZE_WARNING],
      assumptions: [
        safeText(inputs.waterIntensity)
          ? "User-supplied water intensity was used."
          : `Default planning intensity of ${formatNumber(intensity, 0)} m³/ha/year was used for ${useCase}.`,
        GLOBAL_DISCLAIMER,
      ],
    },
  );
}

// ─── Calculator 6: Irrigation Water ──────────────────────────────────────────

export function calculateIrrigationWater(inputs: CalculatorInputs): CalculatorOutput {
  const cropType = safeText(inputs.cropType) || "general";
  const area = parseNumber(inputs.area);
  const cropWaterReqInput = parseNumber(inputs.cropWaterReq);
  const effectiveRainfall = parseNumber(inputs.effectiveRainfall);
  const irrigationEfficiency = parseNumber(inputs.irrigationEfficiency);
  const irrigationPeriod = parseNumber(inputs.irrigationPeriod);

  const fieldErrors: Record<string, string> = {};

  if (!isPositiveNumber(inputs.area))
    fieldErrors.area = "Irrigated area must be greater than 0.";
  if (!CROP_ET_DEFAULTS_MM[cropType])
    fieldErrors.cropType = "Select a valid crop type.";
  if (safeText(inputs.cropWaterReq) && !isPositiveNumber(inputs.cropWaterReq))
    fieldErrors.cropWaterReq = "Crop water requirement must be greater than 0 if provided.";
  if (!isNonNegativeNumber(inputs.effectiveRainfall))
    fieldErrors.effectiveRainfall = "Effective rainfall must be 0 or greater.";
  if (
    !Number.isFinite(irrigationEfficiency) ||
    irrigationEfficiency <= 0 ||
    irrigationEfficiency > 100
  )
    fieldErrors.irrigationEfficiency =
      "Irrigation efficiency must be between 1% and 100%.";
  if (
    !Number.isFinite(irrigationPeriod) ||
    irrigationPeriod <= 0 ||
    irrigationPeriod > 365
  )
    fieldErrors.irrigationPeriod = "Irrigation period must be between 1 and 365 days.";

  if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors);

  const etcMm =
    safeText(inputs.cropWaterReq) && cropWaterReqInput > 0
      ? cropWaterReqInput
      : CROP_ET_DEFAULTS_MM[cropType]!;

  const netMm = Math.max(etcMm - effectiveRainfall, 0);
  const netM3 = mmHaToM3(netMm, area);
  const efficiencyFactor = irrigationEfficiency / 100;
  const grossM3 = netM3 / efficiencyFactor;
  const m3PerHa = grossM3 / area;
  const dailyGrossM3 = grossM3 / irrigationPeriod;

  const warnings: string[] = [CROP_ET_WARNING];
  if (effectiveRainfall >= etcMm) {
    warnings.push(
      "Effective rainfall equals or exceeds the selected crop water requirement. Net irrigation requirement is shown as 0 m³, but storage may still be needed for dry spells and reliability.",
    );
  }
  if (irrigationEfficiency < 60) {
    warnings.push(
      "Low efficiency significantly increases gross water requirement. Check system losses.",
    );
  }
  if (irrigationEfficiency > 90) {
    warnings.push(
      "Very high efficiency assumes a well-designed and well-managed system.",
    );
  }

  const nextStep =
    "Use this irrigation estimate to plan storage capacity, lined dam volume or steel tank backup. Confirm final values with local rainfall, crop stage, irrigation system efficiency and agronomic advice.";

  return success(
    {
      "Net irrigation requirement": formatM3(netM3),
      "Gross irrigation requirement": formatM3(grossM3),
      "m³ per hectare": formatM3(m3PerHa),
      "Total m³ required": `${formatM3(grossM3)} over approximately ${Math.round(irrigationPeriod)} days (${formatM3(dailyGrossM3)} / day average)`,
      "Next step": nextStep,
    },
    {
      warnings,
      assumptions: [
        safeText(inputs.cropWaterReq)
          ? "User-supplied crop water requirement (ETc) was used."
          : `Default planning ETc of ${formatNumber(etcMm, 0)} mm was used for ${cropType}.`,
        GLOBAL_DISCLAIMER,
      ],
      nextStep,
    },
  );
}

// ─── Calculator 7: Rainwater Harvesting ─────────────────────────────────────

export function calculateRainwaterHarvesting(inputs: CalculatorInputs): CalculatorOutput {
  const catchmentArea = parseNumber(inputs.catchmentArea);
  const annualRainfall = parseNumber(inputs.annualRainfall);
  const runoffCoefficient = parseNumber(inputs.runoffCoefficient);
  const storageDays = parseNumber(inputs.storageDays);
  const annualDemandInput = parseNumber(inputs.annualDemand);

  const fieldErrors: Record<string, string> = {};

  if (!isPositiveNumber(inputs.catchmentArea))
    fieldErrors.catchmentArea = "Catchment area must be greater than 0.";
  if (!isPositiveNumber(inputs.annualRainfall))
    fieldErrors.annualRainfall = "Annual rainfall must be greater than 0.";
  if (
    !Number.isFinite(runoffCoefficient) ||
    runoffCoefficient <= 0 ||
    runoffCoefficient > 1
  )
    fieldErrors.runoffCoefficient = "Runoff coefficient must be between 0 and 1.";
  if (!Number.isFinite(storageDays) || storageDays <= 0 || storageDays > 365)
    fieldErrors.storageDays = "Storage days must be between 1 and 365.";
  if (safeText(inputs.annualDemand) && !isPositiveNumber(inputs.annualDemand))
    fieldErrors.annualDemand = "Annual demand must be greater than 0 if provided.";

  if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors);

  const annualHarvestLitres =
    m2MmToLitres(catchmentArea, annualRainfall) * runoffCoefficient;
  const annualHarvestM3 = litresToM3(annualHarvestLitres);

  let storageRequirementLitres: number;
  let coverageNote = "";

  if (safeText(inputs.annualDemand) && annualDemandInput > 0) {
    const averageDailyDemand = annualDemandInput / 365;
    storageRequirementLitres = averageDailyDemand * storageDays;
    const coveragePercent = (annualHarvestLitres / annualDemandInput) * 100;
    coverageNote = ` Estimated harvest covers approximately ${formatNumber(coveragePercent, 0)}% of annual demand before losses and seasonal mismatch.`;
  } else {
    storageRequirementLitres = (annualHarvestLitres / 365) * storageDays;
  }

  let tankOption: string;
  if (storageRequirementLitres <= 25_000) {
    tankOption = "Small steel or poly tank storage may be sufficient.";
  } else if (storageRequirementLitres <= 250_000) {
    tankOption = "Steel water tank storage should be considered.";
  } else {
    tankOption =
      "Consider a larger steel reservoir, lined dam or combined storage system.";
  }
  if (coverageNote) tankOption += coverageNote;

  const nextStep =
    "Confirm rainfall, catchment type, first-flush losses, filtration and storage days before selecting a final tank or lined storage option.";

  return success(
    {
      "Annual harvestable water": `${formatLitres(annualHarvestLitres)} (${formatM3(annualHarvestM3)})`,
      "Estimated storage requirement": `${formatLitres(storageRequirementLitres)} (${formatM3(litresToM3(storageRequirementLitres))}) for approximately ${Math.round(storageDays)} days of average demand.`,
      "Suggested tank / dam option": tankOption,
      "Next step": nextStep,
    },
    { nextStep },
  );
}

// ─── Calculator 8: Waterproofing Area ──────────────────────────────────────

export function calculateWaterproofingArea(inputs: CalculatorInputs): CalculatorOutput {
  const length = parseNumber(inputs.length);
  const width = parseNumber(inputs.width);
  const layers = parseNumber(inputs.layers);
  const upstandHeight = parseNumber(inputs.upstandHeight);
  const overlap = parseNumber(inputs.overlap);
  const wastage = parseNumber(inputs.wastage);

  const fieldErrors: Record<string, string> = {};

  if (!isPositiveNumber(inputs.length)) fieldErrors.length = "Length must be greater than 0.";
  if (!isPositiveNumber(inputs.width)) fieldErrors.width = "Width must be greater than 0.";
  if (!Number.isFinite(layers) || layers < 1 || layers > 5)
    fieldErrors.layers = "Number of layers must be between 1 and 5.";
  if (!isNonNegativeNumber(inputs.upstandHeight) || upstandHeight > 3)
    fieldErrors.upstandHeight = "Upstand height must be between 0 and 3 m.";
  if (!Number.isFinite(overlap) || overlap < 0 || overlap > 50)
    fieldErrors.overlap = "Overlap must be between 0% and 50%.";
  if (!Number.isFinite(wastage) || wastage < 0 || wastage > 50)
    fieldErrors.wastage = "Wastage must be between 0% and 50%.";

  if (Object.keys(fieldErrors).length > 0) return validationError(fieldErrors);

  const baseArea = length * width;
  const perimeter = 2 * (length + width);
  const upstandArea = perimeter * upstandHeight;
  const waterproofingArea = baseArea + upstandArea;
  const materialArea =
    waterproofingArea * layers * (1 + overlap / 100) * (1 + wastage / 100);

  const warnings: string[] = [];
  if (layers > 2) {
    warnings.push("Multiple layers may require product-specific confirmation.");
  }
  if (upstandHeight === 0) {
    warnings.push(
      "No upstand allowance included. Reservoirs, roofs and channels often need upstand or return allowances.",
    );
  }

  const nextStep =
    "Use this as a material planning estimate only. Damtech should confirm falls, outlets, penetrations, corners, surface preparation, upstands, overlaps and product specifications before quoting.";

  return success(
    {
      "Waterproofing area": formatM2(waterproofingArea),
      "Estimated material area": formatM2(materialArea),
      "Next step": nextStep,
    },
    { warnings, nextStep },
  );
}

// ─── Calculator 9: Leaking Dam Repair ────────────────────────────────────────

export function calculateLeakingDamRepair(inputs: CalculatorInputs): CalculatorOutput {
  const waterLossRate = safeText(inputs.waterLossRate) || "moderate";
  const visibleDamage = safeText(inputs.visibleDamage) || "unknown";
  const wetPatches = safeText(inputs.wetPatches) || "unknown";
  const existingLiner = safeText(inputs.existingLiner) || "unknown";
  const canEmpty = safeText(inputs.canEmpty) || "maybe";
  const accessCondition = safeText(inputs.accessCondition) || "good";
  const damAgeYears = parseDamAgeYears(inputs.damAge);

  const lossScores: Record<string, number> = { low: 1, moderate: 3, high: 5 };
  const damageScores: Record<string, number> = { no: 0, unknown: 1, yes: 4 };
  const wetScores: Record<string, number> = { no: 0, unknown: 1, yes: 4 };
  const linerScores: Record<string, number> = {
    hdpe: 1,
    pvc: 1,
    bitumen: 2,
    none: 4,
    unknown: 2,
  };
  const emptyScores: Record<string, number> = { yes: 0, maybe: 1, no: 2 };
  const accessScores: Record<string, number> = { good: 0, limited: 1, difficult: 2 };

  let score =
    (lossScores[waterLossRate] ?? 0) +
    (damageScores[visibleDamage] ?? 0) +
    (wetScores[wetPatches] ?? 0) +
    (linerScores[existingLiner] ?? 0) +
    (emptyScores[canEmpty] ?? 0) +
    (accessScores[accessCondition] ?? 0);

  if (damAgeYears !== null) {
    if (damAgeYears >= 20) score += 3;
    else if (damAgeYears >= 10) score += 2;
  } else if (safeText(inputs.damAge)) {
    score += 1;
  }

  const warnings: string[] = [];

  // Decision overrides
  let urgency: "Low" | "Medium" | "High";
  if (
    waterLossRate === "high" &&
    (wetPatches === "yes" || visibleDamage === "yes")
  ) {
    urgency = "High";
  } else if (existingLiner === "none" && wetPatches === "yes") {
    urgency = "High";
    warnings.push(
      "An unlined earth dam with wet patches may indicate seepage through the embankment or basin, not a liner tear.",
    );
  } else if (
    canEmpty === "no" &&
    waterLossRate === "high"
  ) {
    urgency = "High";
    warnings.push(
      "Repair options may be limited if the dam cannot be emptied or lowered.",
    );
  } else if (score <= 5) {
    urgency = "Low";
  } else if (score <= 11) {
    urgency = "Medium";
  } else {
    urgency = "High";
  }

  if (
    visibleDamage === "yes" &&
    (waterLossRate === "moderate" || waterLossRate === "high") &&
    urgency === "Low"
  ) {
    urgency = "Medium";
  }

  if (canEmpty === "no") {
    warnings.push(
      "Repair options may be limited if the dam cannot be emptied or lowered.",
    );
  }
  if (accessCondition === "difficult") {
    warnings.push(
      "Limited access may affect repair method, equipment and timing.",
    );
  }

  let likelyNextStep: string;
  if (urgency === "Low") {
    likelyNextStep =
      "Monitor water loss, photograph visible signs and request advice if loss increases.";
  } else if (urgency === "Medium") {
    likelyNextStep =
      "Site inspection is recommended to confirm whether localised repair, seam repair or partial relining is practical.";
  } else {
    likelyNextStep =
      "Prompt site inspection is recommended. Full relining, embankment seepage review or urgent repair planning may be required.";
  }

  const recommendedAction =
    "Request a Damtech inspection and send photos, dimensions, water level changes and access details. This assessment is not a diagnosis.";

  return success(
    {
      "Urgency level": urgency,
      "Likely next step": likelyNextStep,
      "Recommended action": recommendedAction,
    },
    { warnings, nextStep: recommendedAction },
  );
}

// ─── Calculator 10: Project Budget ───────────────────────────────────────────

export function calculateProjectBudget(inputs: CalculatorInputs): CalculatorOutput {
  const siteLocation = safeText(inputs.siteLocation);
  const damSize = safeText(inputs.damSize);
  const serviceRequired = safeText(inputs.serviceRequired) || "dam-lining";
  const existingLiner = safeText(inputs.existingLiner) || "unknown";
  const accessCondition = safeText(inputs.accessCondition) || "good";
  const photosAvailable = safeText(inputs.photosAvailable) || "no";
  const urgency = safeText(inputs.urgency) || "normal";
  const waterInDam = safeText(inputs.waterInDam) || "yes";

  const validServices = [
    "dam-lining",
    "steel-tank",
    "waterproofing",
    "repair",
    "reservoir",
  ];
  if (!validServices.includes(serviceRequired)) {
    return validationError({
      serviceRequired: "Select a valid service type.",
    });
  }

  let score = 0;
  const missing: string[] = [];

  if (siteLocation) score += 2;
  else missing.push("Add the site location or nearest town.");

  if (damSize) score += 2;
  else missing.push("Add approximate dimensions such as length × width × depth.");

  score += 2; // valid service

  if (existingLiner === "yes" || existingLiner === "no") score += 1;
  else missing.push("Confirm whether an existing liner is present, if possible.");

  if (accessCondition === "good") score += 2;
  else score += 1;
  if (accessCondition === "difficult") {
    missing.push(
      "Mention access constraints, steep roads, gates, soft ground or distance from loading area.",
    );
  }

  if (photosAvailable === "yes") score += 2;
  else if (photosAvailable === "some") score += 1;
  else missing.push("Take clear photos of the dam, access route, existing liner and problem areas.");

  score += 1; // urgency
  score += 1; // water in dam

  if (waterInDam === "yes" || waterInDam === "partial") {
    missing.push("Indicate current water level and whether the dam can be lowered.");
  }

  const serviceChecklist: Record<string, string> = {
    "dam-lining":
      "Include top dimensions, depth, slope condition and whether an anchor trench is possible.",
    "steel-tank":
      "Include required storage volume, available platform size and water source.",
    waterproofing:
      "Include area dimensions, surface type, leaks and photos.",
    repair:
      "Include water loss rate, visible damage, wet patches and liner age.",
    reservoir:
      "Include reservoir type, dimensions, current condition and access.",
  };

  const serviceNote = serviceChecklist[serviceRequired];
  if (serviceNote && (photosAvailable === "no" || !damSize)) {
    if (!missing.includes(serviceNote)) missing.push(serviceNote);
  }

  let readiness: string;
  let nextStep: string;

  if (score >= 10) {
    readiness = "Ready to request a quote";
    nextStep =
      "You can request a quote now. Send your dimensions, location and photos so Damtech can prepare a site-specific response.";
  } else if (score >= 6) {
    readiness = "Almost ready";
    nextStep =
      "You can request a quote, but adding the missing information will help Damtech respond faster and more accurately.";
  } else {
    readiness = "More information needed";
    nextStep =
      "Gather the missing details before requesting a quote, or contact Damtech for help identifying what is needed.";
  }

  const checklistText =
    missing.length > 0
      ? missing.map((item) => `• ${item}`).join("\n")
      : "All key planning details appear to be covered.";

  return success(
    {
      "Quote readiness": readiness,
      "Missing information checklist": checklistText,
      "Next step": nextStep,
    },
    { nextStep },
  );
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

const CALCULATOR_MAP: Record<string, (inputs: CalculatorInputs) => CalculatorOutput> =
  {
    "dam-lining-area": calculateDamLiningArea,
    "hdpe-pvc-material": calculateHdpePvcMaterial,
    "steel-tank-size": calculateSteelTankSize,
    "annual-water-requirement": calculateAnnualWaterRequirement,
    "water-by-land-size": calculateWaterByLandSize,
    "irrigation-water": calculateIrrigationWater,
    "rainwater-harvesting": calculateRainwaterHarvesting,
    "waterproofing-area": calculateWaterproofingArea,
    "leaking-dam-repair": calculateLeakingDamRepair,
    "project-budget": calculateProjectBudget,
  };

export function calculateCalculator(
  calculatorId: string,
  inputs: CalculatorInputs,
): CalculatorOutput {
  const fn = CALCULATOR_MAP[calculatorId];
  if (!fn) {
    return { error: "Unknown calculator. Please select a valid tool." };
  }
  return fn(inputs);
}
