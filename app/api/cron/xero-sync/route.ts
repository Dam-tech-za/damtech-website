import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { refreshFinancials } from "@/lib/operations/financials-store";
import { runConfiguredXeroSync } from "@/lib/operations/run-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const maxDuration = 60;

/**
 * Xero → Operations sync. Protected by CRON_SECRET.
 *
 * Vercel Hobby crons run once a day, so the frequent trigger is Supabase
 * pg_cron (net.http_post with the same Bearer secret), every 15 minutes in
 * working hours. Does nothing until OPS_XERO_SYNC_ENABLED=true, so deploying
 * this code cannot start syncing before the database migration is applied.
 */
async function handle(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: "Unauthorised" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  if (process.env.OPS_XERO_SYNC_ENABLED !== "true") {
    return NextResponse.json({ ok: true, skipped: "disabled" }, { headers: { "Cache-Control": "no-store" } });
  }

  const result = await runConfiguredXeroSync("cron");
  // Financial reports change slowly; refresh at most every three hours (about 7 Xero calls).
  const financials = await refreshFinancials("cron", { maxAgeMinutes: 180 });
  const status = result.status === "failed" ? 502 : 200;
  return NextResponse.json(
    {
      ok: result.status === "ok" || result.status === "partial" || result.status === "skipped",
      status: result.status,
      reason: result.reason,
      counts: result.counts,
      errors: result.errors.length,
      financials: financials.ok ? "ok" : financials.reason,
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = handle;
export const POST = handle;
