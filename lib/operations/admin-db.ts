import type { SupabaseClient } from "@supabase/supabase-js";
import { assertAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem } from "@/lib/auth/permissions";
import type { PERMISSIONS } from "@/lib/auth/permissions";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Database client for the Operations screens. The ops_* tables grant nothing
 * to anon or authenticated (migration 20261026150000), so access is checked
 * here in server code and the query then runs with the service role, the same
 * pattern as catalogue orders. Never import from a Client Component.
 */
export async function adminOpsDb(
  options: { permission?: keyof typeof PERMISSIONS } = {},
): Promise<{ db: SupabaseClient; admin: Awaited<ReturnType<typeof assertAdmin>> }> {
  const admin = await assertAdmin(options.permission ? { permission: options.permission } : {});
  if (!canAccessNavItem(admin.profile.role, "operations")) {
    throw new Error("Your role cannot view operations.");
  }
  return { db: createServiceRoleClient(), admin };
}

/** True when a Supabase error means the Operations tables are not installed yet. */
export function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message ?? "");
}
