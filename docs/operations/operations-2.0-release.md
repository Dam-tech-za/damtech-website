# Operations 2.0: completion and release notes (27 Oct 2026)

Branch `claude/project-thread-s3q680`. This builds on the foundation that went to production on 26 Oct (PR #7). Design reference: `operations-2.0-design.md`. Monday data check: `monday-migration-check.md`.

## What was added

| Area | Built |
|---|---|
| Projects | Create manually (`/admin/operations/projects/new/`), edit name, customer, lead, owner and OneDrive folder, archive completed jobs. Accepted Xero quotes still create one project per quote (ACCEPTED → INVOICED never duplicates). |
| Board | Automatic groups (Awaiting deposit / confirmation, Planning & materials, Scheduled & on site, Handover & final payment, Completed). Board or compact table, search, filters for service, stage and payment (including Overdue), sort by next action. Inline stage change. Phones get cards. |
| Project page | Sections: Overview, Tasks, Materials, Financials (read-only from Xero), Documents, Notes, History. Next action with owner, On hold as a flag with a reason, checklist tasks with owners, OneDrive and document links, notes. |
| Payment label | Derived from linked Xero invoices only and never editable: Deposit not invoiced, Deposit invoiced, Deposit paid, Balance due, Paid in full, plus Overdue. Handles part payments, credit notes (Kingdom Pumps shows paid), voided invoices, several invoices and value not yet invoiced. |
| Invoice linking | The sync links an invoice only when its reference names the project's quote or the invoice number is already on the project. A customer-name match is only a suggestion: it goes to **Unmatched Xero records** (`/admin/operations/xero-review/`), where choosing the project once stores the invoice number on it, so it is linked automatically from then on. |
| Materials | Statuses: Not ordered, Quote requested, Quoted / awaiting approval, Ordered, Paid, Ready for collection, Collected / delivered, Problem / on hold (plus Cancelled). Client supplies flag. Unit, received date, fulfilment notes, Xero bill number. Project materials status rolls up from its orders. Procurement page has search, status filter and inline status change. |
| Dashboard | What needs attention: overdue, due today, no next action, on hold, next 7 days, needs review; Done / reschedule from the dashboard; supplier orders awaiting action; unmatched Xero count. |
| Daily reminder | `/api/cron/ops-reminders/` at 05:15 UTC (07:15 SAST), Mon–Sat. Plain code, no AI. One email per day (day claimed in `ops_reminder_runs`, Resend idempotency key), nothing sent when nothing is due. |
| Monday import | `scripts/ops-monday-import.ts` maps to the new statuses and prints an audit (created, skipped, flagged, orders). Amounts never come from Monday. |

## Tests run

- `npx tsc --noEmit`: clean.
- `npm run lint`: 0 errors (35 existing warnings, none in Operations files).
- `npm test`: 443 passing, including `board.test.ts` (groups, payment labels with the Kingdom Pumps, Clinton and Pexmart cases, materials roll-up, attention buckets, invoice classification) and `reminders.test.ts`.
- `npm run build`: passes; all Operations routes and the reminder cron compile.
- Isolated database (in-memory Postgres, not Supabase): foundation + v2 migration applied over existing data, re-run, rolled back and re-applied; old statuses mapped; constraints, one project per quote, one reminder per day, RLS on and service-role-only grants on the new tables. 19 checks passed.
- Browser: the board table and phone cards rendered with sample data through a temporary page (removed). The real admin screens were **not** checked logged in.

Not verified: the screens against the real database (the v2 columns don't exist in production until the migration is applied), and a live reminder email.

## Deployment steps (need the owner's go-ahead)

Order matters: the new code reads the v2 columns, so the migration goes first.

1. Apply `supabase/migrations/20261027150000_operations_v2.sql` to the Damtech Admin project. It is additive: renames two order statuses (`ready` → `ready_for_collection`, `received` → `collected_delivered`), adds columns and two tables. Production currently has 0 projects and 0 orders. Rollback: `supabase/rollbacks/20261027150000_operations_v2_down.sql`.
2. Optional Vercel env vars: `OPS_REMINDER_EMAIL` (comma-separated, default `LEAD_INBOX_EMAIL` or info@), `OPS_REMINDERS_ENABLED=false` to switch the email off.
3. Merge to `main` (Vercel deploys).
4. Run a Xero sync from Operations, then check `/admin/operations/xero-review/`.
5. Monday import (needs the Monday data, see below): dry run, then `--write`, then sync again.

## Monday migration: blocked

Monday is not connected in this session, so the 7 projects and 4 orders were not re-read today. The 26 Oct check is in `monday-migration-check.md`. To import, either connect Monday or export the two boards to JSON in the shape `scripts/ops-monday-import.ts` expects. Keep Monday running until the imported jobs have been checked in the admin.

## Old quote builder and pricing: keep for now

Production has 2 quotes in `quotes`, the latest from 21 Jul 2026, none in the last 60 days. It is still referenced by the public quote link page `/q/[token]`, RFQ detail and actions, customer pages, the admin dashboard metrics and settings (company, PDF, quotes, estimating). Removing it is not a safe side effect of this work. Suggested next step if the owner agrees: hide Quotes and Pricing from the admin navigation, keep `/q/[token]` working for the two existing links, and remove the code in a separate change.

## Financials

`/admin/operations/financials/` (from the foundation) shows Xero figures labelled Actual, Forecast or Estimate with the last refresh time, and keeps showing the last snapshot when Xero is unreachable. Unchanged in this branch.
