export type CoverageQuantityInput = {
  treatmentAreaM2: number;
  consumptionRate: number;
  consumptionUnit?: string;
  numberOfCoats?: number;
  wastePercent?: number;
  packSize: number;
};

export type CoverageQuantityResult = {
  theoreticalUsage: number;
  wasteAdjustedUsage: number;
  requiredPacks: number;
  orderedQuantity: number;
  quoteQuantityM2: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateCoverageQuantity(
  input: CoverageQuantityInput,
): CoverageQuantityResult {
  const area = Math.max(0, input.treatmentAreaM2);
  const rate = Math.max(0, input.consumptionRate);
  const coats = Math.max(1, input.numberOfCoats ?? 1);
  const wastePct = Math.max(0, input.wastePercent ?? 0);
  const packSize = Math.max(0, input.packSize);

  const theoreticalUsage = round2(area * rate * coats);
  const wasteAdjustedUsage = round2(theoreticalUsage * (1 + wastePct / 100));
  const requiredPacks = packSize > 0 ? Math.ceil(wasteAdjustedUsage / packSize) : 0;
  const orderedQuantity = round2(requiredPacks * packSize);

  return {
    theoreticalUsage,
    wasteAdjustedUsage,
    requiredPacks,
    orderedQuantity,
    quoteQuantityM2: area,
  };
}
