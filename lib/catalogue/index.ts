import {
  CATALOGUE_PRODUCTS,
} from "./products.ts";
import { getOgImageAsset } from "./images.ts";
import {
  CATALOGUE_CATEGORY_PATH,
  isCatalogueSku,
  type CatalogueProduct,
  type CatalogueSku,
  type ProductCategoryId,
} from "./types.ts";

export {
  CATALOGUE_CATEGORY_PATH,
  CATALOGUE_CURRENCY,
  CATALOGUE_SKUS,
  MAX_CATALOGUE_QUANTITY,
  MIN_CATALOGUE_QUANTITY,
  PRODUCT_CATEGORY_IDS,
  PRODUCT_CATEGORY_LABELS,
  VAT_RATE_PERCENT,
  isCatalogueSku,
  isUnresolvedFact,
} from "./types.ts";
export type {
  CatalogueDimension,
  CatalogueFaq,
  CatalogueImage,
  CatalogueLineSnapshot,
  CatalogueProduct,
  CatalogueSku,
  CatalogueSpecification,
  ProductCategoryId,
  ResolvedImage,
  UnresolvedBusinessFact,
} from "./types.ts";
export { CATALOGUE_PRODUCTS } from "./products.ts";
export { UNRESOLVED_BUSINESS_FACTS } from "./unresolved.ts";
export {
  canonicalProductImageUrl,
  getOgImageAsset,
  getPageGalleryImages,
  getSchemaImageUrls,
  PLANNED_MAIN_IMAGES,
  PRODUCT_GALLERY_ASPECT,
  type CatalogueImageAsset,
  type ProductImageManifest,
} from "./images.ts";
export {
  clampCatalogueQuantity,
  formatCapacityLitres,
  formatJsonLdPrice,
  formatZarExactAmount,
  formatZarInclVat,
  formatZarWholeAmount,
  formatZarWholeInclVat,
  formatZarNumber,
  invoiceRequestPath,
  orderPath,
  parseCatalogueQuantity,
  productPath,
  roundMoney,
} from "./format.ts";
export {
  MERCHANT_CENTER_RELEASE_GATE,
  getMerchantFeedProducts,
  isProductMerchantEligible,
} from "./merchant.ts";
export {
  buildCatalogueAnalyticsFromLine,
  buildCatalogueAnalyticsItem,
  buildCatalogueAnalyticsPayload,
  CATALOGUE_ANALYTICS_EVENTS,
} from "./analytics.ts";
export {
  resolveCatalogueLine,
  resolveCatalogueSelectionFromParams,
} from "./rfq.ts";
export type { CatalogueSelectionParams } from "./rfq.ts";

const productsBySku = new Map<CatalogueSku, CatalogueProduct>(
  CATALOGUE_PRODUCTS.map((product) => [product.sku, product]),
);

const productsBySlug = new Map<string, CatalogueProduct>(
  CATALOGUE_PRODUCTS.map((product) => [product.slug, product]),
);

export function getCatalogueProductBySku(
  sku: string,
): CatalogueProduct | undefined {
  if (!isCatalogueSku(sku)) return undefined;
  return productsBySku.get(sku);
}

export function getCatalogueProductBySlug(
  slug: string,
): CatalogueProduct | undefined {
  return productsBySlug.get(slug);
}

export function getCatalogueSlugs(): string[] {
  return CATALOGUE_PRODUCTS.map((product) => product.slug);
}

export function getCatalogueProductsByCategory(
  categoryId: ProductCategoryId,
): CatalogueProduct[] {
  return CATALOGUE_PRODUCTS.filter(
    (product) => product.categoryId === categoryId,
  );
}

export function getWaterStorageProducts(): CatalogueProduct[] {
  return getCatalogueProductsByCategory("corrugated-steel-water-tanks");
}

export function getFishPondAndTroughProducts(): CatalogueProduct[] {
  return CATALOGUE_PRODUCTS.filter(
    (product) =>
      product.categoryId === "fish-ponds-and-aquaculture-tanks" ||
      product.categoryId === "livestock-water-troughs",
  );
}

export function getFishPondProducts(): CatalogueProduct[] {
  return getCatalogueProductsByCategory("fish-ponds-and-aquaculture-tanks");
}

export function getLivestockTroughProducts(): CatalogueProduct[] {
  return getCatalogueProductsByCategory("livestock-water-troughs");
}

export function getRelatedCatalogueProducts(
  product: CatalogueProduct,
): CatalogueProduct[] {
  return product.relatedSkus
    .map((sku) => productsBySku.get(sku))
    .filter((related): related is CatalogueProduct => Boolean(related));
}

export function catalogueProductUrlPath(product: CatalogueProduct): string {
  return `${CATALOGUE_CATEGORY_PATH}/${product.slug}`;
}

export function resolvedImageSrc(
  product: CatalogueProduct,
): string | undefined {
  return getOgImageAsset(product.images)?.src;
}
