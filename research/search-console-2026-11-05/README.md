# Google Search Console export, 5 November 2026

Source: Search Console → Performance on Search results, exported by Tiaan on 5 Nov 2026 (`dam-tech.co.za-Performance-on-Search-2026-11-05.zip`).

| Setting | Value |
|---|---|
| Search type | Web (text-based) |
| Date range | 3 May 2026 – 2 Nov 2026 (last 6 months) |
| Property | dam-tech.co.za (www and non-www URLs both appear) |

## Files

| File | What it is |
|---|---|
| `raw/daily.csv` | Google's `Chart.csv`: clicks, impressions, CTR, position per day |
| `raw/queries.csv` | Top 1 000 queries |
| `raw/pages.csv` | Top pages (www, non-www, old WordPress URLs listed separately) |
| `raw/countries.csv`, `raw/devices.csv`, `raw/search-appearance.csv`, `raw/filters.csv` | As exported |
| `monthly.csv` | Daily data rolled up per month (May and Nov are partial) |
| `queries-tagged.csv` | Every query with a theme, region, intent and position band added |
| `query-themes.csv` | Totals per theme |
| `pages-combined.csv` | Pages with www/non-www merged and old blog URLs merged into their `/blog/` slug |
| `blog-posts-performance.csv` | One row per post in `lib/posts-data.json` |

The derived files are built by `research/scripts/gsc_summary.py`. Themes are simple keyword rules (see the script), so a few queries land in the wrong bucket. Read the query, not just the tag.

## Headline numbers (whole window)

| Measure | Value |
|---|---:|
| Clicks | 1 857 |
| Impressions | 71 741 |
| South Africa share of clicks | 1 690 (91%) |
| Mobile clicks / avg position | 1 099 / 6.8 |
| Desktop clicks / avg position | 737 / 20.2 |
| Product snippet clicks / impressions | 295 / 10 796 |
| All blog posts together | 114 clicks / 11 069 impressions (1.0% CTR) |

Clicks per month went from 51 (May, partial) to 747 (October). The October jump follows the redesign launch on 18 Oct.

## Limits

- Google caps the query list at 1 000 rows and hides rare queries, so query totals (454 clicks) are far below page totals.
- Impressions are not search volume. No search volumes are quoted anywhere in this folder.
- Posts published from 5 Nov 2026 (steel tank series, El Niño series, tank base guides) were not live in the window and show zero.
- No city-level split inside South Africa is available.
