import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { CATALOGUE_PRODUCTS } from "./products.ts";
import { CATALOGUE_SKUS, isUnresolvedFact } from "./types.ts";
import {
  formatJsonLdPrice,
  formatZarInclVat,
  formatZarWholeInclVat,
  invoiceRequestPath,
  orderPath,
  productPath,
  roundMoney,
} from "./format.ts";
import {
  resolveCatalogueLine,
  resolveCatalogueSelectionFromParams,
} from "./rfq.ts";
import { MERCHANT_CENTER_RELEASE_GATE } from "./merchant.ts";
import { getMerchantFeedProducts } from "./merchant-feed.ts";
import {
  CATALOGUE_IMAGE_ORIGIN,
  getOgImageAsset,
  getPageGalleryImages,
  getSchemaImageUrls,
  PLANNED_MAIN_IMAGES,
  RESERVOIR_PRIMARY_IMAGE,
  SHALLOW_BASIN_PRIMARY_IMAGE,
  UNUSED_DOMESTIC_ROOFED_PRIMARY,
} from "./images.ts";
import { UNRESOLVED_BUSINESS_FACTS } from "./unresolved.ts";

function getBySku(sku: string) {
  return CATALOGUE_PRODUCTS.find((product) => product.sku === sku);
}

function getBySlug(slug: string) {
  return CATALOGUE_PRODUCTS.find((product) => product.slug === slug);
}

describe("catalogue identity", () => {
  it("contains exactly seven allowlisted SKUs", () => {
    assert.equal(CATALOGUE_PRODUCTS.length, 7);
    assert.deepEqual(
      CATALOGUE_PRODUCTS.map((product) => product.sku),
      [...CATALOGUE_SKUS],
    );
  });

  it("uses unique slugs, titles and descriptions", () => {
    const slugs = new Set(CATALOGUE_PRODUCTS.map((p) => p.slug));
    const titles = new Set(CATALOGUE_PRODUCTS.map((p) => p.seoTitle));
    const descriptions = new Set(CATALOGUE_PRODUCTS.map((p) => p.seoDescription));
    assert.equal(slugs.size, 7);
    assert.equal(titles.size, 7);
    assert.equal(descriptions.size, 7);
  });

  it("looks up by SKU and slug", () => {
    const bySku = getBySku("DMT-WT-10000");
    const bySlug = getBySlug("10000-litre-water-tank");
    assert.equal(bySku?.name, "10 000L Corrugated Steel Water Tank");
    assert.equal(bySku, bySlug);
    assert.equal(getBySku("FAKE-SKU"), undefined);
  });

  it("builds product paths under the steel-tank hub", () => {
    assert.equal(
      productPath("10000-litre-water-tank"),
      "/steel-water-storage-tanks/10000-litre-water-tank",
    );
    assert.equal(
      orderPath("DMT-WT-10000", 1),
      "/order/?sku=DMT-WT-10000&qty=1",
    );
    assert.equal(
      invoiceRequestPath("DMT-WT-10000", 2),
      "/quote/?sku=DMT-WT-10000&qty=2",
    );
  });
});

describe("prices", () => {
  it("formats VAT-inclusive consumer prices without from/ex-VAT language", () => {
    const formatted = formatZarInclVat(12999);
    assert.equal(formatted, "R 12\u00a0999.00 incl. VAT");
    assert.doesNotMatch(formatted, /from|starting|estimated|ex-VAT|excl/i);
    assert.equal(formatJsonLdPrice(12999), "12999.00");
  });

  it("keeps visible prices equal to catalogue and JSON-LD prices", () => {
    for (const product of CATALOGUE_PRODUCTS) {
      assert.equal(product.vatIncluded, true);
      assert.equal(product.currency, "ZAR");
      assert.match(formatZarInclVat(product.priceInclVatZar), /incl\. VAT$/);
      const specPrice = product.specifications.find((row) => row.label === "Price");
      assert.match(specPrice?.value ?? "", /incl\. VAT$/);
      assert.doesNotMatch(specPrice?.value ?? "", /from |starting|estimated|ex-VAT/i);
      assert.equal(
        formatJsonLdPrice(product.priceInclVatZar),
        roundMoney(product.priceInclVatZar).toFixed(2),
      );
    }
  });

  it("formats whole-rand marketing prices as R12 999 incl. VAT", () => {
    assert.equal(formatZarWholeInclVat(12999), "R12\u00a0999 incl. VAT");
    assert.equal(formatZarWholeInclVat(15999), "R15\u00a0999 incl. VAT");
    assert.equal(formatZarWholeInclVat(24999), "R24\u00a0999 incl. VAT");
    assert.equal(formatZarWholeInclVat(40999), "R40\u00a0999 incl. VAT");
    assert.equal(formatZarWholeInclVat(13999), "R13\u00a0999 incl. VAT");
    assert.equal(formatZarWholeInclVat(17999), "R17\u00a0999 incl. VAT");
    assert.equal(formatZarWholeInclVat(4999), "R4\u00a0999 incl. VAT");
  });
});

describe("water tank product pages", () => {
  const waterTanks = CATALOGUE_PRODUCTS.filter(
    (product) => product.categoryId === "corrugated-steel-water-tanks",
  );

  it("uses unique titles, descriptions, H1s, heroes, FAQs and CTAs", () => {
    assert.equal(waterTanks.length, 4);
    assert.equal(new Set(waterTanks.map((p) => p.seoTitle)).size, 4);
    assert.equal(new Set(waterTanks.map((p) => p.seoDescription)).size, 4);
    assert.equal(new Set(waterTanks.map((p) => p.h1)).size, 4);
    assert.equal(new Set(waterTanks.map((p) => p.heroCopy)).size, 4);
    assert.equal(new Set(waterTanks.map((p) => p.bodyHeading)).size, 4);
    assert.equal(new Set(waterTanks.map((p) => p.ctaLabel)).size, 4);
    assert.equal(new Set(waterTanks.map((p) => p.feedTitle)).size, 4);
    const faqQuestions = waterTanks.flatMap((p) => p.faqs.map((faq) => faq.question));
    assert.equal(new Set(faqQuestions).size, faqQuestions.length);
    const linkBlocks = waterTanks.map((p) => JSON.stringify(p.relatedPageLinks));
    assert.equal(new Set(linkBlocks).size, 4);
  });

  it("publishes the required VAT-inclusive supply-only prices and dimensions", () => {
    const expected = [
      ["DMT-WT-10000", 12999, 3, 1.5, "3 m × 1.5 m"],
      ["DMT-WT-20000", 15999, 4, 1.5, "4 m × 1.5 m"],
      ["DMT-WT-50000", 24999, 5, 2.3, "5 m × 2.3 m"],
      ["DMT-WT-100000", 40999, 9, 1.5, "9 m × 1.5 m"],
    ] as const;
    for (const [sku, price, diameter, height, dims] of expected) {
      const product = getBySku(sku);
      assert.ok(product);
      assert.equal(product.priceInclVatZar, price);
      assert.equal(product.diameterM, diameter);
      assert.equal(product.heightM, height);
      assert.match(product.coreSpecSummary, new RegExp(dims.replace("×", "×")));
      assert.equal(
        product.specifications.find((row) => row.label === "Price")?.value,
        formatZarWholeInclVat(price),
      );
      assert.equal(
        product.supplyNotice,
        "Fixed-price supply-only reservoir kit. Price includes VAT. Delivery and installation are excluded.",
      );
      assert.match(product.ctaLabel, /Add .+ Tank to RFQ — Request Invoice/);
      assert.equal(isUnresolvedFact(product.inclusions), false);
      if (!isUnresolvedFact(product.inclusions)) {
        assert.ok(product.inclusions.some((item) => /850 gsm PVC liner/i.test(item)));
      }
      for (const faq of product.faqs) {
        assert.doesNotMatch(
          faq.answer,
          /free delivery is included|installation is included/i,
        );
      }
    }
  });
});

describe("RFQ SKU resolution", () => {
  it("derives name and price from the SKU, ignoring query-string pricing", () => {
    const line = resolveCatalogueSelectionFromParams({
      sku: "DMT-WT-10000",
      qty: "2",
      price: "1",
      name: "Cheap fake tank",
    });
    assert.ok(line);
    assert.equal(line.productName, "10 000L Corrugated Steel Water Tank");
    assert.equal(line.unitPriceInclVatZar, 12999);
    assert.equal(line.quantity, 2);
    assert.equal(line.lineTotalInclVatZar, 25998);
    assert.equal(line.vatIncluded, true);
    assert.equal(line.transportExcluded, true);
    assert.equal(line.installationExcluded, true);
  });

  it("rejects unknown SKUs", () => {
    assert.equal(
      resolveCatalogueSelectionFromParams({ sku: "DMT-FAKE", qty: "1" }),
      null,
    );
    assert.equal(resolveCatalogueLine("DMT-FAKE", 1), null);
  });

  it("clamps quantity to 1–99", () => {
    assert.equal(
      resolveCatalogueSelectionFromParams({ sku: "DMT-LT-1500", qty: "0" })
        ?.quantity,
      1,
    );
    assert.equal(
      resolveCatalogueSelectionFromParams({ sku: "DMT-LT-1500", qty: "500" })
        ?.quantity,
      99,
    );
  });
});

describe("niche fish pond and trough pages", () => {
  it("publishes unique pond and trough copy, prices and CTAs", () => {
    const pond10 = getBySku("DMT-FP-10000");
    const pond15 = getBySku("DMT-FP-15000");
    const trough = getBySku("DMT-LT-1500");
    assert.ok(pond10 && pond15 && trough);

    assert.equal(pond10.slug, "10000-litre-fish-pond");
    assert.equal(pond15.slug, "15000-litre-fish-pond");
    assert.equal(trough.slug, "livestock-water-trough");
    assert.equal(pond10.priceInclVatZar, 13999);
    assert.equal(pond15.priceInclVatZar, 17999);
    assert.equal(trough.priceInclVatZar, 4999);
    assert.equal(
      pond10.ctaLabel,
      "Add 10 000L Fish Pond to RFQ — Request Invoice",
    );
    assert.equal(
      pond15.ctaLabel,
      "Add 15 000L Fish Pond to RFQ — Request Invoice",
    );
    assert.equal(
      trough.ctaLabel,
      "Add Livestock Trough to RFQ — Request Invoice",
    );
    assert.equal(new Set([pond10.seoTitle, pond15.seoTitle, trough.seoTitle]).size, 3);
    assert.equal(new Set([pond10.h1, pond15.h1, trough.h1]).size, 3);
    assert.doesNotMatch(trough.h1, /670/);
    assert.match(trough.heroCopy, /livestock water trough/i);
    assert.match(trough.description, /cattle water trough/i);
    assert.match(trough.bodyCopy ?? "", /waterkrippe|beeswaterkrip|waterkrip/);
    assert.match(
      trough.bodyCopy ?? "",
      /Die ronde waterkrip is geskik as ’n praktiese drinkpunt/,
    );
    assert.match(
      trough.specifications.find((row) =>
        /gross theoretical/i.test(row.label),
      )?.value ?? "",
      /approximately 670 litres before freeboard/i,
    );
  });

  it("does not invent pond dimensions or claim filtration, fish or duck ponds", () => {
    const ponds = CATALOGUE_PRODUCTS.filter(
      (product) => product.categoryId === "fish-ponds-and-aquaculture-tanks",
    );
    assert.equal(ponds.length, 2);
    for (const pond of ponds) {
      assert.equal(isUnresolvedFact(pond.diameterM), true);
      assert.equal(isUnresolvedFact(pond.heightM), true);
      assert.doesNotMatch(pond.h1, /\d+(\.\d+)?\s*m/);
      const published = [
        pond.heroCopy,
        pond.description,
        pond.bodyCopy,
        pond.supplyNotice,
        ...pond.exclusions,
        ...pond.faqs.map((faq) => `${faq.question} ${faq.answer}`),
      ].join(" ");
      assert.match(published, /filtration/i);
      assert.match(published, /excluded/i);
      assert.doesNotMatch(published, /duck pond/i);
      assert.doesNotMatch(published, /koi for sale|pond fish for sale/i);
      assert.doesNotMatch(
        published,
        /includes (a |the )?(filter|pump|aeration|fish)\b/i,
      );
      assert.match(pond.supplyNotice, /Delivery, installation, filtration/);
    }
  });

  it("links the two fish ponds to each other and the trough to farm watering tools", () => {
    const pond10 = getBySku("DMT-FP-10000");
    const pond15 = getBySku("DMT-FP-15000");
    const trough = getBySku("DMT-LT-1500");
    assert.ok(pond10 && pond15 && trough);
    assert.deepEqual([...pond10.relatedSkus], ["DMT-FP-15000"]);
    assert.deepEqual([...pond15.relatedSkus], ["DMT-FP-10000"]);
    assert.ok(
      trough.relatedPageLinks?.some((link) =>
        link.href.includes("/agricultural-water-storage"),
      ),
    );
    assert.ok(
      trough.relatedPageLinks?.some((link) =>
        link.href.includes("/calculators/#annual-water-requirement"),
      ),
    );
  });
});

describe("unresolved facts stay typed", () => {
  it("does not publish fish-pond dimensions or trough inclusions", () => {
    const pond = getBySku("DMT-FP-10000");
    const trough = getBySku("DMT-LT-1500");
    assert.ok(pond && trough);
    assert.equal(isUnresolvedFact(pond.diameterM), true);
    assert.equal(isUnresolvedFact(pond.heightM), true);
    assert.equal(isUnresolvedFact(pond.images.main), false);
    assert.equal(isUnresolvedFact(trough.inclusions), true);
    assert.equal(trough.grossTheoreticalCapacityLitres, 670);
    assert.equal(isUnresolvedFact(trough.images.main), false);
    assert.equal(
      UNRESOLVED_BUSINESS_FACTS.safetyCrossbarInclusion.status,
      "unresolved",
    );
    if (!isUnresolvedFact(pond.inclusions)) {
      assert.equal(
        pond.inclusions.some((item) => /crossbar/i.test(item)),
        false,
      );
    }
  });
});

describe("product image SEO architecture", () => {
  it("reserves a unique planned filename and alt for every SKU", () => {
    const filenames = Object.values(PLANNED_MAIN_IMAGES).map((image) => image.filename);
    const alts = Object.values(PLANNED_MAIN_IMAGES).map((image) => image.alt);
    assert.equal(new Set(filenames).size, 7);
    assert.equal(new Set(alts).size, 7);
    assert.equal(
      PLANNED_MAIN_IMAGES["DMT-FP-10000"].filename,
      "damtech-10000l-fish-pond-aquaculture-tank-south-africa.webp",
    );
    assert.equal(
      PLANNED_MAIN_IMAGES["DMT-LT-1500"].filename,
      "damtech-round-livestock-cattle-water-trough-south-africa.webp",
    );
    for (const alt of alts) {
      assert.doesNotMatch(alt, /\b(price|best|cheap)\b/i);
    }
  });

  it("maps white-background primary and lifestyle images into gallery and JSON-LD", () => {
    for (const product of CATALOGUE_PRODUCTS) {
      assert.equal(product.images.merchantEligible, false);
      const gallery = getPageGalleryImages(product.images);
      assert.equal(gallery.length, 2);
      assert.equal(gallery[0]?.role, "main");
      assert.equal(gallery[1]?.role, "lifestyle");
      const schema = getSchemaImageUrls(product.images);
      assert.equal(schema.length, 2);
      assert.match(schema[0] ?? "", /^https:\/\/www\.dam-tech\.co\.za\/images\/.+\.webp$/);
      assert.equal(schema[0]?.startsWith(CATALOGUE_IMAGE_ORIGIN), true);
      assert.doesNotMatch(schema.join(" "), /_next\/image/);
      assert.ok(getOgImageAsset(product.images));
      assert.equal(getOgImageAsset(product.images)?.role, "lifestyle");
      const galleryAlts = gallery.map((image) => image.alt);
      assert.equal(new Set(galleryAlts).size, galleryAlts.length);
      assert.equal(
        gallery.some((image) => image.src === UNUSED_DOMESTIC_ROOFED_PRIMARY.src),
        false,
      );
    }
    const tank = getBySku("DMT-WT-10000");
    const pond = getBySku("DMT-FP-10000");
    const trough = getBySku("DMT-LT-1500");
    assert.ok(tank && !isUnresolvedFact(tank.images.main));
    assert.equal(tank.images.main.src, RESERVOIR_PRIMARY_IMAGE.src);
    assert.ok(pond && !isUnresolvedFact(pond.images.main));
    assert.equal(pond.images.main.src, SHALLOW_BASIN_PRIMARY_IMAGE.src);
    assert.doesNotMatch(pond.images.main.caption ?? "", /1\.5 m|381/);
    assert.ok(trough && !isUnresolvedFact(trough.images.main));
    assert.match(trough.images.main.alt, /livestock water trough/i);
    assert.equal(getMerchantFeedProducts().length, 7);
  });
});

describe("Merchant Center gate", () => {
  it("enables the feed for all seven eligible catalogue products", () => {
    assert.equal(MERCHANT_CENTER_RELEASE_GATE.feedEnabled, true);
    assert.equal(
      CATALOGUE_PRODUCTS.every((product) => product.merchantEligible === true),
      true,
    );
    assert.equal(getMerchantFeedProducts().length, 7);
  });
});

describe("catalogue sitemap and robots", () => {
  it("includes the hub, seven products and policy pages with production URLs", () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
    const sitemap = readFileSync(join(root, "lib/sitemap.ts"), "utf8");
    const robots = readFileSync(join(root, "app/robots.ts"), "utf8");
    const site = readFileSync(join(root, "lib/site.ts"), "utf8");
    const disallowBlock = site.slice(
      site.indexOf("ROBOTS_DISALLOW_PATHS"),
      site.indexOf("INDEXABLE_STATIC_PATHS"),
    );
    const indexableBlock = site.slice(site.indexOf("INDEXABLE_STATIC_PATHS"));
    assert.match(sitemap, /CATALOGUE_PRODUCTS/);
    assert.match(sitemap, /catalogueProductUrlPath/);
    assert.match(sitemap, /normalised\.startsWith\("\/order"\)/);
    assert.match(sitemap, /normalised\.startsWith\("\/feeds"\)/);
    assert.doesNotMatch(sitemap, /lastModified:\s*now/);
    assert.doesNotMatch(robots, /["']\/order\//);
    assert.match(robots, /Googlebot/);
    assert.match(robots, /Googlebot-Image/);
    assert.match(robots, /CANONICAL_ORIGIN/);
    assert.match(robots, /sitemap\.xml/);
    assert.doesNotMatch(disallowBlock, /"\/order\/"/);
    assert.doesNotMatch(disallowBlock, /\/feeds/);
    assert.match(disallowBlock, /"\/admin\/"/);
    for (const path of [
      '"/"',
      '"/steel-water-storage-tanks"',
      '"/privacy"',
      '"/terms"',
      '"/returns"',
      '"/contact"',
      '"/about-us-waterproofing-company"',
      '"/calculators"',
    ]) {
      assert.match(indexableBlock, new RegExp(path.replaceAll("/", "\\/")));
    }
    for (const product of CATALOGUE_PRODUCTS) {
      assert.equal(productPath(product.slug).startsWith("/steel-water-storage-tanks/"), true);
    }
  });
});
