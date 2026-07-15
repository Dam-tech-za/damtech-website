# RFQ workflow

## Public intake

1. Visitor submits `/quote`, `/contact`, or calculator-prefilled quote form.
2. Server action `submitLead`:
   - rate-limits
   - validates with Zod (`lib/rfq/schema.ts`)
   - rejects/ignore honeypot (`website` field) as spam RFQ
   - emails the team (existing Resend flow)
   - inserts legacy `leads` row (best-effort)
   - creates/matches `customers` and inserts `rfqs` with `next_rfq_number()`
3. Browser redirects to `/thank-you`.

## Admin triage

1. Open `/admin/rfqs/`
2. Filter/search via URL query params
3. Bulk update status or open `/admin/rfqs/[id]/`
4. Assign staff, add notes, change status, convert to draft quote

## Statuses

`new` → `reviewing` → `information_required` / `ready_for_quote` → `converted` / `closed` / `spam`

## Convert to quote

`convertRfqToQuote` creates a Phase 2 `quotes` draft, copies project + calculator data, suggests editable line items, sets RFQ `converted`, and blocks accidental duplicates unless `forceSecondQuote` is set.
