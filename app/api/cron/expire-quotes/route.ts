import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { writeQuoteEvent } from "@/lib/quotes/events";
import { todayIsoDateJohannesburg } from "@/lib/quotes/totals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Daily expiry pass. Protect with CRON_SECRET.
 * Never redirects — returns JSON only.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorised" }, { status: 401 });
  }

  const today = todayIsoDateJohannesburg();
  const service = createServiceRoleClient();
  const { data: rows, error } = await service
    .from("quotes")
    .select("id, status, valid_until")
    .in("status", ["sent", "viewed"])
    .lt("valid_until", today)
    .eq("is_latest_revision", true);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let expired = 0;
  for (const row of rows ?? []) {
    const { error: updateError } = await service
      .from("quotes")
      .update({ status: "expired" })
      .eq("id", row.id)
      .in("status", ["sent", "viewed"]);
    if (!updateError) {
      expired += 1;
      await writeQuoteEvent(service, {
        quoteId: row.id,
        eventType: "expired",
        actorType: "system",
        metadata: { valid_until: row.valid_until },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    expired,
    checked: rows?.length ?? 0,
    date: today,
  });
}
