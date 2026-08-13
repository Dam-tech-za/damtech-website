import {
  formatJsonLdPrice,
  parseCatalogueQuantity,
  roundMoney,
} from "./format.ts";
import { CATALOGUE_PRODUCTS } from "./products.ts";
import type { CatalogueLineSnapshot, CatalogueSku } from "./types.ts";
import { isCatalogueSku } from "./types.ts";

function productBySku(sku: string) {
  if (!isCatalogueSku(sku)) return undefined;
  return CATALOGUE_PRODUCTS.find((product) => product.sku === sku);
}

export type CatalogueSelectionParams = {
  sku?: string | string[];
  qty?: string | string[];
  quantity?: string | string[];
  price?: string | string[];
  name?: string | string[];
  [key: string]: string | string[] | undefined;
};

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * Resolve a catalogue line from allowlisted SKU + quantity only.
 * Name and price query parameters are ignored.
 */
export function resolveCatalogueSelectionFromParams(
  params: CatalogueSelectionParams,
): CatalogueLineSnapshot | null {
  const sku = firstString(params.sku).trim().toUpperCase();
  if (!sku || !isCatalogueSku(sku)) return null;
  const quantity = parseCatalogueQuantity(
    firstString(params.qty) || firstString(params.quantity),
  );
  return resolveCatalogueLine(sku, quantity);
}

export function resolveCatalogueLine(
  sku: CatalogueSku | string,
  quantity: number,
): CatalogueLineSnapshot | null {
  const product = productBySku(sku);
  if (!product) return null;
  const qty = parseCatalogueQuantity(quantity);
  const unitPriceInclVatZar = roundMoney(product.priceInclVatZar);
  const lineTotalInclVatZar = roundMoney(unitPriceInclVatZar * qty);
  return {
    sku: product.sku,
    productName: product.name,
    quantity: qty,
    unitPriceInclVatZar,
    lineTotalInclVatZar,
    vatIncluded: true,
    vatRatePercent: product.vatRatePercent,
    currency: product.currency,
    transportExcluded: true,
    installationExcluded: true,
    categoryLabel: product.categoryLabel,
    slug: product.slug,
    rfqService: product.rfqService,
  };
}

export function catalogueLineJsonLdPrice(line: CatalogueLineSnapshot): string {
  return formatJsonLdPrice(line.unitPriceInclVatZar);
}
