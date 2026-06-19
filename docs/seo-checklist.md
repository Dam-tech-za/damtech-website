# SEO Checklist

Canonical domain: `https://dam-tech.co.za` (non-www).  
Metadata is generated via `createPageMetadata()` / `createMetadata()` in `lib/seo.ts`.  
Global JSON-LD on every page: **Organization**, **LocalBusiness**, **WebSite** (root layout).

## Indexable static pages

| Route | Title | Meta description (chars) | H1 | Canonical | Index | Schema (page-level) | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Dam Liners, Steel Water Tanks & Waterproofing \| Damtech South Africa | Expert dam liner, corrugated steel tank and bitumen waterproofing contractors serving farms and properties across South Africa. Request a free quote. (143) | Leaders In Dam Liners And Water Storage Solutions | `https://dam-tech.co.za/` | index | BreadcrumbList | Hero background OG image |
| `/about-us-waterproofing-company/` | About Damtech \| Dam Lining & Waterproofing Experts | Learn about Damtech — 30+ years installing HDPE dam liners, steel water reservoirs and bitumen waterproofing for agricultural and commercial clients nationwide. (154) | About Our Company | `https://dam-tech.co.za/about-us-waterproofing-company/` | index | BreadcrumbList | — |
| `/bitumen-waterproofing-services-and-more/` | Dam Liners, Water Tanks & Waterproofing Services \| Damtech | Full water storage and protection services: HDPE dam liners, corrugated steel tanks, bitumen waterproofing, leak repair and preventative maintenance. (147) | Dam Liners, Water Tanks & Waterproofing Services | `https://dam-tech.co.za/bitumen-waterproofing-services-and-more/` | index | BreadcrumbList, Service | — |
| `/dam-liners/` | HDPE Dam Liners & Dam Lining Contractors \| Damtech | Professional HDPE, PVC and bitumen torch-on dam liner supply and installation for farm dams, earth dams and reservoirs across South Africa. (138) | Quality Dam Liners For Every Application | `https://dam-tech.co.za/dam-liners/` | index | BreadcrumbList, Service | — |
| `/steel-water-storage-tanks/` | Corrugated Steel Water Tanks \| Damtech South Africa | Corrugated galvanised steel water tanks from 11 kL to 500 kL+, supplied with PVC lining. Built for farms, game reserves and rural water storage. (147) | Corrugated Steel Water Tanks | `https://dam-tech.co.za/steel-water-storage-tanks/` | index | BreadcrumbList, Service | — |
| `/bitumen-waterproofing/` | Bitumen Waterproofing Specialists \| Damtech | Bitumen torch-on, self-adhesive and liquid waterproofing for roofs, foundations, retaining walls and reservoirs. Installed by Damtech specialists. (144) | Bitumen Waterproofing | `https://dam-tech.co.za/bitumen-waterproofing/` | index | BreadcrumbList, Service | — |
| `/waterproofing-and-dam-liners/` | Dam Liner & Waterproofing FAQ \| Damtech | Answers to common questions about dam liners, zinc reservoirs, waterproofing warranties, maintenance and leak repair from the Damtech team. (138) | Dam Liner & Waterproofing FAQ | `https://dam-tech.co.za/waterproofing-and-dam-liners/` | index | BreadcrumbList, FAQPage | 6 FAQ items in schema |
| `/contact/` | Contact Damtech \| Request a Dam Liner Quote | Request a free dam liner or waterproofing quote. Contact Damtech by phone, email or our online form — serving clients across South Africa. (138) | Contact Damtech | `https://dam-tech.co.za/contact/` | index | BreadcrumbList | — |
| `/blog/` | Damtech Blog \| Dam Liners & Water Storage Guides | Practical articles on farm dam liners, steel reservoir maintenance, leak repair, borehole integration and water storage for South African agriculture. (147) | Damtech Blog | `https://dam-tech.co.za/blog/` | index | BreadcrumbList | Page 1 of 3 |
| `/blog/page/2/` | Damtech Blog \| Dam Liners & Water Storage Guides — Page 2 | Page 2 of Damtech blog articles on farm dam liners, steel reservoirs, waterproofing and water storage in South Africa. (127) | Damtech Blog | `https://dam-tech.co.za/blog/page/2/` | index | BreadcrumbList | Paginated archive |
| `/blog/page/3/` | Damtech Blog \| Dam Liners & Water Storage Guides — Page 3 | Page 3 of Damtech blog articles on farm dam liners, steel reservoirs, waterproofing and water storage in South Africa. (127) | Damtech Blog | `https://dam-tech.co.za/blog/page/3/` | index | BreadcrumbList | Paginated archive |

## Indexable blog posts (25)

Each post at `/{slug}/` has:

- **Title:** post `metaTitle` or `title` (unique per post)
- **Meta description:** post `metaDescription` or `excerpt` (unique per post)
- **H1:** post title (single H1 in article header)
- **Canonical:** `https://dam-tech.co.za/{slug}/`
- **Index:** index, follow
- **Schema:** BreadcrumbList, Article
- **OG/Twitter:** default share image + article Open Graph type

| Slug |
| --- |
| `essential-farm-dam-leak-repair-techniques-to-safeguard-your-water-storage-in-south-africa` |
| `powerful-strategies-to-optimize-borehole-and-farm-dam-water-integration-for-reliable-irrigation-in-south-africa` |
| `strategies-to-prevent-costly-farm-dam-liner-failure` |
| `proven-leak-repair-solutions-for-corrugated-steel-reservoirs` |
| `water-saving-hacks-for-south-african-farm-dams` |
| `critical-water-storage-tips-to-overcome-borehole-water-shortages-during-south-african-droughts` |
| `understanding-the-impact-of-soil-types-on-dam-liner-selection-and-longevity` |
| `innovative-maintenance-strategies-to-extend-the-life-of-corrugated-steel-reservoirs-in-harsh-agricultural-environments` |
| `proper-dam-and-borehole-water-management` |
| `fix-leaks-in-your-farms-water-storage-system` |
| `proper-water-storage-and-borehole-integration` |
| `prevent-leaks-in-your-water-storage-system` |
| `maximizing-irrigation-efficiency-with-proper-reservoir-maintenance` |
| `cost-benefit-analysis-of-corrugated-steel-reservoir` |
| `how-to-manage-farm-dam-water-levels-during-prolonged-droughts-in-south-africa` |
| `the-best-practices-for-repairing-leaks-in-corrugated-steel-reservoirs-to-avoid-costly-water-loss` |
| `protect-your-farm-dam-from-contamination-during-load-shedding` |
| `how-to-prevent-and-repair-leaks-in-your-farms-dam` |
| `integrating-borehole-water-with-farm-dams` |
| `how-to-optimize-farm-dam-water-quality-to-prevent-livestock-illnesses-in-south-africa` |
| `choosing-the-best-dam-lining-solutions-to-prevent-seepage-in-sandy-and-clay-soils-common-in-south-african-farmlands` |
| `how-seasonal-rainfall-patterns-influence-dam-design-and-reservoir-capacity-in-south-africa` |
| `the-role-of-vegetation-management-around-reservoirs-to-prevent-liner-damage-and-water-contamination` |
| `assessing-the-environmental-impact-of-different-dam-lining-materials-on-south-african-farmland` |
| `the-importance-of-proper-dam-liners-how-hdpe-protects-your-investment` |

## Noindex archives (`noindex, follow`)

| Route | Title | Canonical | Index | Notes |
| --- | --- | --- | --- | --- |
| `/category/uncategorized/` | Uncategorized Archives \| Damtech | `https://dam-tech.co.za/blog/` | noindex | Canonical points to blog |
| `/category/uncategorized/page/2/` | Uncategorized Archives \| Damtech — Page 2 | `https://dam-tech.co.za/blog/` | noindex | Legacy WP archive |
| `/category/uncategorized/page/3/` | Uncategorized Archives \| Damtech — Page 3 | `https://dam-tech.co.za/blog/` | noindex | Legacy WP archive |
| `/author/infodam-tech-co-za/` | Tiaan, Author at Damtech | `https://dam-tech.co.za/author/infodam-tech-co-za/` | noindex | Self-canonical |
| `/author/infodam-tech-co-za/page/2/` | Tiaan, Author at Damtech — Page 2 | `https://dam-tech.co.za/author/infodam-tech-co-za/page/2/` | noindex | Legacy WP archive |
| `/author/infodam-tech-co-za/page/3/` | Tiaan, Author at Damtech — Page 3 | `https://dam-tech.co.za/author/infodam-tech-co-za/page/3/` | noindex | Legacy WP archive |

## Sitemap (`/sitemap.xml`)

Includes:

- 9 indexable static paths (home, about, services, dam-liners, steel-tanks, bitumen, FAQ, blog, contact)
- 25 blog post URLs
- Blog pagination pages 2–3 (`/blog/page/2/`, `/blog/page/3/`)

Excludes:

- Category and author archives
- Reserved routes that 404 via `[slug]` guard
- WordPress `/wp-content/` paths

## Robots (`/robots.txt`)

```
User-agent: *
Allow: /

Sitemap: https://dam-tech.co.za/sitemap.xml
Host: https://dam-tech.co.za
```

Archive pages use `noindex, follow` meta tags rather than `robots.txt` disallow rules.

## Open Graph & Twitter

All pages include:

- `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale` (`en_ZA`)
- `og:image` (page-specific or default hero WebP)
- `twitter:card` = `summary_large_image`
- `twitter:title`, `twitter:description`, `twitter:image`

## Heading structure

- One **H1** per page via `Hero` or blog article header
- Section content uses **H2** / **H3** via `section-heading` and prose styles
- Blog post body uses **H2**+ from migrated WordPress HTML (no duplicate H1)

## Source of truth

Update titles, descriptions and H1s in `lib/pages.ts` (`PAGE_SEO`).  
Blog post metadata remains in `lib/posts-data.json`.
