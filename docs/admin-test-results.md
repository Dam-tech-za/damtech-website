# Admin test results (18 Oct 2026)

Branch `claude/project-thread-s3q680`, local production build (`next build && next start -p 3100`). Supabase environment variables were **not** available locally.

## Executed and passing

| Check | Command / method | Result |
|---|---|---|
| Type check | `npx tsc --noEmit` | Clean |
| Lint | `npm run lint` | 0 errors (35 pre-existing warnings, none in changed files) |
| Unit tests | `npm test` | **350/350 pass** (18 new in `lib/admin/admin-navigation.test.ts`) |
| Production build | `npm run build` | Passes |
| Public SEO regression | `seo-snapshot.mjs` vs `live-2026-10-18.json`, 75 routes | **0 differences** (titles, descriptions, canonicals, headings, links, JSON-LD) |
| Signed-out access | curl on `/admin/`, `/admin/rfqs/`, an RFQ detail, `/admin/orders/`, `/admin/quotes/new/`, `/admin/settings/system/`, `/admin/audit/`, both CSV exports | All 307 → `/admin/login/`, all `X-Robots-Tag: noindex, nofollow, noarchive` |
| Admin API signed out | `/api/admin/company-assets/` GET / POST | 405 / 403 |
| Indexing | `robots.txt`, `sitemap.xml` | `/admin/` disallowed; 0 admin URLs in sitemap |
| Server-action guards | Script over every `"use server"` file | Every admin mutation checks auth + permission directly or in the `lib/` function it calls |

### New unit tests (`lib/admin/admin-navigation.test.ts`)
- Every nav item sits in exactly one sidebar group; Orders is visible for every role allowed to open it; empty groups are dropped for viewers.
- Only the most specific nav item is active (Suppliers/Project templates no longer also light up Pricing); `/admin/rfqsx` matches nothing.
- Breadcrumbs show "Enquiry"/"Order" instead of UUIDs; page titles are plain English.
- Attention list: empty when all zero; failed emails first and urgent; old new enquiries urgent with age; singular wording; failed queries shown as unavailable, not zero; day maths and bad dates.
- Action results never include database error text; auth errors explained.
- Every order status has a readable label; unknown codes fall back to readable text.

### Browser checks of the new components (Playwright, Chromium)
A temporary page outside `/admin` (deleted before commit, never pushed) rendered the real `AdminShell`, `AttentionPanel` and `AdminActionForm` with a stub action, because authenticated admin pages cannot render without Supabase. Results:

| Check | Result |
|---|---|
| Sidebar at 1440 px shows four groups incl. Orders with its icon | Pass |
| Mobile menu at 390 px: grouped, opens from the header button, closes on Escape | Pass |
| Save: "Saving…" while pending, then "Status changed to Reviewing." | Pass |
| Failed save: message announced as an alert, typed text kept | Pass |
| Status select keeps the saved value after success | Pass |
| Layout at 1440 / 768 / 390 px | Screenshots in `docs/design/screenshots/admin/` (local only, that folder is gitignored; sent to the owner in the project thread). The public header/footer around them are an artefact of the temporary page. |
| Console errors from admin components | None (only local-only Vercel Speed Insights 404 and Meta Pixel bot-blocking noise from the public shell) |

## Not executed — blocked

| Check | Why | Needed |
|---|---|---|
| Click-through of every authenticated admin page with real data | No test admin login, no `.env.local`, no non-production Supabase project | Test admin account + Supabase branch (or `.env.local` pointing at one) |
| Persistence of status/assignment/note/order changes | Would write to production; tests must use non-production data | Same as above |
| Role restrictions in the browser (sales/estimator/viewer) | Only one (owner) profile exists | Test accounts per role on a branch |
| Visual regression run `npm run test:visual` | Needs `PLAYWRIGHT_ADMIN_EMAIL/PASSWORD` | Test admin login |
| Production verification after deploy | Not deployed yet; needs owner login | Owner checks after deploy (list in completion report) |
