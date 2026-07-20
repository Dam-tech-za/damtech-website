export type PricingItemType =
  | "material"
  | "installation_service"
  | "labour"
  | "travel"
  | "delivery"
  | "equipment"
  | "site_establishment"
  | "tank_model"
  | "subcontractor"
  | "allowance"
  | "fixed_price"
  | "other";

export type PricingMethod =
  | "unit_rate"
  | "fixed_price"
  | "calculated_consumption"
  | "labour_productivity"
  | "travel_calculation"
  | "supplier_price"
  | "manual";

export type TaxCategory = "standard" | "zero_rated" | "exempt" | "no_vat";

export type PriceStatus = "current" | "expiring" | "expired" | "missing" | "manual";

export type PricingItemRecord = {
  id: string;
  itemCode: string;
  itemType: PricingItemType;
  category: string;
  name: string;
  shortDescription: string | null;
  quoteDescription: string | null;
  purchaseUnit: string | null;
  quoteUnit: string;
  conversionFactor: number;
  defaultCost: number | null;
  defaultSellPrice: number | null;
  pricingMethod: PricingMethod;
  defaultMarkupPercent: number | null;
  targetMarginPercent: number | null;
  minimumSellPrice: number | null;
  taxCategory: TaxCategory;
  wastePercent: number;
  overlapPercent: number;
  coverageRate: number | null;
  coverageUnit: string | null;
  productivityRate: number | null;
  productivityUnit: string | null;
  priceValidFrom: string | null;
  priceValidTo: string | null;
  isActive: boolean;
  requiresManualQuantityConfirmation: boolean;
  metadata: Record<string, unknown>;
  legacyMaterialItemId: string | null;
  legacyLabourItemId: string | null;
  legacyTankModelId: string | null;
  supplierName: string | null;
  priceStatus: PriceStatus;
};

export type EffectivePrice = {
  costPrice: number | null;
  sellPrice: number | null;
  source: "quote_override" | "supplier_price" | "item_sell" | "calculated" | "category_default" | "global_default";
  supplierPriceId: string | null;
  supplierName: string | null;
  validTo: string | null;
  priceStatus: PriceStatus;
};

export type QuoteLinePriceSnapshot = {
  pricingCapturedAt: string;
  sourceType: PricingItemType | "custom";
  pricingItemId: string | null;
  itemCode: string;
  itemType: PricingItemType | string;
  quoteDescription: string;
  purchaseUnit: string | null;
  quoteUnit: string;
  conversionFactor: number;
  costUnitPrice: number | null;
  sellUnitPrice: number;
  pricingMethod: PricingMethod | string;
  markupPercent: number | null;
  marginPercent: number | null;
  supplierPriceId: string | null;
  supplierName: string | null;
  supplierValidTo: string | null;
  taxCategory: TaxCategory;
  priceSource: EffectivePrice["source"];
  quantityCalculation: Record<string, unknown> | null;
  manualOverride: boolean;
  overrideReason: string | null;
};
