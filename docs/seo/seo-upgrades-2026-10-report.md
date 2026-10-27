# SEO upgrades — October 2026 report

Branch: `seo/upgrades-2026-10` (local only — not pushed, not deployed).
Base: `ab85afe` (the 550 gsm price commit, still awaiting owner approval). This branch sits on top of it, so merging it also ships the new prices.

| Commit | Work package |
|---|---|
| `fb463d0` | WP1 structured data |
| `3c952aa` | WP2 sitemap lastmod |
| `f98950a` | WP3 five region pages |
| `bb461ab` | WP4 internal linking |
| `fdb6e90` | WP6 captions, 550 gsm wording, visible dates, title/meta fixes |

WP5, WP7 and WP8 are report-only (below). No prices, URLs, H1s, warranties or lead times were changed by these commits.

## Files changed

- **WP1:** `lib/seo.ts`, `lib/site.ts`, `app/steel-water-storage-tanks/page.tsx`
- **WP2:** `scripts/generate-sitemap-lastmod.mjs` (new), `lib/sitemap-lastmod.generated.ts` (new, generated), `lib/sitemap.ts`
- **WP3:** `lib/local-pages-provinces.ts` (new), `lib/local-pages.ts`, `components/LocalSeoPage.tsx`, `app/[slug]/page.tsx`, `app/dam-liners/page.tsx`, `lib/site.ts`, five new `app/*-dam-liners/page.tsx` routes
- **WP4:** `lib/sub-service-pages.ts`, `components/SubServicePage.tsx`, `lib/internal-links.ts`, `lib/post-topics.ts`
- **WP6:** `lib/catalogue/images.ts`, `lib/catalogue/products.ts`, `lib/service-pages-content.ts`, `lib/sub-service-pages.ts`, `app/dam-liners/page.tsx`, `components/Hero.tsx`, `components/SubServicePage.tsx`, `components/LocalSeoPage.tsx`, `app/[slug]/page.tsx`, `app/brand-pages.css`, `lib/site.ts`, `lib/pages.ts`, `lib/local-pages.ts`, `lib/residential-waterproofing.ts`, `lib/projects.ts`

To refresh sitemap dates after future content commits: `node scripts/generate-sitemap-lastmod.mjs`, then commit the generated file (Vercel clones shallow, so dates cannot be computed at build time).

## Pages added or changed

| Page | Change |
|---|---|
| `/kwazulu-natal-dam-liners/` | **New.** ~1,170 words, typical uses, 4 FAQs (FAQPage), breadcrumbs, plan links to quote/HDPE/PVC/cost guide |
| `/north-west-dam-liners/` | **New.** As above; links the real Marico game lodge project |
| `/northern-cape-dam-liners/` | **New.** As above |
| `/free-state-dam-liners/` | **New.** As above |
| `/eastern-cape-dam-liners/` | **New.** As above |
| Existing local pages (Western Cape, Overberg, Limpopo, Mpumalanga, Pretoria, Johannesburg, farm, mining, agricultural) | Added "Plan Your Dam Liner" link block and visible "Last updated" date |
| `/dam-liners/` | Added "Dam Liners by Region" section; sizes read "550 gsm standard, 850 gsm on request" |
| HDPE, PVC, torch-on, repair, reservoir lining, cost guide | Curated related projects, new "Related Guides" links to blog posts, visible "Last updated" date, 550/850 gsm wording |
| `/steel-water-storage-tanks/` | ItemList now carries each kit's Product with VAT-inclusive offer; title/meta shortened |
| Product pages | Product schema: `priceValidUntil` 2027-01-31 and VAT-inclusive `priceSpecification`; neutral image captions |
| Blog posts | Visible "Updated" date where the post was edited after publishing (4 posts) |
| Footer (all pages) | Five new region links |
| Home, agricultural, blog, calculators, contact, repair, FAQ, farm, HDPE, PVC, projects, roof, services | Title or meta trimmed into range (no new claims) |

## Verification

- `npx tsc --noEmit`, `npm run lint`, `npm test` (413/413) and `npm run build` all pass. The only build `[seo]` warning is pre-existing: the description of `/innovative-maintenance-strategies-…/` is 156 characters.
- Sitemap: 86 URLs, no `changefreq`/`priority`, real per-page `lastmod` (2024 – 2026-10-27). All five new pages are included.
- Link check (every sitemap page crawled): 120 internal targets, **0 broken**, **0 orphans**. Weakly linked (≤2 inbound pages): the two fish-pond product pages, `/blog/page/2/` and `/blog/page/3/`, and ten blog posts — see WP5 for the fix.
- New pages: each returns 200, is in the sitemap, has one H1, a self-canonical, and a unique title (54–58 chars) and meta (145–152 chars).
- SEO snapshot diff: `docs/seo/snapshots/diff-latest.md` (live site 2026-10-27 vs this branch). Every finding is explained by: the price commit `ab85afe` (product prices and 850 → 550 gsm text); the title/meta edits listed above; WP4 swapping which projects and related posts appear on service pages and three blog posts; the new sections and dates; and JSON-LD changes from WP1. No heading wording, URL or canonical changed unintentionally.

## Schema validation

Validated with the schema.org validator (validator.schema.org) using each page's JSON-LD, plus a local check of Google's required and recommended fields on every sitemap page.

| Type | Pages | Result |
|---|---|---|
| Product | 7 product pages | 0 errors, 0 warnings. Google's optional review/rating is absent (correct — no real reviews yet) |
| ItemList (with Product offers) | `/steel-water-storage-tanks/` | 0 errors, 0 warnings |
| FAQPage | 45 pages | 0 errors, 0 warnings |
| LocalBusiness + GeneralContractor | all pages | 0 errors. Recommended fields missing: street address, opening hours, geo (owner TODOs) |
| HomeAndConstructionBusiness (offices) | contact, Western Cape | 0 errors; same TODOs |
| BreadcrumbList, Organization, WebSite, Service, BlogPosting | all applicable | 0 errors, 0 warnings |

One fix came from validation: the global LocalBusiness used `serviceType`, which is not a LocalBusiness property; it is now `knowsAbout` (same list).

Google's Rich Results Test needs a public URL. Run it on the Vercel preview or after deploy for: a product page, `/steel-water-storage-tanks/`, `/kwazulu-natal-dam-liners/` and `/contact/`.

## Lighthouse (mobile)

"Before" is production (www.dam-tech.co.za), 27 Oct 2026:

| Page | Score | LCP | TBT | CLS |
|---|---|---|---|---|
| Home | 62 | 5.6 s | 650 ms | 0 |
| `/steel-water-storage-tanks/` | 66 | 4.2 s | 670 ms | 0.003 |
| `/steel-water-storage-tanks/10000-litre-water-tank/` | 80 | 3.5 s | 420 ms | 0.003 |
| `/mpumalanga-dam-liners/` | 78 | 2.7 s | 480 ms | 0.003 |

"After" must be measured on the Vercel preview: local image optimisation is broken on this PC (sharp's Windows binary is missing), so local runs serve uncompressed images and are not comparable.

Findings:
- All "safe fix" audits already pass: image sizes, font-display, LCP image not lazy-loaded and prioritised. No code fix was needed, and this branch adds no client JavaScript.
- The main cost is third-party scripts on every page: Google Tag Manager (~330 ms main thread, 516 KB) and the Meta pixel (~250–350 ms, 206 KB). Home render delay is 3.5 s while the main thread is busy.
- **Owner decision, not changed:** delaying the Meta pixel or GTM until interaction (or behind a consent banner) would improve TBT and LCP, but affects attribution. Trimming unused GTM tags is safe and done in the GTM console, not the code.
- INP cannot be measured in a lab run. Use Search Console → Core Web Vitals (field data) after deploy.

## WP5 — Blog URL plan (report only, nothing changed)

22 posts live at the site root with long slugs (up to 118 characters). Proposal: move to `/blog/<short-slug>/` with a 301 per post, sitemap update, and repointing of the two posts with hard-coded links (12 legacy redirects/rewrites point at the leak-repair post; one redirect and one e2e test point at the drought post) so no redirect chains form.

| # | Current URL | Proposed URL |
|---|---|---|
| 1 | `/essential-farm-dam-leak-repair-techniques-to-safeguard-your-water-storage-in-south-africa/` | `/blog/farm-dam-leak-repair/` |
| 2 | `/powerful-strategies-to-optimize-borehole-and-farm-dam-water-integration-for-reliable-irrigation-in-south-africa/` | merge → `/blog/integrating-borehole-water-farm-dams/` |
| 3 | `/strategies-to-prevent-costly-farm-dam-liner-failure/` | `/blog/prevent-farm-dam-liner-failure/` |
| 4 | `/proven-leak-repair-solutions-for-corrugated-steel-reservoirs/` | `/blog/steel-reservoir-leak-repair/` |
| 5 | `/water-saving-hacks-for-south-african-farm-dams/` | `/blog/farm-dam-water-saving-tips/` |
| 6 | `/critical-water-storage-tips-to-overcome-borehole-water-shortages-during-south-african-droughts/` | `/blog/borehole-shortage-water-storage/` |
| 7 | `/understanding-the-impact-of-soil-types-on-dam-liner-selection-and-longevity/` | merge → `/blog/dam-lining-sandy-clay-soils/` |
| 8 | `/innovative-maintenance-strategies-to-extend-the-life-of-corrugated-steel-reservoirs-in-harsh-agricultural-environments/` | `/blog/steel-reservoir-maintenance/` |
| 9 | `/proper-dam-and-borehole-water-management/` | merge → `/blog/integrating-borehole-water-farm-dams/` |
| 10 | `/proper-water-storage-and-borehole-integration/` | `/blog/borehole-irrigation-storage-sizing/` |
| 11 | `/maximizing-irrigation-efficiency-with-proper-reservoir-maintenance/` | merge → `/blog/steel-reservoir-maintenance/` |
| 12 | `/cost-benefit-analysis-of-corrugated-steel-reservoir/` | `/blog/steel-reservoir-cost-benefit/` |
| 13 | `/how-to-manage-farm-dam-water-levels-during-prolonged-droughts-in-south-africa/` | `/blog/farm-dam-drought-water-levels/` |
| 14 | `/the-best-practices-for-repairing-leaks-in-corrugated-steel-reservoirs-to-avoid-costly-water-loss/` | merge → `/blog/steel-reservoir-leak-repair/` |
| 15 | `/protect-your-farm-dam-from-contamination-during-load-shedding/` | `/blog/farm-dam-load-shedding-contamination/` |
| 16 | `/integrating-borehole-water-with-farm-dams/` | `/blog/integrating-borehole-water-farm-dams/` |
| 17 | `/how-to-optimize-farm-dam-water-quality-to-prevent-livestock-illnesses-in-south-africa/` | `/blog/farm-dam-water-quality-livestock/` |
| 18 | `/choosing-the-best-dam-lining-solutions-to-prevent-seepage-in-sandy-and-clay-soils-common-in-south-african-farmlands/` | `/blog/dam-lining-sandy-clay-soils/` |
| 19 | `/how-seasonal-rainfall-patterns-influence-dam-design-and-reservoir-capacity-in-south-africa/` | `/blog/rainfall-dam-design-capacity/` |
| 20 | `/the-role-of-vegetation-management-around-reservoirs-to-prevent-liner-damage-and-water-contamination/` | `/blog/reservoir-vegetation-management/` |
| 21 | `/assessing-the-environmental-impact-of-different-dam-lining-materials-on-south-african-farmland/` | `/blog/dam-lining-materials-environmental-impact/` |
| 22 | `/the-importance-of-proper-dam-liners-how-hdpe-protects-your-investment/` | `/blog/hdpe-dam-liner-benefits/` |

Duplicate topics (search-intent overlap, not copied text):
- **Borehole + farm dam irrigation:** #2, #9, #16 (and #10). Keep #16; merge #2 and #9 into it. Keep #10 only if refocused on storage sizing (needs an H1 change — your call).
- **Steel reservoir leak repair:** #4 and #14. Keep #4; merge #14.
- **Liner choice by soil:** #7 and #18. Keep #18; merge #7.
- **Reservoir maintenance:** #8 and #11. Keep #8; merge #11.
- **Drought / water saving:** #13 and #5 overlap moderately; keep both and cross-link.

Other findings: 21 of 22 posts repeat a "When are corrugated steel reservoirs appropriate?" section, so every post's top service link and call to action is the steel-tank page. WP4 added rules so posts can now link the repair, reservoir lining and cost-guide pages. No post covers PVC lining, torch-on for cement dams, or lining cost — these are content gaps.

## WP8 — Reviews plan (no rating schema)

1. **Get the review link:** Google Business Profile → "Ask for reviews" → copy the short link (`g.page/r/…/review`). Do this for both profiles (Western Cape and Gauteng) and keep each link with the matching team.
2. **When to ask:** at handover, once the client has seen the finished liner or tank holding water. Ask every client, not only the happy ones (Google forbids selective asking and any incentive).
3. **WhatsApp wording:**
   > Hi {name}, thanks for choosing Damtech for your {dam liner / tank}. If you're happy with the work, a short Google review would help other farmers find us: {link}. Photos of the finished job are very welcome. — {your name}, Damtech
4. **Email wording:** subject "How did we do on your {project}?" — same message, plus one line inviting them to reply directly if anything isn't right.
5. **Follow-up:** one reminder after 7 days, then stop.
6. **Reply to every review** within a week, including critical ones, naming the job type and area (helps local relevance).
7. **On the website:** quote real reviews only with the client's permission. Do not add Review or AggregateRating schema for your own business — Google ignores self-serving ratings and may treat them as spam.

## TODOs for the owner

- **Opening hours.** The site said Mon–Sun 09:00–17:00 but the Google profiles say Mon–Sat 06:00–18:00. Hours were removed from the schema until you confirm (`BUSINESS_HOURS` in `lib/site.ts`).
- **Google Business Profile URLs.** The site uses `share.google` short links. Please supply the full `maps.google.com/?cid=…` or `g.page` URLs for both profiles, plus any other official profiles (Facebook, Instagram, LinkedIn, YouTube) for `sameAs`.
- **Address.** The schema shows service-area form (locality only, no street address). Tell me if you want a street address or map pin published.
- **Photos.** Product pages use shared stand-in images: one corrugated reservoir image for all four open tanks; one trough image for both fish ponds and the trough. Real per-size photos are needed (list in `docs/branding/damtech-photography-requirements.md` / `PLANNED_MAIN_IMAGES`). Region pages for KZN, Northern Cape, Free State and Eastern Cape use generic installation photos (neutral alt text, no location claimed); a real project photo from each province would help.
- **Regional projects.** Only North West has a real project to link. If you have completed jobs in the other four provinces, send name/area/size and they can be added.
- **750 gsm.** The site now says "550 gsm standard, 850 gsm on request"; the 750 gsm grade was removed. Confirm that is correct.
- **Blog URL plan (WP5).** Approve, change or reject the table above before any URL moves.
- **Short metas** (left alone, would need new facts): `/privacy/`, `/terms/`, and the Grabouw, Villiersdorp and Worcester project pages (92–105 characters).
- **After deploy:** submit `https://www.dam-tech.co.za/sitemap.xml` in Search Console, request indexing for the five region pages, run the Rich Results Test on the pages listed above, and re-run Lighthouse for the "after" column.
