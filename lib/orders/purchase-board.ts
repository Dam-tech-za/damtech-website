import { orderStatusLabel } from "../admin/labels.ts";
import { fulfilmentLabel, isCollectionMethod } from "../shop/delivery.ts";
import { PURCHASE_STAGE_LABELS, PURCHASE_STAGES, purchaseStage, type PurchaseStage } from "./purchase-stage.ts";

/**
 * Online Purchases board: stage groups, pill labels, search, sort and CSV.
 * Pure, so the board and its tests share it.
 */

/** Colour of a group heading or status pill (see .ops-tone-* in admin-layout.css). */
export type BoardTone = "amber" | "blue" | "purple" | "teal" | "green" | "grey" | "red";

export const PURCHASE_STAGE_TONES: Record<PurchaseStage, BoardTone> = {
  awaiting_payment: "amber",
  to_make: "blue",
  ready: "purple",
  dispatched: "teal",
  delivered: "green",
  cancelled: "grey",
};

/** The fields the board reads from an order. */
export type PurchaseBoardRow = {
  id: string;
  order_reference: string;
  status: string;
  sku: string;
  product_name_snapshot: string;
  quantity: number;
  total_price_snapshot: number | string;
  customer_name: string;
  business_name?: string | null;
  email: string;
  phone: string;
  billing_city: string;
  billing_province: string;
  fulfilment_method: string;
  created_at: string;
  payment_method?: string | null;
  payment_status?: string | null;
  delivery_fee_snapshot?: number | string | null;
  amount_due_snapshot?: number | string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  dispatched_on?: string | null;
  delivered_on?: string | null;
};

/** Courier settings the quick-view panel needs, worked out on the server. */
export type PurchaseCourierSetup = { ok: true; depots: { id: string; label: string }[] } | { ok: false; message: string };

/** Per-order values the server works out for the quick-view panel. */
export type PurchaseRowExtras = {
  defaultParcel: { lengthCm: number; widthCm: number; heightCm: number; weightKg: number } | null;
  defaultDepot: string;
  depotLabel: string;
  courierSummary: string | null;
};

export function purchaseAmountDue(row: Pick<PurchaseBoardRow, "amount_due_snapshot" | "total_price_snapshot" | "delivery_fee_snapshot">): number {
  return row.amount_due_snapshot == null
    ? Number(row.total_price_snapshot) + Number(row.delivery_fee_snapshot ?? 0)
    : Number(row.amount_due_snapshot);
}

export type PaymentFilter = "paid" | "pending" | "failed" | "invoice";

export const PAYMENT_FILTER_LABELS: Record<PaymentFilter, string> = {
  paid: "Paid on PayFast",
  pending: "PayFast pending",
  failed: "Failed or cancelled",
  invoice: "Invoice",
};

export function purchasePaymentKind(row: Pick<PurchaseBoardRow, "payment_method" | "payment_status">): PaymentFilter {
  if (row.payment_method !== "payfast") return "invoice";
  if (row.payment_status === "paid") return "paid";
  if (row.payment_status === "failed" || row.payment_status === "cancelled") return "failed";
  return "pending";
}

export function purchasePaymentPill(row: Pick<PurchaseBoardRow, "payment_method" | "payment_status" | "status">): { label: string; tone: BoardTone } {
  switch (purchasePaymentKind(row)) {
    case "paid":
      return { label: "Paid on PayFast", tone: "green" };
    case "failed":
      return { label: row.payment_status === "failed" ? "Payment failed" : "Payment cancelled", tone: "red" };
    case "pending":
      return { label: "PayFast pending", tone: "amber" };
    default:
      return { label: `Invoice · ${orderStatusLabel(row.status)}`, tone: "blue" };
  }
}

export function purchaseFulfilment(row: Pick<PurchaseBoardRow, "fulfilment_method" | "billing_city" | "billing_province">): { label: string; detail: string } {
  return isCollectionMethod(row.fulfilment_method)
    ? { label: fulfilmentLabel(row.fulfilment_method, row.billing_province), detail: "Customer collects" }
    : { label: row.billing_city, detail: row.billing_province };
}

export function matchesPurchaseSearch(row: PurchaseBoardRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [row.order_reference, row.customer_name, row.business_name ?? "", row.email, row.phone, row.sku, row.product_name_snapshot, row.tracking_number ?? "", row.billing_city]
    .some((value) => value.toLowerCase().includes(needle));
}

export type PurchaseSort = "newest" | "oldest" | "total_desc" | "total_asc";

export const PURCHASE_SORT_LABELS: Record<PurchaseSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  total_desc: "Highest total",
  total_asc: "Lowest total",
};

export function sortPurchases<T extends PurchaseBoardRow>(rows: T[], sort: PurchaseSort): T[] {
  const copy = [...rows];
  if (sort === "total_desc") return copy.sort((a, b) => purchaseAmountDue(b) - purchaseAmountDue(a));
  if (sort === "total_asc") return copy.sort((a, b) => purchaseAmountDue(a) - purchaseAmountDue(b));
  copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return sort === "oldest" ? copy : copy.reverse();
}

export type PurchaseGroup<T> = { stage: PurchaseStage; label: string; tone: BoardTone; rows: T[] };

/** Orders in stage order; every stage is listed even when empty. */
export function groupPurchases<T extends PurchaseBoardRow>(rows: T[]): PurchaseGroup<T>[] {
  return PURCHASE_STAGES.map((stage) => ({
    stage,
    label: PURCHASE_STAGE_LABELS[stage],
    tone: PURCHASE_STAGE_TONES[stage],
    rows: rows.filter((row) => purchaseStage(row) === stage),
  }));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/** South African wall-clock parts; plain dates (YYYY-MM-DD) are taken as they are. */
function sastParts(value: string | Date | null | undefined) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return { y, m: m - 1, d, time: null as string | null };
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const local = new Date(date.getTime() + SAST_OFFSET_MS);
  const time = `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
  return { y: local.getUTCFullYear(), m: local.getUTCMonth(), d: local.getUTCDate(), time };
}

/** "11 Nov" in South African time. */
export function purchaseShortDate(value: string | Date | null | undefined): string {
  const p = sastParts(value);
  return p ? `${p.d} ${MONTHS[p.m]}` : "—";
}

/** "11 Nov 2026, 14:05" in South African time (no time for plain dates). */
export function purchaseDateTime(value: string | Date | null | undefined): string {
  const p = sastParts(value);
  if (!p) return "—";
  return `${p.d} ${MONTHS[p.m]} ${p.y}${p.time ? `, ${p.time}` : ""}`;
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function purchasesCsv(rows: PurchaseBoardRow[]): string {
  const header = ["Order", "Stage", "Payment", "Customer", "Business", "Email", "Phone", "Product", "SKU", "Quantity", "Total incl. VAT", "Delivery or collection", "Courier", "Tracking", "Ordered"];
  const lines = rows.map((row) =>
    [
      row.order_reference,
      PURCHASE_STAGE_LABELS[purchaseStage(row)],
      purchasePaymentPill(row).label,
      row.customer_name,
      row.business_name ?? "",
      row.email,
      row.phone,
      row.product_name_snapshot,
      row.sku,
      String(row.quantity),
      purchaseAmountDue(row).toFixed(2),
      purchaseFulfilment(row).label,
      row.courier_name ?? "",
      row.tracking_number ?? "",
      row.created_at.slice(0, 10),
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...lines].join("\n");
}
