# Vercel cron setup

## Jobs (`vercel.json`)

| Path | Schedule (UTC) | Purpose |
|------|----------------|---------|
| `/api/cron/expire-quotes` | `0 4 * * *` | Mark overdue sent/viewed quotes expired |
| `/api/cron/quote-reminders` | `30 4 * * *` | Expiry / not-viewed / not-answered reminders |

## Security

Both routes require:

```http
Authorization: Bearer $CRON_SECRET
```

They return JSON only (no redirects).

Set `CRON_SECRET` in the Vercel project environment.

## Plan limitations

Hobby / lower Vercel plans may only allow daily crons. That is enough for these jobs. Expiry badges and “days remaining” still calculate dynamically from `valid_until` if cron misses a day.

## Reminder deduplication

`quote_notification_log` unique `(quote_id, notification_key)` prevents duplicate reminder emails for the same day/key.
