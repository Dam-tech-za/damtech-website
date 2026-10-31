# Security review — 31 October 2026

Scope: live site (www.dam-tech.co.za), the Next.js codebase on `main` (efeca43), the
"Damtech Admin" Supabase project, the admin panel, public RFQ/quote/order forms, cron
routes and the Xero bridge integration (PRs #11–#19 included).

Method: read every server action and route handler, checked each one for an auth gate,
ran the Supabase security advisor, read-only SQL on RLS/storage/function definitions,
live HTTP header and endpoint checks, `npm audit`, and a secrets scan of the repo.

## Overall

Good. The fundamentals are sound and nothing critical turned up. One real data leak in
the new Operations board was found and fixed on a branch. Two owner actions from
18 October are still open.

## Findings, most serious first

### 1. Cached Xero quotes could be read without signing in — MEDIUM-HIGH — fixed on branch
`app/admin/operations/board-xero-actions.ts` — `loadBoardXeroQuotesAction` returned its
60-second in-memory cache *before* checking who was calling. Server actions are public
POST endpoints and their ids ship in the admin JavaScript bundle (which is downloadable
without logging in), so for up to a minute after an admin opened the Projects board,
anyone who called that action got the list of accepted Xero quotes (customer names,
quote numbers, amounts). `invalidateBoardXeroQuotesCache` had no check either.

Fix: both actions now call `adminOpsDb()` (admin + Operations role) first.
Branch `claude/project-thread-ey4m76`. Needs merge + deploy to take effect.

### 2. 14 database functions callable through the public API — MEDIUM — awaiting approval
Still open (Supabase advisor, 31 Oct). Checked each definition:
- The pricing `*_sell` functions check for an active admin inside, so they leak nothing.
- `is_active_admin`, `has_admin_role`, etc. only report the caller's own role. Harmless,
  and must stay executable because RLS policies use them.
- **`next_quote_number()` and `next_rfq_number()` are the real issue.** Anyone with the
  public Supabase key (it is in every page) can call them repeatedly and burn numbers,
  leaving gaps or jumps in quote/RFQ numbering.

Fix: `docs/admin/proposed-advisor-fixes.sql` (already written, not applied). Apply on a
Supabase branch first, then production. **Needs Tiaan's go-ahead.**

### 3. Leaked-password protection is off — MEDIUM — one switch
Admin sign-in uses email + password. Supabase can reject passwords that appear in known
breach lists. Supabase dashboard → Authentication → Providers/Settings → Password
security → enable "Leaked password protection". **Tiaan to switch on.**

### 4. No second factor on admin accounts — MEDIUM (recommendation)
The admin panel holds customer records, quotes, pricing and Xero links behind a single
password. Supabase supports TOTP (authenticator app) MFA. Recommend requiring it for
owner/admin roles. This is a feature to build (enrol screen + `aal2` check in
`requireAdmin`); not started.

### 5. Vulnerable dependency (zod) — LOW — fixed on branch
zod 4.4.3 had GHSA-mrhx-c7xc-m3w5 (memory exhaustion on oversized input). Bumped to
4.6.6; `npm audit --omit=dev` now reports 0. Next.js server-action body limit (1 MB)
already limited real-world impact.

### 6. Smaller items — LOW / INFO
- **CSP allows inline scripts** (`'unsafe-inline'`), needed by GTM/Meta Pixel. Acceptable
  trade-off for marketing tags; a nonce-based CSP is possible later but affects caching.
- **HSTS** is `max-age=63072000` without `includeSubDomains`. Fine unless other
  subdomains are served over plain HTTP; check before adding.
- **Admin RFQ search** (`lib/quotes/import-rfq.ts`) interpolates the search text into a
  PostgREST `.or()` filter. Admin-only, so not exploitable from outside, but a comma or
  bracket in a search breaks it. Escape or strip `,()` when next touched.
- **Public form rate limits fail open** if Upstash is down (falls back to Supabase, then
  per-instance memory). Deliberate so leads are never lost; honeypots still apply.
- `public.set_updated_at` has a mutable `search_path` (advisor warning, trivial fix
  included in the proposed SQL).

## What is solid
- Every admin server action (~120) and admin route checks for an active, approved admin
  with the right role server-side, not just in the page.
- Proxy redirects anonymous users away from `/admin`; admin responses are
  `no-store` + `noindex`.
- RLS is enabled on every table in `public` and `xero_bridge`; no anonymous policies.
- All three storage buckets (RFQ attachments, quote PDFs, company assets) are private;
  access is through short-lived signed URLs.
- Customer quote links and upload links use random tokens stored only as SHA-256 hashes,
  with expiry and revocation.
- Cron routes require `CRON_SECRET` with a constant-time compare (live check: 401).
- Service-role key and Xero bridge key are server-only; no secrets committed to git.
- Admin login and password reset are rate-limited and fail closed; reset links are pinned
  to the canonical domain.
- Live headers: HSTS, CSP, `X-Frame-Options: DENY`, `nosniff`, strict referrer,
  Permissions-Policy; HTTP redirects to HTTPS.
- Public forms validate server-side (email and province required), with honeypots and
  rate limits.

## Owner actions
1. Merge and deploy branch `claude/project-thread-ey4m76` (finding 1 + zod).
2. Approve applying `docs/admin/proposed-advisor-fixes.sql` (finding 2).
3. Turn on leaked-password protection in Supabase Auth (finding 3).
4. Decide whether to add authenticator-app MFA for admins (finding 4).
