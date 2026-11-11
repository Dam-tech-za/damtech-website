import type { AdminSectionId } from "@/lib/admin/navigation";
import { canAccessNavItem } from "@/lib/auth/permissions";
import type { AdminRole } from "@/lib/auth/types";
import { todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { adminOrdersDb } from "@/lib/orders/admin-db";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Menu badges: only things that need someone to act. New enquiries not yet
 * reviewed, paid shop orders not yet dispatched, and active projects whose
 * next step is overdue. Head-only counts; any failure just hides the badge.
 */
export async function getNavBadges(role: AdminRole): Promise<Partial<Record<AdminSectionId, number>>> {
  const badges: Partial<Record<AdminSectionId, number>> = {};
  const jobs: Promise<void>[] = [];
  if (canAccessNavItem(role, "rfqs")) {
    jobs.push(
      (async () => {
        const supabase = await createClient();
        const { count, error } = await supabase.from("rfqs").select("id", { count: "exact", head: true }).eq("status", "new");
        if (!error && count) badges.enquiries = count;
      })(),
    );
  }
  if (canAccessNavItem(role, "operations")) {
    jobs.push(
      (async () => {
        const db = createServiceRoleClient();
        const { count, error } = await db
          .from("ops_projects")
          .select("id", { count: "exact", head: true })
          .neq("stage", "completed")
          .is("archived_at", null)
          .eq("on_hold", false)
          .lt("next_action_due", todayInSouthAfrica());
        if (!error && count) badges.projects = count;
      })(),
    );
  }
  if (canAccessNavItem(role, "online-purchases")) {
    jobs.push(
      (async () => {
        const db = await adminOrdersDb();
        const { count, error } = await db
          .from("catalogue_orders")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "paid")
          .not("status", "in", "(cancelled,completed)")
          .is("dispatched_on", null)
          .is("delivered_on", null);
        if (!error && count) badges.shop = count;
      })(),
    );
  }
  await Promise.allSettled(jobs);
  return badges;
}
