# Email setup (quotations)

## Environment variables

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key |
| `QUOTE_FROM_EMAIL` | From address (must be verified in Resend) |
| `QUOTE_REPLY_TO_EMAIL` | Customer replies |
| `QUOTE_INTERNAL_NOTIFY_EMAIL` | Accept/reject/reminder alerts (optional; falls back to `LEAD_INBOX_EMAIL`) |

## Send flow

1. Quote approved (or owner override)
2. PDF generated and stored
3. Public token created (hash stored)
4. Snapshots written
5. Resend email with secure link (+ PDF attachment if &lt; 8MB)
6. Only on success: status → `sent`, communication + event + audit rows

Provider failure does **not** mark the quote as sent; the fresh token is revoked.

## Domain verification

Verify `dam-tech.co.za` (or the from-domain) in the Resend dashboard before production sends.
