# Admin audit — baseline defects (18 Oct 2026)

Scope: every route under `app/admin/` (41 pages, 4 route handlers, 12 server-action files), the admin layout and proxy, the Supabase data layer used by the admin, and the production database schema and aggregate counts (read-only, via the Supabase connector; no customer data was read or changed).

## How the admin is actually used (live data, counts only)

| Table | Rows | What it tells us |
|---|---|---|
| `rfqs` | 61 | **All 61 are status `new`, none assigned.** Statuses have never been moved, so the inbox cannot show what is waiting. |
| `rfqs` by channel | 48 simple quote, 10 contact form, 2 calculator, 1 catalogue invoice request | Contact-form enquiries (10) have no email records — matches the contact-form email bug fixed on 18 Oct. |
| `rfq_communications` | 102 (51 admin + 51 customer, all `sent`) | Email delivery is recorded per enquiry; no failures. |
| `catalogue_orders` | 5, all `pending_invoice` | Includes test order DT-20261018-8VW2JHQC that still needs cancelling. |
| `quotes` | 0 | Quote builder, pricing library, templates and suppliers are built but unused. |
| `admin_profiles` | 1 owner | Single-user admin today. |

## Defects found

### Navigation and orientation
1. **Orders missing from the expanded sidebar.** `NAV_GROUPS` in `components/admin/layout/AdminSidebar.tsx` did not include `orders`, so the page the owner was told to use ("Admin → Orders") was only reachable from the collapsed icon rail, which also had **no Orders icon**.
2. **Two menu items highlighted at once.** Prefix matching made Pricing active on Suppliers and Project Templates pages (both desktop and mobile menus).
3. **Mobile menu stayed open after tapping a link** (CSS checkbox toggle in the persistent layout) and had no Escape handling; items were an ungrouped flat list.
4. **Breadcrumbs went stale and showed raw IDs.** They were computed in the server layout, which does not re-render on client navigation, and detail pages showed the UUID as a crumb.
5. **Inconsistent naming**: "RFQs", "Quotes", "Dashboard", "Create RFQ" (which opens the public quote form).
6. **No way back to a filtered list** from an enquiry or order without losing search and filters.

### Feedback and error handling
7. **Every enquiry and order save was silent.** Status, assignment, note, measurement and order-status actions returned `void`; failures were only `console.error`. No pending state, no success message, no error message — the core "does not reliably communicate what is happening" complaint.
8. **Destructive/irreversible clicks had no confirmation**: Mark spam, Close RFQ, order status change to cancelled.
9. **Raw codes shown to the user**: status dropdown values like `site_measurement_required`, timeline `status_changed`, notification `admin_notification · sent`, order email `pending_configuration`, ISO timestamps for terms acceptance.
10. **Raw database error text returned** by bulk RFQ actions (`error.message`).
11. **Orders list showed "No orders" when the query failed**, and had a `page` parameter with no pagination controls.
12. **Re-saving the measurement schedule pulled an enquiry back** to `site_measurement_required` even if it had moved on to Ready for Quote or Converted.

### Overview (dashboard)
13. **Fabricated zeros on failure.** `getDashboardMetrics` returned an all-zero object on any error and treated failed counts as 0, so a database outage looked like "no new enquiries".
14. **Nothing told the owner what to do.** No "needs attention" list; 61 unreviewed enquiries and 5 orders awaiting invoice were invisible. Orders and email failures were not on the dashboard at all; order audit entries had no link.

### Code health
15. Four dead duplicate components (`components/admin/AdminShell.tsx`, `AdminSidebar.tsx`, `AdminHeader.tsx`, `AdminModulePlaceholder.tsx` — the last a "coming soon" placeholder).
16. Bulk actions re-ran the admin auth check and an insert once per selected enquiry.
17. Admin CSS (`styles/admin-*.css`, ~27 KB) is imported into `app/globals.css` and therefore downloaded by every public page. Not changed here: `/q/[token]` and `/quote/info/[token]` reuse admin classes, so moving it needs its own change and visual check.

### Security
| Check | Result |
|---|---|
| Unauthenticated access | All admin pages, exports and the company-assets API redirect to login or return 403/405 (verified with curl against a production build). |
| Server actions | Every exported admin action runs `requireAdmin`/`assertAdmin` with a named permission, directly or in the `lib/` function it calls (scripted check over all `"use server"` files). |
| Cron routes | Protected by `authorizeCronRequest`. |
| Service-role key | Server-only env var; never `NEXT_PUBLIC_`. |
| Indexing | `/admin/*` sends `X-Robots-Tag: noindex, nofollow, noarchive`; `robots.txt` disallows `/admin/`; sitemap has no admin URLs. |
| Login redirect | `next` is restricted to `/admin…` paths (no open redirect). |
| Supabase advisor | 14 `SECURITY DEFINER` functions executable by `anon`; mutable `search_path` on `set_updated_at`; leaked-password protection off; `public_submission_rate_limits` RLS with no policy (intentional, service-role only). A reviewed fix is drafted in `docs/admin/proposed-advisor-fixes.sql` and **not applied**. |

## Not verified (blocked)
No test admin login or non-production Supabase project exists, and there is no `.env.local`. Clicking through authenticated pages against real data, persistence of saves, and role restrictions in the browser could not be done. See `docs/admin-test-results.md`.
