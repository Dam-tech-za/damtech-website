# Admin architecture

The admin is a Next.js App Router section at `/admin/` backed by Supabase (Postgres + Auth + Storage). It is the source of truth for website enquiries (RFQs), online kit orders, quotations, customers and the pricing library. There is no external CRM; nothing here duplicates another system.

## Request flow and access control

1. `proxy.ts` (runs only on `/admin`, `/auth`) refreshes the Supabase session and redirects signed-out visitors to `/admin/login/?next=…`.
2. `app/admin/layout.tsx` loads the admin profile (`getCurrentAdmin`). No profile → login; inactive or not allow-listed → `/admin/unauthorised/`.
3. Each page calls `requireAdmin()`; each mutation calls `assertAdmin({ permission })` (returns errors instead of redirecting). Role → permission map: `lib/auth/permissions.ts` (`owner > admin > sales > estimator > viewer`).
4. Postgres RLS is enabled on every table; policies use `is_active_admin()` / `has_admin_role()`.
5. Public submissions write through server actions with the service-role client (`lib/supabase/admin.ts`), rate-limited, never exposed to the browser.
6. `/admin/*` responses carry `X-Robots-Tag: noindex` and `Cache-Control: private, no-store`; `robots.txt` disallows `/admin/`.

## Information architecture

Defined once in `lib/admin/navigation.ts` and used by the desktop sidebar, the mobile menu, breadcrumbs and page titles.

| Group | Item | Route | What it is for |
|---|---|---|---|
| Overview | Overview | `/admin/` | "Needs attention" list, then period activity |
| Sales | Enquiries | `/admin/rfqs/` | All website quote requests and contact messages (RFQ numbers) |
| | Quotations | `/admin/quotes/` | Quote builder, approval, sending, PDF |
| | Orders | `/admin/orders/` | Invoice-only tank kit orders from the online shop |
| | Customers | `/admin/customers/` | Customer records linked to enquiries and quotes |
| Estimating | Pricing | `/admin/pricing/` | Materials, labour, travel, tank models, CSV import |
| | Project templates | `/admin/pricing/project-templates/` | Reusable quote content |
| | Suppliers | `/admin/pricing/suppliers/` | Supplier directory |
| Administration | Settings | `/admin/settings/` | Company, email, PDF, quote numbering, estimating rules, System health |
| | Audit log | `/admin/audit/` | Every important change, who and when |

The suggested "Projects", "Content" and "Analytics" areas were deliberately **not** added: projects and blog content live in code (`lib/projects.ts`, `lib/posts-data.json`) with no editing backend, and analytics live in GA4/Search Console. Adding menu items for them would be empty modules.

Active item = the nav item whose href is the longest prefix of the path (`activeNavItemId`). Breadcrumbs and the header title are derived on the client from `usePathname()` because the shared layout does not re-render on client navigation.

## Overview ("Needs attention")

`lib/admin/dashboard/get-dashboard-metrics.ts` runs all counts in parallel; `lib/admin/dashboard/attention.ts` turns them into at most eight action items, each linking to a filtered list:

| Item | Source | Link |
|---|---|---|
| Emails failed to send (urgent) | `rfq_communications.status = failed` + orders with a failed email | The affected enquiry/order |
| New enquiries not yet reviewed (urgent after 2 days) | `rfqs.status = new`, oldest first | `/admin/rfqs/?status=new&sort=submitted_asc` |
| Orders awaiting an invoice | `catalogue_orders.status = pending_invoice` | `/admin/orders/?status=pending_invoice` |
| Waiting on customer / site measurement / ready to quote | `rfqs.status` | Filtered enquiries |
| Quotations awaiting approval / expiring in 7 days | `quotes` | Filtered quotations |

A failed query is shown as "could not be loaded", never as zero. If the main queries fail the page shows an error banner (`metrics.loadError`).

## Enquiry status model (unchanged)

`new → reviewing → information_required / site_measurement_required → ready_for_quote → converted`, plus `closed`, `spam`, `archived` (Postgres enum `rfq_status`, `lib/rfq/statuses.ts`). Labels: `RFQ_STATUS_LABELS`. Moving away from `new` stamps `reviewed_at`. Every change writes an `rfq_events` timeline row and an `audit_log` row.

Order statuses: `pending_invoice → invoice_sent → awaiting_payment → paid → processing → ready_for_delivery → completed`, or `cancelled` (`lib/orders/types.ts`, labels in `lib/admin/labels.ts`). Changes are written to `audit_log` and shown as the order's History.

## Mutations and feedback

Simple admin forms use `AdminActionForm` (`components/admin/ui/AdminActionForm.tsx`) with Server Actions of the form `(prevState, formData) => Promise<AdminActionState>` (`lib/admin/action-state.ts`):

- The submit button shows "Saving…" and is disabled while the request runs.
- Success text appears only after the server confirms the write; failures appear as an alert with a plain message (`describeActionError` never returns database text).
- Optional `confirmMessage` asks before destructive or irreversible changes; `resetOnSuccess` clears fields (new notes) only after a confirmed save. Failed saves keep what the user typed.

Converted to this pattern: enquiry status, assignment, spam/close, notes, measurement schedule; order status and cancel. Forms that redirect on completion (convert to quote, information request) use `AdminSubmitButton` for the pending state and show results through URL messages, as before. The quote builder and pricing screens have their own client-side state handling and were not changed.

## List ↔ detail navigation

`AdminListMemory` on the Enquiries and Orders lists stores the current list URL (search, filters, page) in `sessionStorage`; `AdminBackLink` on the detail page links back to it, falling back to the plain list.

## Integrations

| Integration | Where | Health visible in admin |
|---|---|---|
| Resend email | `lib/email`, `lib/rfq/notify-public-rfq.ts`, `lib/orders/email` | Per-enquiry Notifications panel; order email status; failed emails on the Overview; Settings → Email test send |
| Supabase keepalive cron | `app/api/cron/supabase-keepalive` | Settings → System health |
| Quote expiry / reminder crons | `app/api/cron/expire-quotes`, `quote-reminders` | Quotation statuses |
| Upstash rate limiting | `lib/rate-limit` | Settings → System health probe |
| GA4 / GTM / Meta Pixel | public site only; admin paths excluded (`lib/analytics/private-paths.ts`) | Not in admin (use GA4) |
