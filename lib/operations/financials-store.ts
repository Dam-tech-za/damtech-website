import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { composeFinancialSnapshot, fetchFinancialParts, type FinancialParts } from "./financials-sync";
import type { FinancialSnapshot } from "./financials";
import { todayInSouthAfrica } from "./lifecycle";
import { createXeroBridgeClient, xeroBridgeConfigFromEnv } from "./xero-bridge";
import type { SyncTrigger } from "./sync";

/**
 * Stores Xero financial reports in ops_financial_snapshots (one row per
 * report, sharing a sync run) and reads the latest complete set back.
 * Server-only; callers authorise first.
 */

export type FinancialRefreshResult =
  | { ok: true; fetchedAt: string }
  | { ok: false; reason: "not_configured" | "already_running" | "failed"; message: string };

const REPORTS = ["profit_and_loss", "bank_summary", "receivables", "payables"] as const;

export async function refreshFinancials(trigger: SyncTrigger, options: { maxAgeMinutes?: number } = {}): Promise<FinancialRefreshResult> {
  const config = xeroBridgeConfigFromEnv();
  if (!config || !isSupabaseServiceConfigured()) {
    return { ok: false, reason: "not_configured", message: "The Xero bridge key is not set on the server." };
  }
  const db = createServiceRoleClient();

  if (options.maxAgeMinutes) {
    const latest = await latestRun(db);
    if (latest && Date.now() - Date.parse(latest.finished_at) < options.maxAgeMinutes * 60_000) {
      return { ok: true, fetchedAt: latest.finished_at };
    }
  }

  const { data: runId, error: startError } = await db.rpc("ops_start_sync_run", { p_kind: "xero_financials", p_trigger: trigger });
  if (startError) return { ok: false, reason: "failed", message: startError.message };
  if (!runId) return { ok: false, reason: "already_running", message: "A financial refresh is already running." };

  const finish = (status: "ok" | "failed", error: string | null) =>
    db.from("ops_sync_runs").update({ status, finished_at: new Date().toISOString(), error }).eq("id", runId);

  try {
    const today = todayInSouthAfrica();
    const parts = await fetchFinancialParts(createXeroBridgeClient(config), today);
    const fetchedAt = new Date().toISOString();
    const rows = [
      { report: "profit_and_loss", period_from: parts.profitAndLoss.financialYearStart, period_to: today, payload: parts.profitAndLoss },
      { report: "bank_summary", period_from: null, period_to: today, payload: parts.bank },
      { report: "receivables", period_from: null, period_to: today, payload: { docs: parts.receivables } },
      { report: "payables", period_from: null, period_to: today, payload: { docs: parts.payables } },
    ].map((r) => ({ ...r, fetched_at: fetchedAt, sync_run_id: runId }));
    const { error } = await db.from("ops_financial_snapshots").insert(rows);
    if (error) throw new Error(error.message);
    await finish("ok", null);
    return { ok: true, fetchedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finish("failed", message.slice(0, 2000));
    return { ok: false, reason: "failed", message };
  }
}

async function latestRun(db: SupabaseClient): Promise<{ id: string; finished_at: string } | null> {
  const { data } = await db
    .from("ops_sync_runs")
    .select("id, finished_at")
    .eq("kind", "xero_financials")
    .eq("status", "ok")
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.finished_at ? (data as { id: string; finished_at: string }) : null;
}

export type FinancialLoad =
  | { state: "ready"; snapshot: FinancialSnapshot }
  | { state: "empty" }
  | { state: "tables_missing" }
  | { state: "error"; message: string };

export async function loadLatestFinancials(db: SupabaseClient): Promise<FinancialLoad> {
  const { data: run, error: runError } = await db
    .from("ops_sync_runs")
    .select("id, finished_at")
    .eq("kind", "xero_financials")
    .eq("status", "ok")
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (runError) {
    if (/does not exist|could not find the table/i.test(runError.message) || runError.code === "42P01" || runError.code === "PGRST205") {
      return { state: "tables_missing" };
    }
    return { state: "error", message: runError.message };
  }
  if (!run) return { state: "empty" };

  const { data: rows, error } = await db
    .from("ops_financial_snapshots")
    .select("report, payload, fetched_at")
    .eq("sync_run_id", run.id);
  if (error) return { state: "error", message: error.message };
  const byReport = new Map((rows ?? []).map((r) => [r.report as string, r.payload as unknown]));
  if (!REPORTS.every((r) => byReport.has(r))) return { state: "error", message: "The latest refresh is incomplete." };

  const parts: FinancialParts = {
    profitAndLoss: byReport.get("profit_and_loss") as FinancialParts["profitAndLoss"],
    bank: byReport.get("bank_summary") as FinancialParts["bank"],
    receivables: (byReport.get("receivables") as { docs: FinancialParts["receivables"] }).docs,
    payables: (byReport.get("payables") as { docs: FinancialParts["payables"] }).docs,
  };
  const fetchedAt = (rows ?? [])[0]?.fetched_at ?? run.finished_at;
  return { state: "ready", snapshot: composeFinancialSnapshot(parts, fetchedAt, todayInSouthAfrica(new Date(fetchedAt))) };
}
