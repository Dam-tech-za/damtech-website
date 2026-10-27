import type {
  InvoiceKind,
  MaterialOrderStatus,
  OpsMaterialOrder,
  OpsProject,
  ProjectStage,
} from "./types.ts";

/**
 * Board rules for the Projects screen: automatic groups, the payment label
 * staff see (derived from Xero invoices only), the project-level materials
 * status (derived from supplier orders), and the attention list. Pure
 * functions so they are unit-tested without a database.
 */

// ---------------------------------------------------------------------------
// Groups: follow the stage automatically, never moved by hand
// ---------------------------------------------------------------------------

export const PROJECT_GROUPS = [
  "awaiting",
  "planning",
  "on_site",
  "handover",
  "completed",
] as const;
export type ProjectGroup = (typeof PROJECT_GROUPS)[number];

export const GROUP_LABELS: Record<ProjectGroup, string> = {
  awaiting: "Awaiting deposit / confirmation",
  planning: "Planning & materials",
  on_site: "Scheduled & on site",
  handover: "Handover & final payment",
  completed: "Completed",
};

const STAGE_GROUP: Record<ProjectStage, ProjectGroup> = {
  awaiting_deposit: "awaiting",
  planning: "planning",
  scheduled: "on_site",
  in_progress: "on_site",
  handover: "handover",
  completed: "completed",
};

export function groupForStage(stage: ProjectStage): ProjectGroup {
  return STAGE_GROUP[stage];
}

export function groupProjects<T extends Pick<OpsProject, "stage">>(projects: T[]): { group: ProjectGroup; projects: T[] }[] {
  return PROJECT_GROUPS.map((group) => ({
    group,
    projects: projects.filter((p) => groupForStage(p.stage) === group),
  })).filter((entry) => entry.projects.length > 0);
}

// ---------------------------------------------------------------------------
// Payment label (from Xero invoices only; not editable in the website)
// ---------------------------------------------------------------------------

export const PAYMENT_LABELS = [
  "deposit_not_invoiced",
  "deposit_invoiced",
  "deposit_paid",
  "balance_due",
  "paid_in_full",
] as const;
export type PaymentLabel = (typeof PAYMENT_LABELS)[number];

export const PAYMENT_LABEL_TEXT: Record<PaymentLabel, string> = {
  deposit_not_invoiced: "Deposit not invoiced",
  deposit_invoiced: "Deposit invoiced",
  deposit_paid: "Deposit paid",
  balance_due: "Balance due",
  paid_in_full: "Paid in full",
};

export type InvoiceForLabel = {
  kind: InvoiceKind;
  xero_status: string;
  total_incl_vat: number;
  amount_paid: number;
  amount_due: number;
  due_date: string | null;
};

const live = (status: string) => {
  const s = status.toUpperCase();
  return s === "AUTHORISED" || s === "PAID";
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function looksLikeDeposit(invoice: InvoiceForLabel, quotedTotalInclVat: number | null): boolean {
  if (invoice.kind === "deposit") return true;
  if (invoice.kind !== "unclassified") return false;
  return quotedTotalInclVat !== null && invoice.total_incl_vat < quotedTotalInclVat - 1;
}

export type PaymentPicture = {
  label: PaymentLabel;
  overdue: boolean;
  /** Sum of live invoice totals (gross; credit notes reduce what is due, not this). */
  invoiced: number;
  paid: number;
  /** Owed now on issued invoices. */
  due: number;
  /** Credit notes and write-offs applied to the invoices. */
  credited: number;
  /** Contract value not yet invoiced (quote total minus invoiced), when the quote is known. */
  notYetInvoiced: number | null;
};

/**
 * The money picture shown on a project. Settled invoices with a credit note
 * (Kingdom Pumps) count as settled: amount due is what Xero says is due.
 * Payment never changes the operational stage.
 */
export function paymentPicture(
  invoices: InvoiceForLabel[],
  quotedTotalInclVat: number | null,
  today: string,
): PaymentPicture {
  const issued = invoices.filter((i) => live(i.xero_status));
  const invoiced = round2(issued.reduce((s, i) => s + Number(i.total_incl_vat || 0), 0));
  const paid = round2(issued.reduce((s, i) => s + Number(i.amount_paid || 0), 0));
  const due = round2(issued.reduce((s, i) => s + Number(i.amount_due || 0), 0));
  const credited = round2(Math.max(0, invoiced - paid - due));
  const overdue = issued.some((i) => i.amount_due > 0 && i.due_date !== null && i.due_date < today);
  const notYetInvoiced =
    quotedTotalInclVat === null ? null : round2(Math.max(0, quotedTotalInclVat - invoiced));

  let label: PaymentLabel;
  if (issued.length === 0) {
    label = "deposit_not_invoiced";
  } else if (due <= 0 && (notYetInvoiced === null || notYetInvoiced <= 1)) {
    label = "paid_in_full";
  } else if (due <= 0) {
    // Everything issued so far is settled; the rest of the contract is still to be invoiced.
    label = "deposit_paid";
  } else if (paid <= 0 && issued.length === 1 && looksLikeDeposit(issued[0], quotedTotalInclVat)) {
    label = "deposit_invoiced";
  } else {
    label = "balance_due";
  }
  return { label, overdue, invoiced, paid, due, credited, notYetInvoiced };
}

// ---------------------------------------------------------------------------
// Materials status for a project (from its supplier orders)
// ---------------------------------------------------------------------------

export type MaterialsRollup =
  | "client_supplies"
  | "none"
  | "problem"
  | "to_order"
  | "awaiting_supplier"
  | "all_in";

export const MATERIALS_ROLLUP_LABELS: Record<MaterialsRollup, string> = {
  client_supplies: "Client supplies",
  none: "No orders yet",
  problem: "Problem",
  to_order: "To order",
  awaiting_supplier: "Ordered, awaiting",
  all_in: "All in",
};

const TO_ORDER: MaterialOrderStatus[] = ["not_ordered", "quote_requested", "quoted"];
const AWAITING: MaterialOrderStatus[] = ["ordered", "paid", "ready_for_collection"];

export function materialsRollup(
  orders: Pick<OpsMaterialOrder, "status">[],
  materialsByClient: boolean,
): MaterialsRollup {
  const active = orders.filter((o) => o.status !== "cancelled");
  if (active.length === 0) return materialsByClient ? "client_supplies" : "none";
  if (active.some((o) => o.status === "problem")) return "problem";
  if (active.some((o) => TO_ORDER.includes(o.status))) return "to_order";
  if (active.some((o) => AWAITING.includes(o.status))) return "awaiting_supplier";
  return "all_in";
}

// ---------------------------------------------------------------------------
// What needs attention (dashboard)
// ---------------------------------------------------------------------------

export type AttentionBucket =
  | "overdue"
  | "today"
  | "next_7_days"
  | "no_next_action"
  | "on_hold"
  | "needs_review";

export const ATTENTION_LABELS: Record<AttentionBucket, string> = {
  overdue: "Overdue actions",
  today: "Due today",
  next_7_days: "Due in the next 7 days",
  no_next_action: "No valid next action",
  on_hold: "Blocked / on hold",
  needs_review: "New from Xero: check details",
};

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type AttentionProject = Pick<
  OpsProject,
  "id" | "title" | "stage" | "on_hold" | "on_hold_reason" | "next_action" | "next_action_due" | "needs_review" | "archived_at"
>;

export function bucketForProject(p: AttentionProject, today: string): AttentionBucket | null {
  if (p.stage === "completed" || p.archived_at) return null;
  if (p.on_hold) return "on_hold";
  if (!p.next_action?.trim() || !p.next_action_due) return "no_next_action";
  if (p.next_action_due < today) return "overdue";
  if (p.next_action_due === today) return "today";
  if (p.next_action_due <= addDays(today, 7)) return "next_7_days";
  if (p.needs_review) return "needs_review";
  return null;
}

export function attentionBuckets<T extends AttentionProject>(
  projects: T[],
  today: string,
): { bucket: AttentionBucket; projects: T[] }[] {
  const order: AttentionBucket[] = ["overdue", "today", "no_next_action", "on_hold", "next_7_days", "needs_review"];
  const map = new Map<AttentionBucket, T[]>();
  for (const p of projects) {
    const b = bucketForProject(p, today);
    if (!b) continue;
    map.set(b, [...(map.get(b) ?? []), p]);
  }
  return order
    .filter((b) => map.has(b))
    .map((bucket) => ({
      bucket,
      projects: (map.get(bucket) ?? []).sort((a, b) => (a.next_action_due ?? "9999").localeCompare(b.next_action_due ?? "9999")),
    }));
}

/** Supplier orders that need someone to act: not yet ordered, problems, or past their expected date. */
export function orderNeedsAction(
  order: Pick<OpsMaterialOrder, "status" | "expected_date">,
  today: string,
): boolean {
  if (order.status === "cancelled" || order.status === "collected_delivered") return false;
  if (order.status === "problem" || TO_ORDER.includes(order.status)) return true;
  return order.expected_date !== null && order.expected_date < today;
}

// ---------------------------------------------------------------------------
// Board filters and sorting
// ---------------------------------------------------------------------------

export type BoardFilters = {
  q?: string;
  service?: string;
  stage?: string;
  payment?: string;
  view?: "board" | "table";
  sort?: "next_action" | "updated" | "customer";
  show?: "active" | "completed" | "archived";
};

export function matchesSearch(p: Pick<OpsProject, "title" | "customer_name" | "site_location" | "xero_quote_numbers" | "xero_invoice_numbers">, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [p.title, p.customer_name, p.site_location ?? "", ...p.xero_quote_numbers, ...p.xero_invoice_numbers]
    .some((v) => v.toLowerCase().includes(needle));
}

export function sortProjects<T extends Pick<OpsProject, "next_action_due" | "updated_at" | "customer_name">>(
  projects: T[],
  sort: BoardFilters["sort"],
): T[] {
  const copy = [...projects];
  if (sort === "updated") return copy.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  if (sort === "customer") return copy.sort((a, b) => a.customer_name.localeCompare(b.customer_name));
  return copy.sort((a, b) => (a.next_action_due ?? "9999").localeCompare(b.next_action_due ?? "9999"));
}
