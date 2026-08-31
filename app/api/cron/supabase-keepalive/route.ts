import { NextResponse } from "next/server";
import { handleSupabaseKeepalive } from "@/lib/cron/supabase-keepalive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

/**
 * Scheduled Supabase database keepalive.
 * Protected by CRON_SECRET (Vercel sends Authorization automatically).
 * Performs a read-only RPC against Postgres — no customer data is written.
 */
export async function GET(request: Request) {
  const result = await handleSupabaseKeepalive(request);

  return NextResponse.json(result.body, {
    status: result.status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
