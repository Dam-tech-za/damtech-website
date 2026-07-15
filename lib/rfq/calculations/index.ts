import { calculateCircularDam } from "./circular-dam";
import { PUBLIC_QUANTITY_DISCLAIMER, CALCULATION_VERSION } from "./common";
import {
  calculateConcreteCircular,
  calculateConcreteRectangular,
} from "./concrete";
import {
  calculateKnownTotalArea,
  calculateRectangularDam,
  calculateSeparateAreas,
} from "./rectangular-dam";
import { calculateSteelTank } from "./steel-tank";

export type RfqAssetType =
  | "earth_dam"
  | "circular_open_reservoir"
  | "corrugated_steel_tank"
  | "concrete_rectangular_reservoir"
  | "concrete_circular_reservoir"
  | "existing_liner_repair"
  | "torch_on"
  | "other";

export type MeasurementMethod =
  | "known_total_area"
  | "dimensions"
  | "separate_areas"
  | "known_capacity"
  | "catalogue_selection"
  | "drawings"
  | "site_measurement_required";

export type AssetCalculationRequest = {
  assetType: RfqAssetType;
  measurementMethod: MeasurementMethod;
  quantity?: number;
  rawInputs: Record<string, unknown>;
};

export type AssetCalculationSuccess = {
  ok: true;
  measurementStatus: string;
  outputs: Record<string, unknown>;
  warnings: Array<{ code: string; message: string }>;
  assumptions: Record<string, unknown>;
  calculationVersion: string;
  calculationType: string;
};

export type AssetCalculationFailure = {
  ok: false;
  errors: string[];
  warnings: Array<{ code: string; message: string }>;
  measurementStatus?: string;
};

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function bool(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (value === "yes" || value === "true") return true;
  if (value === "no" || value === "false") return false;
  return fallback;
}

/**
 * Server-side source of truth for public RFQ asset quantities.
 * Never trust browser-calculated outputs for persistence.
 */
export function calculateRfqAsset(
  request: AssetCalculationRequest,
): AssetCalculationSuccess | AssetCalculationFailure {
  const { assetType, measurementMethod, rawInputs } = request;
  const quantity = Math.max(1, Math.floor(num(rawInputs.quantity) ?? request.quantity ?? 1));

  if (
    measurementMethod === "drawings" ||
    measurementMethod === "site_measurement_required"
  ) {
    return {
      ok: true,
      measurementStatus: "site_measurement_required",
      calculationVersion: CALCULATION_VERSION,
      calculationType: measurementMethod,
      outputs: {
        installationAreaM2: null,
        materialAreaM2: null,
        quantity,
        disclaimer: PUBLIC_QUANTITY_DISCLAIMER,
        note:
          "Damtech will need drawings, dimensions or a site measurement before a reliable quantity can be confirmed.",
      },
      warnings: [
        {
          code: "site_measurement_required",
          message:
            "Damtech will need drawings, dimensions or a site measurement before a reliable quantity can be confirmed.",
        },
      ],
      assumptions: { calculated: false },
    };
  }

  if (
    assetType === "earth_dam" ||
    (assetType === "circular_open_reservoir" && measurementMethod !== "dimensions")
  ) {
    if (measurementMethod === "known_total_area") {
      const result = calculateKnownTotalArea({
        measuredAreaM2: num(rawInputs.measuredAreaM2) ?? 0,
        includesFloor: bool(rawInputs.includesFloor, true),
        includesSideSlopes: bool(rawInputs.includesSideSlopes, true),
        includesAnchorTrench: (rawInputs.includesAnchorTrench as "yes" | "no" | "unknown") || "unknown",
        includesOverlapWaste: (rawInputs.includesOverlapWaste as "yes" | "no" | "unknown") || "unknown",
        measurementSource: String(rawInputs.measurementSource ?? "customer_estimate"),
        overlapPercent: num(rawInputs.overlapPercent) ?? 5,
        wastePercent: num(rawInputs.wastePercent) ?? 10,
        allowancesAlreadyIncluded: bool(rawInputs.allowancesAlreadyIncluded, false),
      });
      if (!result.ok) return result;
      return {
        ok: true,
        measurementStatus: "customer_estimate",
        calculationVersion: result.calculationVersion,
        calculationType: "known_total_area",
        outputs: { ...result, quantity, disclaimer: PUBLIC_QUANTITY_DISCLAIMER },
        warnings: result.warnings,
        assumptions: result.assumptions,
      };
    }

    if (measurementMethod === "separate_areas") {
      const result = calculateSeparateAreas({
        floorAreaM2: num(rawInputs.floorAreaM2) ?? 0,
        longWallAreaM2: num(rawInputs.longWallAreaM2) ?? 0,
        shortWallAreaM2: num(rawInputs.shortWallAreaM2) ?? 0,
        otherLiningAreaM2: num(rawInputs.otherLiningAreaM2) ?? 0,
        anchorAreaM2: num(rawInputs.anchorAreaM2) ?? 0,
        overlapAlreadyIncluded: bool(rawInputs.overlapAlreadyIncluded, false),
        wasteAlreadyIncluded: bool(rawInputs.wasteAlreadyIncluded, false),
        overlapPercent: num(rawInputs.overlapPercent) ?? 5,
        wastePercent: num(rawInputs.wastePercent) ?? 10,
      });
      if (!result.ok) return result;
      return {
        ok: true,
        measurementStatus: "customer_estimate",
        calculationVersion: result.calculationVersion,
        calculationType: "separate_areas",
        outputs: { ...result, quantity, disclaimer: PUBLIC_QUANTITY_DISCLAIMER },
        warnings: result.warnings,
        assumptions: result.assumptions,
      };
    }
  }

  if (assetType === "earth_dam" && measurementMethod === "dimensions") {
    const result = calculateRectangularDam({
      topLengthM: num(rawInputs.topLengthM) ?? 0,
      topWidthM: num(rawInputs.topWidthM) ?? 0,
      depthM: num(rawInputs.depthM) ?? 0,
      bottomLengthM: num(rawInputs.bottomLengthM),
      bottomWidthM: num(rawInputs.bottomWidthM),
      sideSlopeZH: num(rawInputs.sideSlopeZH),
      freeboardM: num(rawInputs.freeboardM),
      anchorRunoutWidthM: num(rawInputs.anchorRunoutWidthM) ?? 1.2,
      includeFloor: bool(rawInputs.includeFloor, true),
      includeSideSlopes: bool(rawInputs.includeSideSlopes, true),
      includeAnchorAllowance: bool(rawInputs.includeAnchorAllowance, true),
      overlapPercent: num(rawInputs.overlapPercent) ?? 5,
      wastePercent: num(rawInputs.wastePercent) ?? 10,
    });
    if (!result.ok) return result;
    return {
      ok: true,
      measurementStatus: "customer_estimate",
      calculationVersion: result.calculationVersion,
      calculationType: "rectangular_dam_dimensions",
      outputs: { ...result, quantity, disclaimer: PUBLIC_QUANTITY_DISCLAIMER },
      warnings: result.warnings,
      assumptions: result.assumptions,
    };
  }

  if (
    assetType === "circular_open_reservoir" &&
    measurementMethod === "dimensions"
  ) {
    const result = calculateCircularDam({
      topDiameterM: num(rawInputs.topDiameterM) ?? 0,
      bottomDiameterM: num(rawInputs.bottomDiameterM) ?? 0,
      depthM: num(rawInputs.depthM) ?? 0,
      anchorRunoutWidthM: num(rawInputs.anchorRunoutWidthM) ?? 1.2,
      includeFloor: bool(rawInputs.includeFloor, true),
      includeSideSlopes: bool(rawInputs.includeSideSlopes, true),
      includeAnchorAllowance: bool(rawInputs.includeAnchorAllowance, true),
      overlapPercent: num(rawInputs.overlapPercent) ?? 5,
      wastePercent: num(rawInputs.wastePercent) ?? 10,
    });
    if (!result.ok) return result;
    return {
      ok: true,
      measurementStatus: "customer_estimate",
      calculationVersion: result.calculationVersion,
      calculationType: "circular_dam_dimensions",
      outputs: { ...result, quantity, disclaimer: PUBLIC_QUANTITY_DISCLAIMER },
      warnings: result.warnings,
      assumptions: result.assumptions,
    };
  }

  if (assetType === "corrugated_steel_tank") {
    const result = calculateSteelTank({
      quantity,
      diameterM: num(rawInputs.diameterM),
      shellHeightM: num(rawInputs.shellHeightM),
      operatingWaterDepthM: num(rawInputs.operatingWaterDepthM),
      freeboardM: num(rawInputs.freeboardM),
      requiredCapacityKL: num(rawInputs.requiredCapacityKL),
      fixingAllowanceAreaM2: num(rawInputs.fixingAllowanceAreaM2) ?? 0,
      overlapPercent: num(rawInputs.overlapPercent) ?? 5,
      wastePercent: num(rawInputs.wastePercent) ?? 10,
      linerWallHeightM: num(rawInputs.linerWallHeightM),
    });
    if (!result.ok) return result;
    return {
      ok: true,
      measurementStatus: "customer_estimate",
      calculationVersion: result.calculationVersion,
      calculationType: `steel_tank_${result.mode}`,
      outputs: { ...result, disclaimer: PUBLIC_QUANTITY_DISCLAIMER },
      warnings: result.warnings,
      assumptions: result.assumptions,
    };
  }

  if (
    assetType === "concrete_rectangular_reservoir" ||
    assetType === "torch_on"
  ) {
    if (measurementMethod === "known_total_area") {
      const area = num(rawInputs.measuredAreaM2) ?? 0;
      if (!isPositive(area)) {
        return { ok: false, errors: ["Measured area must be positive."], warnings: [] };
      }
      return {
        ok: true,
        measurementStatus: "customer_estimate",
        calculationVersion: CALCULATION_VERSION,
        calculationType: "known_total_area",
        outputs: {
          installationAreaM2: area,
          materialAreaM2: null,
          totalTreatmentAreaM2: area * quantity,
          quantity,
          disclaimer: PUBLIC_QUANTITY_DISCLAIMER,
        },
        warnings: [],
        assumptions: {},
      };
    }
    const result = calculateConcreteRectangular({
      lengthM: num(rawInputs.lengthM) ?? 0,
      widthM: num(rawInputs.widthM) ?? 0,
      wallHeightM: num(rawInputs.wallHeightM) ?? 0,
      includeFloor: bool(rawInputs.includeFloor, true),
      includeWalls: bool(rawInputs.includeWalls, true),
      quantity,
    });
    if (!result.ok) return result;
    return {
      ok: true,
      measurementStatus: "customer_estimate",
      calculationVersion: result.calculationVersion,
      calculationType: "concrete_rectangular",
      outputs: { ...result, disclaimer: PUBLIC_QUANTITY_DISCLAIMER },
      warnings: result.warnings,
      assumptions: result.assumptions,
    };
  }

  if (assetType === "concrete_circular_reservoir") {
    const result = calculateConcreteCircular({
      diameterM: num(rawInputs.diameterM) ?? 0,
      wallHeightM: num(rawInputs.wallHeightM) ?? 0,
      includeFloor: bool(rawInputs.includeFloor, true),
      includeWalls: bool(rawInputs.includeWalls, true),
      quantity,
    });
    if (!result.ok) return result;
    return {
      ok: true,
      measurementStatus: "customer_estimate",
      calculationVersion: result.calculationVersion,
      calculationType: "concrete_circular",
      outputs: { ...result, disclaimer: PUBLIC_QUANTITY_DISCLAIMER },
      warnings: result.warnings,
      assumptions: result.assumptions,
    };
  }

  // Repair / other — allow submission without quantity
  return {
    ok: true,
    measurementStatus: "customer_estimate",
    calculationVersion: CALCULATION_VERSION,
    calculationType: "passthrough",
    outputs: {
      installationAreaM2: num(rawInputs.measuredAreaM2),
      materialAreaM2: null,
      quantity,
      disclaimer: PUBLIC_QUANTITY_DISCLAIMER,
    },
    warnings: [
      {
        code: "estimator_review",
        message: "Estimator must confirm scope and quantities.",
      },
    ],
    assumptions: {},
  };
}

function isPositive(n: number | null | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

export {
  calculateRectangularDam,
  calculateKnownTotalArea,
  calculateSeparateAreas,
  calculateCircularDam,
  calculateSteelTank,
  calculateConcreteRectangular,
  calculateConcreteCircular,
  PUBLIC_QUANTITY_DISCLAIMER,
  CALCULATION_VERSION,
};
