"use server";

import { unstable_rethrow } from "next/navigation";
import { assertAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem } from "@/lib/auth/permissions";
import { describeActionError } from "@/lib/admin/action-state";
import { createClient } from "@/lib/supabase/server";

export type OrderHistoryEntry = {
  id: string;
  action: string;
  actor_email: string | null;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
};

/** Recent audit entries for one shop order, for the quick-view panel. */
export async function orderHistoryAction(orderId: string): Promise<{ entries: OrderHistoryEntry[] } | { error: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { error: "Unknown order." };
  try {
    const admin = await assertAdmin();
    if (!canAccessNavItem(admin.profile.role, "online-purchases")) return { error: "You do not have access to orders." };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("id, action, actor_email, before_data, after_data, created_at")
      .eq("entity_type", "catalogue_order")
      .eq("entity_id", orderId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("[orders] history failed:", error.message);
      return { error: "History could not be loaded." };
    }
    return { entries: (data ?? []) as OrderHistoryEntry[] };
  } catch (error) {
    unstable_rethrow(error);
    return { error: describeActionError(error) };
  }
}
