# Damtech Admin — security checklist

Use this checklist before treating `/admin` as production-ready.

## Authentication & authorisation

- [ ] Google OAuth enabled in Supabase (no password sign-up UI on `/admin/login`)
- [ ] Only approved emails exist in `admin_email_allowlist`
- [ ] First owner inserted manually via SQL (not hardcoded in git)
- [ ] Unapproved Google user is redirected to `/admin/unauthorised/` and signed out
- [ ] Inactive allowlist / profile cannot reach `/admin`
- [ ] `requireAdmin()` / `assertAdmin()` used on protected pages and mutations
- [ ] Navigation hiding is **not** treated as security

## Row Level Security

- [ ] RLS enabled on `admin_profiles`, `admin_email_allowlist`, `audit_log`
- [ ] Anon role has no policies (deny by default)
- [ ] Authenticated non-admin cannot `select` allowlist or audit rows
- [ ] Only `owner` can mutate allowlist (verify in SQL editor as a non-owner JWT)
- [ ] Service role used only on the server (`lib/supabase/admin.ts`)

Verify quickly:

```sql
select * from public.admin_email_allowlist; -- as anon should fail / return 0 under RLS
```

## Secrets

- [ ] `SUPABASE_SERVICE_ROLE_KEY` never prefixed with `NEXT_PUBLIC_`
- [ ] Service role key not visible in client bundles / HTML
- [ ] `.env.local` not committed
- [ ] Preview deployments do not expose production service role unless intentional

## Sessions & cookies

- [ ] `@supabase/ssr` cookie client used (no deprecated auth-helpers)
- [ ] `proxy.ts` refreshes auth cookies
- [ ] Sign-out clears session and redirects to `/admin/login/`
- [ ] HTTPS only in production

## Network / headers

- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy` set
- [ ] `Permissions-Policy` set
- [ ] `X-Frame-Options: DENY` / CSP `frame-ancestors 'none'`
- [ ] CSP still allows GTM, Meta Pixel, Supabase, Google OAuth, Next images
- [ ] Admin responses include `X-Robots-Tag: noindex`

## SEO (not security)

- [ ] `/admin/` and `/auth/` in `robots.txt` disallow
- [ ] Admin excluded from sitemap
- [ ] Admin layout metadata has `robots: { index: false, follow: false, nocache: true }`

## Rate limiting

- [ ] Understand in-memory limiter is **degraded** on serverless
- [ ] Plan Upstash (or equivalent) before high-risk exposure
- [ ] Login initiation and sensitive actions call `rateLimit()` abstraction

## Operational

- [ ] Audit log records login, logout, access denied
- [ ] Documented process to deactivate admins
- [ ] Documented process to rotate service-role key
- [ ] Localhost OAuth URLs removed from Google/Supabase when no longer needed
- [ ] Vercel production domain primary is `www.dam-tech.co.za`

## Manual access tests

1. Incognito → `/admin/` → redirects to `/admin/login/`
2. Google account **not** on allowlist → `/admin/unauthorised/`
3. Allowlisted owner → `/admin/` dashboard
4. Viewer role → Settings/Audit hidden or blocked
5. Sign out → session gone; `/admin/` redirects to login again
