import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { getQuoteFromEmail } from "@/lib/email/config";
import { sendIdempotentResendEmail } from "@/lib/email/resend-idempotent";
import { todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { buildReminderEmail, isReminderDay, type ReminderOrder, type ReminderProject } from "@/lib/operations/reminders";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";
import { CANONICAL_ORIGIN } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const maxDuration = 30;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

function recipients(): string[] {
  const raw = process.env.OPS_REMINDER_EMAIL?.trim() || process.env.LEAD_INBOX_EMAIL?.trim() || "info@dam-tech.co.za";
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    .slice(0, 5);
}

/**
 * Daily Operations reminder (Vercel cron, 07:15 SAST). Protected by
 * CRON_SECRET. Sends at most one email per day: the day is claimed in
 * ops_reminder_runs before sending, and Resend gets an idempotency key.
 * Set OPS_REMINDERS_ENABLED=false to switch it off.
 */
async function handle(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return json({ ok: false, error: "Unauthorised" }, 401);
  if (process.env.OPS_REMINDERS_ENABLED === "false") return json({ ok: true, skipped: "disabled" });
  if (!isSupabaseServiceConfigured()) return json({ ok: true, skipped: "database_not_configured" });

  const today = todayInSouthAfrica();
  if (!isReminderDay(today)) return json({ ok: true, skipped: "sunday" });

  const db = createServiceRoleClient();
  const to = recipients();

  // Claim today first: a second cron call the same day does nothing.
  const { error: claimError } = await db
    .from("ops_reminder_runs")
    .insert({ run_date: today, status: "skipped", recipients: to });
  if (claimError) {
    if (claimError.code !== "23505") {
      console.error("[ops-reminders] claim failed:", claimError.message);
      return json({ ok: false, error: "claim_failed" }, 500);
    }
    // Only a failed run may be retried the same day (Resend's idempotency key still guards against a double send).
    const { data: existing } = await db.from("ops_reminder_runs").select("status").eq("run_date", today).maybeSingle();
    if (existing?.status !== "failed") return json({ ok: true, skipped: "already_ran_today" });
  }

  const [projects, orders, unmatched] = await Promise.all([
    db
      .from("ops_projects")
      .select("id, title, stage, on_hold, on_hold_reason, next_action, next_action_due, next_action_owner, needs_review, archived_at")
      .neq("stage", "completed")
      .is("archived_at", null),
    db
      .from("ops_material_orders")
      .select("id, project_id, supplier_name, description, status, expected_date, ops_projects(title)")
      .not("status", "in", "(collected_delivered,cancelled)"),
    db.from("ops_xero_unmatched").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  const loadError = projects.error ?? orders.error ?? unmatched.error;
  if (loadError) {
    await db.from("ops_reminder_runs").update({ status: "failed", error: loadError.message.slice(0, 500) }).eq("run_date", today);
    return json({ ok: false, error: "load_failed" }, 500);
  }

  const email = buildReminderEmail(
    (projects.data ?? []) as ReminderProject[],
    (orders.data ?? []).map((o) => ({
      ...(o as unknown as ReminderOrder),
      project_title: ((o.ops_projects as { title?: string } | null)?.title) ?? "Unknown project",
    })),
    unmatched.count ?? 0,
    today,
    CANONICAL_ORIGIN,
  );

  if (!email) {
    await db.from("ops_reminder_runs").update({ status: "nothing_due", item_count: 0 }).eq("run_date", today);
    return json({ ok: true, sent: false, reason: "nothing_due" });
  }

  const result = await sendIdempotentResendEmail(
    { from: `Damtech Operations <${getQuoteFromEmail()}>`, to, subject: email.subject, text: email.text, html: email.html },
    `ops-reminder-${today}`,
  );
  await db
    .from("ops_reminder_runs")
    .update({
      status: result.ok ? "sent" : "failed",
      item_count: email.itemCount,
      error: result.ok ? null : result.reason,
      sent_at: new Date().toISOString(),
    })
    .eq("run_date", today);
  return json({ ok: result.ok, sent: result.ok, items: email.itemCount }, result.ok ? 200 : 502);
}

export const GET = handle;
export const POST = handle;
