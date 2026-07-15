import {
  applyOverlapWaste,
  CALCULATION_VERSION,
  isPositive,
  round2,
  round3,
  type CalcWarning,
} from "./common";

export type SteelTankInputs = {
  quantity?: number;
  diameterM?: number | null;
  shellHeightM?: number | null;
  operatingWaterDepthM?: number | null;
  freeboardM?: number | null;
  requiredCapacityKL?: number | null;
  fixingAllowanceAreaM2?: number | null;
  overlapPercent?: number;
  wastePercent?: number;
  linerWallHeightM?: number | null;
};

export function calculateSteelTank(input: SteelTankInputs) {
  const warnings: CalcWarning[] = [];
  const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
  const diameter = input.diameterM;
  const shellHeight = input.shellHeightM;
  const freeboard = input.freeboardM ?? null;

  if (!isPositive(diameter) || !isPositive(shellHeight)) {
    if (isPositive(input.requiredCapacityKL)) {
      return {
        ok: true as const,
        calculationVersion: CALCULATION_VERSION,
        mode: "known_capacity" as const,
        quantity,
        requiredCapacityKL: round3(input.requiredCapacityKL!),
        totalRequiredCapacityKL: round3(input.requiredCapacityKL! * quantity),
        catalogueMatch: "unavailable" as const,
        warnings: [
          {
            code: "catalogue_unavailable",
            message:
              "Tank catalogue data is not loaded. Theoretical capacity was recorded; estimator confirmation required.",
          },
        ],
        assumptions: { estimatorActionRequired: true },
        installationAreaM2: null,
        materialAreaM2: null,
        grossCapacityKL: null,
        usableCapacityKL: null,
      };
    }
    return {
      ok: false as const,
      errors: ["Provide diameter and shell height, or a required capacity."],
      warnings,
    };
  }

  if (freeboard != null && freeboard >= shellHeight) {
    return {
      ok: false as const,
      errors: ["Freeboard must be less than shell height."],
      warnings,
    };
  }

  const radiusM = diameter / 2;
  const grossVolumeM3 = round3(Math.PI * radiusM ** 2 * shellHeight);
  const grossCapacityKL = grossVolumeM3; // 1 m³ = 1 kL
  const grossCapacityLitres = round2(grossVolumeM3 * 1000);

  const operatingDepth =
    input.operatingWaterDepthM ??
    (freeboard != null ? shellHeight - freeboard : null);

  let usableVolumeM3: number | null = null;
  if (isPositive(operatingDepth)) {
    if (operatingDepth! > shellHeight) {
      return {
        ok: false as const,
        errors: ["Operating water depth cannot exceed shell height."],
        warnings,
      };
    }
    usableVolumeM3 = round3(Math.PI * radiusM ** 2 * operatingDepth!);
  }

  const linerWallHeight = isPositive(input.linerWallHeightM)
    ? input.linerWallHeightM!
    : operatingDepth && isPositive(operatingDepth)
      ? operatingDepth
      : shellHeight;

  const floorAreaM2 = round2(Math.PI * radiusM ** 2);
  const wallAreaM2 = round2(Math.PI * diameter * linerWallHeight);
  const fixing = Math.max(0, input.fixingAllowanceAreaM2 ?? 0);
  const baseLinerAreaM2 = round2(floorAreaM2 + wallAreaM2);
  const perTankBase = round2(baseLinerAreaM2 + fixing);
  const applied = applyOverlapWaste(
    perTankBase,
    input.overlapPercent ?? 5,
    input.wastePercent ?? 10,
  );

  const linerAreaPerTankM2 = applied.materialAreaM2;
  const totalLinerAreaM2 = round2(linerAreaPerTankM2 * quantity);

  warnings.push({
    code: "liner_estimate_only",
    message:
      "Internal liner area is for estimating only. Prefabricated liners may replace this with a supplier size.",
  });
  warnings.push({
    code: "catalogue_unavailable",
    message:
      "Do not invent Damtech tank sizes. Catalogue matching requires loaded tank_models data.",
  });

  return {
    ok: true as const,
    calculationVersion: CALCULATION_VERSION,
    mode: "dimensions" as const,
    quantity,
    diameterM: diameter,
    shellHeightM: shellHeight,
    radiusM: round3(radiusM),
    grossVolumeM3,
    grossCapacityKL: round3(grossCapacityKL),
    grossCapacityLitres,
    operatingWaterDepthM: operatingDepth ? round3(operatingDepth) : null,
    usableVolumeM3,
    usableCapacityKL: usableVolumeM3,
    totalGrossCapacityKL: round3(grossCapacityKL * quantity),
    totalUsableCapacityKL: usableVolumeM3
      ? round3(usableVolumeM3 * quantity)
      : null,
    floorAreaM2,
    wallAreaM2,
    baseLinerAreaM2,
    linerAreaPerTankM2,
    totalLinerAreaM2,
    installationAreaM2: round2(applied.installationAreaM2 * quantity),
    materialAreaM2: totalLinerAreaM2,
    catalogueMatch: "unavailable" as const,
    warnings,
    assumptions: {
      roofNotLined: true,
      freeboardM: freeboard,
      fixingAllowanceAreaM2: fixing,
      estimatorConfirmationRequired: true,
    },
  };
}
