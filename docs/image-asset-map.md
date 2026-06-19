# Image Asset Map

Audit completed for the Damtech Next.js site. All local raster assets are WebP. Blog images were downloaded from the legacy WordPress site, optimised, and self-hosted under `/public/images/blog/`.

| Old filename | New filename | Used on page/component | Alt text | Notes |
| --- | --- | --- | --- | --- |
| `public/images/dam-liner-hero.svg` | `public/images/hdpe-dam-liner-farm-water-storage.webp` | `app/page.tsx`, `app/dam-liners/page.tsx`, `app/contact/page.tsx` (`PageImage` via `SITE_IMAGES`) | HDPE dam liner installation for agricultural water storage dam | Rasterised from placeholder SVG; ~10 KB |
| `public/images/about-company.svg` | `public/images/damtech-waterproofing-dam-liner-specialists.webp` | `app/about-us-waterproofing-company/page.tsx` (`PageImage`) | Damtech dam lining and water storage installation team | Rasterised from placeholder SVG; ~7 KB |
| `public/images/bitumen-waterproofing.svg` | `public/images/bitumen-waterproofing-roof-reservoir-repair.webp` | `app/bitumen-waterproofing/page.tsx` (`PageImage`) | Bitumen waterproofing application on concrete water-retaining structure | Rasterised from placeholder SVG; ~7 KB |
| `public/images/steel-tank.svg` | `public/images/corrugated-steel-water-tank-installation.webp` | `app/steel-water-storage-tanks/page.tsx` (`PageImage`) | Corrugated steel water tank installed for farm water storage | Rasterised from placeholder SVG; ~15 KB |
| `public/images/hero.webp` | `public/images/damtech-dam-liners-water-storage-solutions.webp` | `app/page.tsx` (`Hero` background via `SITE_IMAGES.homeHero`) | *(decorative — empty alt)* | Hero background; ~150 KB at 1600×900 |
| `IMG-20191205-WA0002.jpg` (WordPress) | `public/images/blog/hdpe-dam-liner-installation-farm-dam.webp` | Blog posts via `components/Prose.tsx` | HDPE dam liner installation for agricultural water storage in South Africa | Downloaded and compressed to ~61 KB |
| `Bonsmara-Cattle-next-to-HDPE-Lined-Dam.png` (WordPress) | `public/images/blog/bonsmara-cattle-beside-hdpe-lined-farm-dam.webp` | Blog posts via `components/Prose.tsx` | Cattle beside an HDPE-lined farm dam used for livestock water storage | Downloaded and compressed to ~143 KB |
| `Corrugated-Steel-Reservoir-Maintenance.png` (WordPress) | `public/images/blog/corrugated-steel-reservoir-leak-repair-maintenance.webp` | Blog posts via `components/Prose.tsx` | Corrugated steel reservoir undergoing professional leak repair | Downloaded and compressed to ~123 KB |
| `public/file.svg` | *(removed)* | — | — | Unused Next.js boilerplate |
| `public/globe.svg` | *(removed)* | — | — | Unused Next.js boilerplate |
| `public/next.svg` | *(removed)* | — | — | Unused Next.js boilerplate |
| `public/vercel.svg` | *(removed)* | — | — | Unused Next.js boilerplate |
| `public/window.svg` | *(removed)* | — | — | Unused Next.js boilerplate |

## Registry

Static image paths and alt text are centralised in `lib/images.ts` (`SITE_IMAGES`, `BLOG_IMAGE_REWRITES`). Blog HTML image URLs are rewritten at load time in `lib/posts.ts`.

## Re-optimising assets

```bash
node scripts/optimize-images.mjs
```

Requires `sharp` (dev dependency). Targets: content images &lt; 150 KB, hero images &lt; 300 KB.
