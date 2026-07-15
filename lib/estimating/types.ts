export type { HdpeLinerInputs, HdpeLinerResult } from "./hdpe";
export type { TravelInputs, TravelResult, DeliveryInputs, DeliveryResult } from "./travel";
export type { VatBreakdown, VatBreakdownInput } from "./vat";
export type {
  MaterialCostInput,
  LabourCostInput,
  DirectCostInput,
} from "./pricing";

export type EstimatingSettingsMap = Record<string, unknown>;

export type SuggestedQuoteLineItem = {
  kind: "material" | "labour" | "travel" | "delivery" | "other";
  code?: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost?: number;
  unitSell?: number;
  taxable: boolean;
  source: "calculator" | "manual" | "settings";
  editable: true;
};

export type CalculatorImportPayload = {
  calculatorType: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
};
