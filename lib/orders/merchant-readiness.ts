import { MERCHANT_CENTER_RELEASE_GATE } from "../catalogue/merchant.ts";
import { isUnresolvedFact } from "../catalogue/types.ts";
import { UNRESOLVED_BUSINESS_FACTS } from "../catalogue/unresolved.ts";
import { isCollectionLocationConfigured } from "./collection.ts";

export type MerchantReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  blocker: string;
};

/**
 * Explicit production checklist. Passing local code is not Merchant approval.
 * Do not flip merchantEligible or feedEnabled from this helper.
 */
export function getMerchantOrderReadinessChecks(): MerchantReadinessCheck[] {
  return [
    {
      id: "order-page-no-login",
      label: "The order page works without login",
      passed: true,
      blocker: "Verify on production that /order/ loads without an account.",
    },
    {
      id: "individual-consumer",
      label: "An individual consumer can place an order",
      passed: false,
      blocker: "A complete live production order has not been confirmed.",
    },
    {
      id: "invoice-payment-visible",
      label: "Invoice payment is clearly available",
      passed: true,
      blocker: "Invoice payment copy is implemented; confirm it on production.",
    },
    {
      id: "collection-location",
      label: "A real collection location is disclosed before the order is placed",
      passed: isCollectionLocationConfigured(),
      blocker:
        UNRESOLVED_BUSINESS_FACTS.collectionLocation.reason,
    },
    {
      id: "final-total-visible",
      label: "The exact final product total is visible",
      passed: true,
      blocker: "Confirm VAT-inclusive totals on production for every SKU.",
    },
    {
      id: "order-completes",
      label: "The customer can complete the order",
      passed: false,
      blocker: "Production placement of a live test order is still required.",
    },
    {
      id: "resend-emails",
      label: "Both emails work through production Resend",
      passed: false,
      blocker: "Customer and internal order emails must be verified in production.",
    },
    {
      id: "returns-policy",
      label: "Returns/cancellation policy is visible",
      passed: true,
      blocker: "Confirm /returns/ is linked from checkout and the footer in production.",
    },
    {
      id: "privacy-policy",
      label: "Privacy policy is visible",
      passed: true,
      blocker: "Confirm /privacy/ is linked from checkout and the footer in production.",
    },
    {
      id: "contact-details",
      label: "Business contact details are visible",
      passed: true,
      blocker: "Confirm /contact/ remains reachable from checkout.",
    },
    {
      id: "primary-image",
      label: "The primary product image is configured",
      passed: false,
      blocker:
        "Current images are shared interim representations, not unique Merchant pack shots.",
    },
    {
      id: "price-availability-match",
      label: "Price and availability match Product JSON-LD",
      passed: true,
      blocker:
        "Visible price matches JSON-LD. Availability stays truthful and is not InStock.",
    },
    {
      id: "no-hidden-transport",
      label: "No hidden transport cost is added to the collection order",
      passed: true,
      blocker: "Collection checkout totals are kit-only. Confirm on production.",
    },
    {
      id: "https",
      label: "HTTPS is active",
      passed: true,
      blocker: "Confirm the live site remains on HTTPS.",
    },
    {
      id: "live-test-order",
      label: "A complete live test order succeeds",
      passed: false,
      blocker: "Do not report Google Shopping ready until a live order and invoice email succeed.",
    },
    {
      id: "feed-gate",
      label: "Merchant feed remains closed until every check passes",
      passed: !MERCHANT_CENTER_RELEASE_GATE.feedEnabled,
      blocker: "feedEnabled must stay false until production verification is complete.",
    },
    {
      id: "checkout-not-rfq",
      label: "Checkout is an order, not an RFQ",
      passed: !isUnresolvedFact(UNRESOLVED_BUSINESS_FACTS.merchantCheckout)
        ? true
        : false,
      blocker: UNRESOLVED_BUSINESS_FACTS.merchantCheckout.reason,
    },
  ];
}

export function getMerchantOrderReadiness(): {
  ready: boolean;
  blockers: MerchantReadinessCheck[];
  checks: MerchantReadinessCheck[];
} {
  const checks = getMerchantOrderReadinessChecks();
  const blockers = checks.filter((check) => !check.passed);
  return {
    ready: blockers.length === 0,
    blockers,
    checks,
  };
}

export function skusReadyForMerchantEligibleTrue(): string[] {
  if (!getMerchantOrderReadiness().ready) return [];
  return [];
}
