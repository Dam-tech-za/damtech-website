# Residential Waterproofing — Implementation Record

Date: 17 October 2026. Companion to `residential-waterproofing-seo-plan.md` (research and strategy) and `image-requirements.md` (photography needed). Not deployed — see Deployment status.

## Pages created (6) and changed (4)

| Route | Type | H1 | Words | Schema |
|---|---|---|---|---|
| `/roof-waterproofing/` | Service | Roof Waterproofing for Homes | ~850 | Service ×3, FAQPage, BreadcrumbList |
| `/foundation-waterproofing/` | Service | Foundation Waterproofing & Damp-Proofing | ~835 | Service ×3, FAQPage, BreadcrumbList |
| `/waterproofing-pretoria/` | Regional | Waterproofing in Pretoria and Centurion | ~715 | Service ×2, FAQPage, BreadcrumbList, HomeAndConstructionBusiness (Pretoria base) |
| `/waterproofing-overstrand/` | Regional | Waterproofing in the Overstrand | ~720 | Service ×2, FAQPage, BreadcrumbList, HomeAndConstructionBusiness (Betty's Bay base) |
| `/torch-on-waterproofing/` | Guide | Torch-On Waterproofing for Homes | ~710 | Service, FAQPage, BreadcrumbList |
| `/waterproofing-membranes-and-coatings/` | Guide | Waterproofing Membranes and Coatings Compared | ~870 + comparison table | Service, FAQPage, BreadcrumbList |

Changed: `/waterproofing/` (hub now links to all six), `lib/site.ts` (nav + footer + sitemap), `components/Footer.tsx` (two-pathway footer), `app/[slug]/page.tsx` (reserve the new slugs from the blog catch-all).

## How it is built

- **One config file** `lib/residential-waterproofing.ts` holds every page's content (hero, sections, comparison, FAQs, related links, schema service types, area served, office ids, quote-service) as typed objects, plus the shared process steps and the `residentialMetadata` / `residentialQuoteHref` helpers.
- **One renderer** `components/ResidentialWaterproofingPage.tsx` turns a config into a page using the existing design-system blocks (`Hero`, `ServiceProseSections`, `ComparisonTable`, `ProcessStepsSection`, `SectionCta`, `ServiceFaqSection`, `RelatedPageLinks`, `PageSeo`). Each route file is ~10 lines.
- **Image-free template** (same as `/waterproofing/`): no hero photo and no project-photo strip, so the image restriction is fully respected — no existing image was edited, and no dam photo is used to imply a residential roof project. The OG image falls back to the site default; a residential OG image is logged in `image-requirements.md`.

## Content accuracy (per the plan's guardrails)

- Waterproofing vs damp-proofing, and coatings vs membrane systems, are explained explicitly (foundation page and the comparison guide).
- System-per-substrate is stated throughout: flat concrete roof ≠ moving metal roof ≠ below-ground wall under hydrostatic pressure.
- Acrylic paint is not presented as a cure for structural ingress.
- Systems (torch-on, self-adhesive, reinforced liquid, liquid rubber, acrylic/elastomeric, cementitious) are framed as options confirmed by on-site assessment, not as standing products.
- Guarantees use `lib/warranty.ts` wording ("up to 10 years supplier-backed material warranty where stated; 12 months workmanship"); no "permanently leak-free" promises.
- No invented projects, reviews, certifications, offices or street addresses. Bases are "operating bases, not walk-in offices." The Overstrand is the Overberg region, not a Cape Town suburb.

## Conversion & lead classification

- Each page has a hero **Request a free assessment** button and a **WhatsApp photos** button, a mid-page CTA, and FAQ.
- Quote links carry `?service=Roof%20%2F%20home%20waterproofing`, which the existing quote form pre-selects (verified). Combined with the first-touch attribution added in the main optimisation (landing page is saved on each RFQ), admin can tell a residential lead and its source page from an agricultural one — using the existing backend, no separate system.
- The quote/contact workflow, validation, spam protection and storage are unchanged and still shared; dam and reservoir flows are untouched.

**Scope decision:** no residential-only form fields (property type, urgency) were added. The shared quote form already captures province, service, approximate size, location and a free-text message, and adding residential-only fields to the shared schema/backend risked the "disconnected system" the brief warns against. Residented intent is carried by the pre-selected service + landing-page attribution. Property type / urgency can be added later as optional fields on the shared form if the owner wants them.

## Tests executed (local, cloud copy of the repo)

| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | 0 errors (pre-existing warnings only) |
| `npm test` | 297 / 297 pass |
| `next build` | Pass; all 6 routes prerendered as static; meta titles ≤ 60, descriptions ≤ 155 |
| Playwright crawl (85 routes × 6 viewports) | New routes 200, single H1, correct schema, in sitemap, 82 inbound internal links each, **no horizontal overflow, no console/hydration errors** |
| Quote pre-select | `/roof-waterproofing/` CTA → `/quote/` with "Roof / home waterproofing" selected |
| Nav / footer | All 6 residential links present in the header Waterproofing dropdown and the footer Waterproofing group |
| Comparison table | Renders with 4 columns × 5 rows; scrolls on mobile (no overflow) |
| Dam-lining regression | Existing dam/reservoir/quote routes still 200; unit tests for RFQ flows pass |

## Internal linking

Hub `/waterproofing/` → all six. Service ↔ service, service ↔ regional ↔ guide cross-links in each page's related section. Guides link to `/torch-on-dam-lining/` and back. Nav dropdown and footer group link all six site-wide. Regional pages link to `/contact/`.

## Deployment status

**Not deployed.** Push access to the GitHub repository was not available in this session. Commits are in the branch `feat/residential-waterproofing` (continuing from the main optimisation). To ship: push the branch, open a PR, verify the Vercel preview (hub, a service page, a regional page, the comparison guide, the quote pre-select, and an existing dam page), then merge and resubmit the sitemap in Search Console.

## Remaining limitations / next steps

- **Photography** is the main gap — see `image-requirements.md`. Residential pages are text-only; real local roof/damp photos (and a residential OG image) would lift credibility and conversion.
- **Per-town pages** (individual Hermanus / Gansbaai / Kleinmond pages) are deliberately not created yet; add them only when real local projects with photos exist, so they are substantive rather than thin.
- **Google Business Profile**: the plan assumes the existing service-area profiles; no GBP data was accessible in this session to tailor local content further.
- Optional residential form fields (property type, urgency) not added — see scope decision above.
- A short "two pathways" chooser block on the homepage could make the dam-vs-waterproofing split clearer; current homepage keeps a waterproofing card + banner.
