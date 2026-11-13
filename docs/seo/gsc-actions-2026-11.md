# Search Console actions — November 2026

Source: Search Console export, 6 months to 5 Nov 2026 (web). Branch `seo-gsc-nov-2026`.
These are deliberate SEO changes, not design side effects. Before/after diff of all 168 routes
against `main`: `docs/seo/snapshots/diff-latest.md` (every difference is listed below).

## Changed
| Page | Change | Why (GSC) |
|---|---|---|
| `/hdpe-dam-lining/` | Title and description | "hdpe dam lining" at position 4 with 0% CTR; geomembrane terms at 25–52 |
| `/steel-water-storage-tanks/livestock-water-trough/` | Title and description lead with "cattle water trough" | "water trough" position 5.4, 0.2% CTR |
| `/torch-on-waterproofing/` | Title and description | "torch on waterproofing" position 9.5, 0.3% CTR |
| `/waterproofing/` | Title, description, H1 now service-led; new bitumen torch-on section and FAQ; town section moved lower | Hub and `/waterproofing-overstrand/` both targeted Betty's Bay; the old `/bitumen-waterproofing/` URL (1 054 impressions) redirected to a town-titled page |
| `/waterproofing-pretoria/` | New section and FAQ: damp proofing, basements, balconies, showers | Pretoria damp/basement/bathroom queries at 6–34 with 0 clicks |
| `/steel-water-storage-tanks/` | Description with the kit price; size and price grid linking to each kit; price FAQ; pressed/sectional FAQ | 23k impressions, head terms at ~30 |
| `/farm-dam-liners/` | Title, description, H1 retargeted at farm dam lining and earth dam liners; earth dam FAQ; more links | Position 32.9, cannibalised by `/dam-liners/` |
| `/agricultural-water-storage/` | Title, description, H1 retargeted at steel reservoirs; two FAQs; steel tank project links | Position 37.9, 0 clicks; "steel reservoirs" 384 impressions at 26 |
| `/mining-dam-liners/` | FAQ on water storage tanks for mines | "mining water storage tanks" at 59 |
| `/limpopo-dam-liners/`, `/mpumalanga-dam-liners/` | Link to the Tzaneen and Barberton projects | Regional pages at 17–28 needed local proof |
| Site-wide | Anchor text for the two retargeted pages; Tulbagh project links to the tanks hub as "Steel water tanks for sale" | Internal links for the head terms |

A test in `lib/catalogue/catalogue.test.ts` fails if the prices quoted in the hub description or FAQ drift from the catalogue.

## Not done
- Fish ponds hub page: dropped at the owner's request.
- HDPE geomembrane supply-only page: needs the owner to confirm Damtech sells material without installation.
- Tank comparison article (corrugated vs pressed vs sectional): covered by an FAQ on the tanks hub for now; a full article should go through `research/blog-writing-policy.md`.
- Regional pages for Johannesburg, KwaZulu-Natal, Free State, Northern and Eastern Cape have no published local project to link. They need real projects with photos.

## Owner actions in Search Console
1. Confirm the property is the Domain property (covers www, non-www, http).
2. Resubmit `https://www.dam-tech.co.za/sitemap.xml` after deploy.
3. Request indexing for `/waterproofing/`, `/farm-dam-liners/`, `/agricultural-water-storage/`, `/steel-water-storage-tanks/` and `/hdpe-dam-lining/`.
4. Recheck positions and CTR for these pages 4 weeks after deploy.
