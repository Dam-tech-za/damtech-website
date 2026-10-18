# 02 — Search Console baseline and ranking analysis

## Sources and limits
| Source | Window | Notes |
|---|---|---|
| GSC performance export (`google_analytics/Chart.csv`, `Pages.csv`, `Queries.csv`, `Countries.csv`, `Devices.csv`, `Search appearance.csv`) | 15 Jul – 14 Oct 2026, web search | Exported 17 Oct 2026. Queries capped at the top 1 000 rows; anonymised queries excluded by Google, so query totals are lower than page totals. |
| GA4 report snapshot (`Reports_snapshot.csv`) | 19 Sep – 16 Oct 2026 | Channel, country and page-title views only; no conversion events in the export. |
| Live GSC / URL Inspection / Page Indexing | — | **Not available** to this session. |
| Rank trackers, keyword volumes, backlinks | — | **None available. No search volumes are quoted anywhere in these documents.** |

Everything below is pre-redesign data: the redesign went live on 18 Oct 2026, after the export window. There is no post-launch period to compare yet.

## Site-level trend (GSC, web)
| Period | Clicks | Impressions | CTR | Avg position |
|---|---:|---:|---:|---:|
| 15–31 Jul (17 days) | 105 | 3 596 | 2.92% | 20.4 |
| Aug | 285 | 12 025 | 2.37% | 18.6 |
| Sep | 493 | 16 312 | 3.02% | 9.5 |
| 1–14 Oct (14 days) | 268 | 8 714 | 3.08% | 8.4 |

Clicks per day rose from ~6 (late Jul) to ~16 (Sep) and ~19 (early Oct). The position jump in September coincides with the June migration settling and the product pages being indexed (Product snippets: 179 clicks / 6 510 impressions). Total 3-month: ~1 150 clicks, ~40 650 impressions.

**Visitor baseline check:** the owner's "800–900 visitors per month" is broadly consistent with GA4 for 19 Sep–16 Oct (749 new users, 907 sessions: Organic 616, Direct 261, AI assistant 22). GA4 sessions and GSC clicks are different measures and are not added together.

## Segments
- **Country (GSC clicks):** South Africa 1 032 of ~1 150 (90%); then Eswatini 21, Zimbabwe 15, Botswana 9. US has 874 impressions but 7 clicks (irrelevant international demand).
- **GA4 anomaly:** Singapore shows 120 active users (≈ 18% of the month) with no matching GSC demand. This pattern is typical of data-centre bot or crawler traffic and inflates "visitors". Recommendation: filter in GA4 reports; do not treat as customers.
- **Device:** Mobile 682 clicks at avg position 6.6; Desktop 458 at 19.4 — mobile ranks far better; mobile conversion paths matter most.
- **Geography inside South Africa:** not available in GSC; GA4 export has no city breakdown. Pretoria/Western Cape split is **not verifiable**.

## Top landing pages (3 months, combined host/slash variants)
| Page | Clicks | Impr. | Pos. | Opportunity |
|---|---:|---:|---:|---|
| `/steel-water-storage-tanks/` | 262 | 12 643 | ~16–37 | Largest impression pool; CTR 2.1%. Generic tank queries rank 20–35 (see below). |
| `/` | 199 | 4 686 | ~14 | Brand + generic. |
| `/steel-water-storage-tanks/100000-litre-water-tank/` | 68 | 2 127 | 15.4 | Product snippet; price-intent. |
| `/steel-water-storage-tanks/10000-litre-fish-pond/` | 68 | 1 537 | 7.5 | Strong CTR 4.4%. |
| `/steel-water-storage-tanks/10000-litre-water-tank/` | 64 | 3 355 | 13.7 | High impressions, CTR 1.9%. |
| `/dam-liners/` | 61 | 3 097 | 11.1 | Core service hub. |
| `/steel-water-storage-tanks/livestock-water-trough/` | 40 | 2 113 | 8.0 | "water trough" (484 impr, pos 5.4, 2 clicks) — low CTR for position. |
| `/hdpe-dam-lining/` | 37 | 2 117 | 20.2 | "hdpe liner" pos 21.5. |
| `/dam-repair-services/` | 35 | 899 | 18.6 | |
| `/reservoir-lining/` | 29 | 554 | 14.1 | CTR 5.2%. |
| `/how-to-manage-farm-dam-water-levels-…-droughts…/` | 13 | 1 078 | 13.3 | Informational. |
| Pretoria / Limpopo / Mpumalanga / Western Cape / Johannesburg dam-liner pages | 5–19 each | 129–471 | 19–33 | Location pages rank on page 2–4. |
| Residential pages (`/roof-waterproofing/`, `/waterproofing-pretoria/`, `/waterproofing-overstrand/` …) | 0 | 0 | — | Not in the export (new or not yet ranking). |

## Query themes (top 1 000 queries, GSC)
| Theme | Queries | Clicks | Impr. | Evidence / uncertainty |
|---|---:|---:|---:|---|
| Steel tanks, reservoirs, troughs, fish ponds | 576 | 111 | 10 747 | Strong demand; most generic terms rank 20–35 ("steel water tanks" 329 impr pos 27; "steel water storage tanks" 194 pos 31; "galvanized water tank" 108 pos 32). "water tanks for sale" 1 401 impr pos 6.6 but only 3 clicks — intent mostly plastic/JoJo retail. |
| Dam liners / lining | 134 | 65 | 3 440 | Good positions for core terms: "dam liners south africa" pos 3.3, "dam lining" 4.9, "dam linings south africa" 5.0, "pvc dam liners south africa" 4.9. "hdpe liner" 21.5, "geomembrane liner" 50. |
| Price / cost | 149 | 59 | 1 423 | "sink dam prices in south africa" 10 clicks pos 6.6; "10000 litre water tank price in south africa" pos 8.3. |
| Waterproofing / roof / damp / leak | 46 | 2 | 618 | Mostly dam/geomembrane wording; "bitumen waterproofing" 127 impr pos 26. Residential roof/damp queries effectively absent. |
| Western Cape / Overstrand | 10 | 1 | 177 | "dam liners western cape" pos 3.4; "waterproofing company betty's bay" pos 1 (11 impr); "waterproofing contractor grabouw" pos 25. |
| Pretoria / Gauteng | 4 | 1 | 14 | No measurable Pretoria waterproofing demand captured yet. |
| Brand (damtech, dam tech) | 2 | 55 | 159 | |

## High-impression / low-CTR pages and queries (actionable)
1. `/steel-water-storage-tanks/` — 12.6k impressions, 2.1% CTR, ranking 16–37 for generic tank terms. Biggest single lever; content and internal linking already strong, so the gap is authority and relevance for "steel water tanks / galvanised tanks / steel reservoirs" (see `04-local-seo-recommendations.md`).
2. `10000-litre-water-tank` product — 3.4k impressions, CTR 1.9% at pos 13.7.
3. "water trough" — pos 5.4, 484 impressions, 0.4% CTR: the result may not match "concrete/plastic trough" intent; check the SERP before changing anything.
4. Location dam-liner pages — positions 19–33; low CTR expected at those positions.

## What to watch after the 18 Oct launch (no conclusions possible yet)
- GSC → Pages: "Not found (404)" should fall to zero for the 10 URLs redirected in this audit after recrawl.
- GSC → Performance compare 28 days after launch vs the previous 28 days, **same weekdays**, filtered to South Africa; expect noise for 2–6 weeks.
- If `/steel-water-storage-tanks/` or `/dam-liners/` lose > 30% clicks with stable impressions, inspect title/snippet changes in the SERP before editing pages.
- Submit `https://www.dam-tech.co.za/sitemap.xml` again in GSC (owner action) so the redesign is recrawled promptly.

## Conversions
GA4 export contains page views of "Quote request received" (13) and "Place your order" (4) in 19 Sep–16 Oct, which indicates at least 13 quote confirmations viewed. These are views, not deduplicated leads; trustworthy landing-page → lead attribution must come from the admin RFQ "Enquiry source" panel (stored per lead), not from this export.
