/** Shared helpers for public RFQ geometry calculations. */

export const CALCULATION_VERSION = "rfq-geom-2026.07.1";

export const PUBLIC_QUANTITY_DISCLAIMER =
  "Preliminary estimating values only. Damtech must confirm site dimensions, material selection, panel layout, anchor details and final quantities before issuing a quotation.";

export type CalcWarning = {
  code: string;
  message: string;
};

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function isPositive(n: number | null | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

export function applyOverlapWaste(
  baseAreaM2: number,
  overlapPercent: number,
  wastePercent: number,
  options: { overlapAlreadyIncluded?: boolean; wasteAlreadyIncluded?: boolean } = {},
): {
  installationAreaM2: number;
  materialAreaM2: number;
  overlapPercentApplied: number;
  wastePercentApplied: number;
} {
  const overlap = options.overlapAlreadyIncluded
    ? 0
    : Math.max(0, overlapPercent);
  const waste = options.wasteAlreadyIncluded ? 0 : Math.max(0, wastePercent);
  const afterOverlap = baseAreaM2 * (1 + overlap / 100);
  const materialAreaM2 = round2(afterOverlap * (1 + waste / 100));
  return {
    installationAreaM2: round2(baseAreaM2),
    materialAreaM2,
    overlapPercentApplied: overlap,
    wastePercentApplied: waste,
  };
}
