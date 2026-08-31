# Vercel cron setup

## Jobs (`vercel.json`)

| Path | Schedule (UTC) | Purpose |
|------|----------------|---------|
| `/api/cron/expire-quotes/` | `0 4 * * *` | Mark overdue sent/viewed quotes expired |
| `/api/cron/quote-reminders/` | `30 4 * * *` | Expiry / not-viewed / not-answered reminders |
| `/api/cron/supabase-keepalive/` | `15 4 * * *` | Supabase Postgres keepalive (morning) |
| `/api/cron/supabase-keepalive/` | `15 12 * * *` | Supabase Postgres keepalive (midday) |
| `/api/cron/supabase-keepalive/` | `15 20 * * *` | Supabase Postgres keepalive (evening) |

## Security

All cron routes require:

```http
Authorization: Bearer $CRON_SECRET
```

Vercel injects this header automatically when `CRON_SECRET` is set on the project.

They return JSON only (no redirects). With `trailingSlash: true`, cron paths in `vercel.json` must include the trailing slash — Vercel Cron does not follow redirects, so a `308` to the canonical URL would never reach the handler.

Set `CRON_SECRET` in the Vercel project environment.

## Supabase keepalive

The keepalive route calls the existing read-only RPC `rfq_infrastructure_ping` using the service role. It does not insert or update customer, RFQ, or quote data.

On failure it sends one internal Resend alert per cooldown window. **Resend idempotency keys** (`keepalive-failure/<env>/<window>`) are the primary cross-instance duplicate guard (24-hour retention). Upstash is optional for outage-state tracking. A recovery alert is sent after the next successful ping if a previous failure was recorded (`keepalive-recovery/<env>/<outage-started-at>`).

See also `docs/database-fallback-runbook.md` for public-form fallback handling when Supabase persistence fails.

Required env vars:

- `CRON_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` and internal notification email vars for failure/recovery alerts
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (recommended for alert cooldown and outage state across instances)

## Plan limitations

Hobby / lower Vercel plans allow multiple cron jobs, but **each cron expression may only run once per day**. Three separate daily schedules to the same keepalive route are valid on Hobby. Vercel may invoke a daily cron at any point within the scheduled hour (±59 minutes on Hobby).

Quote expiry/reminder crons alone are **not** reliable keepalives: they only run once each morning, may return `401` before touching Supabase when `CRON_SECRET` is missing, and do not provide midday/evening database activity.

## Reminder deduplication

`quote_notification_log` unique `(quote_id, notification_key)` prevents duplicate reminder emails for the same day/key.
