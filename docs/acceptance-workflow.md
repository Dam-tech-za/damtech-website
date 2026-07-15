# Acceptance workflow

## Accept (`/q/[token]/`)

Requires:

- Confirmation checkbox
- Customer name
- Optional job title, PO/reference, note

Stores:

- `accepted_at`
- `acceptance_metadata` (name, optional fields, quote snapshot hash, optional IP hash, short UA summary)
- Status `accepted`
- Quote event

Wording used: **Electronic quotation acceptance** — not represented as a qualified electronic signature.

Notifications: customer confirmation + Damtech internal email.

## Reject

Requires confirmation; optional reason and revision request. Status `rejected`. Reason is internal only.

## Expiry

UI computes days remaining from `valid_until` even if cron has not run. Daily cron marks overdue `sent`/`viewed` quotes as `expired` when `CRON_SECRET` is configured.
