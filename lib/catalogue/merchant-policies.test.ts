import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { CATALOGUE_FULFILMENT_LEAD_TIME } from "./availability.ts";
import {
  createMerchantReturnPolicySchema,
  createOfferMerchantReturnPolicy,
  createOfferShippingDetails,
  createShippingServiceSchema,
  merchantFeedHandlingTransitFields,
  merchantReturnPolicyId,
  merchantReturnPolicyUrl,
  merchantShippingServiceId,
  MERCHANT_RETURN_POLICY_COPY,
  MERCHANT_SHIPPING_POLICY_COPY,
} from "./merchant-policies.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("Merchant return policy schema", () => {
  it("permits only damaged or incorrect goods", () => {
    const policy = createMerchantReturnPolicySchema();
    const offerPolicy = createOfferMerchantReturnPolicy();
    assert.equal(policy["@type"], "MerchantReturnPolicy");
    assert.equal(
      policy.returnPolicyCategory,
      "https://schema.org/MerchantReturnNotPermitted",
    );
    assert.equal(
      offerPolicy.returnPolicyCategory,
      "https://schema.org/MerchantReturnNotPermitted",
    );
    assert.equal(policy.itemCondition, "https://schema.org/DamagedCondition");
    assert.equal(
      policy.itemDefectReturnFees,
      "https://schema.org/FreeReturn",
    );
    assert.equal(policy.applicableCountry, "ZA");
    assert.equal(policy["@id"], merchantReturnPolicyId());
    assert.equal(policy.merchantReturnLink, merchantReturnPolicyUrl());
    assert.match(merchantReturnPolicyId(), /\/returns\/#merchant-return-policy$/);
    assert.match(MERCHANT_RETURN_POLICY_COPY.summary, /damaged or is the wrong product/i);
    assert.match(MERCHANT_RETURN_POLICY_COPY.notReturnable, /not returnable/i);
  });
});

describe("Merchant shipping policy schema", () => {
  it("describes weight-based South African delivery without inventing a rand rate", () => {
    const service = createShippingServiceSchema();
    const offerShipping = createOfferShippingDetails();
    const conditions = service.shippingConditions as Record<string, unknown>;
    const weight = conditions.weight as Record<string, unknown>;
    const json = JSON.stringify({ service, offerShipping });

    assert.equal(service["@type"], "ShippingService");
    assert.equal(service["@id"], merchantShippingServiceId());
    assert.equal(
      service.fulfillmentType,
      "https://schema.org/FulfillmentTypeDelivery",
    );
    assert.equal(weight.unitCode, "KGM");
    assert.equal(
      (conditions.shippingDestination as Record<string, unknown>).addressCountry,
      "ZA",
    );
    assert.equal(offerShipping["@type"], "OfferShippingDetails");
    assert.equal(
      (offerShipping.hasShippingService as Record<string, unknown>)["@id"],
      merchantShippingServiceId(),
    );
    assert.doesNotMatch(json, /"shippingRate"/);
    assert.doesNotMatch(json, /"value":\s*0/);
    assert.match(MERCHANT_SHIPPING_POLICY_COPY.description, /kilograms/i);
    assert.match(MERCHANT_SHIPPING_POLICY_COPY.deliveryCharge, /kilograms/i);
  });

  it("uses confirmed handling and transit windows", () => {
    const fields = merchantFeedHandlingTransitFields();
    const offerShipping = createOfferShippingDetails();
    const deliveryTime = offerShipping.deliveryTime as Record<string, unknown>;
    const handling = deliveryTime.handlingTime as Record<string, unknown>;
    const transit = deliveryTime.transitTime as Record<string, unknown>;

    assert.equal(
      fields.min_handling_time,
      String(CATALOGUE_FULFILMENT_LEAD_TIME.manufacturingMinBusinessDays),
    );
    assert.equal(
      fields.max_handling_time,
      String(CATALOGUE_FULFILMENT_LEAD_TIME.manufacturingMaxBusinessDays),
    );
    assert.equal(
      fields.min_transit_time,
      String(CATALOGUE_FULFILMENT_LEAD_TIME.deliveryMinBusinessDays),
    );
    assert.equal(
      fields.max_transit_time,
      String(CATALOGUE_FULFILMENT_LEAD_TIME.deliveryMaxBusinessDays),
    );
    assert.equal(fields.ships_from_country, "ZA");
    assert.equal(handling.minValue, 5);
    assert.equal(handling.maxValue, 10);
    assert.equal(transit.minValue, 3);
    assert.equal(transit.maxValue, 5);
  });
});

describe("JSON-LD wiring", () => {
  it("attaches return and shipping fields to Organization and Product offers", () => {
    const seo = readFileSync(join(root, "lib/seo.ts"), "utf8");
    assert.match(seo, /hasMerchantReturnPolicy: createMerchantReturnPolicySchema\(\)/);
    assert.match(seo, /hasShippingService: createShippingServiceSchema\(\)/);
    assert.match(seo, /hasMerchantReturnPolicy: createOfferMerchantReturnPolicy\(\)/);
    assert.match(seo, /shippingDetails: createOfferShippingDetails\(\)/);
    const returnsPage = readFileSync(join(root, "app/returns/page.tsx"), "utf8");
    assert.match(returnsPage, /MERCHANT_RETURN_POLICY_COPY/);
    assert.doesNotMatch(returnsPage, /case by case/i);
  });
});
