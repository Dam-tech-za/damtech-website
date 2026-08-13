import { CATALOGUE_PRODUCTS } from "./products.ts";
import { isUnresolvedFact, type CatalogueProduct } from "./types.ts";
import { UNRESOLVED_BUSINESS_FACTS } from "./unresolved.ts";

/**
 * Merchant Center release gate.
 *
 * Product JSON-LD may include images while this gate stays closed.
 * merchantEligible is independent of Product.image.
 *
 * An invoice-payment order flow exists at /order/?sku=&qty= for
 * collection/customer-arranged transport. That does not by itself open
 * Merchant Center. A genuine collection location must be displayed before
 * checkout, unique pack shots are still required, and a live production
 * order must succeed. RFQ remains a quote path, not checkout.
 *
 * See docs/merchant-center-release-gate.md and
 * lib/orders/merchant-readiness.ts.
 */
export const MERCHANT_CENTER_RELEASE_GATE = {
  feedEnabled: false,
  reason: UNRESOLVED_BUSINESS_FACTS.merchantCheckout.reason,
  requirements: [
    "Visible price equals JSON-LD price, in ZAR, VAT included.",
    "Use CatalogueProduct.feedTitle as the Merchant title when a feed is enabled.",
    "No “from”, “starting at”, estimated or ex-VAT consumer prices.",
    "Genuine product-specific images on every submitted offer.",
    "Factual Schema.org availability (never InStock without confirmation).",
    "Google-accepted checkout or verified Merchant Center eligibility.",
  ],
} as const;

export function isProductMerchantEligible(product: CatalogueProduct): boolean {
  if (!MERCHANT_CENTER_RELEASE_GATE.feedEnabled) return false;
  if (!product.images.merchantEligible) return false;
  if (isUnresolvedFact(product.images.main)) return false;
  if (product.images.main.representative) return false;
  if (!product.images.main.schemaEligible) return false;
  if (product.images.main.origin !== "photography") return false;
  if (isUnresolvedFact(UNRESOLVED_BUSINESS_FACTS.stockStatus)) return false;
  if (isUnresolvedFact(UNRESOLVED_BUSINESS_FACTS.availabilityDate)) return false;
  if (isUnresolvedFact(UNRESOLVED_BUSINESS_FACTS.merchantCheckout)) return false;
  return true;
}

/** Always empty until the release gate is opened and each SKU is eligible. */
export function getMerchantFeedProducts(): CatalogueProduct[] {
  if (!MERCHANT_CENTER_RELEASE_GATE.feedEnabled) return [];
  return CATALOGUE_PRODUCTS.filter(isProductMerchantEligible);
}
