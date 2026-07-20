import { roundCommercialArea } from "@/lib/estimating/hdpe";

export type AreaQuantityInput = {
  measuredAreaM2: number;
  overlapPercent?: number;
  wastePercent?: number;
};

export type AreaQuantityResult = {
  baseAreaM2: number;
  overlapQuantityM2: number;
  wasteQuantityM2: number;
  procurementAreaM2: number;
  installationAreaM2: number;
};

/** Overlap and waste are disclosed separately — not merged into one unexplained figure. */
export function calculateAreaQuantity(input: AreaQuantityInput): AreaQuantityResult {
  const base = Math.max(0, input.measuredAreaM2);
  const overlapPct = Math.max(0, input.overlapPercent ?? 0);
  const wastePct = Math.max(0, input.wastePercent ?? 0);

  const overlapQuantityM2 = roundCommercialArea(base * (overlapPct / 100));
  const afterOverlap = base + overlapQuantityM2;
  const wasteQuantityM2 = roundCommercialArea(afterOverlap * (wastePct / 100));
  const procurementAreaM2 = roundCommercialArea(afterOverlap + wasteQuantityM2);

  return {
    baseAreaM2: base,
    overlapQuantityM2,
    wasteQuantityM2,
    procurementAreaM2,
    installationAreaM2: base,
  };
}

export type RollQuantityInput = {
  procurementAreaM2: number;
  grossAreaPerRollM2: number;
  usableAreaPerRollM2?: number;
};

export type RollQuantityResult = {
  requiredRolls: number;
  orderedGrossAreaM2: number;
  usableAreaPerRollM2: number;
};

export function calculateRollQuantity(input: RollQuantityInput): RollQuantityResult {
  const procurement = Math.max(0, input.procurementAreaM2);
  const gross = Math.max(0, input.grossAreaPerRollM2);
  const usable = Math.max(0, input.usableAreaPerRollM2 ?? gross);
  const divisor = usable > 0 ? usable : gross;
  const requiredRolls = divisor > 0 ? Math.ceil(procurement / divisor) : 0;
  const orderedGrossAreaM2 =
    gross > 0 ? roundCommercialArea(requiredRolls * gross) : procurement;

  return {
    requiredRolls,
    orderedGrossAreaM2,
    usableAreaPerRollM2: usable,
  };
}

export type TorchOnRollInput = {
  rollWidthM: number;
  rollLengthM: number;
  sideLapM?: number;
  endLapM?: number;
};

export function calculateUsableRollAreaM2(input: TorchOnRollInput): {
  grossAreaM2: number;
  usableAreaM2: number;
} {
  const width = Math.max(0, input.rollWidthM);
  const length = Math.max(0, input.rollLengthM);
  const sideLap = Math.max(0, input.sideLapM ?? 0);
  const endLap = Math.max(0, input.endLapM ?? 0);
  const grossAreaM2 = roundCommercialArea(width * length);
  const usableWidth = Math.max(0, width - sideLap);
  const usableLength = Math.max(0, length - endLap);
  const usableAreaM2 = roundCommercialArea(usableWidth * usableLength);
  return { grossAreaM2, usableAreaM2: usableAreaM2 > 0 ? usableAreaM2 : grossAreaM2 };
}
