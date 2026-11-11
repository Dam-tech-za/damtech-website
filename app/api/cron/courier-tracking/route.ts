import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { COURIER_NAME, courierStatusFields, getCourierConfig, getCourierTracking } from "@/lib/courier";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isSupabaseServiceConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const maxDuration = 60;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Daily Courier Guy tracking check (Vercel cron). Protected by CRON_SECRET.
 * Reads the courier's status for every booked order that is not delivered yet
 * and saves it on the order. Read-only on the courier side; emails nobody.
 */
async function handle(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return json({ ok: false, error: "Unauthorised" }, 401);
  const courier = getCourierConfig();
  if (!courier.ok) return json({ ok: true, skipped: "courier_not_configured" });
  if (!isSupabaseServiceConfigured()) return json({ ok: true, skipped: "database_not_configured" });

  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("catalogue_orders")
    .select("id, tracking_number, dispatched_on, delivered_on")
    .eq("courier_name", COURIER_NAME)
    .not("tracking_number", "is", null)
    .is("delivered_on", null)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    console.error("[courier-tracking] list failed:", error.message);
    return json({ ok: true, skipped: "tracking_columns_missing_or_query_failed" });
  }

  let updated = 0;
  let failed = 0;
  for (const order of data ?? []) {
    const result = await getCourierTracking(courier.config, String(order.tracking_number));
    if (!result.ok) {
      failed += 1;
      continue;
    }
    const fields = courierStatusFields(order, result.data, new Date().toISOString());
    const { error: saveError } = await db
      .from("catalogue_orders")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    if (saveError) {
      console.error("[courier-tracking] save failed:", saveError.message);
      failed += 1;
    } else {
      updated += 1;
    }
  }
  return json({ ok: true, checked: (data ?? []).length, updated, failed });
}

export async function GET(request: Request) {
  return handle(request);
}
