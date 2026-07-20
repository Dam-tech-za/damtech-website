import type { EffectivePrice, PriceStatus, PricingItemRecord } from "./types";
import { calculateSellPrice } from "./calculate-sell-price";

export type SupplierPriceOption = {
  id: string;
  supplierName: string | null;
  unitCost: number;
  validTo: string | null;
  isPreferred: boolean;
  expired: boolean;
};

function resolvePriceStatus(validTo: string | null, hasPrice: boolean): PriceStatus {
  if (!hasPrice) return "missing";
  if (!validTo) return "current";
  const expiry = new Date(`${validTo}T23:59:59`).getTime();
  const now = Date.now();
  if (expiry < now) return "expired";
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (expiry - now <= thirtyDays) return "expiring";
  return "current";
}

/** Pricing precedence: supplier-linked → item sell → calculated from cost. */
export function selectEffectivePrice(
  item: Pick<
    PricingItemRecord,
    | "defaultCost"
    | "defaultSellPrice"
    | "defaultMarkupPercent"
    | "targetMarginPercent"
    | "minimumSellPrice"
    | "priceValidTo"
  >,
  options: {
    supplierPrice?: SupplierPriceOption | null;
    globalMarkupPercent?: number;
    globalMarginPercent?: number;
  } = {},
): EffectivePrice {
  const supplier = options.supplierPrice ?? null;
  const costFromSupplier = supplier?.unitCost ?? item.defaultCost ?? null;

  if (item.defaultSellPrice != null && item.defaultSellPrice > 0) {
    return {
      costPrice: costFromSupplier,
      sellPrice: item.defaultSellPrice,
      source: supplier ? "supplier_price" : "item_sell",
      supplierPriceId: supplier?.id ?? null,
      supplierName: supplier?.supplierName ?? null,
      validTo: supplier?.validTo ?? item.priceValidTo,
      priceStatus: resolvePriceStatus(
        supplier?.validTo ?? item.priceValidTo,
        true,
      ),
    };
  }

  if (costFromSupplier != null && costFromSupplier > 0) {
    const markup = item.defaultMarkupPercent ?? options.globalMarkupPercent ?? null;
    const margin = item.targetMarginPercent ?? options.globalMarginPercent ?? null;
    const method = margin != null && margin > 0 ? "margin" : "markup";
    const calculated = calculateSellPrice({
      cost: costFromSupplier,
      method,
      markupPercent: markup,
      marginPercent: margin,
      minimumSellPrice: item.minimumSellPrice,
    });

    return {
      costPrice: costFromSupplier,
      sellPrice: calculated.sellPrice,
      source: "calculated",
      supplierPriceId: supplier?.id ?? null,
      supplierName: supplier?.supplierName ?? null,
      validTo: supplier?.validTo ?? item.priceValidTo,
      priceStatus: resolvePriceStatus(
        supplier?.validTo ?? item.priceValidTo,
        calculated.sellPrice != null,
      ),
    };
  }

  return {
    costPrice: costFromSupplier,
    sellPrice: null,
    source: "global_default",
    supplierPriceId: supplier?.id ?? null,
    supplierName: supplier?.supplierName ?? null,
    validTo: supplier?.validTo ?? item.priceValidTo,
    priceStatus: "missing",
  };
}
