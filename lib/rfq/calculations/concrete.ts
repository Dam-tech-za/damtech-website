import {
  CALCULATION_VERSION,
  isPositive,
  round2,
  type CalcWarning,
} from "./common";

export type ConcreteRectInputs = {
  lengthM: number;
  widthM: number;
  wallHeightM: number;
  includeFloor?: boolean;
  includeWalls?: boolean;
  quantity?: number;
};

export function calculateConcreteRectangular(input: ConcreteRectInputs) {
  const warnings: CalcWarning[] = [];
  if (![input.lengthM, input.widthM, input.wallHeightM].every(isPositive)) {
    return {
      ok: false as const,
      errors: ["Length, width and wall height must be positive."],
      warnings,
    };
  }
  const qty = Math.max(1, Math.floor(input.quantity ?? 1));
  const floorAreaM2 = round2(input.lengthM * input.widthM);
  const wallAreaM2 = round2(
    2 * input.lengthM * input.wallHeightM +
      2 * input.widthM * input.wallHeightM,
  );
  const includeFloor = input.includeFloor !== false;
  const includeWalls = input.includeWalls !== false;
  const perUnit = round2(
    (includeFloor ? floorAreaM2 : 0) + (includeWalls ? wallAreaM2 : 0),
  );
  return {
    ok: true as const,
    calculationVersion: CALCULATION_VERSION,
    floorAreaM2,
    wallAreaM2,
    treatmentAreaPerUnitM2: perUnit,
    totalTreatmentAreaM2: round2(perUnit * qty),
    installationAreaM2: round2(perUnit * qty),
    materialAreaM2: null as number | null,
    surfacePreparationAreaM2: null as number | null,
    quantity: qty,
    warnings: [
      {
        code: "areas_not_auto_equal",
        message:
          "Material, installation and surface-preparation areas are not assumed equal.",
      },
    ] satisfies CalcWarning[],
    assumptions: { includeFloor, includeWalls },
  };
}

export type ConcreteCircularInputs = {
  diameterM: number;
  wallHeightM: number;
  includeFloor?: boolean;
  includeWalls?: boolean;
  quantity?: number;
};

export function calculateConcreteCircular(input: ConcreteCircularInputs) {
  const warnings: CalcWarning[] = [];
  if (![input.diameterM, input.wallHeightM].every(isPositive)) {
    return {
      ok: false as const,
      errors: ["Diameter and wall height must be positive."],
      warnings,
    };
  }
  const qty = Math.max(1, Math.floor(input.quantity ?? 1));
  const radius = input.diameterM / 2;
  const floorAreaM2 = round2(Math.PI * radius ** 2);
  const wallAreaM2 = round2(Math.PI * input.diameterM * input.wallHeightM);
  const includeFloor = input.includeFloor !== false;
  const includeWalls = input.includeWalls !== false;
  const perUnit = round2(
    (includeFloor ? floorAreaM2 : 0) + (includeWalls ? wallAreaM2 : 0),
  );
  return {
    ok: true as const,
    calculationVersion: CALCULATION_VERSION,
    floorAreaM2,
    wallAreaM2,
    treatmentAreaPerUnitM2: perUnit,
    totalTreatmentAreaM2: round2(perUnit * qty),
    installationAreaM2: round2(perUnit * qty),
    materialAreaM2: null as number | null,
    surfacePreparationAreaM2: null as number | null,
    quantity: qty,
    warnings: [
      {
        code: "areas_not_auto_equal",
        message:
          "Material, installation and surface-preparation areas are not assumed equal.",
      },
    ] satisfies CalcWarning[],
    assumptions: { includeFloor, includeWalls },
  };
}
