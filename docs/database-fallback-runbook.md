# Database fallback runbook

When Supabase is unavailable, public quote, contact and catalogue order forms can deliver enquiries through Resend using a clearly marked **DATABASE FALLBACK** email. This is not a stored RFQ or order.

## How fallback messages appear

- **Subject:** `[DATABASE FALLBACK] <form type> — <INCIDENT ID>`
- **Visual:** Red border banner stating manual RFQ/order is required
- **Separate alert:** `[DATABASE FALLBACK ALERT]` concise operational note

Search the DamTech inbox for `DATABASE FALLBACK` or the incident ID (8-character ref).

## Incident ID vs RFQ number

| | Fallback incident ID | Real RFQ |
|---|---|---|
| Format | 8-char ref from UUID (e.g. `A1B2C3D4`) | `RFQ-2026-00042` |
| Shown to customer | Yes, on fallback success page | Yes, on normal success |
| Database row | **No** | Yes |
| Upload token | **No** | Yes |

Never treat an incident ID as an RFQ or order reference.

## Manual RFQ creation

1. Open the `[DATABASE FALLBACK]` email.
2. Search inbox for the same **incident ID** or **submission ID suffix** to avoid duplicate processing.
3. In admin, create a new RFQ/customer with the validated details from the email.
4. Contact the customer to confirm and issue the formal `RFQ-…` reference.
5. Request attachments again if the email notes files were not uploaded.

## Manual catalogue order

1. Follow the same deduplication search.
2. Create the order manually in admin using SKU, quantity and billing details from the fallback email.
3. Send the formal order reference and invoice through the normal process.

## Submission ID

Each public form sends a client-generated UUID (`submissionId`) in a hidden field. It is included in the internal fallback email suffix for cross-checking. It is **not** shown to customers as a reference.

## Duplicate protection

1. **Resend idempotency key:** `database-fallback/<form-type>/<submission-id>` — retained **24 hours** by Resend. Retries with the same submission ID do not send duplicate emails.
2. **Upstash (optional):** Used for keepalive alert outage state, not required for fallback dedupe.

## Confirming Supabase recovery

1. Resume a paused project in the Supabase dashboard if needed.
2. Check Vercel cron logs for `supabase_keepalive` with `ok: true`.
3. Submit a test enquiry in Preview (not Production customers) or use admin → System settings ping.
4. Watch for keepalive recovery email: `Damtech alert: Supabase keepalive recovered`.

## Keepalive alert idempotency

Failure alerts use Resend keys `keepalive-failure/<environment>/<cooldown-window>`. Recovery uses `keepalive-recovery/<environment>/<outage-started-at>`. Upstash optionally tracks outage state across instances.

Resend idempotency retention is **24 hours** for all keys above.
