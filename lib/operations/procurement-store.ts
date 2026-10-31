import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "@/lib/operations/admin-db";
import { deliveryProgress, orderTotals, type BillLink, type DeliveryProgress, type OrderLine, type OrderTotals, type ProcurementDocType } from "@/lib/operations/procurement";
import type { MaterialFulfilment, MaterialOrderStatus, OpsMaterialOrder } from "@/lib/operations/types";

export type OrderBill = BillLink & {
  id: string;
  bill_number: string | null;
  contact_name: string | null;
  bill_date: string | null;
  due_date: string | null;
  last_synced_at: string | null;
};

export type OrderDocument = {
  id: string;
  doc_type: ProcurementDocType;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  uploaded_by_label: string | null;
};

export type OrderReceipt = {
  id: string;
  line_id: string;
  received_on: string;
  quantity_accepted: number;
  quantity_rejected: number;
  delivery_note_ref: string | null;
  notes: string | null;
  received_by_label: string | null;
  reversed_at: string | null;
  reversal_reason: string | null;
};

export type ProcurementOrder = OpsMaterialOrder & {
  status: MaterialOrderStatus;
  fulfilment: MaterialFulfilment;
  project: { title: string; customer_name: string | null; stage: string; lead: string | null };
  lines: OrderLine[];
  totals: OrderTotals;
  progress: DeliveryProgress;
  bills: OrderBill[];
  documentCount: number;
};

export type OrderDetail = { order: ProcurementOrder; receipts: OrderReceipt[]; documents: OrderDocument[] };

export type ProcurementLoad = { state: "ok"; orders: ProcurementOrder[] } | { state: "not_installed" } | { state: "error" };

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

type ProjectEmbed = { title: string; customer_name: string | null; stage: string; project_lead_name: string | null; crew: string | null } | null;

/** Orders with lines, delivery progress, linked bills and document counts. */
export async function loadProcurement(db: SupabaseClient, options: { projectId?: string; includeClosed?: boolean } = {}): Promise<ProcurementLoad> {
  let query = db
    .from("ops_material_orders")
    .select("*, ops_projects(title, customer_name, stage, project_lead_name, crew)")
    .order("expected_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(1000);
  if (options.projectId) query = query.eq("project_id", options.projectId);
  if (!options.includeClosed && !options.projectId) query = query.not("status", "in", "(collected_delivered,cancelled)");
  const orders = await query;
  if (orders.error) {
    console.error("[procurement] orders:", orders.error.message);
    return { state: "error" };
  }
  const rows = (orders.data ?? []) as (OpsMaterialOrder & { ops_projects: ProjectEmbed })[];
  const ids = rows.map((r) => r.id);
  if (!ids.length) return { state: "ok", orders: [] };

  const [lines, progress, bills, docs] = await Promise.all([
    db.from("ops_order_lines").select("id, order_id, description, specification, unit, quantity, unit_cost_excl_vat, discount_pct, vat_rate, sort_order").in("order_id", ids).order("sort_order"),
    db.from("ops_order_line_progress").select("line_id, quantity_received, quantity_rejected").in("order_id", ids),
    db.from("ops_order_bill_links").select("id, order_id, xero_invoice_id, bill_number, contact_name, xero_status, bill_date, due_date, total_incl_vat, amount_paid, amount_due, last_synced_at").in("order_id", ids),
    db.from("ops_procurement_documents").select("order_id").in("order_id", ids),
  ]);
  if ([lines, progress, bills, docs].some((r) => isMissingTableError(r.error))) return { state: "not_installed" };
  const failed = [lines, progress, bills, docs].find((r) => r.error);
  if (failed?.error) {
    console.error("[procurement] detail:", failed.error.message);
    return { state: "error" };
  }

  const prog = new Map(((progress.data ?? []) as { line_id: string; quantity_received: number; quantity_rejected: number }[]).map((p) => [p.line_id, p]));
  const linesBy = new Map<string, OrderLine[]>();
  for (const l of (lines.data ?? []) as Record<string, unknown>[]) {
    const p = prog.get(l.id as string);
    const line: OrderLine = {
      id: l.id as string,
      order_id: l.order_id as string,
      description: l.description as string,
      specification: (l.specification as string | null) ?? null,
      unit: l.unit as string,
      quantity: Number(l.quantity),
      unit_cost_excl_vat: num(l.unit_cost_excl_vat),
      discount_pct: Number(l.discount_pct),
      vat_rate: Number(l.vat_rate),
      quantity_received: Number(p?.quantity_received ?? 0),
      quantity_rejected: Number(p?.quantity_rejected ?? 0),
    };
    linesBy.set(line.order_id, [...(linesBy.get(line.order_id) ?? []), line]);
  }
  const billsBy = new Map<string, OrderBill[]>();
  for (const b of (bills.data ?? []) as Record<string, unknown>[]) {
    const bill: OrderBill = {
      id: b.id as string,
      xero_invoice_id: b.xero_invoice_id as string,
      bill_number: (b.bill_number as string | null) ?? null,
      contact_name: (b.contact_name as string | null) ?? null,
      xero_status: (b.xero_status as string | null) ?? null,
      bill_date: (b.bill_date as string | null) ?? null,
      due_date: (b.due_date as string | null) ?? null,
      total_incl_vat: num(b.total_incl_vat),
      amount_paid: num(b.amount_paid),
      amount_due: num(b.amount_due),
      last_synced_at: (b.last_synced_at as string | null) ?? null,
    };
    const key = b.order_id as string;
    billsBy.set(key, [...(billsBy.get(key) ?? []), bill]);
  }
  const docCount = new Map<string, number>();
  for (const d of (docs.data ?? []) as { order_id: string }[]) docCount.set(d.order_id, (docCount.get(d.order_id) ?? 0) + 1);

  return {
    state: "ok",
    orders: rows.map(({ ops_projects, ...o }) => {
      const orderLines = linesBy.get(o.id) ?? [];
      const cost = num(o.cost_excl_vat);
      return {
        ...o,
        cost_excl_vat: cost,
        project: {
          title: ops_projects?.title ?? "Unknown project",
          customer_name: ops_projects?.customer_name ?? null,
          stage: ops_projects?.stage ?? "planning",
          lead: ops_projects?.project_lead_name || ops_projects?.crew || null,
        },
        lines: orderLines,
        totals: orderTotals(orderLines, cost),
        progress: deliveryProgress(orderLines),
        bills: billsBy.get(o.id) ?? [],
        documentCount: docCount.get(o.id) ?? 0,
      };
    }),
  };
}

export async function loadOrderExtras(db: SupabaseClient, orderId: string): Promise<{ receipts: OrderReceipt[]; documents: OrderDocument[] } | null> {
  const [receipts, documents] = await Promise.all([
    db
      .from("ops_order_receipts")
      .select("id, line_id, received_on, quantity_accepted, quantity_rejected, delivery_note_ref, notes, received_by_label, reversed_at, reversal_reason")
      .eq("order_id", orderId)
      .order("received_on", { ascending: false })
      .order("created_at", { ascending: false }),
    db
      .from("ops_procurement_documents")
      .select("id, doc_type, file_name, content_type, size_bytes, created_at, uploaded_by_label")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false }),
  ]);
  if (receipts.error || documents.error) return null;
  return {
    receipts: ((receipts.data ?? []) as Record<string, unknown>[]).map((r) => ({
      ...(r as unknown as OrderReceipt),
      quantity_accepted: Number(r.quantity_accepted),
      quantity_rejected: Number(r.quantity_rejected),
    })),
    documents: (documents.data ?? []) as OrderDocument[],
  };
}
