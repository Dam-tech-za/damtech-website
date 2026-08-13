export const ORDER_STATUSES = [
  "pending_invoice",
  "invoice_sent",
  "awaiting_payment",
  "paid",
  "processing",
  "ready_for_collection",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_EMAIL_STATUSES = [
  "pending",
  "sent",
  "failed",
  "skipped",
  "pending_configuration",
] as const;

export type OrderEmailStatus = (typeof ORDER_EMAIL_STATUSES)[number];

export const ORDER_CUSTOMER_TYPES = ["individual", "business"] as const;

export type OrderCustomerType = (typeof ORDER_CUSTOMER_TYPES)[number];

export const ORDER_FULFILMENT_METHOD = "collection_customer_arranged" as const;

export type OrderFulfilmentMethod = typeof ORDER_FULFILMENT_METHOD;

export const ORDER_CURRENCY = "ZAR" as const;
export const ORDER_VAT_RATE_PERCENT = 15;

export const MIN_ORDER_QUANTITY = 1;
export const MAX_ORDER_QUANTITY = 99;

export const ORDER_FIELD_LIMITS = {
  customerName: 200,
  businessName: 200,
  email: 320,
  phone: 40,
  vatNumber: 20,
  customerPoNumber: 80,
  billingLine1: 200,
  billingLine2: 200,
  suburb: 120,
  city: 120,
  province: 80,
  postalCode: 12,
  notes: 2000,
  sku: 40,
} as const;

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isOrderCustomerType(value: string): value is OrderCustomerType {
  return (ORDER_CUSTOMER_TYPES as readonly string[]).includes(value);
}
