# Performance benchmark comparison

## Source and method
- Tool: `scripts/perf-lab.mjs` (Playwright + Chrome DevTools Protocol). **Not Lighthouse** — Lighthouse is not installed in this environment. Metrics: FCP, LCP, CLS, TBT (long tasks after FCP, minus 50 ms each, within 5 s after load), transferred bytes.
- Profiles: **mobile** 390×844, 4× CPU slowdown, 150 ms RTT, 1.6 Mbps down; **desktop** 1366×768, no CPU slowdown, 40 ms RTT, 10 Mbps.
- Servers: local `next start` production builds on Windows desktop (no CDN, gzip only). `main` @ 8d1acc8 vs branch. Median of 3 runs. Lab only — not CrUX field data, not South African network conditions; absolute numbers will differ on Vercel's edge (brotli, CDN).
- The Grok report (desktop Lighthouse 65, LCP 2.66 s, TBT 389 ms) was not supplied in this environment and was not re-run as Lighthouse.

## Results (median of 3)
| Profile | Route | Before LCP | After LCP | Before CLS | After CLS | Before TBT | After TBT | After KB |
|---|---|---|---|---|---|---|---|---|
| mobile | `/` | 1936 ms | 2136 ms | 0 | 0 | 470 ms | 517 ms | 1239 |
| mobile | `/roof-waterproofing/` | 1680 | 1848 | 0 | 0.046 | 520 | 540 | 1209 |
| mobile | `/dam-liners/` | 1784 | 2048 | 0 | 0.034 | 516 | 532 | 1295 |
| mobile | `/steel-water-storage-tanks/` | 1812 | 2024 | 0 | 0.027 | 535 | 539 | 1323 |
| desktop | `/` | 764 | 888 | 0 | 0 | 180 | 52 | 1766 |
| desktop | `/roof-waterproofing/` | 324 | 444 | 0 | 0.012 | 0 | 0 | 1555 |
| desktop | `/dam-liners/` | 360 | 764 | 0 | 0.007 | 0 | 2 | 1755 |

Reading:
- LCP stays well inside the 2.5 s "good" threshold on the throttled mobile profile. The +150–250 ms comes from the second font file (Archivo, ~100 KB) and larger hero photographs replacing text-only heroes.
- CLS rose from 0 to ≤0.046 on inner pages — inside the 0.1 "good" threshold. Cause (attributed via layout-shift sources): the hero H1 reflows when Archivo swaps in over its fallback, because the expanded width axis can't be matched by fallback metrics.
- **Third-party tags dominate main-thread cost.** With Google Tag Manager, Meta Pixel and Speed Insights blocked (`BLOCK_THIRD_PARTY=1`), mobile TBT on `/` drops from ~517 ms to ~71 ms and JS transfer from ~958 KB to ~236 KB. First-party JS (React/Next + site code) is ~190 KB gzip on the homepage.
- Tested deferring GTM/Pixel to `lazyOnload`: no lab improvement (scripts still execute in the measurement window), so the tracking change was **reverted** rather than altering attribution timing without evidence.

## Recommendations (not yet implemented)
1. **GTM container audit (owner/marketing access needed):** the container plus Pixel add ~720 KB JS. Remove unused tags, check whether GA4 is configured both as a GTM tag and elsewhere, and consider server-side tagging. This is the largest single lever and needs no site code change.
2. If brand allows, set Archivo to `display: "optional"` to eliminate the font-swap CLS (first uncached visit may then show fallback headings).
3. Re-measure with Lighthouse (mobile + desktop, 5 runs) on the Vercel preview and production once access allows.

## Update 18 Oct 2026 (after palette change + dead-CSS prune, commit 9baf848)
Main CSS bundle 37 KB → 32 KB gzip (286 unused legacy rules removed). Same mobile profile, median of 3:

| Route | Before (main) LCP | Now LCP | Now CLS | Now TBT |
|---|---|---|---|---|
| `/` | 1936 ms | 1896 ms | 0 | 483 ms |
| `/roof-waterproofing/` | 1680 ms | 1680 ms | 0.046 | 523 ms |
| `/dam-liners/` | 1784 ms | 1904 ms | 0.034 | 490 ms |

The first-screen regression is gone on the homepage and roof page; the dam liners page is ~120 ms slower because it now opens on a full photograph instead of text. TBT is still dominated by GTM + Meta Pixel.
