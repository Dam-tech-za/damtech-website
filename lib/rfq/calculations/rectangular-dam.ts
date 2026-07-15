import {
  applyOverlapWaste,
  CALCULATION_VERSION,
  isPositive,
  round2,
  round3,
  type CalcWarning,
} from "./common";

export type RectangularDamInputs = {
  topLengthM: number;
  topWidthM: number;
  depthM: number;
  bottomLengthM?: number | null;
  bottomWidthM?: number | null;
  /** Horizontal:vertical slope ratio z (zH:1V). Used when bottom dims omitted. */
  sideSlopeZH?: number | null;
  freeboardM?: number | null;
  anchorRunoutWidthM?: number | null;
  includeFloor?: boolean;
  includeSideSlopes?: boolean;
  includeAnchorAllowance?: boolean;
  overlapPercent?: number;
  wastePercent?: number;
};

export type RectangularDamResult = {
  ok: true;
  calculationVersion: string;
  bottomLengthM: number;
  bottomWidthM: number;
  floorAreaM2: number;
  longWallSlopeLengthM: number;
  shortWallSlopeLengthM: number;
  longWallAreaM2: number;
  shortWallAreaM2: number;
  sideWallAreaM2: number;
  baseLiningAreaM2: number;
  topPerimeterM: number;
  anchorAllowanceAreaM2: number;
  installationAreaM2: number;
  materialAreaM2: number;
  grossVolumeM3: number;
  grossCapacityLitres: number;
  overlapPercentApplied: number;
  wastePercentApplied: number;
  warnings: CalcWarning[];
  assumptions: Record<string, unknown>;
} | {
  ok: false;
  errors: string[];
  warnings: CalcWarning[];
};

/**
 * Rectangular/trapezoidal earth dam liner areas + prismoidal capacity.
 */
export function calculateRectangularDam(
  input: RectangularDamInputs,
): RectangularDamResult {
  const warnings: CalcWarning[] = [];
  const Lt = input.topLengthM;
  const Wt = input.topWidthM;
  const h = input.depthM;

  if (![Lt, Wt, h].every(isPositive)) {
    return {
      ok: false,
      errors: ["Top length, top width and depth must be positive."],
      warnings,
    };
  }

  let Lb = input.bottomLengthM ?? null;
  let Wb = input.bottomWidthM ?? null;
  const z = input.sideSlopeZH ?? null;

  const hasDirectBottom = isPositive(Lb) && isPositive(Wb);
  const hasSlope = isPositive(z);

  if (hasDirectBottom && hasSlope) {
    const derivedLb = Lt - 2 * z! * h;
    const derivedWb = Wt - 2 * z! * h;
    if (
      Math.abs(derivedLb - Lb!) > 0.05 ||
      Math.abs(derivedWb - Wb!) > 0.05
    ) {
      return {
        ok: false,
        errors: [
          "Direct bottom dimensions conflict with side-slope-derived dimensions. Use one method only.",
        ],
        warnings,
      };
    }
  }

  if (!hasDirectBottom) {
    if (!hasSlope) {
      return {
        ok: false,
        errors: [
          "Provide bottom length and width, or a side-slope ratio (zH:1V).",
        ],
        warnings,
      };
    }
    Lb = Lt - 2 * z! * h;
    Wb = Wt - 2 * z! * h;
  }

  if (!isPositive(Lb) || !isPositive(Wb)) {
    return {
      ok: false,
      errors: [
        "Bottom dimensions are zero or negative — check depth and side slopes.",
      ],
      warnings,
    };
  }

  if (Lb > Lt || Wb > Wt) {
    return {
      ok: false,
      errors: ["Bottom dimensions cannot exceed top dimensions."],
      warnings,
    };
  }

  const includeFloor = input.includeFloor !== false;
  const includeSides = input.includeSideSlopes !== false;
  const includeAnchor = input.includeAnchorAllowance !== false;
  const anchorRunout = Math.max(0, input.anchorRunoutWidthM ?? 1.2);
  const overlap = Math.max(0, input.overlapPercent ?? 5);
  const waste = Math.max(0, input.wastePercent ?? 10);

  const floorAreaM2 = round2(Lb * Wb);
  const longWallSlopeLength = Math.sqrt(h ** 2 + ((Wt - Wb) / 2) ** 2);
  const shortWallSlopeLength = Math.sqrt(h ** 2 + ((Lt - Lb) / 2) ** 2);
  const longWallAreaM2 = round2((Lt + Lb) * longWallSlopeLength);
  const shortWallAreaM2 = round2((Wt + Wb) * shortWallSlopeLength);
  const sideWallAreaM2 = round2(longWallAreaM2 + shortWallAreaM2);

  const selectedFloor = includeFloor ? floorAreaM2 : 0;
  const selectedSides = includeSides ? sideWallAreaM2 : 0;
  const baseLiningAreaM2 = round2(selectedFloor + selectedSides);
  const topPerimeterM = round2(2 * (Lt + Wt));
  const anchorAllowanceAreaM2 = includeAnchor
    ? round2(topPerimeterM * anchorRunout)
    : 0;

  const installationBeforeAllowances = round2(
    baseLiningAreaM2 + anchorAllowanceAreaM2,
  );
  const { installationAreaM2, materialAreaM2, overlapPercentApplied, wastePercentApplied } =
    applyOverlapWaste(installationBeforeAllowances, overlap, waste);

  // Prismoidal / Simpson capacity
  const Lm = (Lt + Lb) / 2;
  const Wm = (Wt + Wb) / 2;
  const At = Lt * Wt;
  const Am = Lm * Wm;
  const Ab = Lb * Wb;
  const grossVolumeM3 = round3((h / 6) * (At + 4 * Am + Ab));
  const grossCapacityLitres = round2(grossVolumeM3 * 1000);

  if (input.freeboardM != null && input.freeboardM > 0) {
    warnings.push({
      code: "freeboard_not_applied_to_usable",
      message:
        "Freeboard was recorded but usable capacity is not claimed — geometric capacity only.",
    });
  }

  warnings.push({
    code: "anchor_not_engineered",
    message:
      "Anchor/runout area is a provisional allowance, not an engineered anchor-trench design.",
  });

  return {
    ok: true,
    calculationVersion: CALCULATION_VERSION,
    bottomLengthM: round3(Lb),
    bottomWidthM: round3(Wb),
    floorAreaM2,
    longWallSlopeLengthM: round3(longWallSlopeLength),
    shortWallSlopeLengthM: round3(shortWallSlopeLength),
    longWallAreaM2,
    shortWallAreaM2,
    sideWallAreaM2,
    baseLiningAreaM2,
    topPerimeterM,
    anchorAllowanceAreaM2,
    installationAreaM2,
    materialAreaM2,
    grossVolumeM3,
    grossCapacityLitres,
    overlapPercentApplied,
    wastePercentApplied,
    warnings,
    assumptions: {
      includeFloor,
      includeSideSlopes: includeSides,
      includeAnchorAllowance: includeAnchor,
      anchorRunoutWidthM: anchorRunout,
      capacityLabel: "Estimated geometric capacity",
      disclaimer:
        "Public calculations are never final engineering or construction quantities.",
    },
  };
}

export type KnownTotalAreaInputs = {
  measuredAreaM2: number;
  includesFloor?: boolean | null;
  includesSideSlopes?: boolean | null;
  includesAnchorTrench?: "yes" | "no" | "unknown";
  includesOverlapWaste?: "yes" | "no" | "unknown";
  measurementSource?: string;
  overlapPercent?: number;
  wastePercent?: number;
  /** When true, do not add overlap/waste again for material. */
  allowancesAlreadyIncluded?: boolean;
};

export function calculateKnownTotalArea(input: KnownTotalAreaInputs) {
  const warnings: CalcWarning[] = [];
  if (!isPositive(input.measuredAreaM2)) {
    return {
      ok: false as const,
      errors: ["Measured lining area must be positive."],
      warnings,
    };
  }

  const installationAreaM2 = round2(input.measuredAreaM2);
  const overlapAlready =
    input.allowancesAlreadyIncluded ||
    input.includesOverlapWaste === "yes";
  const wasteAlready = overlapAlready;

  if (input.includesAnchorTrench === "unknown") {
    warnings.push({
      code: "anchor_inclusion_unknown",
      message: "Whether the measured area includes the anchor trench is unknown.",
    });
  }
  if (input.includesOverlapWaste === "unknown") {
    warnings.push({
      code: "allowance_inclusion_unknown",
      message: "Whether overlap/waste is already included is unknown.",
    });
  }

  const { materialAreaM2, overlapPercentApplied, wastePercentApplied } =
    applyOverlapWaste(
      installationAreaM2,
      input.overlapPercent ?? 5,
      input.wastePercent ?? 10,
      {
        overlapAlreadyIncluded: overlapAlready,
        wasteAlreadyIncluded: wasteAlready,
      },
    );

  return {
    ok: true as const,
    calculationVersion: CALCULATION_VERSION,
    customerMeasuredAreaM2: installationAreaM2,
    installationAreaM2,
    materialAreaM2,
    provisionalMaterialAreaM2: materialAreaM2,
    overlapPercentApplied,
    wastePercentApplied,
    warnings,
    assumptions: {
      measurementSource: input.measurementSource ?? "customer_estimate",
      includesFloor: input.includesFloor,
      includesSideSlopes: input.includesSideSlopes,
      includesAnchorTrench: input.includesAnchorTrench ?? "unknown",
      includesOverlapWaste: input.includesOverlapWaste ?? "unknown",
      labourUsesMeasuredArea: true,
    },
  };
}

export type SeparateAreasInputs = {
  floorAreaM2?: number;
  longWallAreaM2?: number;
  shortWallAreaM2?: number;
  otherLiningAreaM2?: number;
  anchorAreaM2?: number;
  overlapAlreadyIncluded?: boolean;
  wasteAlreadyIncluded?: boolean;
  overlapPercent?: number;
  wastePercent?: number;
};

export function calculateSeparateAreas(input: SeparateAreasInputs) {
  const floor = Math.max(0, input.floorAreaM2 ?? 0);
  const longW = Math.max(0, input.longWallAreaM2 ?? 0);
  const shortW = Math.max(0, input.shortWallAreaM2 ?? 0);
  const other = Math.max(0, input.otherLiningAreaM2 ?? 0);
  const anchor = Math.max(0, input.anchorAreaM2 ?? 0);
  const base = round2(floor + longW + shortW + other + anchor);
  if (base <= 0) {
    return {
      ok: false as const,
      errors: ["Enter at least one positive area component."],
      warnings: [] as CalcWarning[],
    };
  }
  const applied = applyOverlapWaste(
    base,
    input.overlapPercent ?? 5,
    input.wastePercent ?? 10,
    {
      overlapAlreadyIncluded: input.overlapAlreadyIncluded,
      wasteAlreadyIncluded: input.wasteAlreadyIncluded,
    },
  );
  return {
    ok: true as const,
    calculationVersion: CALCULATION_VERSION,
    floorAreaM2: round2(floor),
    longWallAreaM2: round2(longW),
    shortWallAreaM2: round2(shortW),
    otherLiningAreaM2: round2(other),
    anchorAreaM2: round2(anchor),
    baseLiningAreaM2: base,
    ...applied,
    warnings: [] as CalcWarning[],
    assumptions: {
      overlapAlreadyIncluded: Boolean(input.overlapAlreadyIncluded),
      wasteAlreadyIncluded: Boolean(input.wasteAlreadyIncluded),
    },
  };
}
