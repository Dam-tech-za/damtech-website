# Production SEO & QA execution plan

Written 18 Oct 2026 after discovery (crawl, GSC/GA4 exports, code review). Branch `claude/project-thread-7zqlsd`. Status values: not started · in progress · implemented · tested · deployed · verified · blocked.

No P0 issue was found: all 75 sitemap URLs return 200 with unchanged SEO, every URL with Search Console clicks resolves, no unintended `noindex`, no lead-path crash.

| ID | Pri | Area / files | Problem (evidence) | Change | Risk / rollback | Test | Status |
|---|---|---|---|---|---|---|---|
| P1-1 | P1 | `lib/redirects.ts` | 10 URLs Google reported returned 404 (`docs/seo/old-vs-new-regression.md`) | 7 permanent redirect rules (literal + pattern) to the intended pages | Low; remove rules | `lib/redirects.test.ts`, e2e redirect test, curl all 10 | tested — deploy pending |
| P1-2 | P1 | `components/PublicRfqWizard.tsx` | Submit-time re-check skipped the Measurements step (`draft.stage === 3` instead of `stage === 3`), so a visitor could jump to Review with an unnamed/empty asset and get a generic server error | Validate the requested stage | Very low; one-line revert | offline spec "wizard re-checks assets" | tested — deploy pending |
| P1-3 | P1 | `scripts/seo-snapshot.mjs`, `screenshots.mjs`, `perf-lab.mjs` | QA scripts loaded GTM/Pixel when pointed at production, polluting GA4/Meta | Block analytics (snapshot, screenshots); drop collection beacons only (perf-lab, keeps realistic cost) | None (tooling) | code review; crawl | implemented |
| P1-4 | P1 | `tests/e2e/*`, `playwright.public.config.ts`, `lib/calculators-reference.test.ts` | No automated public-journey or calculator reference coverage | 35 browser tests + 22 calculator unit tests; offline-submit spec refuses non-localhost | None | `npx playwright test -c playwright.public.config.ts`; `npm test` | tested |
| P1-5 | P1 | Supabase / admin | Admin and live write paths unverified (no test login/branch) | Owner creates Supabase branch + test admin; then run blocked scenarios in `docs/qa/01-user-journey-matrix.md` | — | — | blocked (owner) |
| P1-6 | P1 | Supabase security | Advisor (earlier session): 14 SECURITY DEFINER functions executable by `anon`, mutable `search_path` on `set_updated_at`, leaked-password protection off | Draft a migration revoking `anon` EXECUTE where not needed + set `search_path`; apply only with owner approval on a branch first | Medium (could break public RFQ numbering if `next_rfq_number` is needed by anon — must test on branch) | branch test of public RFQ submit | blocked (approval + branch) |
| P2-1 | P2 | `lib/posts-data.json` | 6 dead external links in blog posts | Repointed to verified DWS/CSIR homepages or unlinked | Low | external re-check | implemented |
| P2-2 | P2 | `app/brand.css`, `components/Breadcrumbs.tsx` | Footer phone/email and breadcrumb links below 24 px tap height | inline-block + padding | Low (visual) | measured; footer screenshot | tested |
| P2-3 | P2 | GA4 | Singapore bot traffic ≈ 18% of active users | GA4 data filter / report exclusion | — | — | owner action |
| P2-4 | P2 | `lib/calculators-config.ts` | Possible freeboard double count in dam-lining tool (help text vs formula) | Owner chooses: reword depth help or default freeboard 0 | Commercial assumption — not changed | reference test #1–3 | blocked (owner decision) |
| P2-5 | P2 | GSC | Post-launch recrawl | Resubmit sitemap; monitor Pages report and 28-day comparison | — | — | owner action |
| P2-6 | P2 | Local SEO | GBP, reviews, residential proof (`docs/seo/04-local-seo-recommendations.md` L1–L5) | Owner actions; code ready for case studies | — | — | owner action |
| P3-1 | P3 | Sitemap | `lastmod` only on blog posts | Add only if real page-modified dates are tracked | — | — | deferred |
| P3-2 | P3 | Cross-browser | Only Chromium available | Install Firefox/WebKit for Playwright when approved; rerun suite | — | — | blocked (download approval) |
| P3-3 | P3 | Perf | CWV field data inaccessible | Owner shares Vercel Speed Insights / GSC CWV, or grants API access | — | — | blocked (access) |
| P3-4 | P3 | Content | Name residential systems and warranties precisely | Owner confirms products | — | — | blocked (owner) |
| P3-5 | P3 | Backlinks | Supplier/press/association links (L4, L8) | Owner outreach | — | — | owner action |

## Execution order used
P1-1 → P1-2 → P1-3 → P2-1 → P2-2 → P1-4 (tests written alongside), then full gates: `tsc`, `eslint` (0 errors), `npm test` (329/329 + new), `next build`, Playwright 35/35, SEO snapshot diff vs live (0 differences on 75 routes).

## Deployment
Production deploy requires the owner's go-ahead (standing rule). Ready to merge: the changes are additive redirects, one wizard bug fix, tap-target CSS, blog link repairs, tests and docs. After merge: re-run `node scripts/audit-crawl.mjs https://www.dam-tech.co.za docs/audit` and `PLAYWRIGHT_BASE_URL=https://www.dam-tech.co.za npx playwright test -c playwright.public.config.ts public-journeys` (read-only).
