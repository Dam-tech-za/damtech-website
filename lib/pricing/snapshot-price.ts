import type {
  EffectivePrice,
  PricingItemRecord,
  QuoteLinePriceSnapshot,
  TaxCategory,
} from "./types";
import { normaliseUnitCode } from "./units";

export function buildQuoteLinePriceSnapshot(input: {
  item: PricingItemRecord;
  effectivePrice: EffectivePrice;
  sellUnitPrice: number;
  costUnitPrice: number | null;
  quantityCalculation?: Record<string, unknown> | null;
  manualOverride?: boolean;
  overrideReason?: string | null;
}): QuoteLinePriceSnapshot {
  const { item, effectivePrice, sellUnitPrice, costUnitPrice } = input;
  const cost = costUnitPrice ?? effectivePrice.costPrice;
  const marginPercent =
    cost != null && cost > 0 && sellUnitPrice > 0
      ? Math.round(((sellUnitPrice - cost) / sellUnitPrice) * 1000) / 10
      : null;
  const markupPercent =
    cost != null && cost > 0 && sellUnitPrice > 0
      ? Math.round(((sellUnitPrice - cost) / cost) * 1000) / 10
      : item.defaultMarkupPercent;

  return {
    pricingCapturedAt: new Date().toISOString(),
    sourceType: item.itemType,
    pricingItemId: item.id,
    itemCode: item.itemCode,
    itemType: item.itemType,
    quoteDescription: item.quoteDescription ?? item.name,
    purchaseUnit: item.purchaseUnit ? normaliseUnitCode(item.purchaseUnit) : null,
    quoteUnit: normaliseUnitCode(item.quoteUnit),
    conversionFactor: item.conversionFactor,
    costUnitPrice: costUnitPrice ?? effectivePrice.costPrice,
    sellUnitPrice,
    pricingMethod: item.pricingMethod,
    markupPercent,
    marginPercent,
    supplierPriceId: effectivePrice.supplierPriceId,
    supplierName: effectivePrice.supplierName,
    supplierValidTo: effectivePrice.validTo,
    taxCategory: (item.taxCategory as TaxCategory) ?? "standard",
    priceSource: effectivePrice.source,
    quantityCalculation: input.quantityCalculation ?? null,
    manualOverride: Boolean(input.manualOverride),
    overrideReason: input.overrideReason?.trim() || null,
  };
}
