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

- `https://dam-tech.co.za/` → 301/308 → `https://www.dam-tech.co.za/`
- `https://dam-tech.co.za/dam-liners/` → 301/308 → `https://www.dam-tech.co.za/dam-liners/`
- `https://www.dam-tech.co.za/waterproofing-and-dam-liners/` → 301/308 → `https://www.dam-tech.co.za/faq/`
- `https://www.dam-tech.co.za/category/uncategorized/` → 301/308 → `https://www.dam-tech.co.za/blog/`

### Host / apex (avoid redirect chains)

In **Vercel → Project → Settings → Domains**:

1. Set **`www.dam-tech.co.za`** as the **primary** production domain.
2. Add **`dam-tech.co.za`** (apex) as a domain that **Redirects to www.dam-tech.co.za** (not as a second production alias that serves content).
3. Confirm DNS: apex and www both point at Vercel as required for your DNS provider.

App redirects in `lib/redirects.ts` / `vercel.json` already send HTTPS apex → www. The HTTP apex chain (`http://apex` → `https://apex` → `https://www`) is fixed at the **Vercel domain** layer by making www primary and apex a redirect-to-www alias — platform HTTPS upgrade then lands on www in one hop.

Verify after change:

```bash
curl -sI http://dam-tech.co.za/ | head -10
curl -sI https://dam-tech.co.za/ | head -10
curl -sI http://www.dam-tech.co.za/ | head -10
curl -sI https://www.dam-tech.co.za/ | head -10
```

Expected: HTTP apex Location is `https://www.dam-tech.co.za/` (not `https://dam-tech.co.za/`).

## Monitor

- Non-www impressions declining as www canonical consolidates.
- `/calculators/` indexed and appearing in internal link graph.
- Sitelink candidates: Dam Liners, Steel Tanks, Calculators, Projects, Quote, FAQ (Google decides automatically).
- 404s from legacy WordPress URLs (add 301s in `lib/redirects.ts` as needed).
- FAQ rich results after `/faq/` re-crawl.

## NAP verification (manual)

- Confirm Betty's Bay head office and Pretoria regional office match Google Business Profile listings before changing GBP.
