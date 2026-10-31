import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTableError } from "@/lib/operations/admin-db";

/** Saved project leads, or null when the table is not installed yet. */
export async function loadSavedLeads(db: SupabaseClient): Promise<string[] | null> {
  const { data, error } = await db.from("ops_project_leads").select("name").order("name");
  if (error) {
    if (!isMissingTableError(error)) console.error("[operations] project leads:", error.message);
    return null;
  }
  return (data ?? []).map((r) => (r.name as string).trim()).filter(Boolean);
}
