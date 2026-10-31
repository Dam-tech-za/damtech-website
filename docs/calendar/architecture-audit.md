# DamTech Calendar: architecture audit

31 Oct 2026. Phase 0 of the Calendar and Team Scheduling spec. Checked against the repository on `main` (019c8de) and the production "Damtech Admin" database (read-only queries).

## What already exists

| Area | Finding | Use for the calendar |
| --- | --- | --- |
| Projects | `ops_projects` is the single record per won job (migration `20261026150000_operations_foundation`). 12 active projects. | Bookings reference `ops_projects.id`. No second project table. |
| Stages | `awaiting_deposit → planning → scheduled → in_progress → handover → completed`, with `on_hold` as a flag (`lib/operations/lifecycle.ts`). Supply-only jobs skip the install stages. | Backlog is `planning` and `awaiting_deposit` jobs with no confirmed booking. The calendar never moves a stage on its own. |
| Dates | `ops_projects.scheduled_start` and `scheduled_end` are plain dates, empty on all 12 active projects. | Keep as the project's planned window; offer to fill them from bookings (on confirm), never silently. |
| Crews | `ops_projects.crew` is free text. Live values: "Andre" (8 projects) and "Arno" (4). | Seed two teams, Andre's team and Arno's team, after the owner confirms. No team table exists. |
| Payment | `payment_status`, `amount_paid` and `amount_due` are a cache written by the Xero sync. Stage guard blocks leaving `awaiting_deposit` while unpaid unless overridden. | Deposit readiness = existing `payment_status`. Calendar reads it, never writes it. |
| Materials | `ops_material_orders` with `status` and `expected_date` per project. `materials_by_client` flag. | Materials readiness warning before confirming a booking. |
| Activity | `ops_project_activity` holds the project timeline. | Booking changes also write a summary line there, so the project page shows them. |
| Auth | Supabase auth + `admin_profiles.role` (`owner`, `admin`, `sales`, `estimator`, `viewer`). `PERMISSIONS.manageOperations` = owner, admin, sales, estimator. Two-step verification now required for admins. | Edit = `manageOperations`; view = the `ops-projects` nav roles. No new auth. |
| DB access | ops_* tables grant nothing to anon/authenticated; server code checks the role and uses the service role (`lib/operations/admin-db.ts`). | Same pattern. Booking writes go through one SQL function for atomicity. |
| Background jobs | Vercel crons are daily only (`vercel.json`). Supabase has `pg_cron` and `pg_net` installed. | Outlook outbox worker: run right after each save (Next `after()`), plus a `pg_cron` job every few minutes calling a protected route. |
| UI | Admin template `AdminSheet`, `AdminToolbar`, peek drawers, `styles/admin-*.css`. Projects page is `ProjectsWorkspace` with board/table views. | Calendar is a new page beside Projects using the same template and the existing project peek drawer. |
| Calendar/Outlook | No calendar, Microsoft Graph or MSAL code anywhere. No Microsoft credentials in the environment. | Everything Outlook-related is new and starts switched off. |
| Tests | Node test runner, list in `package.json` (520 tests). No browser E2E suite in CI; Playwright scripts used ad hoc. | Pure scheduling rules get unit tests; Graph is mocked. |

## Missing

Teams, bookings, team/resource allocations, overlap protection, scheduling audit, Outlook connection, event links, outbox, sync state, conflict review, external blockers. All in `supabase/migrations/20261031160000_ops_calendar.sql` (not applied).

## Constraints found

- **Vercel cron is daily only**, so a minute-level sync worker must come from `pg_cron` + `pg_net` (already installed) or from processing inline after each save.
- **btree_gist is not installed.** The per-team no-overlap rule needs it. Enabling it is additive.
- **FullCalendar's team timeline is a paid Premium feature.** The spec's own release-1 needs (team rows × days, week, month, backlog) are a small grid. Recommendation: build the grid with the existing admin components, no calendar library, no licence. Revisit only if drag-resize across many teams becomes painful.
- **Microsoft 365 tenant, mailboxes and app registration are unknown.** Nothing can be verified until the owner (or their Microsoft admin) completes `microsoft-365-setup.md`.
- The board shows `crew` today. Teams should replace it gradually: keep `crew` readable, show booked teams beside it, do not rewrite old values.

## Risks

| Risk | Mitigation |
| --- | --- |
| Double-booking from two managers saving at once | Database exclusion constraint on `(team_id, during)`; the save function returns a clear clash message. |
| Outlook loop or duplicate events | Graph `transactionId` per link, ImmutableId, ETag `If-Match`, version on each booking, events tagged with the DamTech booking id. |
| Outlook edits overwrite the plan | Inbound changes become conflict rows for a manager to accept or reject; never applied automatically. |
| Leaking customer data into shared calendars | Outlook events carry title, site town, team and a link to the admin only. No prices, phone numbers or notes. |
| Calendar changing money or stages | Calendar code has no write path to payment fields or `stage`. Stage moves stay on the project page. |

## Migration and rollback

Additive migration, applied only with the owner's go-ahead. Rollback = drop the new function and the 13 new tables in reverse order; no existing table is altered. Feature flags: `OPS_CALENDAR_ENABLED`, `OPS_CALENDAR_OUTLOOK_OUTBOUND`, `OPS_CALENDAR_OUTLOOK_INBOUND` (all off by default; Outlook flags stay off until the test calendar passes).
