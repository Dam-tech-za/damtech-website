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
      "The shallow-basin image shows a galvanised safety crossbar. Damtech has not confirmed that the bar is included in the fixed-price fish-pond or trough kits. Treat it as an illustrative optional safety feature in captions. Do not list it as a kit inclusion.",
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
    reason:
      "Legacy unresolved marker. Catalogue fulfilment lead times are now confirmed in lib/catalogue/availability.ts.",
  },
  merchantAvailability: {
    status: "unresolved",
    field: "merchantAvailability",
    reason:
      "Legacy unresolved marker. Catalogue Merchant availability is now confirmed as in_stock in lib/catalogue/availability.ts.",
  },
  stockStatus: {
    status: "unresolved",
    field: "stockStatus",
    reason:
      "Legacy unresolved marker. Kits are made to order and available to order; Schema.org InStock is published from the confirmed Merchant availability config.",
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
      "Legacy unresolved marker. The catalogue invoice-payment order flow is live for delivery throughout South Africa.",
  },
  collectionLocation: {
    status: "unresolved",
    field: "collectionLocation",
    reason:
      "DamTech does not offer customer collection and has no public collection point. Catalogue orders are delivery-only.",
  },
} as const satisfies Record<string, UnresolvedBusinessFact>;
