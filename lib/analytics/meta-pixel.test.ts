import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  isMetaPurchaseBlocked,
  metaEventForDataLayer,
  metaParamsFromCatalogueItem,
} from "./meta-pixel.ts";

describe("Meta Pixel event mapping", () => {
  it("maps lead, product view, checkout and contact events", () => {
    assert.deepEqual(metaEventForDataLayer("generate_lead"), {
      name: "Lead",
      useItemParams: false,
    });
    assert.deepEqual(metaEventForDataLayer("view_item"), {
      name: "ViewContent",
      useItemParams: true,
    });
    assert.deepEqual(metaEventForDataLayer("order_form_view"), {
      name: "InitiateCheckout",
      useItemParams: true,
    });
    assert.deepEqual(metaEventForDataLayer("begin_checkout"), {
      name: "InitiateCheckout",
      useItemParams: true,
    });
    assert.deepEqual(metaEventForDataLayer("phone_click"), {
      name: "Contact",
      useItemParams: false,
    });
  });

  it("does not treat invoice-later orders as Purchase", () => {
    assert.equal(metaEventForDataLayer("order_submitted"), null);
    assert.equal(metaEventForDataLayer("purchase"), null);
    assert.equal(isMetaPurchaseBlocked("order_submitted"), true);
    assert.equal(isMetaPurchaseBlocked("purchase"), true);
    assert.equal(isMetaPurchaseBlocked("payment_complete"), true);
  });

  it("sends SKU and ZAR value without PII fields", () => {
    const params = metaParamsFromCatalogueItem({
      item_id: "DMT-WT-10000",
      item_name: "10 000L steel water tank kit",
      item_category: "Steel water tanks",
      price: 13999,
      quantity: 1,
      currency: "ZAR",
      vat_included: true,
    });
    assert.deepEqual(params.content_ids, ["DMT-WT-10000"]);
    assert.equal(params.currency, "ZAR");
    assert.equal(params.value, 13999);
    assert.equal("email" in params, false);
    assert.equal("phone" in params, false);
    assert.equal("em" in params, false);
    assert.equal("ph" in params, false);
  });
});

describe("Meta Pixel base snippet", () => {
  it("disables Smart Setup and autoConfig before init", () => {
    const snippet = readFileSync(
      join(process.cwd(), "components/Analytics.tsx"),
      "utf8",
    );
    assert.match(snippet, /n\.disableSmartSetup\s*=\s*true/);
    assert.match(
      snippet,
      /fbq\('set',\s*'autoConfig',\s*false,\s*'\$\{META_PIXEL_ID\}'\)/,
    );
    const setAt = snippet.indexOf("fbq('set', 'autoConfig'");
    const initAt = snippet.indexOf("fbq('init'");
    assert.ok(setAt > 0 && initAt > setAt);
  });
});
