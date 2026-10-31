# DamTech Calendar: implementation plan

Live checklist. Update as phases land. Audit: `architecture-audit.md`.

| Phase | Scope | Needs from owner | State |
| --- | --- | --- | --- |
| 0 Audit | Repo + database review | none | Done 31 Oct |
| 1 Database | `20261031160000_ops_calendar.sql`: teams, members, resources, bookings, team/resource allocations with no-overlap constraint, audit, Outlook tables, `ops_calendar_save_booking()` | Go-ahead to apply the migration; confirm the two starting teams (Andre, Arno) | Written, not applied |
| 2 Calendar tab | `/admin/operations/calendar/`: team × day grid (week), month view, day list on phones, unscheduled backlog, booking drawer (create, move, resize by editing times, multi-team, cancel), leave/maintenance blocks, filters, clash and readiness warnings, audit history. Outlook off. | none | Next |
| 3 Outlook outbound | Graph client (client credentials, server only), event mapping, outbox worker (after-save + pg_cron), ETag/transactionId idempotency, health panel in Settings → System | Microsoft 365 admin steps in `microsoft-365-setup.md`; one test shared mailbox | Waiting on Microsoft setup |
| 4 Outlook inbound | Webhook route with validation + clientState, subscription renewal, delta reconciliation, conflict review screen, external blockers | Same | After 3 |
| 5 Lifecycle | Backlog rules, deposit and materials warnings, "fill project dates from bookings", actual vs planned, on-hold review | none | With 2 |
| 6 Release | Tests, build, harness checks, staged rollout behind flags | "Deploy" per release | — |

## Release 1 (what ships first)

Phases 1, 2 and 5 behind `OPS_CALENDAR_ENABLED`. Usable daily with no Microsoft dependency. Outlook (3, 4) follows once a test mailbox exists.

## Decisions

- Table names follow the repo's `ops_*` prefix, not `operations_*`.
- No FullCalendar: the team grid is built from existing admin components (licence and design reasons, see audit).
- Bookings are work sessions; a project may have many. Leave, vehicle maintenance and travel are bookings without a project.
- Overlaps are refused by the database. A manager can override with a written reason, which is audited.
- Outlook is a mirror of DamTech, never the source. Outlook edits are proposals.
