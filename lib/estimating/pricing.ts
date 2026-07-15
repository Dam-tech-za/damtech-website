import { applyWastePercent } from "./hdpe";
import { sellingPriceFromGrossMargin, sellingPriceFromMarkup } from "./margin";
import { addMoney, multiplyMoney, roundMoney } from "./money";

export type MaterialCostInput = {
  baseQuantity: number;
  wastePercent: number;
  unitCost: number;
};

export type LabourCostInput = {
  quantity: number;
  productivityRate?: number | null;
  /** Manual override hours */
  overrideHours?: number | null;
  overrideReason?: string | null;
  hourlyRate: number;
};

export type DirectCostInput = {
  materials: number;
  labour: number;
  travel: number;
  delivery: number;
  subcontractors?: number;
  contingencyPercent?: number;
};

export function commercialMaterialQuantity(
  baseQuantity: number,
  wastePercent: number,
): number {
  return applyWastePercent(baseQuantity, wastePercent);
}

export function directMaterialCost(input: MaterialCostInput): {
  commercialQuantity: number;
  cost: number;
} {
  const commercialQuantity = commercialMaterialQuantity(
    input.baseQuantity,
    input.wastePercent,
  );
  return {
    commercialQuantity,
    cost: roundMoney(commercialQuantity * Math.max(0, input.unitCost)),
  };
}

/**
 * labour_hours = quantity / productivity_rate
 * Manual override allowed with reason (enforced by caller).
 */
export function labourHours(input: LabourCostInput): {
  hours: number;
  overridden: boolean;
  overrideReason: string | null;
} {
  if (
    typeof input.overrideHours === "number" &&
    Number.isFinite(input.overrideHours) &&
    input.overrideHours >= 0
  ) {
    return {
      hours: roundMoney(input.overrideHours),
      overridden: true,
      overrideReason: input.overrideReason?.trim() || null,
    };
  }

  const rate = input.productivityRate;
  if (!rate || rate <= 0) {
    return { hours: 0, overridden: false, overrideReason: null };
  }

  return {
    hours: roundMoney(Math.max(0, input.quantity) / rate),
    overridden: false,
    overrideReason: null,
  };
}

export function directLabourCost(input: LabourCostInput): {
  hours: number;
  cost: number;
  overridden: boolean;
  overrideReason: string | null;
} {
  const hoursResult = labourHours(input);
  return {
    ...hoursResult,
    cost: roundMoney(hoursResult.hours * Math.max(0, input.hourlyRate)),
  };
}

export function calculateDirectCost(input: DirectCostInput): {
  subtotal: number;
  contingency: number;
  total: number;
} {
  const subtotal = addMoney(
    input.materials,
    input.labour,
    input.travel,
    input.delivery,
    input.subcontractors || 0,
  );
  const contingency = multiplyMoney(
    subtotal,
    Math.max(0, input.contingencyPercent || 0) / 100,
  );
  return {
    subtotal,
    contingency,
    total: addMoney(subtotal, contingency),
  };
}

export function priceFromCostStrategy(
  cost: number,
  strategy: "markup" | "margin",
  percent: number,
): number {
  return strategy === "markup"
    ? sellingPriceFromMarkup(cost, percent)
    : sellingPriceFromGrossMargin(cost, percent);
}
