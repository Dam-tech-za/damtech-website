/**
 * Fulfilment stage of an online shop order, derived from the order's status,
 * payment and tracking fields. Pure, so the admin list and tests share it.
 */
export const PURCHASE_STAGES = [
  "awaiting_payment",
  "to_make",
  "ready",
  "dispatched",
  "delivered",
  "cancelled",
] as const;

export type PurchaseStage = (typeof PURCHASE_STAGES)[number];

export const PURCHASE_STAGE_LABELS: Record<PurchaseStage, string> = {
  awaiting_payment: "Awaiting payment",
  to_make: "To make / pack",
  ready: "Ready to ship",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type PurchaseStageInput = {
  status: string;
  payment_method?: string | null;
  payment_status?: string | null;
  dispatched_on?: string | null;
  delivered_on?: string | null;
};

export function purchaseStage(order: PurchaseStageInput): PurchaseStage {
  if (order.status === "cancelled") return "cancelled";
  if (order.delivered_on || order.status === "completed") return "delivered";
  if (order.dispatched_on) return "dispatched";
  if (order.payment_method === "payfast" && order.payment_status !== "paid") return "awaiting_payment";
  if (["pending_invoice", "invoice_sent", "awaiting_payment"].includes(order.status)) return "awaiting_payment";
  if (order.status === "ready_for_delivery") return "ready";
  return "to_make";
}

export function isPurchaseStage(value: string): value is PurchaseStage {
  return (PURCHASE_STAGES as readonly string[]).includes(value);
}

/** Add business days (Mon to Fri) to a date. Public holidays are not counted. */
export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from.getTime());
  let left = days;
  while (left > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return date;
}

/** Latest date a made-to-order liner should be ready: 5 business days after payment. */
export function makeByDate(order: { sku: string; paid_at?: string | null }): Date | null {
  if (!order.sku.startsWith("DMT-PVC-") || !order.paid_at) return null;
  const paid = new Date(order.paid_at);
  return Number.isNaN(paid.getTime()) ? null : addBusinessDays(paid, 5);
}
