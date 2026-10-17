# Site Audit — October 2026

**Date:** 17 October 2026 · **Branch:** `feat/residential-waterproofing` · **Method:** production build (`next build` + `next start`) crawled with Playwright/Chromium starting from `sitemap.xml` and following every internal link, plus utility routes. Each route checked for HTTP status, redirects, title, meta description, canonical, robots, H1 count, heading order, JSON-LD types, word count, inbound internal links, images without `alt`, console/hydration errors and horizontal overflow at 360, 390, 768, 1024, 1440 and 1920 px. Third-party scripts were blocked during the crawl (no network), so analytics behaviour was tested separately.

**Inventory:** 69 URLs in the sitemap + 10 utility/archive routes = **79 public routes audited** (78 × 200, 1 × 404 test). The owner's 73–74 estimate is close: 69 indexable pages plus noindex utility pages. Admin (`/admin/*`, 47 routes), token pages (`/q/*`, `/quote/info/*`, upload) and API/cron routes are excluded from the public inventory; they were covered by the security review. 68 legacy redirects in `lib/redirects.ts` were each requested and all resolve with 301/308 to a 200 page.

## Site-wide findings

| Severity | Finding | Resolution |
|---|---|---|
| Critical | `next@16.2.9` had critical/high advisories (proxy bypass, server action DoS, image optimiser) | Upgraded to 16.4.2, sharp 0.35.5; prod `npm audit` = 0 |
| High | Every public page rendered per request (`Cache-Control: private, no-store`) because the root layout read request headers; middleware called Supabase auth on every page view | Layout chrome switch moved client-side; proxy limited to `/admin` + `/auth`. Public pages now prerendered (`s-maxage`, CDN-cacheable) |
| High | GTM/Meta Pixel ran on quote, info-request and upload pages whose URLs contain private tokens; success page URL carried the upload token | Analytics gated off on token pages; token moved to sessionStorage |
| High | GA4 had no conversions: no lead/call/WhatsApp events reached GA4 | `generate_lead`, `phone_click`, `whatsapp_click`, `email_click` dataLayer events + per-RFQ attribution. GTM changes documented (owner action) |
| High | Blog titles cut with "…" and meta descriptions repeating the title (22 posts) | Hand-written titles (≤ 60) and descriptions (110–158) |
| Medium | React hydration error on the HDPE guide (legacy WordPress markup) | Content cleaned; Prose splitter hardened |
| Medium | `/dam-lining-cost-south-africa/` had zero internal links | Linked from Services menu and footer |
| Medium | Email lookup used `ILIKE` with unescaped wildcards | Escaped |
| Medium | Honeypot spam stored without rate limit; info-request answers unbounded | Rate limited / bounded |
| Medium | Two case studies understated wall area of circular dams (+50 m² vs ≈ +108/130 m²) | Recalculated |
| Medium | Copy overstated some technical claims (HDPE "more puncture-resistant", spark-testing HDPE, "certified" materials, unqualified lifespans) | Corrected/qualified (see results doc) |
| Medium | `/waterproofing/` used a non-standard warranty statement; no hero CTA; related-links section rendered outside the page container | Approved warranty wording, CTAs, layout fixed |
| Low | `\| Damtech \| Damtech` titles; 404 page inherited homepage title; nested `<main>`; h1→h3 skips; mobile table overflow; no skip link; five font files preloaded | Fixed |
| Low | `CSP script-src 'unsafe-inline'` | Open — needs nonce-based CSP (see results doc) |

## Items needing owner confirmation (not changed)

- **Steel tank nominal vs geometric capacity.** 20 000 L tank (4 m × 1.5 m) holds ≈ 18 850 L gross; 50 000 L (5 m × 2.3 m) ≈ 45 160 L; 100 000 L (9 m × 1.5 m) ≈ 95 430 L. Pages label these "nominal marketed capacity". Consider stating gross geometric volume next to it (as already done for the livestock trough) to avoid disputes. Product data/prices were not changed.
- **Case-study areas** marked `TODO(business-confirm)` in `lib/projects.ts`: Grabouw 3 400 m² (cards previously 10 520 m²), Hoedspruit 550 m² (previously 9 240 m²), Centurion 1 200 m², Tulbagh tank size.
- **Worcester "bitumen earth dam" (≈ 15 000 m²)** — confirm system type; the torch-on page says torch-on is for rigid surfaces.
- **Claims to verify:** "more than 30 years of combined experience"; 50 mm inlet/outlet connections; "bidem" (likely *bidim*) geotextile spelling; steel tank diameters 3–17 m and ring heights 1.55/2.3/3.05 m; "250 kL reservoir in 3–5 days"; lifespan ranges (HDPE 20–30, PVC 10–15, torch-on 15–20, steel 20–30 years); "free initial inspections"; nationwide/all-province coverage; brick reservoir lining; local soil descriptions (Phalaborwa basalt, Pretoria granite).
- **Business hours** in LocalBusiness schema say 7 days 09:00–17:00 — confirm.

## Route-by-route results

Columns: status · purpose · robots · canonical (✓ = self) · H1 count · words in `<main>` · issues before · issues after · resolution.

| Route | HTTP | Purpose | Robots | Canonical | H1 | Words | Before | After | Status |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 200 | Homepage | index | ✓ | 1 | 986 | title 68 chars; description 180 chars | — | Resolved |
| `/about-us-waterproofing-company/` | 200 | Service / hub | index | ✓ | 1 | 939 | title 68 chars; description 176 chars | — | Resolved |
| `/services/` | 200 | Service / hub | index | ✓ | 1 | 933 | heading level skip | — | Resolved |
| `/dam-liners/` | 200 | Service / hub | index | ✓ | 1 | 1635 | description 166 chars | — | Resolved |
| `/steel-water-storage-tanks/` | 200 | Product (catalogue) | index | ✓ | 1 | 1377 | title 66 chars | title 66 chars | Open (minor) |
| `/waterproofing/` | 200 | Service / hub | index | ✓ | 1 | 799 | — | — | No issues found |
| `/faq/` | 200 | Service / hub | index | ✓ | 1 | 509 | — | — | No issues found |
| `/blog/` | 200 | Blog listing | index | ✓ | 1 | 648 | heading level skip | — | Resolved |
| `/contact/` | 200 | Conversion | index | ✓ | 1 | 581 | — | — | No issues found |
| `/quote/` | 200 | Conversion | index | ✓ | 1 | 406 | — | — | No issues found |
| `/projects/` | 200 | Case study | index | ✓ | 1 | 580 | — | — | No issues found |
| `/pretoria-dam-liners/` | 200 | Regional landing | index | ✓ | 1 | 753 | description 166 chars | — | Resolved |
| `/johannesburg-dam-liners/` | 200 | Regional landing | index | ✓ | 1 | 731 | title 68 chars; description 168 chars | — | Resolved |
| `/limpopo-dam-liners/` | 200 | Regional landing | index | ✓ | 1 | 716 | — | — | No issues found |
| `/mpumalanga-dam-liners/` | 200 | Regional landing | index | ✓ | 1 | 688 | — | — | No issues found |
| `/western-cape-dam-liners/` | 200 | Regional landing | index | ✓ | 1 | 763 | — | — | No issues found |
| `/farm-dam-liners/` | 200 | Service / hub | index | ✓ | 1 | 733 | — | — | No issues found |
| `/mining-dam-liners/` | 200 | Service / hub | index | ✓ | 1 | 645 | — | — | No issues found |
| `/agricultural-water-storage/` | 200 | Service / hub | index | ✓ | 1 | 716 | — | — | No issues found |
| `/hdpe-dam-lining/` | 200 | Service / hub | index | ✓ | 1 | 946 | title 65 chars | — | Resolved |
| `/pvc-dam-lining/` | 200 | Service / hub | index | ✓ | 1 | 877 | — | — | No issues found |
| `/torch-on-dam-lining/` | 200 | Service / hub | index | ✓ | 1 | 905 | — | — | No issues found |
| `/dam-repair-services/` | 200 | Service / hub | index | ✓ | 1 | 1014 | — | — | No issues found |
| `/reservoir-lining/` | 200 | Service / hub | index | ✓ | 1 | 936 | — | — | No issues found |
| `/dam-lining-cost-south-africa/` | 200 | Service / hub | index | ✓ | 1 | 1207 | title 67 chars; description 176 chars; orphan (no internal links) | — | Resolved |
| `/calculators/` | 200 | Service / hub | index | ✓ | 1 | 1355 | — | — | No issues found |
| `/privacy/` | 200 | Legal | index | ✓ | 1 | 167 | — | — | No issues found |
| `/terms/` | 200 | Legal | index | ✓ | 1 | 240 | — | — | No issues found |
| `/returns/` | 200 | Legal | index | ✓ | 1 | 183 | — | — | No issues found |
| `/steel-water-storage-tanks/10000-litre-water-tank/` | 200 | Product (catalogue) | index | ✓ | 1 | 1014 | — | — | No issues found |
| `/steel-water-storage-tanks/20000-litre-water-tank/` | 200 | Product (catalogue) | index | ✓ | 1 | 984 | — | — | No issues found |
| `/steel-water-storage-tanks/50000-litre-water-tank/` | 200 | Product (catalogue) | index | ✓ | 1 | 987 | — | — | No issues found |
| `/steel-water-storage-tanks/100000-litre-water-tank/` | 200 | Product (catalogue) | index | ✓ | 1 | 1015 | — | — | No issues found |
| `/steel-water-storage-tanks/10000-litre-fish-pond/` | 200 | Product (catalogue) | index | ✓ | 1 | 996 | — | — | No issues found |
| `/steel-water-storage-tanks/15000-litre-fish-pond/` | 200 | Product (catalogue) | index | ✓ | 1 | 954 | — | — | No issues found |
| `/steel-water-storage-tanks/livestock-water-trough/` | 200 | Product (catalogue) | index | ✓ | 1 | 984 | — | — | No issues found |
| `/projects/north-west-game-lodge-hdpe-dam-lining/` | 200 | Case study | index | ✓ | 1 | 490 | — | — | No issues found |
| `/projects/stellenbosch-hdpe-dam-liner/` | 200 | Case study | index | ✓ | 1 | 542 | — | — | No issues found |
| `/projects/tulbagh-steel-water-tank/` | 200 | Case study | index | ✓ | 1 | 420 | — | — | No issues found |
| `/projects/grabouw-hdpe-farm-dam/` | 200 | Case study | index | ✓ | 1 | 519 | — | — | No issues found |
| `/projects/hoedspruit-bitumen-dam-lining/` | 200 | Case study | index | ✓ | 1 | 499 | — | — | No issues found |
| `/projects/centurion-hdpe-dam-liner/` | 200 | Case study | index | ✓ | 1 | 484 | — | — | No issues found |
| `/projects/tzaneen-torch-on-bitumen-concrete-dam-18m/` | 200 | Case study | index | ✓ | 1 | 545 | — | — | No issues found |
| `/projects/worcester-bitumen-earth-dam-lining/` | 200 | Case study | index | ✓ | 1 | 388 | — | — | No issues found |
| `/projects/villiersdorp-hdpe-dam-lining/` | 200 | Case study | index | ✓ | 1 | 388 | — | — | No issues found |
| `/essential-farm-dam-leak-repair-techniques-to-safeguard-your-water-storage-in-south-africa/` | 200 | Blog post | index | ✓ | 1 | 1489 | title 67 chars | — | Resolved |
| `/powerful-strategies-to-optimize-borehole-and-farm-dam-water-integration-for-reliable-irrigation-in-south-africa/` | 200 | Blog post | index | ✓ | 1 | 1424 | title 80 chars; title truncated with ellipsis | — | Resolved |
| `/strategies-to-prevent-costly-farm-dam-liner-failure/` | 200 | Blog post | index | ✓ | 1 | 1313 | title 80 chars; title truncated with ellipsis | — | Resolved |
| `/proven-leak-repair-solutions-for-corrugated-steel-reservoirs/` | 200 | Blog post | index | ✓ | 1 | 1513 | title 80 chars; title truncated with ellipsis; description 53 chars | — | Resolved |
| `/water-saving-hacks-for-south-african-farm-dams/` | 200 | Blog post | index | ✓ | 1 | 1294 | title 79 chars; title truncated with ellipsis | — | Resolved |
| `/critical-water-storage-tips-to-overcome-borehole-water-shortages-during-south-african-droughts/` | 200 | Blog post | index | ✓ | 1 | 1321 | title 80 chars; title truncated with ellipsis; description 65 chars | — | Resolved |
| `/understanding-the-impact-of-soil-types-on-dam-liner-selection-and-longevity/` | 200 | Blog post | index | ✓ | 1 | 1485 | title 80 chars; title truncated with ellipsis | — | Resolved |
| `/innovative-maintenance-strategies-to-extend-the-life-of-corrugated-steel-reservoirs-in-harsh-agricultural-environments/` | 200 | Blog post | index | ✓ | 1 | 1279 | title 80 chars; title truncated with ellipsis | — | Resolved |
| `/proper-dam-and-borehole-water-management/` | 200 | Blog post | index | ✓ | 1 | 1189 | title 80 chars; title truncated with ellipsis | — | Resolved |
| `/proper-water-storage-and-borehole-integration/` | 200 | Blog post | index | ✓ | 1 | 1109 | title 80 chars; title truncated with ellipsis | — | Resolved |
| `/maximizing-irrigation-efficiency-with-proper-reservoir-maintenance/` | 200 | Blog post | index | ✓ | 1 | 1156 | title 76 chars | — | Resolved |
| `/cost-benefit-analysis-of-corrugated-steel-reservoir/` | 200 | Blog post | index | ✓ | 1 | 1309 | title 80 chars; title truncated with ellipsis; description 60 chars; horizontal overflow on mobile | — | Resolved |
| `/how-to-manage-farm-dam-water-levels-during-prolonged-droughts-in-south-africa/` | 200 | Blog post | index | ✓ | 1 | 1187 | title 80 chars; title truncated with ellipsis; description 175 chars | — | Resolved |
| `/the-best-practices-for-repairing-leaks-in-corrugated-steel-reservoirs-to-avoid-costly-water-loss/` | 200 | Blog post | index | ✓ | 1 | 1471 | title 80 chars; title truncated with ellipsis | — | Resolved |
| `/protect-your-farm-dam-from-contamination-during-load-shedding/` | 200 | Blog post | index | ✓ | 1 | 1298 | title 80 chars; title truncated with ellipsis; description 68 chars | — | Resolved |
| `/integrating-borehole-water-with-farm-dams/` | 200 | Blog post | index | ✓ | 1 | 1339 | title 80 chars; title truncated with ellipsis | — | Resolved |
| `/how-to-optimize-farm-dam-water-quality-to-prevent-livestock-illnesses-in-south-africa/` | 200 | Blog post | index | ✓ | 1 | 1268 | title 80 chars; title truncated with ellipsis | — | Resolved |
| `/choosing-the-best-dam-lining-solutions-to-prevent-seepage-in-sandy-and-clay-soils-common-in-south-african-farmlands/` | 200 | Blog post | index | ✓ | 1 | 1530 | title 80 chars; title truncated with ellipsis | — | Resolved |
| `/how-seasonal-rainfall-patterns-influence-dam-design-and-reservoir-capacity-in-south-africa/` | 200 | Blog post | index | ✓ | 1 | 1409 | title 80 chars; title truncated with ellipsis; description 179 chars | — | Resolved |
| `/the-role-of-vegetation-management-around-reservoirs-to-prevent-liner-damage-and-water-contamination/` | 200 | Blog post | index | ✓ | 1 | 1198 | title 79 chars; title truncated with ellipsis; description 60 chars | — | Resolved |
| `/assessing-the-environmental-impact-of-different-dam-lining-materials-on-south-african-farmland/` | 200 | Blog post | index | ✓ | 1 | 1479 | title 79 chars; title truncated with ellipsis; description 175 chars | — | Resolved |
| `/the-importance-of-proper-dam-liners-how-hdpe-protects-your-investment/` | 200 | Blog post | index | ✓ | 1 | 1076 | title 80 chars; title truncated with ellipsis; heading level skip; JS/hydration error | — | Resolved |
| `/blog/page/2/` | 200 | Blog listing | index | ✓ | 1 | 605 | heading level skip | — | Resolved |
| `/blog/page/3/` | 200 | Blog listing | index | ✓ | 1 | 265 | heading level skip | — | Resolved |
| `/thank-you/` | 200 | Utility (noindex) | noindex | ✓ | 1 | 51 | — | — | No issues found |
| `/quote/success/` | 200 | Utility (noindex) | noindex | / | 1 | 71 | duplicated brand in title | — | Resolved |
| `/order/` | 200 | Utility (noindex) | noindex | / | 1 | 51 | duplicated brand in title | — | Resolved |
| `/category/dam-liner-guides/` | 200 | Blog listing | noindex | /blog/ | 1 | 563 | heading level skip | — | Resolved |
| `/author/infodam-tech-co-za/` | 200 | Blog listing | noindex | ✓ | 1 | 581 | heading level skip | — | Resolved |
| `/this-page-does-not-exist/` | 404 | 404 check | noindex | — | 1 | 41 | title 68 chars; 404 uses homepage title; description 180 chars | — | Resolved |
| `/category/dam-liner-guides/page/2/` | 200 | Blog listing | noindex | /blog/ | 1 | 556 | heading level skip | — | Resolved |
| `/author/infodam-tech-co-za/page/2/` | 200 | Blog listing | noindex | ✓ | 1 | 546 | heading level skip | — | Resolved |
| `/category/dam-liner-guides/page/3/` | 200 | Blog listing | noindex | /blog/ | 1 | 216 | heading level skip | — | Resolved |
| `/author/infodam-tech-co-za/page/3/` | 200 | Blog listing | noindex | ✓ | 1 | 206 | heading level skip | — | Resolved |

Remaining "Open (minor)" items are titles of 61–66 characters (Google may truncate the brand suffix) and three descriptions of 161–165 characters; kept because those pages already earn clicks (`/steel-water-storage-tanks/` is the top page) and the gain is marginal.
