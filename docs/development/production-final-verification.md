# Production audit — final verification record

18 Oct 2026. Branch `claude/project-thread-7zqlsd`. Production remains on `main` @ `4ce56eb` until the owner approves a merge.

## Owner summary
- **Route coverage:** 153 / 153 discovered URLs audited in a real browser (75 sitemap pages, 85 Search Console URLs, legacy redirects, internal links, private/utility routes). 114 rendered pages, 35 redirects, 11 not-found (10 real + 1 deliberate test), 3 assets/feeds, 1 admin. Exclusions: admin pages behind login (no test account).
- **SEO preservation:** live site vs the pre-redesign site — 0 differences in titles, descriptions, canonicals, robots, headings, structured data or internal links across all 75 pages. All 85 Search Console URLs accounted for; the 10 that returned 404 (0 clicks) now redirect. WordPress-era copy is not verifiable (Internet Archive offline).
- **Search performance (pre-launch, GSC 15 Jul–14 Oct):** ~1 150 clicks, ~40 650 impressions, 90% South Africa, clicks/day ~6 → ~19. Steel tanks are the biggest opportunity (10.7k impressions, generic terms ranking 20–35). Residential waterproofing has no measurable search demand captured yet; GBP, reviews and real residential case studies are the main levers.
- **Forms / RFQs / calculators:** calculators PASS (18 hand-checked cases + edge cases, UI matches); form validation, bot guard and graceful failure PASS; one wizard validation defect found and fixed; end-to-end save → email → admin → upload **BLOCKED** (no test database/admin).
- **Fixed:** GSC 404 redirects; quote-wizard submit check; 24 px tap targets; 6 dead blog links; QA scripts no longer send analytics hits.
- **Performance:** unchanged this pass; lab figures in `docs/performance/benchmark-comparison.md`; field data blocked (Vercel API 403).
- **Deployed:** not yet — awaiting owner go-ahead.
- **Owner inputs needed:** approve deploy; Supabase test branch + test admin; GBP and review link; confirm "free assessment", opening hours and warranty wording; calculator freeboard choice; GA4 bot filter; resubmit sitemap.

## Acceptance gates
| Gate | Result |
|---|---|
| 1. 100% public URLs audited | PASS (153/153) — `docs/audit/01-route-inventory.*` |
| 2. Old/new comparison, critical regressions resolved | PASS where evidence exists; WordPress copy unverifiable |
| 3. GSC/analytics analysed, no invented rankings | PASS (exports only) — `docs/seo/02-…` |
| 4. Regional/service keyword map | PASS — `docs/seo/03-…csv`, `04-…md` |
| 5. Screenshot-checklist items resolved or blocked | PASS — `docs/seo/05-…` |
| 6. Every public flow + calculator tested incl. submit-to-admin and upload | PARTIAL — submit/admin/upload BLOCKED (test infrastructure) |
| 7. Admin auth + workflows | BLOCKED — anonymous redirect + noindex verified only |
| 8. Build, lint, types, tests, a11y, responsive | PASS — `tsc` clean; `eslint` 0 errors (35 existing warnings); `npm test` 329/329; `next build` OK; Playwright 35/35; 0 overflow at 390 px on all 114 pages |
| 9. Analytics not duplicated, tests don't pollute | PASS in code (1 GTM + 1 Pixel per page; all QA tooling blocks/drops beacons); GA4 event audit needs owner access |
| 10. Regression suite passes; production verified; rollback | Local PASS; production verification after deploy; rollback documented in `docs/audit/00-…` |
| 11. Implemented vs tested vs deployed vs blocked | This file + execution plan |

## Commits
See `git log main..claude/project-thread-7zqlsd`.
