/**
 * Stage: derived-field calculation (markup, margin, gross roll area).
 * Pure helpers used by validation and preview; selling price takes precedence
 * over imported markup/margin when they conflict.
 */

export function calculateMarkupPercent(
  cost: number | null,
  sell: number | null,
): number | null {
  if (cost == null || sell == null || cost <= 0) return null;
  return Math.round(((sell - cost) / cost) * 10000) / 100;
}

export function calculateMarginPercent(
  cost: number | null,
  sell: number | null,
): number | null {
  if (cost == null || sell == null || sell <= 0) return null;
  return Math.round(((sell - cost) / sell) * 10000) / 100;
}

export function calculateGrossRollArea(
  widthM: number | null,
  lengthM: number | null,
): number | null {
  if (widthM == null || lengthM == null || widthM <= 0 || lengthM <= 0) return null;
  return Math.round(widthM * lengthM * 100) / 100;
}
