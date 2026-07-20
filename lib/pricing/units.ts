/** Canonical unit codes stored in the database. */
export const APPROVED_UNITS = [
  "each",
  "item",
  "roll",
  "pail",
  "bag",
  "box",
  "litre",
  "kg",
  "m",
  "m2",
  "m²",
  "m3",
  "m³",
  "km",
  "hour",
  "day",
  "crew-day",
  "tank",
  "kL",
  "lump sum",
  "percentage",
] as const;

export type ApprovedUnit = (typeof APPROVED_UNITS)[number];

const DISPLAY_LABELS: Record<string, string> = {
  m2: "m²",
  "m²": "m²",
  m3: "m³",
  "m³": "m³",
  kL: "kL",
  km: "km",
  litre: "litre",
  kg: "kg",
  hour: "hour",
  day: "day",
  "crew-day": "crew-day",
  "lump sum": "lump sum",
};

/** Normalise legacy m2/m3 codes to canonical storage where needed. */
export function normaliseUnitCode(unit: string): string {
  const trimmed = unit.trim();
  if (trimmed === "m2") return "m²";
  if (trimmed === "m3") return "m³";
  return trimmed;
}

/** Customer-facing and primary admin display label. */
export function formatUnitLabel(unit: string): string {
  const code = normaliseUnitCode(unit);
  return DISPLAY_LABELS[code] ?? code;
}

export function convertPurchaseToQuoteQuantity(
  purchaseQuantity: number,
  conversionFactor: number,
): number {
  const factor = conversionFactor > 0 ? conversionFactor : 1;
  return Math.round((purchaseQuantity / factor) * 100) / 100;
}

export function convertQuoteToPurchaseQuantity(
  quoteQuantity: number,
  conversionFactor: number,
): number {
  const factor = conversionFactor > 0 ? conversionFactor : 1;
  return Math.round(quoteQuantity * factor * 100) / 100;
}
