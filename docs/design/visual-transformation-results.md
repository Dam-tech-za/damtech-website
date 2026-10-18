# Visual transformation results

Side-by-side before (left, `main`) / after (right, branch) captures: `docs/design/compare/*-before-after.jpg` for home, roof waterproofing, waterproofing hub, dam liners, steel tanks and projects at desktop (1440) and mobile (390).

## What changed
| Area | Before | After | Files |
|---|---|---|---|
| Brand system | Inter only, navy/blue gradients, rounded white cards | Archivo expanded display + Inter; ink / cream / vivid blue / cyan; hairline rules instead of cards | `app/brand.css`, `app/layout.tsx` |
| Header | Small light bar, blue CTA | Wide-tracked uppercase wordmark, phone number, ink CTA; transparent over the home photo | `components/Header.tsx`, `components/MobileNav.tsx` |
| Home hero | Navy gradient covering most of a 1024 px photo; mobile was a dark block with crowded buttons and a competing sticky bar | Full-bleed 4032 px crew photo, oversized DAMTECH wordmark in the sky, H1 bottom-left; mobile: photo + headline, then copy/CTAs on cream; sticky bar deferred | `components/HomeHero.tsx` |
| Home body | Repeated eyebrow/heading/divider/card blocks | Cyan residential band; numbered proof list + photo/warranty split; photo service tiles (typographic tile for residential, no stand-in photo); dark process band with stroked numerals; editorial project grid with lead tile; blue typographic service index; large closing CTA | `components/Home*.tsx`, `app/page.tsx` |
| Inner heroes (31 pages) | Same dark navy text banner everywhere | Photo heroes where Damtech has relevant site photos (dam liners, services, projects, project detail, HDPE/PVC/torch-on/repair/reservoir, about, steel tanks); blue block + enquiry card for residential; ink for regional pages; cream for utility pages | `components/Hero.tsx`, `app/brand-pages.css` |
| Content sections | Stacked white cards | Editorial rows (heading left, copy right), typographic FAQ, related-link index, dark process band, ink inline CTA | `app/brand-pages.css` |
| Blog articles | Navy gradient header | Cream editorial masthead | `app/[slug]/page.tsx` |
| Footer | Navy four-column list | Ink footer with CTA band, structured link columns, office cards and a giant wordmark | `components/Footer.tsx` |

## Principles taken from the benchmarks (not their assets)
- Swell: photo-first hero with an enormous identity mark; confident type scale; colour blocks with hard edges; obvious primary action.
- Promax: large real installation photography in category tiles.
- Pomerleau: dark numbered sections and editorial project layouts.

## Tests
Typecheck, lint (0 errors), 300 unit tests, production build, SEO snapshot diff (no regressions on 75 routes), no horizontal overflow at 390 px on 17 key routes, lab performance probe (`docs/performance/benchmark-comparison.md`). Not yet done: 768 px and 1366 px full-page screenshot sweep across every route; keyboard/focus audit of the new header.
