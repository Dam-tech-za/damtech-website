# Procurement: implementation plan

Live checklist. Audit: `architecture-audit.md`. Xero details: `xero-integration.md`.

| Phase | Scope | Needs from owner / others | State |
| --- | --- | --- | --- |
| 0 Audit | Repo, database, bridge | none | Done 31 Oct |
| 1 Database | `20261031180000_ops_procurement.sql`: order columns, wider statuses, lines, receipts (over-receipt guard, reversal with reason), progress view, documents, Xero bill links, private bucket | Owner go-ahead to apply | Written; tested on a scratch Postgres (old rows stay valid, over-receipt blocked, reversal needs a reason, duplicate files blocked, project delete blocked, bucket private). Not applied. |
| 2 Project Materials | Order drawer on the project page: lines, status, dates, receipts, documents, Xero bill picker; project cost summary (estimated / committed / billed / paid) | Phase 1 | Next |
| 3 Supplier orders tab | Metrics (open, awaiting approval, overdue, this week, partial, bills outstanding), filters, sort, order drawer, links to project | Phase 1 | After 2 |
| 4 Xero bills | Pick an existing ACCPAY bill (bridge `get_invoices` bills), link, refresh amounts; never mark paid locally | Phase 1 | With 2 |
| 4b Xero purchase orders + attachments | New bridge tools; attachments need a new Xero scope and re-consent | Bridge builder (prompt in `xero-integration.md`), owner re-consent | Blocked |
| 5 Documents + receipts | Upload to private bucket, signed downloads, receipts per line | Phase 1 | With 2 |
| 6 Calendar readiness | Required-on-site vs booking start, partial receipts, overdue deliveries in the booking warnings | Phase 1 | After 2 |
| 7 Multi-project allocation | Split a purchase's lines across projects, reconcile to 100 % | — | Later (recommended second phase) |

## Rules

- `ops_projects` stays the master record; every order has a `project_id`.
- Operational status and payment are separate. Payment shows only Xero's figures, with "last refreshed".
- Approving an order is a separate permission from linking Xero money records.
- Nothing is sent to Xero from procurement in this release.
