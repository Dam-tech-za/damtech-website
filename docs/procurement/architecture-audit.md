# Procurement: architecture audit

31 Oct 2026. Phase 0 of the Procurement & Supplier Orders spec. Checked against `main` and the production "Damtech Admin" database (read-only), and the deployed Xero bridge source (v14, read-only).

## What exists

| Area | Finding | Decision |
| --- | --- | --- |
| Supplier orders | `ops_material_orders` (operations_foundation): one row per supplier order on a project: supplier (free text + optional `suppliers.id`), description, free-text quantity, unit, status, fulfilment, expected/received dates, cost excl. VAT, `xero_bill_id`/`xero_bill_number`. **0 rows in production.** | Keep it as the supplier order record. Add columns and child tables; do not create a second orders table. |
| Statuses | `not_ordered, quote_requested, quoted, ordered, paid, ready_for_collection, collected_delivered, problem, cancelled` (from Monday). "paid" mixes money into the operational status. | Widen to a superset (adds approved, manufacturing, in_transit, partially_received, on_hold). Keep "paid" valid for old rows, stop offering it; payment comes from Xero. |
| Project page | `/admin/operations/projects/[id]` has a "Materials and supplier orders" section with add / edit / quick status. | Becomes the main place to create and manage orders (lines, receipts, documents, bills). |
| Supplier orders tab | `/admin/operations/procurement/`: table with search and status filter, links to projects. | Becomes the cross-project dashboard (metrics, filters, sort, order drawer). |
| Readers of the table | Overview dashboard, project board materials badge, calendar readiness, ops reminders cron, project delete guard. | All keep working: only additive columns; status values they test for are unchanged. |
| Suppliers | `suppliers` (internal list: name, contact, terms, lead time) and `supplier_prices` (pricing library), no Xero contact id. | Orders keep `supplier_id` for the internal list and gain `xero_contact_id` for the Xero supplier. No new supplier table. |
| Products | `pricing_items` library. | Order lines may point at a `pricing_items` row; free-text lines allowed. |
| Storage | Private buckets `rfq-attachments`, `quote-pdfs`, `company-assets`; service-role access pattern in `lib/storage/company-assets.ts`. | New private bucket `procurement-documents`, 20 MB, PDF/images/Office only, signed URLs. |
| Xero bridge | Website reads through the bridge only (no second OAuth app). `get_invoices {kind:"bills"}` returns supplier bills (ACCPAY) with number, contact, dates, status, subtotal, tax, total, amount paid/due. **No purchase-order tools and no attachment tools.** Scopes include `accounting.invoices.read` and `accounting.payments.read`; no attachments scope. | Bills: link and refresh now. Purchase orders and attachments: need new bridge tools (prompt in `xero-integration.md`); attachments also need a new Xero scope and re-consent. |
| Calendar | `readinessWarnings()` counts orders not yet delivered. | Extend with required-on-site vs booked start date and partial receipts. |
| Roles | `manageOperations` = owner, admin, sales, estimator; viewer read-only; `runXeroSync` = owner, admin. | View = ops nav roles; create/edit/receive/upload = manageOperations; approve orders and link Xero bills = owner/admin (new `approveProcurement`). |

## Risks

- Double counting: an order total, its Xero purchase order and its Xero bill are one commitment at three stages. The project summary shows estimated / committed / billed / paid as separate columns and never adds them.
- A bill can cover several orders, or an order several bills. Links are many-to-many; the project summary counts each Xero bill once.
- Linking by supplier name alone is refused; a person picks the bill from a list filtered by supplier and date.
- Xero unavailable: operational fields keep working; money columns show their last refresh time.

## Rollback

Migration `20261031180000_ops_procurement.sql` is additive. Rollback drops the new tables, view, trigger, bucket and columns, and restores the original status check.
