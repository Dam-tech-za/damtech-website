import type { AdminSectionId } from "@/lib/admin/navigation";
import { canAccessNavItem } from "@/lib/auth/permissions";
import type { AdminRole } from "@/lib/auth/types";
import { todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Menu badges: only things that need someone to act. New enquiries not yet
 * reviewed, and active projects whose next step is overdue. Two head-only
 * counts; any failure just hides the badge.
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
  await Promise.allSettled(jobs);
  return badges;
}
