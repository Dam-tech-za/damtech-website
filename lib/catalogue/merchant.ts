/**
 * Merchant Center release gate.
 *
 * Product JSON-LD and the gated TSV feed share the TypeScript catalogue.
 * Delivery settings and rates live in Merchant Center account configuration;
 * the website feed does not invent a delivery price.
 *
 * See docs/merchant-center-release-gate.md.
 */
export const MERCHANT_CENTER_RELEASE_GATE = {
  feedEnabled: true,
  reason:
    "Delivery-only Merchant catalogue feed is enabled for the seven fixed-price kits.",
  requirements: [
    "Visible price equals JSON-LD price, in ZAR, VAT included.",
    "Use CatalogueProduct.feedTitle as the Merchant title.",
    "No “from”, “starting at”, estimated or ex-VAT consumer prices.",
    "Accurate Merchant images: reservoir image for the four tanks; approved livestock/fish-pond image for ponds and trough.",
    "Availability in_stock with DamTech manufacturing 5–10 and delivery 3–5 business days.",
    "Delivery-only fulfilment with delivery address collected before Place order.",
    "Returns accepted only for damaged or incorrect goods.",
    "Merchant Center account-level delivery charges must be configured as weight-based (kg) rates.",
  ],
  deliveryComplianceWarning:
    "The feed assumes that Merchant Center account-level delivery settings contain weight-based (kg) delivery charges. Handling time is 5–10 business days and transit time is 3–5 business days. If compulsory delivery charges are not configured accurately in Merchant Center, products may be disapproved.",
} as const;
