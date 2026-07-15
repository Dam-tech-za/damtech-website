export type HdpeLinerInputs = {
  /** Imported calculator or measured floor area (m²) */
  floorAreaM2?: number;
  wallAreaM2?: number;
  /** Direct measured total before allowances */
  measuredAreaM2?: number;
  /** Imported calculator estimated liner area */
  calculatorEstimatedAreaM2?: number;
  anchorAllowanceM2?: number;
  overlapPercent?: number;
  wastePercent?: number;
  geotextileAreaM2?: number;
  rollWidthM?: number;
  rollLengthM?: number;
};

export type HdpeLinerResult = {
  baseAreaM2: number;
  overlapAllowanceM2: number;
  wasteAllowanceM2: number;
  rawCommercialAreaM2: number;
  commercialAreaM2: number;
  geotextileAreaM2: number;
  estimatedRolls: number | null;
  source: "calculator" | "measured_breakdown" | "measured_total";
  disclaimer: string;
};

export const HDPE_DISCLAIMER =
  "Planning estimate only — confirm quantities through site measurement and technical assessment.";

function n(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

/** Round commercial liner quantity up to 2 dp (never under-order). */
export function roundCommercialArea(areaM2: number): number {
  return Math.ceil(areaM2 * 100) / 100;
}

/**
 * commercial_quantity = base_quantity × (1 + waste_percent / 100)
 * Overlap is applied before waste when breakdown inputs exist.
 */
export function calculateHdpeLinerQuantity(
  input: HdpeLinerInputs,
): HdpeLinerResult {
  const overlapPercent = n(input.overlapPercent);
  const wastePercent = n(input.wastePercent);

  let baseAreaM2 = 0;
  let source: HdpeLinerResult["source"] = "measured_total";

  if (n(input.calculatorEstimatedAreaM2) > 0) {
    baseAreaM2 = n(input.calculatorEstimatedAreaM2);
    source = "calculator";
  } else if (n(input.measuredAreaM2) > 0) {
    baseAreaM2 = n(input.measuredAreaM2);
    source = "measured_total";
  } else {
    baseAreaM2 =
      n(input.floorAreaM2) + n(input.wallAreaM2) + n(input.anchorAllowanceM2);
    source = "measured_breakdown";
  }

  const overlapAllowanceM2 = baseAreaM2 * (overlapPercent / 100);
  const afterOverlap = baseAreaM2 + overlapAllowanceM2;
  const wasteAllowanceM2 = afterOverlap * (wastePercent / 100);
  const rawCommercialAreaM2 = afterOverlap + wasteAllowanceM2;
  const commercialAreaM2 = roundCommercialArea(rawCommercialAreaM2);

  const rollArea = n(input.rollWidthM) * n(input.rollLengthM);
  const estimatedRolls =
    rollArea > 0 ? Math.ceil(commercialAreaM2 / rollArea) : null;

  return {
    baseAreaM2,
    overlapAllowanceM2,
    wasteAllowanceM2,
    rawCommercialAreaM2,
    commercialAreaM2,
    geotextileAreaM2: n(input.geotextileAreaM2) || commercialAreaM2,
    estimatedRolls,
    source,
    disclaimer: HDPE_DISCLAIMER,
  };
}

export function applyWastePercent(
  baseQuantity: number,
  wastePercent: number,
): number {
  const safeBase = n(baseQuantity);
  const safeWaste = Math.max(0, wastePercent);
  return roundCommercialArea(safeBase * (1 + safeWaste / 100));
}
