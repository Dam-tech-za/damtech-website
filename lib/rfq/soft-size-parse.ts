/**
 * Soft-parse customer size text into optional numeric estimates.
 * Never treat these as confirmed quote quantities.
 */

export type SoftSizeEstimates = {
  estimated_area_m2: number | null;
  estimated_capacity_kl: number | null;
  estimated_diameter_m: number | null;
  estimated_height_m: number | null;
};

function round(value: number, digits = 4): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function parseNumberToken(raw: string): number | null {
  const cleaned = raw.replace(/[\s,]/g, "").replace(/(\d)\.(\d{3})\b/g, "$1$2");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Best-effort extraction from free text such as:
 * - "5000 m²" / "5 000 m2 liner"
 * - "250 kL" / "250000 litres"
 * - "10 m diameter × 3 m high"
 */
export function softParseProjectSize(text: string): SoftSizeEstimates {
  const result: SoftSizeEstimates = {
    estimated_area_m2: null,
    estimated_capacity_kl: null,
    estimated_diameter_m: null,
    estimated_height_m: null,
  };

  const input = text.trim();
  if (!input) return result;

  const areaMatch = input.match(
    /(\d[\d\s,]*(?:\.\d+)?)\s*(m²|m2|sq\.?\s*m|square\s*metres?)/i,
  );
  if (areaMatch) {
    const n = parseNumberToken(areaMatch[1]);
    if (n != null) result.estimated_area_m2 = round(n);
  }

  const klMatch = input.match(
    /(\d[\d\s,]*(?:\.\d+)?)\s*(k\s*l|kl|kilolitres?)/i,
  );
  if (klMatch) {
    const n = parseNumberToken(klMatch[1]);
    if (n != null) result.estimated_capacity_kl = round(n);
  } else {
    const litreMatch = input.match(
      /(\d[\d\s,]*(?:\.\d+)?)\s*(l|litres?|liters?)\b/i,
    );
    if (litreMatch) {
      const n = parseNumberToken(litreMatch[1]);
      if (n != null) result.estimated_capacity_kl = round(n / 1000);
    }
  }

  const diameterMatch = input.match(
    /(\d[\d\s,]*(?:\.\d+)?)\s*m(?:etres?)?\s*(?:ø|diameter|dia\.?)/i,
  );
  if (diameterMatch) {
    const n = parseNumberToken(diameterMatch[1]);
    if (n != null) result.estimated_diameter_m = round(n, 3);
  }

  const heightMatch = input.match(
    /(\d[\d\s,]*(?:\.\d+)?)\s*m(?:etres?)?\s*(?:high|height|tall|wall)/i,
  );
  if (heightMatch) {
    const n = parseNumberToken(heightMatch[1]);
    if (n != null) result.estimated_height_m = round(n, 3);
  }

  return result;
}
