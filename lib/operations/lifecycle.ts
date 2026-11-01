import type {
  MaterialFulfilment,
  MaterialOrderStatus,
  OpsMaterialOrder,
  OpsProject,
  PaymentStatus,
  ProjectService,
  ProjectStage,
} from "./types.ts";

/**
 * Project lifecycle rules. Six operational stages; On hold is a flag, and
 * payment is a separate Xero-derived status that never moves the stage.
 */

export const STAGE_LABELS: Record<ProjectStage, string> = {
  awaiting_deposit: "Awaiting deposit",
  planning: "Planning & materials",
  scheduled: "Scheduled",
  in_progress: "On site",
  handover: "Snags / handover",
  completed: "Completed",
};

/** Supply-only jobs: confirm payment, prepare goods, dispatch or collect, complete. */
export const SUPPLY_ONLY_STAGE_LABELS: Partial<Record<ProjectStage, string>> = {
  planning: "Preparing goods",
  scheduled: "Dispatch or collection booked",
};

const INSTALL_PATH: readonly ProjectStage[] = [
  "awaiting_deposit",
  "planning",
  "scheduled",
  "in_progress",
  "handover",
  "completed",
];

const SUPPLY_PATH: readonly ProjectStage[] = [
  "awaiting_deposit",
  "planning",
  "scheduled",
  "completed",
];

export function stagePath(isSupplyOnly: boolean): readonly ProjectStage[] {
  return isSupplyOnly ? SUPPLY_PATH : INSTALL_PATH;
}

export function stageLabel(stage: ProjectStage, isSupplyOnly = false): string {
  return (isSupplyOnly ? SUPPLY_ONLY_STAGE_LABELS[stage] : undefined) ?? STAGE_LABELS[stage];
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  not_invoiced: "Not invoiced",
  awaiting_payment: "Awaiting payment",
  part_paid: "Part paid",
  paid_up_to_date: "Invoices paid, balance not yet invoiced",
  paid_in_full: "Paid in full",
  overdue: "Overdue",
};

export const SERVICE_LABELS: Record<ProjectService, string> = {
  hdpe_dam_lining: "HDPE dam lining",
  pvc_lining: "PVC lining",
  reservoir_lining: "Reservoir lining",
  steel_reservoir: "Steel reservoir",
  torch_on_bitumen: "Torch-on bitumen",
  roof_waterproofing: "Roof waterproofing",
  foundation_waterproofing: "Foundation waterproofing",
  material_supply: "Material supply only",
  repairs: "Repairs and maintenance",
  other: "Other",
  unclassified: "Not classified yet",
};

/** Short names for the board's Type pill; the full name is in its tooltip. */
export const SERVICE_SHORT_LABELS: Record<ProjectService, string> = {
  hdpe_dam_lining: "HDPE",
  pvc_lining: "PVC",
  reservoir_lining: "Reservoir",
  steel_reservoir: "Steel tank",
  torch_on_bitumen: "Torch-on",
  roof_waterproofing: "Roof",
  foundation_waterproofing: "Foundation",
  material_supply: "Supply only",
  repairs: "Repairs",
  other: "Other",
  unclassified: "Set type",
};

export const MATERIAL_STATUS_LABELS: Record<MaterialOrderStatus, string> = {
  not_ordered: "Not ordered",
  quote_requested: "Quote requested",
  quoted: "Quote received",
  approved: "Approved, ready to order",
  ordered: "Ordered",
  manufacturing: "Supplier making / processing",
  paid: "Paid (old status)",
  ready_for_collection: "Ready for collection",
  in_transit: "Dispatched / in transit",
  partially_received: "Partly received",
  collected_delivered: "Received in full",
  on_hold: "On hold",
  problem: "Problem",
  cancelled: "Cancelled",
};

export const FULFILMENT_LABELS: Record<MaterialFulfilment, string> = {
  delivery: "Delivery",
  collection: "We collect",
  customer_collects: "Customer collects",
  tbc: "To confirm",
};

export type StageChangeCheck = { ok: true } | { ok: false; reason: string };

/**
 * Stages may move forward or back (people correct mistakes), but a supply-only
 * job cannot enter installation stages, and leaving Awaiting deposit while Xero
 * shows nothing paid needs an explicit override, because starting work or
 * buying materials without a deposit is the costly mistake.
 */
export function checkStageChange(
  project: Pick<OpsProject, "stage" | "is_supply_only" | "payment_status">,
  next: ProjectStage,
  options: { allowWithoutDeposit?: boolean } = {},
): StageChangeCheck {
  if (project.stage === next) return { ok: false, reason: "The project is already at that stage." };
  if (!stagePath(project.is_supply_only).includes(next)) {
    return {
      ok: false,
      reason: "Supply-only jobs skip the installation stages. Move it to Completed once goods are dispatched or collected.",
    };
  }
  const unpaid = project.payment_status === "not_invoiced" || project.payment_status === "awaiting_payment";
  if (project.stage === "awaiting_deposit" && next !== "awaiting_deposit" && unpaid && !options.allowWithoutDeposit) {
    return {
      ok: false,
      reason: "Xero shows no payment yet. Tick “Proceed without a deposit” if this was agreed with the customer.",
    };
  }
  return { ok: true };
}

export type NextActionCheck = { ok: true; action: string; due: string | null } | { ok: false; reason: string };

/** Every open project needs a next action and a date (mirrors the database check). */
export function checkNextAction(stage: ProjectStage, action: string, due: string): NextActionCheck {
  const trimmed = action.trim();
  if (stage === "completed") return { ok: true, action: trimmed, due: due || null };
  if (!trimmed) return { ok: false, reason: "Write the next action." };
  if (trimmed.length > 500) return { ok: false, reason: "Keep the next action under 500 characters." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return { ok: false, reason: "Choose the date for the next action." };
  return { ok: true, action: trimmed, due };
}

export type AttentionReason =
  | "next_action_overdue"
  | "next_action_today"
  | "awaiting_deposit"
  | "needs_review"
  | "money_outstanding_after_completion";

export type AttentionItem = {
  projectId: string;
  title: string;
  reason: AttentionReason;
  detail: string;
  due: string | null;
};

/** Today's date in South Africa (YYYY-MM-DD); the business runs on SAST. */
export function todayInSouthAfrica(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * The morning list: what must happen next. One entry per project, the most
 * urgent reason first, overdue items at the top.
 */
export function buildAttentionList(
  projects: Pick<
    OpsProject,
    "id" | "title" | "stage" | "on_hold" | "next_action" | "next_action_due" | "needs_review" | "payment_status" | "amount_due"
  >[],
  today: string,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const p of projects) {
    if (p.stage === "completed") {
      if (p.amount_due > 0) {
        items.push({
          projectId: p.id,
          title: p.title,
          reason: "money_outstanding_after_completion",
          detail: "Completed, but Xero shows money still owed.",
          due: null,
        });
      }
      continue;
    }
    if (p.on_hold) continue;
    const due = p.next_action_due;
    if (due && due < today) {
      items.push({ projectId: p.id, title: p.title, reason: "next_action_overdue", detail: p.next_action ?? "", due });
    } else if (due && due === today) {
      items.push({ projectId: p.id, title: p.title, reason: "next_action_today", detail: p.next_action ?? "", due });
    } else if (p.needs_review) {
      items.push({
        projectId: p.id,
        title: p.title,
        reason: "needs_review",
        detail: "Created from Xero. Check the service, site and scope.",
        due,
      });
    } else if (p.stage === "awaiting_deposit" && p.payment_status !== "part_paid" && p.payment_status !== "paid_in_full") {
      items.push({ projectId: p.id, title: p.title, reason: "awaiting_deposit", detail: p.next_action ?? "", due });
    }
  }
  const rank: Record<AttentionReason, number> = {
    next_action_overdue: 0,
    next_action_today: 1,
    awaiting_deposit: 2,
    needs_review: 3,
    money_outstanding_after_completion: 4,
  };
  return items.sort(
    (a, b) => rank[a.reason] - rank[b.reason] || (a.due ?? "9999").localeCompare(b.due ?? "9999"),
  );
}

export function isOpenMaterialOrder(order: Pick<OpsMaterialOrder, "status">): boolean {
  return order.status !== "collected_delivered" && order.status !== "cancelled";
}
