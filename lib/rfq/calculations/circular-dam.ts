import {
  applyOverlapWaste,
  CALCULATION_VERSION,
  isPositive,
  round2,
  round3,
  type CalcWarning,
} from "./common";

export type CircularDamInputs = {
  topDiameterM: number;
  bottomDiameterM: number;
  depthM: number;
  anchorRunoutWidthM?: number | null;
  includeFloor?: boolean;
  includeSideSlopes?: boolean;
  includeAnchorAllowance?: boolean;
  overlapPercent?: number;
  wastePercent?: number;
};

export function calculateCircularDam(input: CircularDamInputs) {
  const warnings: CalcWarning[] = [];
  const Dt = input.topDiameterM;
  const Db = input.bottomDiameterM;
  const h = input.depthM;

  if (![Dt, Db, h].every(isPositive)) {
    return {
      ok: false as const,
      errors: ["Top diameter, bottom diameter and depth must be positive."],
      warnings,
    };
  }
  if (Db > Dt) {
    return {
      ok: false as const,
      errors: ["Bottom diameter cannot exceed top diameter."],
      warnings,
    };
  }

  const Rt = Dt / 2;
  const Rb = Db / 2;
  const s = Math.sqrt(h ** 2 + (Rt - Rb) ** 2);
  const includeFloor = input.includeFloor !== false;
  const includeSides = input.includeSideSlopes !== false;
  const includeAnchor = input.includeAnchorAllowance !== false;
  const anchorRunout = Math.max(0, input.anchorRunoutWidthM ?? 1.2);
  const overlap = Math.max(0, input.overlapPercent ?? 5);
  const waste = Math.max(0, input.wastePercent ?? 10);

  const floorAreaM2 = round2(Math.PI * Rb ** 2);
  const sideWallAreaM2 = round2(Math.PI * (Rt + Rb) * s);
  const topPerimeterM = round2(2 * Math.PI * Rt);
  const baseLiningAreaM2 = round2(
    (includeFloor ? floorAreaM2 : 0) + (includeSides ? sideWallAreaM2 : 0),
  );
  const anchorAllowanceAreaM2 = includeAnchor
    ? round2(topPerimeterM * anchorRunout)
    : 0;
  const installationBase = round2(baseLiningAreaM2 + anchorAllowanceAreaM2);
  const applied = applyOverlapWaste(installationBase, overlap, waste);

  const grossVolumeM3 = round3(
    (Math.PI * h) / 3 * (Rt ** 2 + Rt * Rb + Rb ** 2),
  );

  warnings.push({
    code: "anchor_not_engineered",
    message:
      "Anchor/runout area is a provisional allowance, not an engineered design.",
  });

  return {
    ok: true as const,
    calculationVersion: CALCULATION_VERSION,
    floorAreaM2,
    sideWallAreaM2,
    slopingWallLengthM: round3(s),
    topPerimeterM,
    baseLiningAreaM2,
    anchorAllowanceAreaM2,
    ...applied,
    grossVolumeM3,
    grossCapacityLitres: round2(grossVolumeM3 * 1000),
    warnings,
    assumptions: {
      includeFloor,
      includeSideSlopes: includeSides,
      includeAnchorAllowance: includeAnchor,
      capacityLabel: "Estimated geometric capacity",
    },
  };
}
