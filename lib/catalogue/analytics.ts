import type { CatalogueLineSnapshot, CatalogueProduct } from "./types.ts";

export const CATALOGUE_ANALYTICS_EVENTS = {
  viewItem: "view_item",
  selectItem: "select_item",
  addToRfq: "add_to_rfq",
  beginInvoiceRequest: "begin_invoice_request",
  generateLead: "generate_lead",
  rfqSubmitted: "simple_quote_submitted",
  beginCheckout: "begin_checkout",
  orderFormView: "order_form_view",
  orderSubmitted: "order_submitted",
  orderError: "order_error",
} as const;

/** Must not fire until actual payment is recorded. */
export const CATALOGUE_PAYMENT_ANALYTICS_EVENTS = {
  purchase: "purchase",
  paymentComplete: "payment_complete",
} as const;

export type CatalogueAnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category: string;
  price: number;
  quantity: number;
  currency: "ZAR";
  vat_included: true;
};

export function buildCatalogueAnalyticsItem(
  product: Pick<CatalogueProduct, "sku" | "name" | "categoryLabel" | "priceInclVatZar">,
  quantity = 1,
): CatalogueAnalyticsItem {
  return {
    item_id: product.sku,
    item_name: product.name,
    item_category: product.categoryLabel,
    price: product.priceInclVatZar,
    quantity,
    currency: "ZAR",
    vat_included: true,
  };
}

export function buildCatalogueAnalyticsFromLine(
  line: CatalogueLineSnapshot,
): CatalogueAnalyticsItem {
  return {
    item_id: line.sku,
    item_name: line.productName,
    item_category: line.categoryLabel,
    price: line.unitPriceInclVatZar,
    quantity: line.quantity,
    currency: "ZAR",
    vat_included: true,
  };
}

export function buildCatalogueAnalyticsPayload(
  event: string,
  item: CatalogueAnalyticsItem,
): Record<string, unknown> {
  return {
    event,
    currency: "ZAR",
    value: item.price * item.quantity,
    vat_included: true,
    item_id: item.item_id,
    item_name: item.item_name,
    item_category: item.item_category,
    quantity: item.quantity,
    items: [item],
  };
}
