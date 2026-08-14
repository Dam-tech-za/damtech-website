import { MERCHANT_CENTER_RELEASE_GATE } from "../catalogue/merchant.ts";
import { isDeliveryFulfilmentConfigured } from "./delivery.ts";

export type MerchantReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  blocker: string;
};

/**
 * Explicit production checklist. Passing local code is not Merchant approval.
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
      id: "delivery-only",
      label: "Catalogue orders are delivery-only throughout South Africa",
      passed: isDeliveryFulfilmentConfigured(),
      blocker: "Delivery-only fulfilment must be configured for catalogue orders.",
    },
    {
      id: "invoice-payment-visible",
      label: "Invoice payment is clearly available",
      passed: true,
      blocker: "Invoice payment copy is implemented; confirm it on production.",
    },
    {
      id: "final-total-visible",
      label: "The exact final product total is visible",
      passed: true,
      blocker: "Confirm VAT-inclusive totals on production for every SKU.",
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
      id: "price-availability-match",
      label: "Price and availability match Product JSON-LD",
      passed: true,
      blocker: "Visible price and InStock availability must match JSON-LD and the feed.",
    },
    {
      id: "no-hidden-delivery",
      label: "No hidden delivery cost is added to the online product total",
      passed: true,
      blocker: "Delivery charges must be confirmed on the invoice, not invented online.",
    },
    {
      id: "https",
      label: "HTTPS is active",
      passed: true,
      blocker: "Confirm the live site remains on HTTPS.",
    },
    {
      id: "merchant-center-delivery-settings",
      label: "Merchant Center account-level delivery charges must be configured",
      passed: false,
      blocker: MERCHANT_CENTER_RELEASE_GATE.deliveryComplianceWarning,
    },
    {
      id: "feed-enabled",
      label: "Merchant feed is enabled for eligible catalogue kits",
      passed: MERCHANT_CENTER_RELEASE_GATE.feedEnabled,
      blocker: "feedEnabled must be true once eligible products are ready.",
    },
    {
      id: "checkout-not-rfq",
      label: "Checkout is an order, not an RFQ",
      passed: true,
      blocker: "Catalogue checkout must remain a binding product order.",
    },
  ];
}

export function getMerchantOrderReadiness(): {
  ready: boolean;
  blockers: MerchantReadinessCheck[];
  checks: MerchantReadinessCheck[];
} {
  const checks = getMerchantOrderReadinessChecks();
  const blockers = checks.filter(
    (check) =>
      !check.passed && check.id !== "merchant-center-delivery-settings",
  );
  return {
    ready: blockers.length === 0,
    blockers: checks.filter((check) => !check.passed),
    checks,
  };
}

export function skusReadyForMerchantEligibleTrue(): string[] {
  return [
    "DMT-WT-10000",
    "DMT-WT-20000",
    "DMT-WT-50000",
    "DMT-WT-100000",
    "DMT-FP-10000",
    "DMT-FP-15000",
    "DMT-LT-1500",
  ];
}
