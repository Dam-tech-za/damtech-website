# 01 — User journey matrix

Status key: **PASS** executed and verified · **FAIL** · **BLOCKED** (reason given) · **NOT RUN**. Local = production build of this branch on `127.0.0.1:3200` with no Supabase/Resend env. Live = read-only checks on www.dam-tech.co.za (analytics blocked, nothing submitted).

Automated suites: `tests/e2e/public-journeys.spec.ts` (32 tests, safe against live), `tests/e2e/quote-submit-offline.spec.ts` (3 tests, refuses to run against any non-localhost URL). Run: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3200 npx playwright test -c playwright.public.config.ts` → **35 passed** (18 Oct 2026).

## Coverage
| Journey | Where | Status | Evidence |
|---|---|---|---|
| Every public URL loads (smoke) | Live, 153 URLs, desktop 1366 + mobile 390 | PASS | `docs/audit/01-route-inventory.csv`; 0 render errors, 0 page errors, 0 mobile overflow |
| 17 templates: one H1, self-canonical, no noindex, no page errors | Local | PASS | e2e › templates |
| 404 page status + noindex | Local + live | PASS | e2e; crawl |
| robots.txt / sitemap.xml content | Local + live | PASS | e2e; crawl |
| Admin redirects anonymous users to login, `X-Robots-Tag: noindex` | Local + live | PASS | e2e; crawl |
| GSC 404 URLs now redirect | Local | PASS | e2e; curl of all 10 |
| Desktop header links all 200 | Local | PASS | e2e › navigation |
| Mobile menu opens and navigates to Contact | Local | PASS | e2e › navigation |
| No horizontal overflow at 390 px on /, /quote/, /calculators/, roof, tanks | Local | PASS | e2e; live crawl found none on all 114 pages |
| Mobile sticky Call / WhatsApp / Request Quote bar | Live screenshot | PASS (visual) | footer screenshot; links validated below |
| `tel:` links (`tel:+27828531026`), WhatsApp (`https://wa.me/27828531026`), `mailto:` | Local, 3 pages | PASS | e2e › contact actions |
| Tap targets ≥ 24 px (footer phone/email, breadcrumbs) | Local | PASS after fix | measured 24–30 px |
| Keyboard focus ring on links/buttons/FAQ toggles | Previous session (release verification) | PASS (earlier evidence) | `docs/development/release-verification.md` |
| Reduced motion | e2e run with `reducedMotion: reduce` | PASS (no failures) | config |
| Simple quote form — required fields, honeypot | Local | PASS | e2e › quote form validation |
| Simple quote form — invalid email blocked | Local | PASS | e2e |
| Simple quote form — service preselect from residential CTA | Local | PASS | e2e |
| Simple quote form — 4-second bot guard | Local | PASS | offline spec |
| Simple quote form — complete residential roof enquiry (Pretoria) when storage unavailable | Local (no DB) | PASS | Server logged `CONFIGURATION_ERROR` → fallback skipped (`resend_not_configured`) → visitor saw "could not save … contact Damtech" with phone/WhatsApp visible |
| Simple quote form — successful save, RFQ number, admin email, customer email | — | **BLOCKED** | Needs a Supabase test branch and a test mailbox; production write-path tests not authorised |
| Quote-preparation wizard — step validation | Local | PASS | offline spec |
| Quote-preparation wizard — jumping to Review then submitting with an unnamed asset | Local | **FAIL → fixed** | `validateStage` checked `draft.stage` instead of the stage being validated, so the asset check was skipped on submit; now returns "Each asset needs a name." and sends the user back. Test added. |
| Quote-preparation wizard — successful submission | — | BLOCKED | as above |
| Calculator → "Continue in Quote Preparation" (draft token) | — | BLOCKED | Creates a DB draft; needs test DB |
| Post-submit photo/drawing upload (`/quote/<ref>/upload/`) | — | BLOCKED | Requires a real RFQ reference + upload token from the DB and storage bucket |
| Calculators (10 tools) | Unit + browser | PASS | `docs/qa/03-calculator-reference-cases.md` |
| Catalogue product pages / Product schema | Live crawl | PASS (render, schema valid) | 7 products, Product JSON-LD parses |
| Catalogue "order" / invoice request flow | Live render only | BLOCKED for submit | write path |
| Merchant feed `/feeds/google-merchant.tsv` | Live | PASS (200, `X-Robots-Tag: noindex`, as configured) | crawl |
| Projects index + detail, galleries, FAQ accordions, blog pagination | Live crawl | PASS (render, no errors) | crawl |
| Admin: login, RFQ inbox, detail, status changes, exports, RLS | — | **BLOCKED** | No test admin account or test Supabase branch |
| Cross-browser (Firefox/WebKit) | — | BLOCKED | Only Chromium is installed; installing other engines requires a download the owner has not approved |

## Scenario list from the mission
| Scenario | Status |
|---|---|
| Agricultural HDPE dam with approximate area | Client validation PASS; save BLOCKED |
| PVC liner / reservoir lining | Client validation PASS; save BLOCKED |
| Steel reservoir supply-only / installation | Catalogue page render PASS; save BLOCKED |
| Mining/industrial with company details | Wizard step validation PASS; save BLOCKED |
| Residential leaking roof, Pretoria | PASS up to server; graceful failure PASS; save BLOCKED |
| Residential foundation, Betty's Bay / Overstrand | Bot-guard path PASS; save BLOCKED |
| Invalid/incomplete, retries, duplicate clicks | Invalid PASS; submit button disabled while pending (code: `disabled={isPending}`/`pending`), idempotent `submissionId` replay in server code (unit tested in `submission-repair.test.ts`) |
| Network outage | Simulated by missing DB/email config: PASS (no crash, clear message) |
| Attribution (landing page, UTM, timestamp) | Unit tests `lib/analytics/attribution.test.ts` PASS; admin display BLOCKED |
| Xero / invoices | Not present in code — N/A |
