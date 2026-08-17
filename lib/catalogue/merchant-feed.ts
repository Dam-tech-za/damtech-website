import {
  CATALOGUE_FULFILMENT_LEAD_TIME,
  CATALOGUE_MERCHANT_AVAILABILITY,
  isResolvedFulfilmentLeadTime,
  isResolvedMerchantAvailability,
  merchantAvailabilityDate,
  merchantAvailabilityToFeedValue,
  merchantAvailabilityToSchemaUrl,
} from "./availability.ts";
import { formatCapacityLitres, formatJsonLdPrice } from "./format.ts";
import {
  canonicalProductImageUrl,
  RESERVOIR_LIFESTYLE_IMAGE,
  RESERVOIR_PRIMARY_IMAGE,
  SHALLOW_BASIN_LIFESTYLE_IMAGE,
  SHALLOW_BASIN_PRIMARY_IMAGE,
  TROUGH_PRIMARY_IMAGE,
  UNUSED_DOMESTIC_ROOFED_LIFESTYLE,
  UNUSED_DOMESTIC_ROOFED_PRIMARY,
} from "./images.ts";
import { MERCHANT_CENTER_RELEASE_GATE } from "./merchant.ts";
import { merchantFeedHandlingTransitFields } from "./merchant-policies.ts";
import { CATALOGUE_PRODUCTS } from "./products.ts";
import { isDeliveryFulfilmentConfigured } from "../orders/delivery.ts";
import { CANONICAL_ORIGIN } from "../site-url.ts";
import {
  CATALOGUE_CATEGORY_PATH,
  isUnresolvedFact,
  type CatalogueFulfilmentLeadTime,
  type CatalogueMerchantAvailability,
  type CatalogueProduct,
  type CatalogueSku,
  type ProductCategoryId,
} from "./types.ts";

function catalogueProductPath(product: CatalogueProduct): string {
  return `${CATALOGUE_CATEGORY_PATH}/${product.slug}`;
}

function productionPageUrl(path: string): string {
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  const withSlash = withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
  return `${CANONICAL_ORIGIN}${withSlash}`;
}

export const MERCHANT_FEED_PATH = "/feeds/google-merchant.tsv" as const;
export const MERCHANT_FEED_URL = `${CANONICAL_ORIGIN}${MERCHANT_FEED_PATH}`;

export const MERCHANT_FEED_CONTENT_TYPE =
  "text/tab-separated-values; charset=utf-8" as const;

export const MERCHANT_FEED_COLUMNS = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "additional_image_link",
  "availability",
  "availability_date",
  "price",
  "condition",
  "brand",
  "mpn",
  "identifier_exists",
  "google_product_category",
  "product_type",
  "min_handling_time",
  "max_handling_time",
  "min_transit_time",
  "max_transit_time",
  "ships_from_country",
] as const;

export type MerchantFeedColumn = (typeof MERCHANT_FEED_COLUMNS)[number];
export type MerchantFeedRow = Record<MerchantFeedColumn, string>;

/**
 * Verified Google product taxonomy IDs from
 * https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
 *
 * 1910 — Hardware > Storage Tanks
 * 6990 — Business & Industrial > Agriculture > Animal Husbandry > Livestock Feeders & Waterers
 */
export const GOOGLE_PRODUCT_CATEGORY = {
  storageTanks: {
    id: "1910",
    path: "Hardware > Storage Tanks",
  },
  livestockWaterers: {
    id: "6990",
    path: "Business & Industrial > Agriculture > Animal Husbandry > Livestock Feeders & Waterers",
  },
} as const;

const PRODUCT_TYPE: Record<ProductCategoryId, string> = {
  "corrugated-steel-water-tanks": "Water Storage > Corrugated Steel Water Tanks",
  "fish-ponds-and-aquaculture-tanks": "Aquaculture > Corrugated Steel Fish Ponds",
  "livestock-water-troughs": "Livestock Equipment > Water Troughs",
};

const WATER_TANK_SKUS: readonly CatalogueSku[] = [
  "DMT-WT-10000",
  "DMT-WT-20000",
  "DMT-WT-50000",
  "DMT-WT-100000",
];

const ACCEPTED_DIGITAL_SOURCE_TYPES = new Set([
  "compositeWithTrainedAlgorithmicMedia",
  "CompositeSynthetic",
  "TrainedAlgorithmicMedia",
]);

/**
 * Static WebP paths whose local and production bytes were inspected for
 * IPTC/XMP DigitalSourceType=compositeWithTrainedAlgorithmicMedia.
 * Tests re-read the files. Do not add a path without verifying the bytes.
 */
export const MERCHANT_FEED_AI_METADATA_VERIFIED_SRC = [
  "/images/corrugated-steel-water-reservoir-south-africa-nobg.webp",
  "/images/corrugated-steel-water-reservoir-south-africa.webp",
  "/images/galvanised-livestock-water-trough-south-africa-nobg.webp",
  "/images/galvanised-livestock-water-trough-south-africa.webp",
] as const;

const REQUIRED_POLICY_PATHS = ["/privacy", "/terms", "/returns"] as const;

const REQUIRED_ROW_COLUMNS: readonly MerchantFeedColumn[] = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "availability",
  "price",
  "condition",
  "brand",
  "mpn",
  "identifier_exists",
  "google_product_category",
  "product_type",
  "min_handling_time",
  "max_handling_time",
  "min_transit_time",
  "max_transit_time",
  "ships_from_country",
];

export type MerchantFeedBlocker = {
  id: string;
  message: string;
};

export type MerchantFeedEvaluationContext = {
  feedEnabled: boolean;
  deliveryConfigured: boolean;
  availability: CatalogueMerchantAvailability;
  leadTime: CatalogueFulfilmentLeadTime;
  policyPathsPresent: boolean;
};

export type MerchantFeedImageAssignment = {
  imageLink?: string;
  additionalImageLink?: string;
  blockers: MerchantFeedBlocker[];
};

export type MerchantFeedHttpResult = {
  status: 200 | 404 | 503;
  body: string | null;
  contentType: string;
};

function isWaterTankSku(sku: CatalogueSku): boolean {
  return WATER_TANK_SKUS.includes(sku);
}

function hasRequiredPolicyPages(): boolean {
  return REQUIRED_POLICY_PATHS.every(Boolean);
}

export function getDefaultMerchantFeedContext(): MerchantFeedEvaluationContext {
  return {
    feedEnabled: MERCHANT_CENTER_RELEASE_GATE.feedEnabled,
    deliveryConfigured: isDeliveryFulfilmentConfigured(),
    availability: CATALOGUE_MERCHANT_AVAILABILITY,
    leadTime: CATALOGUE_FULFILMENT_LEAD_TIME,
    policyPathsPresent: hasRequiredPolicyPages(),
  };
}

export function escapeMerchantTsvField(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").replace(/ {2,}/g, " ").trim();
}

export function formatMerchantFeedPrice(amount: number): string {
  return `${formatJsonLdPrice(amount)} ZAR`;
}

export function webpDigitalSourceTypeFromBuffer(buffer: Uint8Array): string | null {
  const text = Buffer.from(buffer).toString("latin1");
  const match = text.match(/digitalsourcetype\/([A-Za-z]+)/i);
  return match?.[1] ?? null;
}

export function webpHasAcceptedAiMetadata(buffer: Uint8Array): boolean {
  const sourceType = webpDigitalSourceTypeFromBuffer(buffer);
  return Boolean(sourceType && ACCEPTED_DIGITAL_SOURCE_TYPES.has(sourceType));
}

function imageHasVerifiedAiMetadata(src: string): boolean {
  return (MERCHANT_FEED_AI_METADATA_VERIFIED_SRC as readonly string[]).includes(
    src,
  );
}

function isAbsoluteProductionUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== "www.dam-tech.co.za") return false;
    if (parsed.search) return false;
    if (/localhost|127\.0\.0\.1|vercel\.app/i.test(url)) return false;
    return true;
  } catch {
    return false;
  }
}

function isStaticWebpUrl(url: string): boolean {
  return (
    isAbsoluteProductionUrl(url) &&
    url.endsWith(".webp") &&
    !url.includes("/_next/image")
  );
}

export function getMerchantFeedImageAssignment(
  product: CatalogueProduct,
): MerchantFeedImageAssignment {
  const blockers: MerchantFeedBlocker[] = [];
  const domesticImages = new Set([
    UNUSED_DOMESTIC_ROOFED_PRIMARY.src,
    UNUSED_DOMESTIC_ROOFED_LIFESTYLE.src,
  ]);

  if (isWaterTankSku(product.sku)) {
    if (domesticImages.has(RESERVOIR_PRIMARY_IMAGE.src)) {
      blockers.push({
        id: "missing-image",
        message: "The unused domestic roofed tank image must not enter the feed.",
      });
      return { blockers };
    }
    return {
      imageLink: canonicalProductImageUrl(RESERVOIR_PRIMARY_IMAGE.src),
      additionalImageLink: canonicalProductImageUrl(RESERVOIR_LIFESTYLE_IMAGE.src),
      blockers,
    };
  }

  if (
    product.sku === "DMT-FP-10000" ||
    product.sku === "DMT-FP-15000" ||
    product.sku === "DMT-LT-1500"
  ) {
    const primary =
      product.sku === "DMT-LT-1500" ? TROUGH_PRIMARY_IMAGE : SHALLOW_BASIN_PRIMARY_IMAGE;
    return {
      imageLink: canonicalProductImageUrl(primary.src),
      additionalImageLink: canonicalProductImageUrl(SHALLOW_BASIN_LIFESTYLE_IMAGE.src),
      blockers,
    };
  }

  blockers.push({
    id: "missing-image",
    message: `No Merchant image mapping exists for ${product.sku}.`,
  });
  return { blockers };
}

function buildFeedDescription(product: CatalogueProduct): string {
  const parts: string[] = [
    "Fixed-price supply-only kit.",
    "Made to order and available to order.",
  ];
  if (typeof product.capacityLitres === "number") {
    parts.push(`Capacity: ${formatCapacityLitres(product.capacityLitres)}.`);
  }
  if (
    typeof product.diameterM === "number" &&
    typeof product.heightM === "number"
  ) {
    parts.push(`Dimensions: ${product.diameterM} m × ${product.heightM} m.`);
  }
  if (!isUnresolvedFact(product.inclusions)) {
    parts.push(product.inclusions.join(". ") + ".");
  }
  parts.push(
    "Delivery only throughout South Africa.",
    "Delivery excluded. Installation excluded.",
    "Delivery charge is calculated from shipping weight in kilograms.",
    "Manufacturing time: 5–10 business days after cleared payment.",
    "Estimated delivery time: 3–5 business days after manufacturing is complete.",
  );
  return parts.join(" ");
}

function googleProductCategoryId(product: CatalogueProduct): string {
  if (product.categoryId === "livestock-water-troughs") {
    return GOOGLE_PRODUCT_CATEGORY.livestockWaterers.id;
  }
  return GOOGLE_PRODUCT_CATEGORY.storageTanks.id;
}

function availabilityBlockers(
  context: MerchantFeedEvaluationContext,
): MerchantFeedBlocker[] {
  const blockers: MerchantFeedBlocker[] = [];
  const availability = context.availability;
  if (!isResolvedMerchantAvailability(availability)) {
    blockers.push({
      id: "missing-availability",
      message: availability.reason,
    });
    return blockers;
  }

  if (availability.value === "in_stock") {
    if (!isResolvedFulfilmentLeadTime(context.leadTime)) {
      blockers.push({
        id: "missing-lead-time",
        message: context.leadTime.reason,
      });
    } else if (
      context.leadTime.manufacturingMinBusinessDays !== 5 ||
      context.leadTime.manufacturingMaxBusinessDays !== 10 ||
      context.leadTime.deliveryMinBusinessDays !== 3 ||
      context.leadTime.deliveryMaxBusinessDays !== 5 ||
      context.leadTime.totalMinBusinessDays !== 8 ||
      context.leadTime.totalMaxBusinessDays !== 15
    ) {
      blockers.push({
        id: "missing-lead-time",
        message:
          "Fulfilment lead times must match DamTech’s confirmed 5–10 / 3–5 / 8–15 business-day windows.",
      });
    }
  }

  if (availability.value === "backorder" || availability.value === "preorder") {
    if (!availability.availabilityDate) {
      blockers.push({
        id: "missing-availability-date",
        message: `${availability.value} requires a factual availability_date.`,
      });
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(availability.availabilityDate)) {
      blockers.push({
        id: "missing-availability-date",
        message: "availability_date must be an ISO date (YYYY-MM-DD).",
      });
    }
  }

  return blockers;
}

function identifierBlockers(product: CatalogueProduct): MerchantFeedBlocker[] {
  const blockers: MerchantFeedBlocker[] = [];
  const brand = "DamTech";
  const mpn = product.sku;
  if (!brand) {
    blockers.push({ id: "invalid-identifier", message: "Brand is required." });
  }
  if (brand !== "DamTech") {
    blockers.push({
      id: "invalid-identifier",
      message: "Brand must be DamTech.",
    });
  }
  if (!mpn || mpn !== product.sku) {
    blockers.push({
      id: "invalid-identifier",
      message: "MPN must equal the catalogue SKU.",
    });
  }
  return blockers;
}

export function getProductMerchantBlockers(
  product: CatalogueProduct,
  context: MerchantFeedEvaluationContext = getDefaultMerchantFeedContext(),
): MerchantFeedBlocker[] {
  const blockers: MerchantFeedBlocker[] = [];

  if (!product.merchantEligible) {
    blockers.push({
      id: "merchant-flag",
      message: `${product.sku} remains merchantEligible: false.`,
    });
  }

  if (!product.sku || !product.feedTitle || !product.description) {
    blockers.push({
      id: "incomplete-catalogue-fields",
      message: `${product.sku} is missing required catalogue fields.`,
    });
  }

  if (!product.vatIncluded || product.currency !== "ZAR" || !product.priceInclVatZar) {
    blockers.push({
      id: "missing-price",
      message: `${product.sku} must have a VAT-inclusive ZAR price.`,
    });
  }

  if (!product.deliveryExplanation?.trim()) {
    blockers.push({
      id: "missing-delivery-information",
      message: `${product.sku} is missing delivery information.`,
    });
  }

  const images = getMerchantFeedImageAssignment(product);
  blockers.push(...images.blockers);
  if (!images.imageLink) {
    blockers.push({
      id: "missing-image",
      message: `${product.sku} has no Merchant image_link.`,
    });
  } else {
    if (!isStaticWebpUrl(images.imageLink)) {
      blockers.push({
        id: "broken-image-url",
        message: `${product.sku} image_link is not an absolute production WebP URL.`,
      });
    }
    if (
      images.imageLink.includes("10000l-galvanised-steel-water-tank") ||
      images.additionalImageLink?.includes("10000l-galvanised-steel-water-tank")
    ) {
      blockers.push({
        id: "missing-image",
        message: "The unused domestic roofed tank image must not enter the feed.",
      });
    }
    const imageSrc = images.imageLink.replace(CANONICAL_ORIGIN, "");
    if (!imageHasVerifiedAiMetadata(imageSrc)) {
      blockers.push({
        id: "missing-ai-metadata",
        message: `${product.sku} primary image is missing IPTC/XMP DigitalSourceType.`,
      });
    }
    if (
      images.additionalImageLink &&
      !imageHasVerifiedAiMetadata(images.additionalImageLink.replace(CANONICAL_ORIGIN, ""))
    ) {
      blockers.push({
        id: "missing-ai-metadata",
        message: `${product.sku} additional image is missing IPTC/XMP DigitalSourceType.`,
      });
    }
  }

  const productUrl = productionPageUrl(catalogueProductPath(product));
  if (
    !isAbsoluteProductionUrl(productUrl) ||
    productUrl.includes("/order") ||
    productUrl === `${CANONICAL_ORIGIN}/steel-water-storage-tanks/`
  ) {
    blockers.push({
      id: "broken-product-url",
      message: `${product.sku} product URL is not the absolute production canonical page.`,
    });
  }

  if (!context.deliveryConfigured) {
    blockers.push({
      id: "failed-order-flow-configuration",
      message: "Delivery-only fulfilment is not configured for catalogue orders.",
    });
  }

  if (!context.policyPathsPresent) {
    blockers.push({
      id: "missing-policy-page",
      message: "Privacy, terms and returns pages must remain published.",
    });
  }

  blockers.push(...availabilityBlockers(context));
  blockers.push(...identifierBlockers(product));

  const expectedPrice = formatMerchantFeedPrice(product.priceInclVatZar);
  if (!/^\d+\.\d{2} ZAR$/.test(expectedPrice)) {
    blockers.push({
      id: "price-mismatch",
      message: `${product.sku} feed price formatting is invalid.`,
    });
  }

  return blockers;
}

export function isProductMerchantEligible(
  product: CatalogueProduct,
  context: MerchantFeedEvaluationContext = getDefaultMerchantFeedContext(),
): boolean {
  return getProductMerchantBlockers(product, context).length === 0;
}

export function getMerchantFeedProducts(
  context: MerchantFeedEvaluationContext = getDefaultMerchantFeedContext(),
  products: readonly CatalogueProduct[] = CATALOGUE_PRODUCTS,
): CatalogueProduct[] {
  if (!context.feedEnabled) return [];
  return products.filter((product) => isProductMerchantEligible(product, context));
}

export function getCatalogueMerchantBlockerReport(
  context: MerchantFeedEvaluationContext = getDefaultMerchantFeedContext(),
  products: readonly CatalogueProduct[] = CATALOGUE_PRODUCTS,
): Record<CatalogueSku, MerchantFeedBlocker[]> {
  return Object.fromEntries(
    products.map((product) => [product.sku, getProductMerchantBlockers(product, context)]),
  ) as Record<CatalogueSku, MerchantFeedBlocker[]>;
}

function buildMerchantFeedRow(
  product: CatalogueProduct,
  context: MerchantFeedEvaluationContext,
): MerchantFeedRow | null {
  if (getProductMerchantBlockers(product, context).length > 0) return null;

  const images = getMerchantFeedImageAssignment(product);
  const availability = merchantAvailabilityToFeedValue(context.availability);
  if (!availability || !images.imageLink) return null;

  const availabilityDate =
    availability === "backorder" || availability === "preorder"
      ? merchantAvailabilityDate(context.availability) ?? ""
      : "";

  return {
    id: product.sku,
    title: escapeMerchantTsvField(product.feedTitle),
    description: escapeMerchantTsvField(buildFeedDescription(product)),
    link: productionPageUrl(catalogueProductPath(product)),
    image_link: images.imageLink,
    additional_image_link: images.additionalImageLink ?? "",
    availability,
    availability_date: availabilityDate,
    price: formatMerchantFeedPrice(product.priceInclVatZar),
    condition: "new",
    brand: "DamTech",
    mpn: product.sku,
    identifier_exists: "yes",
    google_product_category: googleProductCategoryId(product),
    product_type: PRODUCT_TYPE[product.categoryId],
    ...merchantFeedHandlingTransitFields(),
  };
}

export function buildMerchantFeedTsv(rows: readonly MerchantFeedRow[]): string {
  const header = MERCHANT_FEED_COLUMNS.join("\t");
  const lines = rows.map((row) =>
    MERCHANT_FEED_COLUMNS.map((column) => escapeMerchantTsvField(row[column])).join(
      "\t",
    ),
  );
  return [header, ...lines].join("\n") + "\n";
}

export function createMerchantFeedHttpResult(options?: {
  context?: Partial<MerchantFeedEvaluationContext>;
  products?: readonly CatalogueProduct[];
}): MerchantFeedHttpResult {
  const context: MerchantFeedEvaluationContext = {
    ...getDefaultMerchantFeedContext(),
    ...options?.context,
  };
  const products = options?.products ?? CATALOGUE_PRODUCTS;

  if (!context.feedEnabled) {
    return {
      status: 404,
      body: "Not Found",
      contentType: "text/plain; charset=utf-8",
    };
  }

  const eligible = getMerchantFeedProducts(context, products);
  const rows = eligible
    .map((product) => buildMerchantFeedRow(product, context))
    .filter((row): row is MerchantFeedRow => row !== null);

  if (rows.length === 0) {
    console.error(
      "[merchant-feed] feedEnabled is true but no eligible product rows exist. Refusing to serve an empty feed.",
    );
    return {
      status: 503,
      body: "Merchant feed has no eligible products",
      contentType: "text/plain; charset=utf-8",
    };
  }

  for (const row of rows) {
    for (const column of REQUIRED_ROW_COLUMNS) {
      if (!row[column]) {
        console.error(
          `[merchant-feed] eligible row ${row.id} is missing required column ${column}.`,
        );
        return {
          status: 503,
          body: "Merchant feed has no eligible products",
          contentType: "text/plain; charset=utf-8",
        };
      }
    }
    if (row.identifier_exists !== "yes") {
      console.error(
        `[merchant-feed] eligible row ${row.id} must use identifier_exists=yes with brand and MPN.`,
      );
      return {
        status: 503,
        body: "Merchant feed has no eligible products",
        contentType: "text/plain; charset=utf-8",
      };
    }
    if (row.mpn !== row.id || row.brand !== "DamTech") {
      console.error(
        `[merchant-feed] eligible row ${row.id} has invalid brand/MPN identifiers.`,
      );
      return {
        status: 503,
        body: "Merchant feed has no eligible products",
        contentType: "text/plain; charset=utf-8",
      };
    }
  }

  return {
    status: 200,
    body: buildMerchantFeedTsv(rows),
    contentType: MERCHANT_FEED_CONTENT_TYPE,
  };
}

export function parseMerchantFeedTsv(tsv: string): {
  columns: string[];
  rows: Array<Record<string, string>>;
} {
  const lines = tsv.replace(/^\uFEFF/, "").trimEnd().split("\n");
  const columns = (lines[0] ?? "").split("\t");
  const rows = lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split("\t");
    return Object.fromEntries(
      columns.map((column, index) => [column, values[index] ?? ""]),
    );
  });
  return { columns, rows };
}

export { merchantAvailabilityToSchemaUrl };
