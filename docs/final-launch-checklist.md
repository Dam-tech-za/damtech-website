# Final Launch Checklist

Pre-launch QA for the Damtech Next.js site (`https://dam-tech.co.za`).  
Automated checks run on **19 June 2026** — re-run before go-live.

## Automated checks (completed in repo)

| Item | Status | Notes | Action before launch |
| --- | --- | --- | --- |
| `npm run lint` | Pass | ESLint clean | Re-run after any final edits |
| `npm run build` | Pass | 64 static/SSG pages generated | Re-run on production branch |
| `node scripts/qa-links.mjs` | Pass | No missing `/images/` paths in scanned sources | Re-run after adding images |
| TypeScript | Pass | Included in `next build` | — |
| Sitemap (`/sitemap.xml`) | Pass | Includes main pages, 8 local SEO pages, `/quote/`, `/projects/` + 6 case studies, 25 blog posts, blog pagination | Verify live URL after deploy |
| Robots (`/robots.txt`) | Pass | `Allow: /` + sitemap URL on non-www domain | Verify live URL after deploy |
| Trailing-slash URLs | Pass | `trailingSlash: true` in `next.config.ts` | — |
| Legacy redirects | Pass | WordPress paths in `lib/redirects.ts` | Test `/contact-us/`, `/reservoirs/` live |
| One H1 per page | Pass | Via `Hero` or article header | Spot-check new local/project pages |
| Unique SEO titles (static) | Pass | Centralised in `lib/pages.ts`, `lib/local-pages.ts`, `lib/projects.ts` | Review Marico Hill TODO project copy |
| OG / Twitter metadata | Pass | All pages via `createMetadata()` | — |
| JSON-LD | Pass | Organization, LocalBusiness, WebSite (global); BreadcrumbList; Service/FAQ/Article per page type | Validate in Rich Results Test |
| Image alt text | Pass | Registry in `lib/images.ts`; project/local pages use descriptive alts | Add client photos for Marico Hill project |
| Noindex archives | Pass | Category + author + `/thank-you/` | — |

## Lead generation (requires production config)

| Item | Status | Notes | Action before launch |
| --- | --- | --- | --- |
| `/contact/` lead form | Ready | `LeadForm` → server action `submitLead` | Configure Supabase env vars on host |
| `/quote/` page | Ready | Full quote form with all required fields | Add to Google Ads / offline collateral |
| `/thank-you/` redirect | Ready | Redirect after successful submission | Test end-to-end on staging |
| Supabase `leads` table | Pending | SQL in `docs/supabase-leads.sql` | Run migration in Supabase dashboard |
| `SUPABASE_URL` env | Pending | Server-only | Set in Vercel/hosting |
| `SUPABASE_SERVICE_ROLE_KEY` env | Pending | Server-only — never `NEXT_PUBLIC_` | Set in Vercel/hosting |
| Form validation | Pass | Name, service, message required; phone **or** email required | Manual test each rule |
| Graceful failure without keys | Pass | User-friendly error + server log | Confirm on staging without env |

## Content & projects

| Item | Status | Notes | Action before launch |
| --- | --- | --- | --- |
| `/projects/` index | Ready | 6 case studies linked | — |
| Marico Hill project | TODO | Placeholder challenge/result marked in `lib/projects.ts` | Replace with verified client data + photos |
| Real project data (5 others) | Ready | Based on known Damtech portfolio figures | Optional: add more gallery photos |
| 8 local SEO pages | Ready | Unique copy per region/use case in `lib/local-pages.ts` | Review with sales team for accuracy |

## Manual QA (run before launch)

| Item | Status | Notes | Action before launch |
| --- | --- | --- | --- |
| Broken internal links (full crawl) | Manual | Use Screaming Frog or Lighthouse on deployed URL | Crawl staging + production |
| Duplicate meta descriptions | Manual | Blog posts use unique excerpts; static pages unique | Spot-check blog posts |
| Mobile layout | Manual | Tailwind responsive layouts on forms and local pages | Test iPhone + Android |
| Contact form E2E | Manual | Submit test lead with Supabase configured | Confirm row in `leads` table |
| Quote form E2E | Manual | Same as contact | Confirm `source_page` = `/quote` |
| Lighthouse SEO score ≥ 95 | Manual | Run on deployed `/`, `/quote/`, `/dam-liners/` | Target met expected on static SSG |
| Lighthouse Performance ≥ 90 | Manual | Hero WebP ~150 KB; minimal JS on marketing pages | Run on production CDN |
| Email notification for leads | Not built | Supabase insert only | Optional: Supabase webhook → email/CRM |
| Google Search Console | Pending | — | Submit sitemap after DNS cutover |
| Google Business Profile | Pending | — | Align NAP with `siteConfig` |

## New routes summary

| Route | Purpose |
| --- | --- |
| `/contact/` | Contact + lead form |
| `/quote/` | Dedicated quote request form |
| `/thank-you/` | Post-submission confirmation (noindex) |
| `/projects/` | Project portfolio index |
| `/projects/{slug}/` | Case study detail pages |
| `/pretoria-dam-liners/` … `/agricultural-water-storage/` | Local / industry SEO landing pages |

## Environment variables

```bash
# .env.local (see .env.example)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Commands

```bash
npm run lint
npm run build
node scripts/qa-links.mjs
```

## Sign-off

- [ ] Supabase leads table created and env vars set on production
- [ ] Test submission on `/contact/` and `/quote/` received in database
- [ ] Marico Hill project TODO content resolved or page held until client approval
- [ ] Lighthouse SEO ≥ 95 on production homepage
- [ ] Sitemap submitted to Search Console
- [ ] DNS points to `https://dam-tech.co.za` (non-www canonical)
