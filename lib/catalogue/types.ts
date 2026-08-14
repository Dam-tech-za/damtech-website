import type { ServiceOption } from "../form.ts";
import type { ProductImageManifest } from "./images.ts";

export const CATALOGUE_SKUS = [
  "DMT-WT-10000",
  "DMT-WT-20000",
  "DMT-WT-50000",
  "DMT-WT-100000",
  "DMT-FP-10000",
  "DMT-FP-15000",
  "DMT-LT-1500",
] as const;

export type CatalogueSku = (typeof CATALOGUE_SKUS)[number];

export const PRODUCT_CATEGORY_IDS = [
  "corrugated-steel-water-tanks",
  "fish-ponds-and-aquaculture-tanks",
  "livestock-water-troughs",
] as const;

export type ProductCategoryId = (typeof PRODUCT_CATEGORY_IDS)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategoryId, string> = {
  "corrugated-steel-water-tanks": "Corrugated steel water tanks",
  "fish-ponds-and-aquaculture-tanks": "Fish ponds and aquaculture tanks",
  "livestock-water-troughs": "Livestock water troughs",
};

export const CATALOGUE_CATEGORY_PATH = "/steel-water-storage-tanks" as const;

export const MAX_CATALOGUE_QUANTITY = 99;
export const MIN_CATALOGUE_QUANTITY = 1;
export const VAT_RATE_PERCENT = 15;
export const CATALOGUE_CURRENCY = "ZAR" as const;

/** Business fact that must not be published until Damtech supplies it. */
export type UnresolvedBusinessFact = {
  status: "unresolved";
  field: string;
  reason: string;
};

export type MerchantAvailabilityCode =
  | "in_stock"
  | "out_of_stock"
  | "preorder"
  | "backorder";

export type ResolvedMerchantAvailability = {
  status: "resolved";
  value: MerchantAvailabilityCode;
  /** Required for `preorder` and `backorder`. ISO date `YYYY-MM-DD`. */
  availabilityDate?: string;
};

export type CatalogueMerchantAvailability =
  | ResolvedMerchantAvailability
  | UnresolvedBusinessFact;

export type ResolvedFulfilmentLeadTime = {
  status: "resolved";
  manufacturingMinBusinessDays: number;
  manufacturingMaxBusinessDays: number;
  deliveryMinBusinessDays: number;
  deliveryMaxBusinessDays: number;
  totalMinBusinessDays: number;
  totalMaxBusinessDays: number;
};

export type CatalogueFulfilmentLeadTime =
  | ResolvedFulfilmentLeadTime
  | UnresolvedBusinessFact;

/** @deprecated Prefer CatalogueFulfilmentLeadTime / ResolvedFulfilmentLeadTime */
export type ResolvedCollectionLeadTime = ResolvedFulfilmentLeadTime;
export type CatalogueCollectionLeadTime = CatalogueFulfilmentLeadTime;

export type ResolvedImage = {
  status: "resolved";
  src: string;
  alt: string;
  /** True when the photo is a genuine Damtech tank, not a pack shot of this SKU. */
  representative: boolean;
};

export type CatalogueImage = ResolvedImage | UnresolvedBusinessFact;

export type CatalogueDimension = number | UnresolvedBusinessFact;

export type CatalogueStringList = readonly string[] | UnresolvedBusinessFact;

export type CatalogueFaq = {
  question: string;
  answer: string;
};

export type CatalogueSpecification = {
  label: string;
  value: string;
};

export type CatalogueProduct = {
  sku: CatalogueSku;
  slug: string;
  name: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
  categoryId: ProductCategoryId;
  categoryLabel: string;
  rfqService: ServiceOption;
  priceInclVatZar: number;
  currency: typeof CATALOGUE_CURRENCY;
  vatIncluded: true;
  vatRatePercent: typeof VAT_RATE_PERCENT;
  supplyOnly: true;
  transportExcluded: true;
  installationExcluded: true;
  capacityLitres: CatalogueDimension;
  diameterM: CatalogueDimension;
  heightM: CatalogueDimension;
  grossTheoreticalCapacityLitres?: number;
  coreSpecSummary: string;
  specifications: readonly CatalogueSpecification[];
  inclusions: CatalogueStringList;
  exclusions: readonly string[];
  publicAvailability: string;
  warranty: string;
  deliveryExplanation: string;
  images: ProductImageManifest;
  faqs: readonly CatalogueFaq[];
  relatedSkus: readonly CatalogueSku[];
  /** Merchant/feed title. Not submitted while the Merchant Center gate is closed. */
  feedTitle: string;
  /** Per-SKU Merchant release flag. Independent of `feedEnabled`. */
  merchantEligible: boolean;
  heroCopy: string;
  supplyNotice: string;
  ctaLabel: string;
  bodyHeading?: string;
  bodyCopy?: string;
  supportingSections?: readonly { heading: string; copy: string }[];
  applications?: readonly string[];
  sitePreparation?: string;
  relatedPageLinks?: readonly { href: string; label: string }[];
  secondaryCta?: { href: string; label: string };
  relatedHeading?: string;
};

export type CatalogueLineSnapshot = {
  sku: CatalogueSku;
  productName: string;
  quantity: number;
  unitPriceInclVatZar: number;
  lineTotalInclVatZar: number;
  vatIncluded: true;
  vatRatePercent: typeof VAT_RATE_PERCENT;
  currency: typeof CATALOGUE_CURRENCY;
  transportExcluded: true;
  installationExcluded: true;
  categoryLabel: string;
  slug: string;
  rfqService: ServiceOption;
};

export function isUnresolvedFact(
  value: unknown,
): value is UnresolvedBusinessFact {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    (value as UnresolvedBusinessFact).status === "unresolved"
  );
}

export function isCatalogueSku(value: string): value is CatalogueSku {
  return (CATALOGUE_SKUS as readonly string[]).includes(value);
}
