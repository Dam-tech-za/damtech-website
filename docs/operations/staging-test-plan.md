# Operations 2.0 — staging test plan

Goal: prove the whole flow against real Xero data without touching production data and without turning on automatic sync.

## Set-up: an isolated database with real Xero reads

| Piece | Staging value | Why |
|---|---|---|
| Database | A **Supabase branch** of "Damtech Admin" (paid; Supabase shows the cost before it is created) | Projects, links and snapshots written in tests never reach production |
| Website | A **Vercel Preview** deployment of `claude/project-thread-yssxtx` | Production keeps serving `main` |
| Preview env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | The **branch** values | Preview writes only to the branch |
| Preview env: `XERO_BRIDGE_URL` | The production bridge URL `https://ziyjuftbbrjqerjlitav.supabase.co/functions/v1/xero-bridge` | The bridge and its single Xero login stay where they are |
| Preview env: `XERO_BRIDGE_API_KEY` | The new **read-only** bridge key (`docs/operations/xero-bridge-read-key/`) | Staging can read Xero and cannot change it |
| Preview env: `OPS_XERO_SYNC_ENABLED` | Unset | No automatic sync, so every run is started by hand |
| Admin login | Tiaan signs in on the preview, or a test admin is added to the branch's `admin_email_allowlist` | Needed to see the screens |

Xero call budget: a baseline run is about 4 calls plus one per linked quote. A normal sync is 4–6 calls, and a financial refresh about 7. The whole plan uses well under 100 of the roughly 1,000 calls a day.

## Steps and expected results

| # | Step | Expected | Covers |
|---|---|---|---|
| 1 | Apply `20261026150000_operations_foundation.sql` to the branch, then the rollback script, then the migration again | Applies cleanly each time. Advisors show no new warnings | Migration is additive and reversible |
| 2 | Open `/admin/operations/` before any sync | "Run first sync (baseline)" is offered. No figures are invented | Clear empty states |
| 3 | `node --experimental-strip-types scripts/ops-monday-import.ts export.json` (dry run), then `--write` against the **branch** | 7 projects and 4 supplier orders. Pexmart and Kingdom Pumps are in Handover with "confirm" notes | Monday migration |
| 4 | Run the import again | "skip (exists)" for every row, no duplicates | Idempotent import |
| 5 | Click **Run first sync (baseline)** | Every older accepted or invoiced quote from the last 120 days is recorded as baseline (count shown in the message), and 0 projects are created. The 7 Monday quotes that Xero shows as accepted or invoiced get linked (QU0288 stays unlinked while it is SENT) | No old jobs imported |
| 6 | Click **Sync with Xero now** | Invoices INV0137, 0139, 0140, 0142, 0143, 0144 and 0153 are linked to the right jobs. Payment shows Part paid for Hire Eng., Clinton, Francois and Pexmart, and Paid in full for Boscobel and Kingdom Pumps | Invoice matching, payment status |
| 7 | Compare each project's Invoiced, Paid and Due with `docs/operations/monday-migration-check.md` | Every figure is identical | Financial references |
| 8 | Sync twice more | 0 new projects, 0 new links, 0 payment updates | Duplicate prevention |
| 9 | When the next real quote is marked Accepted in Xero (or TMS Redec QU0288 is accepted), click Sync | Exactly one new project in Awaiting deposit with "Confirm the deposit invoice…" due today and "Check details" flagged. If it is QU0288, it attaches to the migrated TMS Redec job instead | Accepted quote → one project |
| 10 | Try to move a project with no payment from Awaiting deposit to Planning | Refused unless "Proceed without a deposit" is ticked. Supply-only jobs never show install stages | Lifecycle rules |
| 11 | Add, update and receive a supplier order; set and clear On hold; change the next action | Each change saves, appears in Activity, and an empty next action is refused | Procurement and next actions |
| 12 | Open `/admin/operations/financials/` and click **Refresh from Xero** | YTD from 1 Mar 2026. Revenue, gross profit, expenses and net profit match Xero's P&L for the same dates. Cash matches the bank summary, and debtors and creditors match Xero's aged reports | Financials (actual) |
| 13 | Check the forecast table by hand: bank + open invoices − open bills by due month | Same numbers. The opex estimate is shown apart and is not deducted | Forecast vs estimate |
| 14 | Sign in as a viewer or sales role | No Financials in the menu, and `/admin/operations/financials/` redirects. Projects are read-only for a viewer | Access control |
| 15 | Call the bridge with the read key: `POST /api/send_invoice` | 403 "This key is read-only" | Server-enforced read-only |
| 16 | Call `/api/cron/xero-sync/` without and with `CRON_SECRET` while `OPS_XERO_SYNC_ENABLED` is unset | 401, then `{"skipped":"disabled"}` | Sync cannot start by accident |
| 17 | Check the public site on the preview (home, RFQ form, calculators) and run the SEO snapshot diff | No changes to public pages | Public site preserved |

Automated already (`npm test`, 404 tests): accepted-quote import, duplicate prevention, baseline, invoice matching incl. ambiguous cases, payment status incl. credit notes and overdue, stage rules, bridge client allowlist, P&L/bank/ageing parsing, forecast arithmetic, FY dates, Monday mapping, navigation and roles. Bridge read key: 8 tests in `docs/operations/xero-bridge-read-key/`.

## Go-live, after staging passes (each step needs Tiaan's yes)

1. Deploy the bridge read-key patch and set `BRIDGE_READ_API_KEY`.
2. Set `XERO_BRIDGE_API_KEY` (read key) in Vercel Production.
3. Merge to `main` → production deploy.
4. Run the Monday import against production, then the baseline sync, then one manual sync. Check step 7 again.
5. Schedule pg_cron (every 15 min, 06:00–19:00 SAST) to POST `/api/cron/xero-sync/` with `CRON_SECRET`, and set `OPS_XERO_SYNC_ENABLED=true`.
6. Run Monday in parallel for one to two weeks, then cancel it.
