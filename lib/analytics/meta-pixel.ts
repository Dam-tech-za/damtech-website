/**
 * Meta Pixel helpers. Smart Setup / automatic events stay off in the base
 * snippet (`fbq.disableSmartSetup` + `autoConfig: false`). Conversion events
 * are sent from this module so Events Manager is not left guessing from
 * buttons and JSON-LD.
 *
 * Never pass names, emails, phone numbers or other PII.
 */

import {
  CATALOGUE_ANALYTICS_EVENTS,
  CATALOGUE_PAYMENT_ANALYTICS_EVENTS,
  type CatalogueAnalyticsItem,
} from "../catalogue/analytics.ts";

export const META_STANDARD_EVENTS = {
  pageView: "PageView",
  lead: "Lead",
  viewContent: "ViewContent",
  initiateCheckout: "InitiateCheckout",
  contact: "Contact",
} as const;

export type MetaStandardEvent =
  (typeof META_STANDARD_EVENTS)[keyof typeof META_STANDARD_EVENTS];

type FbqFn = ((...args: unknown[]) => void) & {
  disableSmartSetup?: boolean;
};

type FbqWindow = Window & { fbq?: FbqFn };

function getFbq(): FbqFn | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as FbqWindow).fbq;
}

export function trackMetaEvent(
  event: MetaStandardEvent,
  params: Record<string, unknown> = {},
) {
  const fbq = getFbq();
  if (typeof fbq !== "function") return;
  fbq("track", event, params);
}

export function trackMetaPageView() {
  trackMetaEvent(META_STANDARD_EVENTS.pageView);
}

/** Safe product params for ViewContent / InitiateCheckout. */
export function metaParamsFromCatalogueItem(
  item: CatalogueAnalyticsItem,
): Record<string, unknown> {
  return {
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_type: "product",
    content_category: item.item_category,
    value: item.price * item.quantity,
    currency: item.currency,
    num_items: item.quantity,
  };
}

/**
 * Map GTM/dataLayer event names to Meta standard events.
 * `order_submitted` is not Purchase — payment is later, against the invoice.
 */
export function metaEventForDataLayer(
  event: string,
): { name: MetaStandardEvent; useItemParams: boolean } | null {
  if (event === "generate_lead") {
    return { name: META_STANDARD_EVENTS.lead, useItemParams: false };
  }
  if (event === CATALOGUE_ANALYTICS_EVENTS.viewItem) {
    return { name: META_STANDARD_EVENTS.viewContent, useItemParams: true };
  }
  if (
    event === CATALOGUE_ANALYTICS_EVENTS.beginCheckout ||
    event === CATALOGUE_ANALYTICS_EVENTS.orderFormView
  ) {
    return { name: META_STANDARD_EVENTS.initiateCheckout, useItemParams: true };
  }
  if (
    event === "phone_click" ||
    event === "whatsapp_click" ||
    event === "email_click"
  ) {
    return { name: META_STANDARD_EVENTS.contact, useItemParams: false };
  }
  return null;
}

export function isMetaPurchaseBlocked(event: string): boolean {
  return (
    event === CATALOGUE_ANALYTICS_EVENTS.orderSubmitted ||
    event === CATALOGUE_PAYMENT_ANALYTICS_EVENTS.purchase ||
    event === CATALOGUE_PAYMENT_ANALYTICS_EVENTS.paymentComplete
  );
}
