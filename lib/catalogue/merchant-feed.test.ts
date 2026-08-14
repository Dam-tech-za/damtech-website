import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CATALOGUE_AVAILABILITY_COPY,
  CATALOGUE_FULFILMENT_LEAD_TIME,
  CATALOGUE_MERCHANT_AVAILABILITY,
  cataloguePublicAvailabilityCopy,
  merchantAvailabilityToFeedValue,
  merchantAvailabilityToSchemaUrl,
} from "./availability.ts";
import { formatJsonLdPrice, productPath } from "./format.ts";
import {
  RESERVOIR_LIFESTYLE_IMAGE,
  RESERVOIR_PRIMARY_IMAGE,
  SHALLOW_BASIN_PRIMARY_IMAGE,
  TROUGH_PRIMARY_IMAGE,
  UNUSED_DOMESTIC_ROOFED_PRIMARY,
} from "./images.ts";
import { MERCHANT_CENTER_RELEASE_GATE } from "./merchant.ts";
import {
  MERCHANT_FEED_AI_METADATA_VERIFIED_SRC,
  MERCHANT_FEED_COLUMNS,
  MERCHANT_FEED_CONTENT_TYPE,
  MERCHANT_FEED_PATH,
  MERCHANT_FEED_URL,
  createMerchantFeedHttpResult,
  escapeMerchantTsvField,
  formatMerchantFeedPrice,
  getMerchantFeedImageAssignment,
  getMerchantFeedProducts,
  getProductMerchantBlockers,
  parseMerchantFeedTsv,
  webpHasAcceptedAiMetadata,
  type MerchantFeedEvaluationContext,
} from "./merchant-feed.ts";
import { CATALOGUE_PRODUCTS } from "./products.ts";
import type { CatalogueProduct } from "./types.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function getBySku(sku: string): CatalogueProduct {
  const product = CATALOGUE_PRODUCTS.find((item) => item.sku === sku);
  assert.ok(product, sku);
  return product;
}

function eligibleContext(
  overrides: Partial<MerchantFeedEvaluationContext> = {},
): MerchantFeedEvaluationContext {
  return {
    feedEnabled: true,
    deliveryConfigured: true,
    availability: CATALOGUE_MERCHANT_AVAILABILITY,
    leadTime: CATALOGUE_FULFILMENT_LEAD_TIME,
    policyPathsPresent: true,
    ...overrides,
  };
}

describe("production Merchant feed is enabled", () => {
  it("returns seven TSV rows with GET-compatible content", () => {
    assert.equal(MERCHANT_CENTER_RELEASE_GATE.feedEnabled, true);
    assert.equal(
      CATALOGUE_PRODUCTS.every((product) => product.merchantEligible === true),
      true,
    );
    const result = createMerchantFeedHttpResult();
    assert.equal(result.status, 200);
    assert.equal(result.contentType, MERCHANT_FEED_CONTENT_TYPE);
    assert.ok(result.body);
    const parsed = parseMerchantFeedTsv(result.body);
    assert.deepEqual(parsed.columns, [...MERCHANT_FEED_COLUMNS]);
    assert.equal(parsed.rows.length, 7);
    assert.deepEqual(
      parsed.rows.map((row) => row.id),
      CATALOGUE_PRODUCTS.map((product) => product.sku),
    );

    const route = readFileSync(
      join(root, "app/feeds/google-merchant.tsv/route.ts"),
      "utf8",
    );
    assert.match(route, /export function GET/);
    assert.match(route, /export function HEAD/);
    assert.match(route, /createMerchantFeedHttpResult\(\)/);
    assert.match(route, /X-Robots-Tag/);
    assert.match(route, /noindex/);
  });
});

describe("enabled Merchant TSV content", () => {
  it("uses correct prices, availability, brand, MPN and categories", () => {
    const result = createMerchantFeedHttpResult({ context: eligibleContext() });
    assert.equal(result.status, 200);
    const parsed = parseMerchantFeedTsv(result.body ?? "");
    const expectedPrices: Record<string, string> = {
      "DMT-WT-10000": "12999.00 ZAR",
      "DMT-WT-20000": "15999.00 ZAR",
      "DMT-WT-50000": "24999.00 ZAR",
      "DMT-WT-100000": "40999.00 ZAR",
      "DMT-FP-10000": "13999.00 ZAR",
      "DMT-FP-15000": "17999.00 ZAR",
      "DMT-LT-1500": "4999.00 ZAR",
    };
    for (const row of parsed.rows) {
      const product = getBySku(row.id);
      assert.equal(row.price, expectedPrices[row.id]);
      assert.equal(row.price, formatMerchantFeedPrice(product.priceInclVatZar));
      assert.equal(row.price, `${formatJsonLdPrice(product.priceInclVatZar)} ZAR`);
      assert.equal(row.availability, "in_stock");
      assert.equal(row.availability_date, "");
      assert.equal(row.brand, "DamTech");
      assert.equal(row.mpn, row.id);
      assert.equal(row.identifier_exists, "yes");
      assert.equal(row.condition, "new");
      assert.match(row.link, /^https:\/\/www\.dam-tech\.co\.za\/steel-water-storage-tanks\//);
      assert.doesNotMatch(row.link, /localhost|127\.0\.0\.1|vercel\.app|\?|\/order/);
      assert.doesNotMatch(row.image_link, /_next\/image|localhost/);
      assert.doesNotMatch(
        `${row.title} ${row.description}`,
        /best|cheapest|\bsale\b|free delivery|same-day|next-day|collection|pickup/i,
      );
      if (row.id === "DMT-LT-1500") {
        assert.equal(row.google_product_category, "6990");
      } else {
        assert.equal(row.google_product_category, "1910");
      }
    }
  });

  it("fails rather than returning an empty feed when enabled with no eligible rows", () => {
    const result = createMerchantFeedHttpResult({
      products: CATALOGUE_PRODUCTS.map((product) => ({
        ...product,
        merchantEligible: false,
      })),
      context: eligibleContext(),
    });
    assert.equal(result.status, 503);
    assert.doesNotMatch(result.body ?? "", /^id\t/);
  });
});

describe("Merchant image mapping", () => {
  it("maps reservoir, fish-pond and trough images without the domestic roof", () => {
    const tank = getMerchantFeedImageAssignment(getBySku("DMT-WT-10000"));
    const pond = getMerchantFeedImageAssignment(getBySku("DMT-FP-10000"));
    const trough = getMerchantFeedImageAssignment(getBySku("DMT-LT-1500"));
    assert.equal(
      tank.imageLink,
      `https://www.dam-tech.co.za${RESERVOIR_PRIMARY_IMAGE.src}`,
    );
    assert.equal(
      tank.additionalImageLink,
      `https://www.dam-tech.co.za${RESERVOIR_LIFESTYLE_IMAGE.src}`,
    );
    assert.equal(
      pond.imageLink,
      `https://www.dam-tech.co.za${SHALLOW_BASIN_PRIMARY_IMAGE.src}`,
    );
    assert.equal(
      trough.imageLink,
      `https://www.dam-tech.co.za${TROUGH_PRIMARY_IMAGE.src}`,
    );

    const result = createMerchantFeedHttpResult();
    const parsed = parseMerchantFeedTsv(result.body ?? "");
    const joined = parsed.rows
      .map((row) => `${row.image_link} ${row.additional_image_link}`)
      .join(" ");
    assert.doesNotMatch(joined, /10000l-galvanised-steel-water-tank/);
    assert.equal(
      parsed.rows.some((row) => row.image_link.includes(UNUSED_DOMESTIC_ROOFED_PRIMARY.src)),
      false,
    );
  });
});

describe("Merchant validation blockers", () => {
  it("blocks a row when delivery fulfilment is not configured", () => {
    const blockers = getProductMerchantBlockers(
      getBySku("DMT-WT-10000"),
      eligibleContext({ deliveryConfigured: false }),
    );
    assert.ok(
      blockers.some((blocker) => blocker.id === "failed-order-flow-configuration"),
    );
  });

  it("blocks backorder without an availability date", () => {
    const blockers = getProductMerchantBlockers(
      getBySku("DMT-WT-10000"),
      eligibleContext({
        availability: { status: "resolved", value: "backorder" },
      }),
    );
    assert.ok(blockers.some((blocker) => blocker.id === "missing-availability-date"));
  });

  it("includes all seven SKUs when eligible", () => {
    assert.equal(getMerchantFeedProducts().length, 7);
  });
});

describe("feed discovery and escaping", () => {
  it("uses a stable production URL, excludes the feed from the sitemap, and does not robots-disallow it", () => {
    assert.equal(MERCHANT_FEED_PATH, "/feeds/google-merchant.tsv");
    assert.equal(MERCHANT_FEED_URL, "https://www.dam-tech.co.za/feeds/google-merchant.tsv");
    const sitemap = readFileSync(join(root, "lib/sitemap.ts"), "utf8");
    const site = readFileSync(join(root, "lib/site.ts"), "utf8");
    const robots = readFileSync(join(root, "app/robots.ts"), "utf8");
    const disallowBlock = site.slice(
      site.indexOf("ROBOTS_DISALLOW_PATHS"),
      site.indexOf("INDEXABLE_STATIC_PATHS"),
    );
    assert.match(sitemap, /startsWith\("\/feeds"\)/);
    assert.doesNotMatch(disallowBlock, /\/feeds/);
    assert.doesNotMatch(robots, /\/feeds/);
    assert.doesNotMatch(site.slice(site.indexOf("INDEXABLE_STATIC_PATHS")), /\/feeds/);
    for (const path of ["/privacy", "/terms", "/returns"]) {
      assert.match(
        site.slice(site.indexOf("INDEXABLE_STATIC_PATHS")),
        new RegExp(`"${path}"`),
      );
      assert.equal(existsSync(join(root, "app", path.slice(1), "page.tsx")), true);
    }
    for (const product of CATALOGUE_PRODUCTS) {
      assert.equal(
        productPath(product.slug).startsWith("/steel-water-storage-tanks/"),
        true,
      );
    }
  });

  it("escapes tabs and newlines in TSV fields", () => {
    assert.equal(
      escapeMerchantTsvField("line\twith\ttabs\nand a break"),
      "line with tabs and a break",
    );
  });
});

describe("AI image metadata and availability", () => {
  it("verifies DigitalSourceType on the static WebP files used by the feed", () => {
    for (const src of MERCHANT_FEED_AI_METADATA_VERIFIED_SRC) {
      const filePath = join(root, "public", src.replace(/^\//, ""));
      const buffer = readFileSync(filePath);
      assert.equal(webpHasAcceptedAiMetadata(buffer), true, src);
    }
  });

  it("publishes confirmed availability and lead times", () => {
    assert.equal(cataloguePublicAvailabilityCopy(), CATALOGUE_AVAILABILITY_COPY);
    assert.match(cataloguePublicAvailabilityCopy(), /5–10 business days/);
    assert.equal(CATALOGUE_MERCHANT_AVAILABILITY.value, "in_stock");
    assert.equal(CATALOGUE_FULFILMENT_LEAD_TIME.manufacturingMinBusinessDays, 5);
    assert.equal(CATALOGUE_FULFILMENT_LEAD_TIME.manufacturingMaxBusinessDays, 10);
    assert.equal(CATALOGUE_FULFILMENT_LEAD_TIME.deliveryMinBusinessDays, 3);
    assert.equal(CATALOGUE_FULFILMENT_LEAD_TIME.deliveryMaxBusinessDays, 5);
    assert.equal(CATALOGUE_FULFILMENT_LEAD_TIME.totalMinBusinessDays, 8);
    assert.equal(CATALOGUE_FULFILMENT_LEAD_TIME.totalMaxBusinessDays, 15);
    assert.equal(
      merchantAvailabilityToSchemaUrl(CATALOGUE_MERCHANT_AVAILABILITY),
      "https://schema.org/InStock",
    );
    assert.equal(
      merchantAvailabilityToFeedValue(CATALOGUE_MERCHANT_AVAILABILITY),
      "in_stock",
    );
  });
});
