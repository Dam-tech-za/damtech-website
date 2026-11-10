import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deliveryQuoteForProvince, DELIVERY_PROVINCES } from "./delivery.ts";
import { getPvcLinerBySku, isPvcLinerSku, PVC_LINERS, pvcLinerSku } from "./pvc-liners.ts";
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
