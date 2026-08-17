import { CANONICAL_ORIGIN } from "../site-url.ts";
import { CATALOGUE_FULFILMENT_LEAD_TIME } from "./availability.ts";

/**
 * Catalogue Merchant listing policies.
 *
 * Returns: damaged or incorrect goods only. Change-of-mind and correctly
 * supplied made-to-order kits are not returnable.
 *
 * Shipping: delivery-only throughout South Africa. The rand amount depends on
 * kit shipping weight in kilograms and is confirmed on the invoice. Do not
 * publish a guessed R/kg rate or a R0 “free delivery” shippingRate.
 */

export const MERCHANT_RETURN_POLICY_PATH = "/returns" as const;
export const MERCHANT_RETURN_POLICY_ID = "#merchant-return-policy" as const;
export const MERCHANT_SHIPPING_SERVICE_ID = "#shipping-service" as const;

export const MERCHANT_POLICY_COUNTRY = "ZA" as const;
export const MERCHANT_POLICY_CURRENCY = "ZAR" as const;

const BUSINESS_DAYS = [
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
  "https://schema.org/Saturday",
  "https://schema.org/Sunday",
] as const;

function origin(): string {
  return CANONICAL_ORIGIN.replace(/\/$/, "");
}

function pageUrl(path: string): string {
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  const withSlash = withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
  return `${origin()}${withSlash}`;
}

export function merchantReturnPolicyId(): string {
  return `${pageUrl(MERCHANT_RETURN_POLICY_PATH)}${MERCHANT_RETURN_POLICY_ID}`;
}

export function merchantShippingServiceId(): string {
  return `${origin()}/${MERCHANT_SHIPPING_SERVICE_ID}`;
}

export const MERCHANT_RETURN_POLICY_COPY = {
  summary:
    "Returns are accepted only when a catalogue kit arrives damaged or is the wrong product. Nothing else is returnable.",
  unpaidCancellation:
    "Contact Damtech with your order reference if you need to cancel or change quantity before the invoice is paid. We will confirm in writing. No payment should be made until you receive the official invoice.",
  notReturnable:
    "Made-to-order kits that were supplied correctly are not returnable. Change of mind, unused kits, custom fabrication, liners cut to size and installed work cannot be returned.",
  damagedOrWrong:
    "If the delivered kit is damaged or does not match the ordered SKU, report it as soon as the goods are received, with photographs and your order reference. Damtech will replace the incorrect or damaged goods or issue a credit. There is no return fee for Damtech’s error or transit damage.",
  contactIntro: "Contact:",
} as const;

export const MERCHANT_SHIPPING_POLICY_COPY = {
  name: "South Africa delivery — weight-based rates",
  description:
    "DamTech delivers catalogue kits throughout South Africa. Delivery is calculated from the kit shipping weight in kilograms because kit sizes differ substantially. The listed product price excludes delivery and installation. DamTech confirms the delivery charge on the formal invoice after the delivery address is confirmed.",
  deliveryCharge:
    "Delivery is calculated from the kit shipping weight in kilograms. DamTech confirms the delivery charge on the formal invoice.",
} as const;

export function merchantReturnPolicyUrl(): string {
  return pageUrl(MERCHANT_RETURN_POLICY_PATH);
}

/** Organization-level return policy. Change-of-mind is not permitted. */
export function createMerchantReturnPolicySchema(): Record<string, unknown> {
  return {
    "@type": "MerchantReturnPolicy",
    "@id": merchantReturnPolicyId(),
    name: "Damaged or incorrect goods only",
    applicableCountry: MERCHANT_POLICY_COUNTRY,
    returnPolicyCountry: MERCHANT_POLICY_COUNTRY,
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    itemCondition: "https://schema.org/DamagedCondition",
    itemDefectReturnFees: "https://schema.org/FreeReturn",
    refundType: [
      "https://schema.org/ExchangeRefund",
      "https://schema.org/FullRefund",
    ],
    merchantReturnLink: merchantReturnPolicyUrl(),
    description: MERCHANT_RETURN_POLICY_COPY.summary,
  };
}

/**
 * Offer-level subset required by Google Merchant listings.
 * Nested in full so Search Console sees the field on Product.offers.
 */
export function createOfferMerchantReturnPolicy(): Record<string, unknown> {
  return {
    "@type": "MerchantReturnPolicy",
    "@id": merchantReturnPolicyId(),
    applicableCountry: MERCHANT_POLICY_COUNTRY,
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    itemCondition: "https://schema.org/DamagedCondition",
    itemDefectReturnFees: "https://schema.org/FreeReturn",
    merchantReturnLink: merchantReturnPolicyUrl(),
  };
}

export function createShippingServiceSchema(): Record<string, unknown> {
  const lead = CATALOGUE_FULFILMENT_LEAD_TIME;
  return {
    "@type": "ShippingService",
    "@id": merchantShippingServiceId(),
    name: MERCHANT_SHIPPING_POLICY_COPY.name,
    description: MERCHANT_SHIPPING_POLICY_COPY.description,
    fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
    handlingTime: {
      "@type": "ServicePeriod",
      businessDays: [...BUSINESS_DAYS],
      duration: {
        "@type": "QuantitativeValue",
        minValue: lead.manufacturingMinBusinessDays,
        maxValue: lead.manufacturingMaxBusinessDays,
        unitCode: "DAY",
      },
    },
    shippingConditions: {
      "@type": "ShippingConditions",
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: MERCHANT_POLICY_COUNTRY,
      },
      shippingOrigin: {
        "@type": "DefinedRegion",
        addressCountry: MERCHANT_POLICY_COUNTRY,
      },
      weight: {
        "@type": "QuantitativeValue",
        minValue: 0,
        unitCode: "KGM",
      },
      transitTime: {
        "@type": "ServicePeriod",
        businessDays: [...BUSINESS_DAYS],
        duration: {
          "@type": "QuantitativeValue",
          minValue: lead.deliveryMinBusinessDays,
          maxValue: lead.deliveryMaxBusinessDays,
          unitCode: "DAY",
        },
      },
    },
  };
}

/**
 * Offer.shippingDetails references the Organization shipping service.
 * Google’s documented pattern when rates are not a single published amount:
 * shippingDetails.hasShippingService.@id only, plus known destination and times.
 * No shippingRate is published because the rand amount depends on kg.
 */
export function createOfferShippingDetails(): Record<string, unknown> {
  const lead = CATALOGUE_FULFILMENT_LEAD_TIME;
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: MERCHANT_POLICY_COUNTRY,
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: lead.manufacturingMinBusinessDays,
        maxValue: lead.manufacturingMaxBusinessDays,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: lead.deliveryMinBusinessDays,
        maxValue: lead.deliveryMaxBusinessDays,
        unitCode: "DAY",
      },
    },
    hasShippingService: {
      "@id": merchantShippingServiceId(),
    },
  };
}

export function merchantFeedHandlingTransitFields(): {
  min_handling_time: string;
  max_handling_time: string;
  min_transit_time: string;
  max_transit_time: string;
  ships_from_country: string;
} {
  const lead = CATALOGUE_FULFILMENT_LEAD_TIME;
  return {
    min_handling_time: String(lead.manufacturingMinBusinessDays),
    max_handling_time: String(lead.manufacturingMaxBusinessDays),
    min_transit_time: String(lead.deliveryMinBusinessDays),
    max_transit_time: String(lead.deliveryMaxBusinessDays),
    ships_from_country: MERCHANT_POLICY_COUNTRY,
  };
}
