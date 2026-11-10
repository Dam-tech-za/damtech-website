import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deliveryQuoteForProvince, DELIVERY_PROVINCES } from "./delivery.ts";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getPvcLinerBySku,
  isPvcLinerSku,
  parsePvcLinerColour,
  PVC_LINER_COLOUR_IMAGES,
  PVC_LINERS,
  pvcLinerOrderName,
  pvcLinerSku,
} from "./pvc-liners.ts";
import { shopOrigin } from "./origin.ts";

describe("PVC liner catalogue", () => {
  it("has 38 standard tank sizes in two thicknesses", () => {
    assert.equal(PVC_LINERS.length, 76);
    assert.equal(new Set(PVC_LINERS.map((l) => l.sku)).size, 76);
  });

  it("prices match the reservoir pricing model (5 m x 3 rows)", () => {
    const l550 = getPvcLinerBySku(pvcLinerSku(550, 5, 3));
    const l800 = getPvcLinerBySku(pvcLinerSku(800, 5, 3));
    assert.equal(l550?.priceExVatZar, 7590);
    assert.equal(l550?.priceInclVatZar, 8728.5);
    assert.equal(l800?.priceInclVatZar, 11994.5);
  });

  it("only accepts real SKUs", () => {
    assert.ok(isPvcLinerSku("DMT-PVC-550-05M-3R"));
    assert.ok(!isPvcLinerSku("DMT-PVC-550-16M-4R"));
    assert.ok(!isPvcLinerSku("DMT-PVC-600-05M-3R"));
    assert.equal(getPvcLinerBySku("dmt-pvc-550-05m-3r")?.diameterM, 5);
  });
});

describe("delivery fee", () => {
  it("is R11.50 per return km on the province average, plus VAT", () => {
    const gp = deliveryQuoteForProvince("Gauteng");
    assert.equal(gp?.feeExVatZar, 1450); // 63 km x 2 x 11.5 = 1449 -> R1 450
    assert.equal(gp?.feeInclVatZar, 1667.5);
  });
  it("covers all nine provinces and nothing else", () => {
    assert.equal(DELIVERY_PROVINCES.length, 9);
    for (const p of DELIVERY_PROVINCES) assert.ok(deliveryQuoteForProvince(p));
    assert.equal(deliveryQuoteForProvince("Other / outside South Africa"), null);
  });
});

describe("shopOrigin", () => {
  it("uses the preview URL on Vercel previews", () => {
    assert.equal(shopOrigin({ VERCEL_ENV: "preview", VERCEL_URL: "x.vercel.app" }), "https://x.vercel.app");
    assert.equal(shopOrigin({ VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://www.dam-tech.co.za/" }), "https://www.dam-tech.co.za");
  });
});

import { buildPvcLinerFeedRows, buildPvcLinerProductGroupSchema, pvcLinerVariantUrl } from "./pvc-merchant.ts";
import { createMerchantFeedHttpResult, parseMerchantFeedTsv } from "../catalogue/merchant-feed.ts";

describe("Google visibility", () => {
  it("describes all 76 liners as variants with exact prices and per-size URLs", () => {
    const schema = buildPvcLinerProductGroupSchema() as { hasVariant: Array<{ sku: string; offers: { price: string; url: string } }> };
    assert.equal(schema.hasVariant.length, 76);
    const v = schema.hasVariant.find((x) => x.sku === "DMT-PVC-550-05M-3R");
    assert.equal(v?.offers.price, "8728.50");
    assert.equal(v?.offers.url, "https://www.dam-tech.co.za/pvc-tank-liners/dmt-pvc-550-05m-3r/");
  });

  it("lists the liners in the Merchant feed with the tagged illustration, and none without an image", () => {
    assert.deepEqual(buildPvcLinerFeedRows(null), []);
    const { rows } = parseMerchantFeedTsv(createMerchantFeedHttpResult().body);
    const liners = rows.filter((r) => r.id.startsWith("DMT-PVC"));
    assert.equal(liners.length, 76);
    assert.equal(liners[0].image_link, "https://www.dam-tech.co.za/images/blue-pvc-tank-liner-folded-damtech.webp");
    assert.equal(rows.length, 76 + 7);
  });

  it("liner images are WebP files labelled as AI-rendered", () => {
    for (const image of Object.values(PVC_LINER_COLOUR_IMAGES)) {
      const bytes = readFileSync(join(process.cwd(), "public", image.src)).toString("latin1");
      assert.ok(bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP");
      assert.match(bytes, /digitalsourcetype\/trainedAlgorithmicMedia/);
      assert.ok(image.alt.length > 20 && !/photo/i.test(image.alt));
    }
  });

  it("stores the colour in the order name without changing the price", () => {
    const liner = getPvcLinerBySku("DMT-PVC-550-05M-3R")!;
    assert.equal(pvcLinerOrderName(liner, "black"), "550 gsm PVC tank liner, 5 m × 2.29 m, black");
    assert.equal(parsePvcLinerColour("Blue"), "blue");
    assert.equal(parsePvcLinerColour("green"), null);
  });

  it("builds valid feed rows once an image is set", () => {
    const rows = buildPvcLinerFeedRows({ src: "/images/example.webp" });
    assert.equal(rows.length, 76);
    const row = rows.find((r) => r.id === "DMT-PVC-800-05M-3R");
    assert.equal(row?.price, "11994.50 ZAR");
    assert.equal(row?.mpn, row?.id);
    assert.equal(row?.item_group_id, "DMT-PVC");
    assert.equal(row?.link, pvcLinerVariantUrl(PVC_LINERS.find((l) => l.sku === "DMT-PVC-800-05M-3R")!));
  });
});

import { addBusinessDays, makeByDate, purchaseStage } from "../orders/purchase-stage.ts";

describe("online purchase stages", () => {
  it("derives the fulfilment stage from status, payment and tracking", () => {
    assert.equal(purchaseStage({ status: "awaiting_payment", payment_method: "payfast", payment_status: "pending" }), "awaiting_payment");
    assert.equal(purchaseStage({ status: "paid", payment_method: "payfast", payment_status: "paid" }), "to_make");
    assert.equal(purchaseStage({ status: "pending_invoice", payment_method: "invoice" }), "awaiting_payment");
    assert.equal(purchaseStage({ status: "ready_for_delivery" }), "ready");
    assert.equal(purchaseStage({ status: "processing", dispatched_on: "2026-11-12" }), "dispatched");
    assert.equal(purchaseStage({ status: "processing", dispatched_on: "2026-11-12", delivered_on: "2026-11-14" }), "delivered");
    assert.equal(purchaseStage({ status: "cancelled", dispatched_on: "2026-11-12" }), "cancelled");
  });

  it("counts five business days for made-to-order liners only", () => {
    // Tuesday 10 Nov 2026 + 5 business days = Tuesday 17 Nov 2026.
    assert.equal(addBusinessDays(new Date("2026-11-10T10:00:00Z"), 5).toISOString().slice(0, 10), "2026-11-17");
    assert.equal(makeByDate({ sku: "DMT-PVC-550-05M-3R", paid_at: "2026-11-13T10:00:00Z" })?.toISOString().slice(0, 10), "2026-11-20");
    assert.equal(makeByDate({ sku: "DMT-WT-10000", paid_at: "2026-11-13T10:00:00Z" }), null);
    assert.equal(makeByDate({ sku: "DMT-PVC-550-05M-3R", paid_at: null }), null);
  });
});

import { fulfilmentLabel, isCollectionMethod, parseCollectionPoint } from "./delivery.ts";

describe("collection instead of delivery", () => {
  it("accepts only the two collection points", () => {
    assert.equal(parseCollectionPoint("pretoria"), "pretoria");
    assert.equal(parseCollectionPoint("Bettys-Bay"), "bettys-bay");
    assert.equal(parseCollectionPoint("cape-town"), null);
    assert.equal(parseCollectionPoint(""), null);
  });

  it("labels the fulfilment method", () => {
    assert.equal(fulfilmentLabel("collection_bettys_bay", "Western Cape"), "Collection in Betty's Bay");
    assert.equal(fulfilmentLabel("delivery_south_africa", "Gauteng"), "Delivery to Gauteng");
    assert.equal(isCollectionMethod("collection_pretoria"), true);
    assert.equal(isCollectionMethod("delivery_south_africa"), false);
  });
});
