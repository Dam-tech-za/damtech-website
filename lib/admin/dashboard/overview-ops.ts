import type { SupabaseClient } from "@supabase/supabase-js";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import type { AdminRole } from "@/lib/auth/types";
import { attentionBuckets, orderNeedsAction } from "@/lib/operations/board";
import type { FinancialSnapshot } from "@/lib/operations/financials";
import { loadLatestFinancials } from "@/lib/operations/financials-store";
import { todayInSouthAfrica } from "@/lib/operations/lifecycle";
import type { OpsProject } from "@/lib/operations/types";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { AttentionCounts } from "./attention";

/**
 * Operations and Xero figures for the admin Overview: the attention counts,
 * active projects, and the latest Xero snapshot (money only for roles that may
 * see financials). Every part fails soft: null means "could not load", and the
 * Overview says so instead of showing a reassuring zero.
 */
export type OverviewOps = {
  attention: Pick<AttentionCounts, "opsOverdueActions" | "opsNoNextAction" | "opsSupplierOrders" | "unmatchedXero" | "overdueDebtors">;
  activeProjects: number | null;
  financials: FinancialSnapshot | null;
};

type AttentionProject = Pick<OpsProject, "id" | "title" | "on_hold_reason" | "stage" | "on_hold" | "next_action" | "next_action_due" | "needs_review" | "archived_at">;

export async function getOverviewOps(role: AdminRole): Promise<OverviewOps> {
  const result: OverviewOps = { attention: {}, activeProjects: null, financials: null };
  if (!canAccessNavItem(role, "operations")) return result;

  let db: SupabaseClient;
  try {
    db = createServiceRoleClient();
  } catch {
    return { ...result, attention: { opsOverdueActions: null, opsNoNextAction: null, opsSupplierOrders: null, unmatchedXero: null } };
  }
  const today = todayInSouthAfrica();
  const [projects, orders, unmatched, financials] = await Promise.all([
    db.from("ops_projects").select("id, title, on_hold_reason, stage, on_hold, next_action, next_action_due, needs_review, archived_at").neq("stage", "completed").is("archived_at", null),
    db.from("ops_material_orders").select("status, expected_date").not("status", "in", "(collected_delivered,cancelled)"),
    db.from("ops_xero_unmatched").select("id", { count: "exact", head: true }).eq("status", "open"),
    canPerform(role, "viewFinancials") ? loadLatestFinancials(db) : Promise.resolve(null),
  ]);

  if (projects.error) {
    result.attention.opsOverdueActions = null;
    result.attention.opsNoNextAction = null;
  } else {
    const rows = (projects.data ?? []) as AttentionProject[];
    const buckets = attentionBuckets(rows, today);
    result.attention.opsOverdueActions = buckets.find((b) => b.bucket === "overdue")?.projects.length ?? 0;
    result.attention.opsNoNextAction = buckets.find((b) => b.bucket === "no_next_action")?.projects.length ?? 0;
    result.activeProjects = rows.length;
  }
  result.attention.opsSupplierOrders = orders.error ? null : (orders.data ?? []).filter((o) => orderNeedsAction(o as never, today)).length;
  result.attention.unmatchedXero = unmatched.error ? null : (unmatched.count ?? 0);

  if (financials?.state === "ready") {
    result.financials = financials.snapshot;
    const a = financials.snapshot.debtors.ageing;
    result.attention.overdueDebtors = a["1-30"] + a["31-60"] + a["61-90"] + a["90+"];
  }
  return result;
}
