import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { todayInSouthAfrica } from "./lifecycle";
import { runXeroProjectSync, type SyncRunResult, type SyncTrigger } from "./sync";
import { createSupabaseSyncStore } from "./sync-store";
import { createXeroBridgeClient, xeroBridgeConfigFromEnv } from "./xero-bridge";

/**
 * Wires the sync engine to the real bridge and database. Callers (the cron
 * route and the admin "Sync now" action) do their own authorisation first.
 */
export async function runConfiguredXeroSync(trigger: SyncTrigger, options: { baseline?: boolean } = {}): Promise<SyncRunResult> {
  const config = xeroBridgeConfigFromEnv();
  if (!config || !isSupabaseServiceConfigured()) {
    return {
      status: "skipped",
      reason: "bridge_not_configured",
      counts: { quotes_seen: 0, projects_created: 0, quotes_linked: 0, quotes_ignored: 0, invoices_linked: 0, projects_updated: 0, invoices_for_review: 0 },
      errors: [],
      createdProjectIds: [],
      baseline: options.baseline === true,
    };
  }
  return runXeroProjectSync(createXeroBridgeClient(config), createSupabaseSyncStore(createServiceRoleClient()), {
    trigger,
    today: todayInSouthAfrica(),
    baseline: options.baseline,
  });
}
