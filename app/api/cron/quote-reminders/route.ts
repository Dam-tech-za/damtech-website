import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendInternalQuoteNotification } from "@/lib/quotes/email";
import { formatQuoteNumber } from "@/lib/quotes/types";
import { addDaysToIsoDate, todayIsoDateJohannesburg } from "@/lib/quotes/totals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReminderSpec = {
  key: string;
  daysUntilExpiry?: number;
  status: string[];
  requireUnviewed?: boolean;
  requireViewedUnanswered?: boolean;
  label: string;
};

const REMINDERS: ReminderSpec[] = [
  {
    key: "expires_in_7",
    daysUntilExpiry: 7,
    status: ["sent", "viewed"],
    label: "Quote expires in 7 days",
  },
  {
    key: "expires_in_3",
    daysUntilExpiry: 3,
    status: ["sent", "viewed"],
    label: "Quote expires in 3 days",
  },
  {
    key: "expires_today",
    daysUntilExpiry: 0,
    status: ["sent", "viewed"],
    label: "Quote expires today",
  },
  {
    key: "sent_not_viewed",
    status: ["sent"],
    requireUnviewed: true,
    label: "Sent quote not viewed",
  },
  {
    key: "viewed_not_answered",
    status: ["viewed"],
    requireViewedUnanswered: true,
    label: "Viewed quote not answered",
  },
];

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorised" }, { status: 401 });
  }

  const service = createServiceRoleClient();
  const today = todayIsoDateJohannesburg();
  let sent = 0;

  for (const reminder of REMINDERS) {
    let query = service
      .from("quotes")
      .select(
        "id, quote_number, revision_number, title, status, valid_until, first_viewed_at, sent_at, email",
      )
      .eq("is_latest_revision", true)
      .in("status", reminder.status);

    if (typeof reminder.daysUntilExpiry === "number") {
      const target = addDaysToIsoDate(today, reminder.daysUntilExpiry);
      query = query.eq("valid_until", target);
    }
    if (reminder.requireUnviewed) {
      query = query.is("first_viewed_at", null);
    }
    if (reminder.requireViewedUnanswered) {
      query = query.not("first_viewed_at", "is", null);
    }

    const { data: quotes } = await query.limit(100);

    for (const quote of quotes ?? []) {
      const notificationKey = `${reminder.key}:${today}`;
      const { error: insertError } = await service
        .from("quote_notification_log")
        .insert({
          quote_id: quote.id,
          notification_key: notificationKey,
          metadata: { label: reminder.label },
        });

      if (insertError) {
        // Unique violation = already reminded
        continue;
      }

      const display = formatQuoteNumber(
        quote.quote_number,
        quote.revision_number ?? 0,
      );
      const result = await sendInternalQuoteNotification({
        subject: `${reminder.label}: ${display.label}`,
        body: [
          reminder.label,
          `Quote: ${display.label}`,
          `Title: ${quote.title}`,
          `Valid until: ${quote.valid_until}`,
          `Status: ${quote.status}`,
        ].join("\n"),
      });

      if (result.ok) sent += 1;
    }
  }

  return NextResponse.json({ ok: true, remindersSent: sent, date: today });
}
