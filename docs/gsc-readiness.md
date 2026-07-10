# Google Search Console readiness

After deploy, complete these manual steps in [Google Search Console](https://search.google.com/search-console):

## Property

- Use the **https://www.dam-tech.co.za** property (Domain or URL-prefix with www).
- Ensure `NEXT_PUBLIC_SITE_URL=https://www.dam-tech.co.za` in Vercel Production.

## Sitemap

- Submit: `https://www.dam-tech.co.za/sitemap.xml`
- Confirm sitemap lists **www** URLs only (no apex, no `/waterproofing-and-dam-liners/`, no `/category/uncategorized/`).
- Confirm `/calculators/` appears once at priority 0.9.

## URL inspection (Request indexing after deploy)

- `https://www.dam-tech.co.za/`
- `https://www.dam-tech.co.za/calculators/`
- `https://www.dam-tech.co.za/dam-liners/`
- `https://www.dam-tech.co.za/steel-water-storage-tanks/`
- `https://www.dam-tech.co.za/bitumen-waterproofing/`
- `https://www.dam-tech.co.za/projects/`
- `https://www.dam-tech.co.za/quote/`
- `https://www.dam-tech.co.za/faq/`

## Redirect checks

- `https://dam-tech.co.za/` → 301 → `https://www.dam-tech.co.za/`
- `https://dam-tech.co.za/dam-liners/` → 301 → `https://www.dam-tech.co.za/dam-liners/`
- `https://www.dam-tech.co.za/waterproofing-and-dam-liners/` → 301 → `https://www.dam-tech.co.za/faq/`
- `https://www.dam-tech.co.za/category/uncategorized/` → 301 → `https://www.dam-tech.co.za/blog/`

## Monitor

- Non-www impressions declining as www canonical consolidates.
- `/calculators/` indexed and appearing in internal link graph.
- Sitelink candidates: Dam Liners, Steel Tanks, Calculators, Projects, Quote, FAQ (Google decides automatically).
- 404s from legacy WordPress URLs (add 301s in `lib/redirects.ts` as needed).
- FAQ rich results after `/faq/` re-crawl.

## NAP verification (manual)

- Confirm Betty's Bay head office and Pretoria regional office match Google Business Profile listings before changing GBP.
