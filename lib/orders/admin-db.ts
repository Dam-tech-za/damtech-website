import type { SupabaseClient } from "@supabase/supabase-js";
import { assertAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem } from "@/lib/auth/permissions";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Database client for admin order screens.
 *
 * `catalogue_orders` is deliberately closed to the `authenticated` role
 * (migration 20260813093808 revokes all table privileges and grants only the
 * service role), so the signed-in admin's own client gets "permission denied".
 * Access is therefore checked here, in server code, before using the
 * service-role client. Never call this from a Client Component.
 */
export async function adminOrdersDb(options: { manage?: boolean } = {}): Promise<SupabaseClient> {
  const admin = await assertAdmin(options.manage ? { permission: "manageOrders" } : {});
  if (!canAccessNavItem(admin.profile.role, "orders")) {
    throw new Error("Your role cannot view orders.");
  }
  return createServiceRoleClient();
}
