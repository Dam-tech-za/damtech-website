/**
 * Procurement rules shared by the server and the order panel. Pure functions
 * only, so they run under the node test runner.
 *
 * Money words used on screen:
 *  - estimated: order lines on orders not yet placed (quotes, approvals)
 *  - committed: order lines on placed orders (ordered and later)
 *  - billed:    Xero supplier bills linked to the project's orders
 *  - paid:      what Xero says has been paid on those bills
 * They are stages of the same spend and are never added together.
 */
import type { MaterialOrderStatus } from "./types.ts";

/** Statuses offered in the website, in workflow order. "paid" is not offered: payment comes from Xero. */
export const ORDER_STATUS_CHOICES: MaterialOrderStatus[] = [
  "not_ordered",
  "quote_requested",
  "quoted",
  "approved",
  "ordered",
  "manufacturing",
  "ready_for_collection",
  "in_transit",
  "partially_received",
  "collected_delivered",
  "on_hold",
  "problem",
  "cancelled",
];

const NOT_PLACED = new Set<MaterialOrderStatus>(["not_ordered", "quote_requested", "quoted", "approved"]);
const CLOSED = new Set<MaterialOrderStatus>(["collected_delivered", "cancelled"]);

export function isOrderPlaced(status: MaterialOrderStatus): boolean {
  return !NOT_PLACED.has(status) && status !== "cancelled";
}

export function isOrderOpen(status: MaterialOrderStatus): boolean {
  return !CLOSED.has(status);
}

export const DOCUMENT_TYPES = [
  "supplier_quote",
  "pro_forma",
  "purchase_order",
  "tax_invoice",
  "delivery_note",
  "proof_of_collection",
  "correspondence",
  "credit_note",
  "other",
] as const;
export type ProcurementDocType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<ProcurementDocType, string> = {
  supplier_quote: "Supplier quotation",
  pro_forma: "Pro forma invoice",
  purchase_order: "Purchase order",
  tax_invoice: "Tax invoice",
  delivery_note: "Delivery note",
  proof_of_collection: "Proof of collection",
  correspondence: "Correspondence",
  credit_note: "Credit note",
  other: "Other",
};

export function isDocType(value: string): value is ProcurementDocType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}

export const ALLOWED_DOC_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
export const MAX_DOC_BYTES = 20 * 1024 * 1024;

/** Checks the first bytes so a renamed file cannot pass as a PDF or image. */
export function sniffMatchesType(bytes: Uint8Array, contentType: string): boolean {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  switch (contentType) {
    case "application/pdf":
      return starts(0x25, 0x50, 0x44, 0x46); // %PDF
    case "image/jpeg":
      return starts(0xff, 0xd8, 0xff);
    case "image/png":
      return starts(0x89, 0x50, 0x4e, 0x47);
    case "image/webp":
      return starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45;
    case "image/heic":
      return bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70; // ftyp
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return starts(0x50, 0x4b, 0x03, 0x04); // zip
    default:
      return false;
  }
}

/** Storage-safe file name: keeps letters, digits, dot, dash and underscore. */
export function safeFileName(name: string): string {
  const cleaned = name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+/, "");
  return (cleaned || "document").slice(-120);
}

export type OrderLine = {
  id: string;
  order_id: string;
  description: string;
  specification: string | null;
  unit: string;
  quantity: number;
  unit_cost_excl_vat: number | null;
  discount_pct: number;
  vat_rate: number;
  quantity_received: number;
  quantity_rejected: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function lineTotalExclVat(line: Pick<OrderLine, "quantity" | "unit_cost_excl_vat" | "discount_pct">): number {
  return round2(line.quantity * (line.unit_cost_excl_vat ?? 0) * (1 - line.discount_pct / 100));
}

export function lineVat(line: Pick<OrderLine, "quantity" | "unit_cost_excl_vat" | "discount_pct" | "vat_rate">): number {
  return round2(lineTotalExclVat(line) * (line.vat_rate / 100));
}

export function lineOutstanding(line: Pick<OrderLine, "quantity" | "quantity_received">): number {
  return Math.max(0, line.quantity - line.quantity_received);
}

export type OrderTotals = { exclVat: number; vat: number; inclVat: number; priced: boolean };

/** Order value from its lines; falls back to the single cost field older orders used. */
export function orderTotals(lines: OrderLine[], legacyCostExclVat: number | null): OrderTotals {
  if (!lines.length) {
    const ex = legacyCostExclVat ?? 0;
    return { exclVat: ex, vat: round2(ex * 0.15), inclVat: round2(ex * 1.15), priced: legacyCostExclVat !== null };
  }
  const exclVat = round2(lines.reduce((s, l) => s + lineTotalExclVat(l), 0));
  const vat = round2(lines.reduce((s, l) => s + lineVat(l), 0));
  return { exclVat, vat, inclVat: round2(exclVat + vat), priced: lines.every((l) => l.unit_cost_excl_vat !== null) };
}

export type DeliveryProgress = { state: "none" | "partial" | "complete" | "no_lines"; received: number; ordered: number };

export function deliveryProgress(lines: Pick<OrderLine, "quantity" | "quantity_received">[]): DeliveryProgress {
  if (!lines.length) return { state: "no_lines", received: 0, ordered: 0 };
  const done = lines.filter((l) => lineOutstanding(l) === 0).length;
  const any = lines.some((l) => l.quantity_received > 0);
  return {
    state: done === lines.length ? "complete" : any ? "partial" : "none",
    received: done,
    ordered: lines.length,
  };
}

/** Status suggested after receipts change. Never moves a cancelled or on-hold order. */
export function statusAfterReceipt(current: MaterialOrderStatus, progress: DeliveryProgress): MaterialOrderStatus {
  if (current === "cancelled" || current === "on_hold" || current === "problem") return current;
  if (progress.state === "complete") return "collected_delivered";
  if (progress.state === "partial") return "partially_received";
  if (current === "collected_delivered" || current === "partially_received") return "ordered";
  return current;
}

export type BillLink = { xero_invoice_id: string; total_incl_vat: number | null; amount_paid: number | null; amount_due: number | null; xero_status: string | null };

export type CostSummary = {
  estimatedExclVat: number;
  committedExclVat: number;
  committedInclVat: number;
  billedInclVat: number;
  paidInclVat: number;
  dueInclVat: number;
  billCount: number;
};

/**
 * Project spend by stage. Bills are counted once even when linked to several
 * orders; voided and deleted bills are left out.
 */
export function costSummary(orders: { status: MaterialOrderStatus; totals: OrderTotals; bills: BillLink[] }[]): CostSummary {
  let estimatedExclVat = 0;
  let committedExclVat = 0;
  let committedInclVat = 0;
  const bills = new Map<string, BillLink>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    if (isOrderPlaced(o.status)) {
      committedExclVat += o.totals.exclVat;
      committedInclVat += o.totals.inclVat;
    } else {
      estimatedExclVat += o.totals.exclVat;
    }
    for (const b of o.bills) bills.set(b.xero_invoice_id, b);
  }
  const live = [...bills.values()].filter((b) => !["VOIDED", "DELETED"].includes((b.xero_status ?? "").toUpperCase()));
  return {
    estimatedExclVat: round2(estimatedExclVat),
    committedExclVat: round2(committedExclVat),
    committedInclVat: round2(committedInclVat),
    billedInclVat: round2(live.reduce((s, b) => s + (b.total_incl_vat ?? 0), 0)),
    paidInclVat: round2(live.reduce((s, b) => s + (b.amount_paid ?? 0), 0)),
    dueInclVat: round2(live.reduce((s, b) => s + (b.amount_due ?? 0), 0)),
    billCount: live.length,
  };
}

const SHORT_DATE = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" });
const d = (iso: string) => SHORT_DATE.format(new Date(`${iso}T00:00:00Z`));

/** Plain warning when an order will not be in before it is needed. */
export function readinessIssue(
  order: { status: MaterialOrderStatus; expected_date: string | null; required_on_site?: string | null },
  today: string,
  installStart: string | null,
): string | null {
  if (!isOrderOpen(order.status)) return null;
  const needBy = [order.required_on_site ?? null, installStart].filter(Boolean).sort()[0] ?? null;
  if (order.status === "problem" || order.status === "on_hold") return "Supplier order has a problem or is on hold.";
  if (!isOrderPlaced(order.status)) return needBy ? `Not ordered yet; needed by ${d(needBy)}.` : "Not ordered yet.";
  if (order.expected_date && order.expected_date < today) return `Delivery overdue (expected ${d(order.expected_date)}).`;
  if (needBy && order.expected_date && order.expected_date > needBy) return `Expected ${d(order.expected_date)}, after it is needed (${d(needBy)}).`;
  if (needBy && !order.expected_date) return `No delivery date; needed by ${d(needBy)}.`;
  return null;
}

/** Parse a decimal typed with a comma or a dot. */
export function parseQty(value: string | null | undefined): number | null {
  const t = (value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Short words for the Delivered column. */
export function deliveryLabel(status: MaterialOrderStatus, progress: DeliveryProgress): string {
  if (progress.state === "no_lines" || !isOrderPlaced(status)) return "—";
  if (progress.state === "complete") return "All in";
  if (progress.state === "partial") return `Part (${progress.received} of ${progress.ordered} items)`;
  return "Not yet";
}
