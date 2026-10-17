# Site Optimisation Results — October 2026

Session date: 17 October 2026. Branch: `feat/residential-waterproofing`. Detailed per-route findings: `docs/site-audit.md`. Measurement plan and GTM steps: `docs/seo-growth-baseline.md`. Photography needs: `docs/image-requirements.md`.

## Status summary

| Area | Implemented | Tested | Deployed |
|---|---|---|---|
| Static rendering + proxy scope | Yes | Build output, cache headers, crawl | **No** — see Deployment |
| Lead events + attribution | Yes | Unit tests, browser test (dataLayer, attribution payload) | No |
| Security fixes + Next.js 16.4.2 | Yes | Typecheck, lint, unit tests, build, `npm audit`, browser test of analytics gating | No |
| SEO metadata, headings, links | Yes | Full crawl before/after | No |
| Content accuracy | Yes | Typecheck/tests; owner confirmations listed in site-audit.md | No |
| Residential waterproofing page | Yes | Desktop/mobile screenshots, crawl | No |
| GTM / GA4 key events | Documented only | — | Owner action (needs GTM access) |

## Commits

1. `4f49858` Move waterproofing hub to /waterproofing with residential focus (owner WIP) — owner's uncommitted work, unchanged.
2. `1971b31` Static rendering, lead tracking, residential waterproofing and SEO fixes.
3. `bca4613` Security hardening, Next.js 16.4.2, content accuracy and faster fonts.
4. Documentation commit (this file and the three other reports).

## Routes reviewed

All 79 public routes listed in `docs/site-audit.md` (69 sitemap URLs + 10 utility/archive routes), 68 legacy redirects, and the admin/token/API surface via code review.

## Issues fixed

**Performance**
- Root layout read request headers → every page dynamic and `Cache-Control: private, no-store`. Now 60+ public pages prerender with CDN-cacheable headers.
- Middleware ran a Supabase `auth.getUser()` round-trip on every public request; now only `/admin` and `/auth`.
- Five preloaded Inter weights → one variable font file.

**Security** (from an independent review of the code)
- Next.js 16.2.9 → 16.4.2 and sharp 0.35.5 (critical/high advisories). Production `npm audit`: 0 vulnerabilities (dev-only `braces` advisory remains in build tooling).
- Analytics no longer loads on token pages; upload token removed from the success-page URL.
- LIKE-wildcard escaping in customer email matching; honeypot submissions rate limited before storage; info-request answers bounded; constant-time cron secret checks; noindex on info-request pages; unused remote image host removed.

**Lead generation / measurement**
- `generate_lead`, `phone_click`, `whatsapp_click`, `email_click` dataLayer events; first-touch attribution saved on each RFQ.
- "Roof / home waterproofing" option on the quote form, preselected from `/waterproofing/` CTAs.
- `/waterproofing/`: hero CTAs (free assessment, WhatsApp photos), Overstrand section + FAQ, approved warranty wording, layout fix.
- Quote page hero no longer shows a button linking to itself (form starts higher on mobile).

**SEO / content**
- 22 blog posts: new meta titles and descriptions (previously truncated or duplicated the title).
- HDPE guide rewritten from legacy WordPress markup (hydration error, dead buttons, heading levels).
- Titles/descriptions shortened on 12 key pages; double-brand titles; 404 title; nested `<main>`; heading skips; orphaned cost guide; mobile table overflow.
- Editorial/technical pass on service, regional, FAQ and intro copy; circular-dam wall areas recalculated in two case studies.
- Skip-to-content link.

## Tests executed (17 Oct 2026, cloud copy of the repo)

| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | 0 errors (35 pre-existing warnings, mostly unused vars) |
| `npm test` | 297 / 297 pass (8 new tests: attribution parser, contact-event classification, analytics path rules) |
| `next build` (16.4.2) | Pass |
| Playwright crawl, 79 routes × 6 viewports | 78 × 200, 1 × 404 (expected); 0 horizontal overflow; 0 JS/hydration errors (was 1 page with hydration error, 1 with overflow) |
| Legacy redirects | 68/68 resolve via 301/308 to a 200 page |
| Browser flow: `/waterproofing/?utm_*` → CTA → `/quote/` | Service preselected; attribution captured and posted; phone/WhatsApp click events pushed |
| Quote submission without backend | Graceful error with phone/email/WhatsApp fallback; no false `generate_lead` |
| Analytics gating | GTM/Pixel requested on `/`; not requested on `/q/…`, `/quote/info/…`, upload page, `/admin/login/` |

**Not verified here:** a successful submission end-to-end into Supabase with email notifications (no credentials in this environment, and no test data was sent to production). Verify on the Vercel preview or production with one clearly-labelled test enquiry, then delete it in admin.

**Build note for this environment only:** Google Fonts is unreachable from the build sandbox, so builds here used `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` with the same Inter files served locally. No repository change was needed; Vercel builds fetch fonts normally.

## Before / after measurements (lab, local production build)

TTFB is from `curl` on the same machine (median of 15). Lighthouse is mobile, simulated throttling, third-party tags blocked, median of 3 runs. These are lab numbers; real-user Core Web Vitals come from Vercel Speed Insights after deployment.

| Page | Cache-Control before → after | TTFB before → after | Lighthouse perf | LCP (lab) | TBT (lab) |
|---|---|---|---|---|---|
| `/` | private, no-store → s-maxage (static) | 26 ms → 5 ms | 78 → 81 | 5.3 s → 4.5 s | 147 → 164 ms |
| `/steel-water-storage-tanks/` | same | 20 ms → 4 ms | 83 → 88 | 4.5 s → 3.8 s | 84 → 90 ms |
| `/hdpe-dam-lining/` | same | 16 ms → 3 ms | 86 → 90 | 4.1 s → 3.6 s | 85 → 79 ms |
| `/waterproofing/` | same | 10 ms → 3 ms | 90 → 91 | 3.7 s → 3.5 s | 72 → 72 ms |

Local TTFB excludes the removed Supabase auth round-trip (no Supabase here), so the production gain should be larger. Accessibility and SEO Lighthouse scores were 100 before and after.

## Deployment status

**Not deployed.** Push access to `Dam-tech-za/damtech-website` was not granted to this session, so nothing was pushed to GitHub or Vercel. The changes were written into the owner's local working tree (see the session summary for the commands that attach the commit history). To ship:

1. `npm install` (Next.js 16.4.2), `npm run build`, check `localhost:3000`.
2. Push the branch and open a PR → check the Vercel preview (home, `/waterproofing/`, `/quote/`, one admin page).
3. Submit one labelled test enquiry on the preview/production and confirm the RFQ shows `attribution` in admin and the notification email arrives; delete the test RFQ.
4. Merge to `main`; verify production returns `x-vercel-cache: HIT` on public pages; resubmit the sitemap in Search Console.
5. Apply the GTM changes in `docs/seo-growth-baseline.md` §3.

**Rollback:** revert the merge commit on `main` (Vercel redeploys the previous build), or use Vercel → Deployments → "Promote" on the previous production deployment.

## Remaining limitations / next steps

- Nonce-based CSP to remove `script-src 'unsafe-inline'` (needs care with GTM; test on preview).
- Upload size/MIME checked from client-declared values; add a per-RFQ file cap and post-upload verification.
- Add `server-only` guards to service-role modules (`lib/supabase/admin.ts`, `lib/email/config.ts`, `lib/auth/audit.ts`); `SendQuoteDialog` (admin, client) imports `lib/email/config`.
- Detailed RFQ wizard (`/calculators/` quote preparation) does not yet send attribution.
- Meta Pixel `PageView` fires only on full page loads, not client-side navigations.
- Hidden page scrollbar (`html { scrollbar-width: none }`) is a design choice that reduces orientation for mouse users; consider restoring.
- Owner confirmations listed in `docs/site-audit.md` (tank capacities, case-study areas, technical claims).
- Residential photography (see `docs/image-requirements.md`).
