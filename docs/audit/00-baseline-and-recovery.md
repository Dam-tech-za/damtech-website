# 00 — Baseline and recovery

Captured 18 Oct 2026, 13:25–13:45 SAST (11:25–11:45 UTC), from the owner's desktop checkout.

## Git state at start
| Item | Value |
|---|---|
| Remote | `origin` → `github.com/Dam-tech-za/damtech-website` |
| `main` (= production source) | `4ce56eb` "Sync branch with main after production merge" |
| Redesign merge on `main` | `0f2db92` (deployed 18 Oct 2026, owner approved) |
| Last pre-redesign production commit | `8d1acc8` (17 Oct 2026 17:51 +0200) |
| WordPress → Next.js migration | `a563383` "Initial Damtech migration" (19 Jun 2026) |
| Audit branch | `claude/project-thread-7zqlsd`, cut from `4ce56eb` |
| Uncommitted work preserved | `DAMTECH_CLAUDE_CODE_MASTER_MISSION.md`, `examples/` (owner files, untouched, not committed) |
| Tags | none |

## Environments (secret names only)
| System | Evidence | Notes |
|---|---|---|
| Production | `https://www.dam-tech.co.za` on Vercel (`server: Vercel`, edge `cpt1`), project `damtech-website` (`prj_1iFz…`) | HSTS `max-age=63072000`, CSP, `X-Frame-Options: DENY` |
| Apex / old Vercel host | `dam-tech.co.za`, `damtech-website-six.vercel.app` → 308 to www (`vercel.json`, `lib/redirects.ts`) | |
| Supabase | project ref in CSP `ziyjuftbbrjqerjlitav`; env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | No local `.env.local`; no test branch |
| Email | Resend (`RESEND_API_KEY`, RFQ email config in `lib/rfq/email/config.ts`) | |
| Rate limiting | Upstash (`UPSTASH_REDIS_REST_URL/TOKEN`), in-memory fallback | |
| Cron (Vercel) | `/api/cron/expire-quotes/` 04:00, `/quote-reminders/` 04:30, `/supabase-keepalive/` ×3 daily (`CRON_SECRET`) | |
| Tracking | GTM → GA4 `G-F01WG96KRG`, Meta Pixel, Vercel Speed Insights; present on all 114 rendered HTML pages | |
| Merchant feed | `/feeds/google-merchant.tsv` (served, `X-Robots-Tag: noindex`) | |
| Accounting (Xero) | No Xero integration found in code | |

## Access available to this audit
- Live production (read-only HTTP + headless Chromium): **yes**.
- Search Console: **export only** (`google_analytics/*.csv`, 15 Jul–14 Oct 2026, 3 months, web search). No live API access.
- GA4: **export only** (`google_analytics/Reports_snapshot.csv`, 19 Sep–16 Oct 2026).
- Vercel API: **blocked** — `403 forbidden` for deployments and runtime-error endpoints on team scope `damtech`; Vercel CLI not installed. Production deployment SHA therefore taken from git (`main` = `4ce56eb`; release record `docs/development/release-verification.md`).
- Supabase data / admin login: **not available** (no test admin account, no test branch). Live write paths not exercised.
- Internet Archive: **offline** during the audit (CDX API returned "Temporarily Offline" twice), so no WordPress-era page content could be retrieved.

## Pre-change evidence
- `docs/seo/snapshots/baseline.json` — pre-redesign site (`8d1acc8`) rendered locally, 75 routes (from the release session).
- `docs/seo/snapshots/live-2026-10-18.json` — live production captured at the start of this audit, 75 routes, before any change on this branch.
- `docs/audit/01-route-inventory.json` / `.csv` — full live crawl, 153 URLs, captured 13:32 UTC before any change.
- Screenshots (desktop 1366 px + mobile 390 px for every rendered URL) in `test-results/audit-screens/` (local only, gitignored).

## Recovery and rollback
- Code: this branch only adds commits on top of `4ce56eb`; revert the merge or individual commits. No data migrations, no Supabase changes, no env changes.
- Production: Vercel "Instant Rollback" to the current production deployment, or `git revert` and push `main`.
- Nothing in this audit writes to Supabase, sends email or creates leads.
