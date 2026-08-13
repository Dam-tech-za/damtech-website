import type { UnresolvedBusinessFact } from "./types.ts";

/**
 * Centralised business facts that must stay off public pages until Damtech
 * confirms them. Do not invent values for these fields in UI, schema or feeds.
 */
export const UNRESOLVED_BUSINESS_FACTS = {
  fishPondDimensions: {
    status: "unresolved",
    field: "dimensions",
    reason:
      "Fish-pond diameter, height and ring count are not in the supplied commercial data or the verified tank catalogue.",
  },
  fishPondInclusions: {
    status: "unresolved",
    field: "inclusions",
    reason:
      "Kit accessories, liner specification and fittings for fish ponds are not verified in the Damtech tank catalogue.",
  },
  troughInclusions: {
    status: "unresolved",
    field: "inclusions",
    reason:
      "Livestock trough liner, fittings and accessories are not verified in the Damtech tank catalogue.",
  },
  safetyCrossbarInclusion: {
    status: "unresolved",
    field: "safetyCrossbar",
    reason:
      "The primary shallow-basin image shows a galvanised safety crossbar, but Damtech has not confirmed that the bar is included in the fixed-price fish-pond or trough kits. Do not list it as an inclusion. This image must not be used as a Merchant image_link until the inclusion is verified or a bar-free pack shot is supplied.",
  },
  troughFilledCapacity: {
    status: "unresolved",
    field: "filledCapacity",
    reason:
      "Only gross theoretical capacity before freeboard is supplied (approximately 670 L). Do not publish a firm filled capacity.",
  },
  linerCertification: {
    status: "unresolved",
    field: "linerCertification",
    reason:
      "No potable-water or aquaculture liner certification is confirmed for these SKUs.",
  },
  leadTimeDays: {
    status: "unresolved",
    field: "leadTimeDays",
    reason: "Fabrication and dispatch lead times are not confirmed per SKU.",
  },
  stockStatus: {
    status: "unresolved",
    field: "stockStatus",
    reason:
      "In-stock versus made-to-order status is not confirmed. Do not mark Schema.org InStock, PreOrder or BackOrder.",
  },
  productWeight: {
    status: "unresolved",
    field: "productWeight",
    reason: "Shipping weights are not supplied.",
  },
  productSpecificImages: {
    status: "unresolved",
    field: "productImage",
    reason:
      "No genuine product-specific photograph is published for this SKU yet.",
  },
  gtin: {
    status: "unresolved",
    field: "gtin",
    reason:
      "Damtech manufactures these kits and has not issued a GTIN/barcode. Use SKU + brand, never invent a barcode.",
  },
  availabilityDate: {
    status: "unresolved",
    field: "availabilityDate",
    reason:
      "No factual availability date exists for PreOrder/BackOrder structured data.",
  },
  merchantCheckout: {
    status: "unresolved",
    field: "onlineCheckout",
    reason:
      "An invoice-payment order flow exists for collection/customer-arranged transport, but Merchant eligibility stays closed until a genuine collection location is displayed before checkout and the production order/invoice flow is verified. RFQ is not checkout.",
  },
  collectionLocation: {
    status: "unresolved",
    field: "collectionLocation",
    reason:
      "No confirmed public collection address or depot has been supplied. Operating bases are not walk-in collection points. Do not invent a collection address for checkout or Merchant Center.",
  },
} as const satisfies Record<string, UnresolvedBusinessFact>;
