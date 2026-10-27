import { isRfqEmailConfigured } from "@/lib/rfq/email/config";
import { xeroBridgeConfigFromEnv } from "@/lib/operations/xero-bridge";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";

/**
 * System health at a glance: four plain rows (green / amber / red), each with
 * what was checked and what to do when it isn't green. Read-only.
 */
export type HealthTone = "good" | "warn" | "bad";
export type HealthRow = { label: string; tone: HealthTone; status: string; detail: string; fix?: string };

const HOURS = 3_600_000;

const ago = (iso: string, now: number) => {
  const h = Math.round((now - new Date(iso).getTime()) / HOURS);
  return h < 1 ? "less than an hour ago" : h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
};

export async function getSystemSummary(now = Date.now()): Promise<{ rows: HealthRow[]; checkedAt: string }> {
  const rows: HealthRow[] = [];
  const db = isSupabaseServiceConfigured() ? createServiceRoleClient() : null;

  // Database
  if (!db) {
    rows.push({ label: "Database", tone: "bad", status: "Not connected", detail: "The site has no database key.", fix: "Add SUPABASE_SERVICE_ROLE_KEY in Vercel and redeploy." });
  } else {
    const { error } = await db.from("admin_profiles").select("id", { count: "exact", head: true });
    rows.push(
      error
        ? { label: "Database", tone: "bad", status: "Not answering", detail: error.message.slice(0, 120), fix: "Check the Supabase project is running (it pauses when idle on the free plan)." }
        : { label: "Database", tone: "good", status: "Working", detail: "Supabase answered just now." },
    );
  }

  // Xero
  const bridge = xeroBridgeConfigFromEnv() !== null;
  if (!bridge) {
    rows.push({ label: "Xero", tone: "bad", status: "Not connected", detail: "No Xero bridge key on this site.", fix: "Add XERO_BRIDGE_API_KEY in Vercel and redeploy." });
  } else if (db) {
    const { data } = await db.from("ops_sync_runs").select("kind, status, finished_at, started_at").order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) {
      rows.push({ label: "Xero", tone: "warn", status: "Never synced", detail: "The connection is set up but no sync has run.", fix: "Press Sync now on Projects → To do." });
    } else if (data.status !== "ok") {
      rows.push({ label: "Xero", tone: "bad", status: "Last sync failed", detail: `Started ${ago(data.started_at, now)}.`, fix: "Press Sync now. If it fails again, reconnect Xero in the bridge." });
    } else {
      const stale = now - new Date(data.finished_at ?? data.started_at).getTime() > 26 * HOURS;
      rows.push({
        label: "Xero",
        tone: stale ? "warn" : "good",
        status: stale ? "Out of date" : "Working",
        detail: `Last synced ${ago(data.finished_at ?? data.started_at, now)}.`,
        fix: stale ? "Press Sync now on Projects → To do." : undefined,
      });
    }
  }

  // Email
  rows.push(
    isRfqEmailConfigured()
      ? { label: "Email", tone: "good", status: "Set up", detail: "Resend is configured for enquiry and quote emails." }
      : { label: "Email", tone: "bad", status: "Not set up", detail: "Enquiry confirmations and alerts can't be sent.", fix: "Add RESEND_API_KEY and the sender address in Vercel." },
  );

  // Daily reminder
  if (db) {
    const { data } = await db.from("ops_reminder_runs").select("run_date, status, item_count, error").order("run_date", { ascending: false }).limit(1).maybeSingle();
    if (process.env.OPS_REMINDERS_ENABLED === "false") {
      rows.push({ label: "Daily reminder", tone: "warn", status: "Switched off", detail: "OPS_REMINDERS_ENABLED is false.", fix: "Remove that setting in Vercel to turn it back on." });
    } else if (!data) {
      rows.push({ label: "Daily reminder", tone: "warn", status: "Not run yet", detail: "Runs at 07:15, Monday to Saturday." });
    } else if (data.status === "failed") {
      rows.push({ label: "Daily reminder", tone: "bad", status: "Last one failed", detail: `On ${data.run_date}.`, fix: "Check the Email row above; it retries the next morning." });
    } else {
      rows.push({
        label: "Daily reminder",
        tone: "good",
        status: data.status === "sent" ? "Sent" : "Nothing due",
        detail: data.status === "sent" ? `${data.item_count} items on ${data.run_date}.` : `Nothing needed attention on ${data.run_date}.`,
      });
    }
  }

  return { rows, checkedAt: new Date(now).toISOString() };
}
