# Old vs new website — SEO regression report

Audit date 18 Oct 2026. Machine-readable evidence: `docs/seo/snapshots/baseline.json` (pre-redesign), `docs/seo/snapshots/live-2026-10-18.json` (live after redesign), `docs/seo/snapshots/diff-baseline-vs-live.md` (diff), `docs/audit/01-route-inventory.json` (full crawl incl. redirect chains).

## Versions compared
| Version | Source | Evidence quality |
|---|---|---|
| WordPress site (before 19 Jun 2026) | Only the legacy URL list in `lib/redirects.ts` and URLs Google still reported Jul–Oct 2026 | **Content not verifiable** — Internet Archive was offline during the audit; no HTML exports in the repo |
| Next.js pre-redesign (`8d1acc8`, live until 18 Oct) | Rendered snapshot of all 75 sitemap URLs (`baseline.json`) | Verified |
| Waterline redesign (`0f2db92`/`4ce56eb`, live from 18 Oct) | Live production snapshot + full crawl | Verified |

## Executive summary
- **All 75 sitemap URLs are byte-identical in SEO terms** between pre-redesign and live: status, title, meta description, canonical, robots, OG title/description, every H1–H6 (wording and order), JSON-LD and internal links. The only text differences: four duplicated mobile chip labels in the home hero (the same labels remain in their full form) and the removed "email or phone" hint on `/quote/` and `/contact/` (email is now compulsory). Classification: **changed with justified improvement**.
- **All 85 URLs that Google reported in the last 3 months were accounted for.** 67 return 200, 8 are legacy WordPress/slug redirects that still work in one hop, and **10 returned 404 on both the old and new site** (typos and malformed links, e.g. `/steel-water-storage-tangks/…`, `/dam-tech.co.za/hdpe-dam-lining/`). Together they had 0 clicks and ≤3 impressions each, so no ranking was lost, but each now 301s to the page it was clearly meant for (`lib/redirects.ts`, tested in `lib/redirects.test.ts` and `tests/e2e/public-journeys.spec.ts`).
- No URL changed, no page gained `noindex`, no canonical moved, no main content is hidden on mobile (mobile and desktop visible-text snapshots both compared).
- **No suspicious SEO regression found.** Any ranking movement in the next 2–6 weeks should be read as normal post-launch re-evaluation unless Search Console shows indexing errors (see `02-gsc-baseline-and-ranking-analysis.md` for what to watch).

## Checks per formerly indexed page
| Check | Result |
|---|---|
| Path and redirects | Unchanged; legacy WordPress redirects (`/linings`, `/hdpe-linings`, `/bitumen-waterproofing`, `/contact-us`, project slug aliases, leak-repair blog consolidation) all resolve in one hop to a 200 |
| Intent/topic/copy | Unchanged (block-level text diff) |
| Headings | Unchanged on all 75 routes |
| Title/description/canonical/robots | Unchanged on all 75 routes |
| Structured data | Unchanged (JSON-LD string-identical) |
| Content in rendered HTML | Yes — static/SSG HTML, verified with JS-rendered and raw HTML |
| Internal links / breadcrumbs / sitemap | Unchanged; 0 broken internal links, 0 internal links pointing at redirects |
| Images and alt | 172 `<img>` checked: 0 missing `alt`, 16 deliberately empty (decorative); 0 broken image URLs |
| Conversion paths | Quote/contact/WhatsApp/phone present on every template (journey tests) |

## Search Console URL inventory (15 Jul – 14 Oct 2026)
Clicks/impressions combine `www`/apex and slash/no-slash variants of the same path. Apex (`dam-tech.co.za`) variants 308 to `www` in one hop; no-slash variants of legacy redirects take two hops (trailing slash, then redirect), which Google follows without issue.

| URL (all host/slash variants combined) | Clicks | Impr. | Pre-redesign (8d1acc8) | Live 18 Oct | Classification |
|---|---:|---:|---|---|---|
| `/steel-water-storage-tanks/` | 262 | 12643 | 200, in sitemap | 200 | unchanged |
| `/` | 199 | 4686 | 200, in sitemap | 200 | unchanged |
| `/steel-water-storage-tanks/10000-litre-water-tank/` | 64 | 3355 | 200, in sitemap | 200 | unchanged |
| `/dam-liners/` | 61 | 3097 | 200, in sitemap | 200 | unchanged |
| `/steel-water-storage-tanks/100000-litre-water-tank/` | 68 | 2127 | 200, in sitemap | 200 | unchanged |
| `/hdpe-dam-lining/` | 37 | 2117 | 200, in sitemap | 200 | unchanged |
| `/steel-water-storage-tanks/livestock-water-trough/` | 40 | 2113 | 200, in sitemap | 200 | unchanged |
| `/steel-water-storage-tanks/20000-litre-water-tank/` | 32 | 1540 | 200, in sitemap | 200 | unchanged |
| `/steel-water-storage-tanks/10000-litre-fish-pond/` | 68 | 1537 | 200, in sitemap | 200 | unchanged |
| `/how-to-manage-farm-dam-water-levels-during-prolonged-droughts-in-south-africa/` | 13 | 1078 | 200, in sitemap | 200 | unchanged |
| `/the-importance-of-proper-dam-liners-how-hdpe-protects-your-investment/` | 8 | 929 | 200, in sitemap | 200 | unchanged |
| `/dam-repair-services/` | 35 | 899 | 200, in sitemap | 200 | unchanged |
| `/projects/tulbagh-steel-water-tank/` | 1 | 807 | 200, in sitemap | 200 | unchanged |
| `/water-saving-hacks-for-south-african-farm-dams/` | 6 | 729 | 200, in sitemap | 200 | unchanged |
| `/calculators/` | 21 | 701 | 200, in sitemap | 200 | unchanged |
| `/bitumen-waterproofing/` | 10 | 671 | not in sitemap | 301/308 → `/waterproofing/` | unchanged (legacy redirect kept) |
| `/powerful-strategies-to-optimize-borehole-and-farm-dam-water-integration-for-reliable-irrigation-in-south-africa/` | 8 | 633 | 200, in sitemap | 200 | unchanged |
| `/services/` | 14 | 629 | 200, in sitemap | 200 | unchanged |
| `/dam-lining-cost-south-africa/` | 16 | 561 | 200, in sitemap | 200 | unchanged |
| `/pvc-dam-lining/` | 7 | 559 | 200, in sitemap | 200 | unchanged |
| `/reservoir-lining/` | 29 | 554 | 200, in sitemap | 200 | unchanged |
| `/how-to-optimize-farm-dam-water-quality-to-prevent-livestock-illnesses-in-south-africa/` | 5 | 487 | 200, in sitemap | 200 | unchanged |
| `/contact/` | 8 | 483 | 200, in sitemap | 200 | unchanged |
| `/western-cape-dam-liners/` | 14 | 476 | 200, in sitemap | 200 | unchanged |
| `/cost-benefit-analysis-of-corrugated-steel-reservoir/` | 11 | 472 | 200, in sitemap | 200 | unchanged |
| `/steel-water-storage-tanks/15000-litre-fish-pond/` | 14 | 450 | 200, in sitemap | 200 | unchanged |
| `/about-us-waterproofing-company/` | 10 | 449 | 200, in sitemap | 200 | unchanged |
| `/pretoria-dam-liners/` | 12 | 439 | 200, in sitemap | 200 | unchanged |
| `/farm-dam-liners/` | 0 | 408 | 200, in sitemap | 200 | unchanged |
| `/essential-farm-dam-leak-repair-techniques-to-safeguard-your-water-storage-in-south-africa/` | 4 | 402 | 200, in sitemap | 200 | unchanged |
| `/limpopo-dam-liners/` | 19 | 340 | 200, in sitemap | 200 | unchanged |
| `/mpumalanga-dam-liners/` | 17 | 294 | 200, in sitemap | 200 | unchanged |
| `/mining-dam-liners/` | 1 | 265 | 200, in sitemap | 200 | unchanged |
| `/torch-on-dam-lining/` | 7 | 260 | 200, in sitemap | 200 | unchanged |
| `/integrating-borehole-water-with-farm-dams/` | 4 | 260 | 200, in sitemap | 200 | unchanged |
| `/proven-leak-repair-solutions-for-corrugated-steel-reservoirs/` | 5 | 235 | 200, in sitemap | 200 | unchanged |
| `/projects/` | 2 | 207 | 200, in sitemap | 200 | unchanged |
| `/steel-water-storage-tanks/50000-litre-water-tank/` | 3 | 187 | 200, in sitemap | 200 | unchanged |
| `/choosing-the-best-dam-lining-solutions-to-prevent-seepage-in-sandy-and-clay-soils-common-in-south-african-farmlands/` | 2 | 163 | 200, in sitemap | 200 | unchanged |
| `/faq/` | 2 | 163 | 200, in sitemap | 200 | unchanged |
| `/projects/stellenbosch-hdpe-dam-liner/` | 0 | 151 | 200, in sitemap | 200 | unchanged |
| `/maximizing-irrigation-efficiency-with-proper-reservoir-maintenance/` | 2 | 150 | 200, in sitemap | 200 | unchanged |
| `/projects/corrugated-steel-water-tank-installation/` | 1 | 148 | not in sitemap | 301/308 → `/projects/tulbagh-steel-water-tank/` | unchanged (legacy redirect kept) |
| `/strategies-to-prevent-costly-farm-dam-liner-failure/` | 3 | 147 | 200, in sitemap | 200 | unchanged |
| `/the-best-practices-for-repairing-leaks-in-corrugated-steel-reservoirs-to-avoid-costly-water-loss/` | 3 | 141 | 200, in sitemap | 200 | unchanged |
| `/projects/grabouw-hdpe-farm-dam/` | 0 | 137 | 200, in sitemap | 200 | unchanged |
| `/johannesburg-dam-liners/` | 5 | 131 | 200, in sitemap | 200 | unchanged |
| `/protect-your-farm-dam-from-contamination-during-load-shedding/` | 2 | 97 | 200, in sitemap | 200 | unchanged |
| `/the-role-of-vegetation-management-around-reservoirs-to-prevent-liner-damage-and-water-contamination/` | 0 | 96 | 200, in sitemap | 200 | unchanged |
| `/quote/` | 4 | 73 | 200, in sitemap | 200 | unchanged |
| `/assessing-the-environmental-impact-of-different-dam-lining-materials-on-south-african-farmland/` | 0 | 71 | 200, in sitemap | 200 | unchanged |
| `/how-to-prevent-and-repair-leaks-in-your-farms-dam/` | 2 | 66 | not in sitemap | 301/308 → `/essential-farm-dam-leak-repair-techniques-to-safeguard-your-water-storage-in-south-africa/` | unchanged (legacy redirect kept) |
| `/projects/hoedspruit-bitumen-dam-lining/` | 0 | 55 | 200, in sitemap | 200 | unchanged |
| `/fix-leaks-in-your-farms-water-storage-system/` | 0 | 51 | not in sitemap | 301/308 → `/essential-farm-dam-leak-repair-techniques-to-safeguard-your-water-storage-in-south-africa/` | unchanged (legacy redirect kept) |
| `/agricultural-water-storage/` | 0 | 49 | 200, in sitemap | 200 | unchanged |
| `/projects/worcester-bitumen-earth-dam-lining/` | 3 | 46 | 200, in sitemap | 200 | unchanged |
| `/proper-water-storage-and-borehole-integration/` | 0 | 43 | 200, in sitemap | 200 | unchanged |
| `/proper-dam-and-borehole-water-management/` | 0 | 34 | 200, in sitemap | 200 | unchanged |
| `/bitumen-waterproofing-services-and-more/` | 0 | 30 | not in sitemap | 301/308 → `/waterproofing/` | unchanged (legacy redirect kept) |
| `/projects/villiersdorp-hdpe-dam-lining/` | 0 | 27 | 200, in sitemap | 200 | unchanged |
| `/understanding-the-impact-of-soil-types-on-dam-liner-selection-and-longevity/` | 1 | 25 | 200, in sitemap | 200 | unchanged |
| `/prevent-leaks-in-your-water-storage-system/` | 0 | 22 | not in sitemap | 301/308 → `/essential-farm-dam-leak-repair-techniques-to-safeguard-your-water-storage-in-south-africa/` | unchanged (legacy redirect kept) |
| `/how-seasonal-rainfall-patterns-influence-dam-design-and-reservoir-capacity-in-south-africa/` | 1 | 21 | 200, in sitemap | 200 | unchanged |
| `/critical-water-storage-tips-to-overcome-borehole-water-shortages-during-south-african-droughts/` | 1 | 20 | 200, in sitemap | 200 | unchanged |
| `/blog/page/3/` | 0 | 20 | 200, in sitemap | 200 | unchanged |
| `/privacy/` | 0 | 16 | 200, in sitemap | 200 | unchanged |
| `/blog/` | 0 | 16 | 200, in sitemap | 200 | unchanged |
| `/projects/centurion-hdpe-dam-liner/` | 0 | 12 | 200, in sitemap | 200 | unchanged |
| `/terms/` | 0 | 11 | 200, in sitemap | 200 | unchanged |
| `/innovative-maintenance-strategies-to-extend-the-life-of-corrugated-steel-reservoirs-in-harsh-agricultural-environments/` | 0 | 11 | 200, in sitemap | 200 | unchanged |
| `/blog/page/2/` | 0 | 10 | 200, in sitemap | 200 | unchanged |
| `/projects/north-west-game-lodge-hdpe-dam-lining/` | 0 | 7 | 200, in sitemap | 200 | unchanged |
| `/waterproofing-and-dam-liners/` | 0 | 4 | not in sitemap | 301/308 → `/faq/` | unchanged (legacy redirect kept) |
| `/steel-water-storage-tank/100000-litre-water-tank/` | 0 | 2 | not in sitemap | 404 | 404 → **fixed** (301 added) |
| `/projects/tzaneen-torch-on-bitumen-concrete-dam-18m/` | 0 | 2 | 200, in sitemap | 200 | unchanged |
| `/projects/hdpe-dam-liner-installation/` | 0 | 2 | not in sitemap | 301/308 → `/projects/stellenbosch-hdpe-dam-liner/` | unchanged (legacy redirect kept) |
| `/HDPE-Dam-Lining-Geomembrane-Installation-South-Africa-Damtech/` | 0 | 1 | not in sitemap | 404 | 404 → **fixed** (301 added) |
| `/dam-tech-co-za/hdpe-dam-lining/` | 0 | 1 | not in sitemap | 404 | 404 → **fixed** (301 added) |
| `/dam-tech.co.za/hdpe-dam-lining/` | 0 | 1 | not in sitemap | 404 | 404 → **fixed** (301 added) |
| `/how-to-manage-dam-water-levels-during-prolonged-droughts-in-south-africa/` | 0 | 1 | not in sitemap | 404 | 404 → **fixed** (301 added) |
| `/steel-storage-tanks/` | 0 | 1 | not in sitemap | 404 | 404 → **fixed** (301 added) |
| `/steel-water-storage-tangks/10000-litre-water-tank/` | 0 | 1 | not in sitemap | 404 | 404 → **fixed** (301 added) |
| `/steel-water-storage-tank/` | 0 | 1 | not in sitemap | 404 | 404 → **fixed** (301 added) |
| `/steel-water-storage-un-tanks/` | 0 | 1 | not in sitemap | 404 | 404 → **fixed** (301 added) |
| `/10000-litre-fish-pond/` | 0 | 1 | not in sitemap | 404 | 404 → **fixed** (301 added) |

Not verifiable: WordPress-era titles, headings and body copy for the URLs above (no archive access). Re-run `node scripts/audit-crawl.mjs` and the Wayback CDX query in `docs/development/next-session.md` when the archive is back.
