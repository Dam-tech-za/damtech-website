import {
  getCatalogueProductBySku,
  isCatalogueSku,
  parseCatalogueQuantity,
  type CatalogueProduct,
} from "../catalogue/index.ts";
import { breakdownVatInclusive, type VatInclusiveBreakdown } from "./money.ts";
import {
  MAX_ORDER_QUANTITY,
  MIN_ORDER_QUANTITY,
  ORDER_CURRENCY,
  ORDER_VAT_RATE_PERCENT,
} from "./types.ts";

export type OrderPriceSnapshot = {
  sku: CatalogueProduct["sku"];
  productName: string;
  coreSpecSummary: string;
  slug: string;
  quantity: number;
  unitPriceInclVatZar: number;
  vatRatePercent: typeof ORDER_VAT_RATE_PERCENT;
  vatAmountZar: number;
  totalInclVatZar: number;
  currency: typeof ORDER_CURRENCY;
  transportExcluded: true;
  installationExcluded: true;
  supplyOnly: true;
  breakdown: VatInclusiveBreakdown;
  product: CatalogueProduct;
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * Server-side price snapshot. URL/form prices and names are ignored.
 */
export function resolveOrderableProduct(
  skuRaw: string,
  quantityRaw: number | string,
): OrderPriceSnapshot | null {
  const sku = skuRaw.trim().toUpperCase();
  if (!isCatalogueSku(sku)) return null;
  const product = getCatalogueProductBySku(sku);
  if (!product) return null;
  const quantity = parseCatalogueQuantity(quantityRaw);
  if (quantity < MIN_ORDER_QUANTITY || quantity > MAX_ORDER_QUANTITY) {
    return null;
  }
  const breakdown = breakdownVatInclusive(
    product.priceInclVatZar,
    quantity,
    product.vatRatePercent,
  );
  return {
    sku: product.sku,
    productName: product.name,
    coreSpecSummary: product.coreSpecSummary,
    slug: product.slug,
    quantity,
    unitPriceInclVatZar: breakdown.unitPriceInclVatZar,
    vatRatePercent: ORDER_VAT_RATE_PERCENT,
    vatAmountZar: breakdown.vatAmountZar,
    totalInclVatZar: breakdown.totalInclVatZar,
    currency: ORDER_CURRENCY,
    transportExcluded: true,
    installationExcluded: true,
    supplyOnly: true,
    breakdown,
    product,
  };
}

export function resolveOrderSelectionFromParams(params: {
  sku?: string | string[];
  qty?: string | string[];
  quantity?: string | string[];
  price?: string | string[];
  name?: string | string[];
  [key: string]: string | string[] | undefined;
}): OrderPriceSnapshot | null {
  void params.price;
  void params.name;
  void params.unitPrice;
  void params.productName;
  void params.total;
  const sku = firstParam(params.sku);
  if (!sku) return null;
  const quantity = firstParam(params.qty) || firstParam(params.quantity) || "1";
  return resolveOrderableProduct(sku, quantity);
}
