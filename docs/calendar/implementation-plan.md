# DamTech Calendar: implementation plan

Live checklist. Update as phases land. Audit: `architecture-audit.md`.

| Phase | Scope | Needs from owner | State |
| --- | --- | --- | --- |
| 0 Audit | Repo + database review | none | Done 31 Oct |
| 1 Database | `20261031160000_ops_calendar.sql`: teams, members, resources, bookings, team/resource allocations with no-overlap constraint, audit, Outlook tables, `ops_calendar_save_booking()` | Owner approved 31 Oct | Applied to production 31 Oct 2026 as "ops_calendar"; teams "Andre's team" and "Arno's team" added. Clash rule re-checked on production inside a rolled-back transaction. |
| 2 Calendar tab | `/admin/operations/calendar/`: team × day grid (week), month view, day list on phones, unscheduled backlog, booking drawer (create, move, resize by editing times, multi-team, cancel), leave/maintenance blocks, filters, clash and readiness warnings, audit history. Outlook off. | none | Built 31 Oct (week/month/phone agenda, backlog, booking drawer, teams, warnings, history). Drag-and-drop not in v1: move a booking by editing its dates, which also works by keyboard. Shows "not switched on" until the migration is applied. |
| 3 Outlook outbound | Graph client (client credentials, server only), event mapping, outbox worker (after-save + pg_cron), ETag/transactionId idempotency, health panel in Settings → System | Microsoft 365 admin steps in `microsoft-365-setup.md`; one test shared mailbox | Waiting on Microsoft setup |
| 4 Outlook inbound | Webhook route with validation + clientState, subscription renewal, delta reconciliation, conflict review screen, external blockers | Same | After 3 |
| 5 Lifecycle | Backlog rules, deposit and materials warnings, "fill project dates from bookings", actual vs planned, on-hold review | none | With 2 |
| 6 Release | Tests, build, harness checks, staged rollout behind flags | "Deploy" per release | — |

## Release 1 (what ships first)

Phases 1, 2 and 5. The tab stays on a "not switched on" notice until the migration is applied, so the code can ship first. Usable daily with no Microsoft dependency. Outlook (3, 4) follows once a test mailbox exists.

## Decisions

- Table names follow the repo's `ops_*` prefix, not `operations_*`.
- No FullCalendar: the team grid is built from existing admin components (licence and design reasons, see audit).
- Bookings are work sessions; a project may have many. Leave, vehicle maintenance and travel are bookings without a project.
- Overlaps are refused by the database. A manager can override with a written reason, which is audited.
- Outlook is a mirror of DamTech, never the source. Outlook edits are proposals.

## Review round 1 (31 Oct 2026)

Owner design review asked for a proper team planner, continuous multi-day bars, clearer team/status identification, a leaner backlog and an honest Outlook indicator.

| Item | State |
| --- | --- |
| Live booking check | Verified in production: the one booking links to a real project, holds Andre's team, has an audit row; the overlap rule refuses a clashing booking (checked inside a rolled-back transaction). Version check blocks stale edits (scratch DB test). |
| Teams view | (Owner later chose Month as the default view and Ready as the default backlog filter.) One row per team (`ops_teams`), "Lead:" shows the team leader separately from the team; free days show "Available". |
| Multi-day bars | `layoutBars()` lays bookings out as one bar per week row with lanes, in both the Teams and Month views. |
| Identification | Team colour on every bar, team names in Month and phone views, "Tentative" tag plus hatched bar, warning flag when the project has a deposit/materials/hold warning. |
| Backlog | Search, All / Ready / Check filters, compact cards, Hide (remembered per browser). |
| Outlook indicator | Toolbar shows "Outlook not connected" until a calendar connection is enabled; the booking panel says "saved in DamTech only". A booking only reads "In Outlook" once its event link is `synced`, which only the (future) Graph worker sets after Microsoft confirms. |
| Outlook integration | Not implemented. Tables exist; no Graph code, no credentials. Blocked on `microsoft-365-setup.md`. |
| Not done | Drag-and-drop and resize by dragging; resizable sidebar width. |
