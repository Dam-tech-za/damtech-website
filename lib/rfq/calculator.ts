import type { CalculatorPayload } from "./schema";
import type { SuggestedQuoteLineItem } from "@/lib/estimating/types";
import { calculateHdpeLinerQuantity } from "@/lib/estimating/hdpe";

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

/** Suggest editable quote lines from calculator payload (Phase 2 foundation). */
export function suggestLineItemsFromCalculator(
  calculator: CalculatorPayload | null,
): SuggestedQuoteLineItem[] {
  if (!calculator) return [];

  const type = calculator.calculatorType;
  const results = calculator.results;
  const inputs = calculator.inputs;

  if (
    type === "dam-lining-area" ||
    type === "hdpe-pvc-material" ||
    type.includes("hdpe")
  ) {
    const hdpe = calculateHdpeLinerQuantity({
      calculatorEstimatedAreaM2:
        num(results.estimatedLinerAreaM2) ??
        num(results.estimatedMaterialAreaM2) ??
        num(results.totalAreaM2),
      floorAreaM2: num(results.floorAreaM2),
      wallAreaM2: num(results.wallAreaM2),
      anchorAllowanceM2: num(results.anchorAllowanceM2),
      wastePercent:
        num(inputs.allowancePercent) ?? num(results.wastePercent) ?? 10,
      overlapPercent: num(results.overlapPercent) ?? 5,
    });

    return [
      {
        kind: "material",
        code: "HDPE-LINER",
        description: "HDPE geomembrane (planning estimate)",
        unit: "m²",
        quantity: hdpe.commercialAreaM2,
        taxable: true,
        source: "calculator",
        editable: true,
      },
    ];
  }

  if (
    type === "steel-tank-size" ||
    type === "rainwater-harvesting" ||
    type.includes("water") ||
    type.includes("irrigation")
  ) {
    const volume =
      num(results.requiredVolumeM3) ??
      num(results.storageVolumeM3) ??
      num(results.suggestedVolumeM3) ??
      num(results.annualVolumeM3);

    if (!volume) return [];

    return [
      {
        kind: "other",
        code: "WATER-STORAGE",
        description: "Suggested water storage capacity (planning estimate)",
        unit: "m³",
        quantity: volume,
        taxable: true,
        source: "calculator",
        editable: true,
      },
    ];
  }

  return [];
}

export function summariseCalculatorSize(
  calculatorType: string | null,
  result: Record<string, unknown> | null,
  fallbackSize: string | null,
): string {
  if (fallbackSize?.trim()) return fallbackSize.trim();
  if (!result) return "—";

  const liner =
    num(result.estimatedLinerAreaM2) ??
    num(result.estimatedMaterialAreaM2) ??
    num(result.totalAreaM2);
  if (liner) return `${liner} m²`;

  const volume =
    num(result.requiredVolumeM3) ??
    num(result.storageVolumeM3) ??
    num(result.suggestedVolumeM3);
  if (volume) return `${volume} m³`;

  if (calculatorType) return "See calculator";
  return "—";
}
