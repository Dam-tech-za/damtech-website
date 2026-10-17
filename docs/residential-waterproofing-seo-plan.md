# Residential Waterproofing — SEO & Content Plan

Date: 17 October 2026. Owner of this plan: the residential waterproofing expansion (Pretoria/Gauteng + Overstrand/Western Cape). Companion docs: `residential-waterproofing-implementation.md` (what was built), `image-requirements.md` (photography needed).

## 1. Evidence used

**First-party Search Console** (owner export, last 3 months to 14 Oct 2026; `google_analytics/*.csv`, not committed). Damtech currently earns almost no *residential* waterproofing search demand — it appears mainly for dam/geomembrane terms — which is the gap this expansion addresses. Relevant signals:

| Query | Impr | Avg position | Read |
|---|---|---|---|
| bitumen waterproofing | 127 | 26.1 | Real demand, Damtech buried on p3 — needs a stronger waterproofing page |
| waterproofing company betty's bay | 11 | **1.0** | Overstrand already ranks #1 — real local footing to build on |
| waterproofing contractor betty's bay | 1 | 1.0 | as above |
| leak detection betty's bay | 2 | 8.0 | coastal leak-detection intent |
| waterproofing contractor grabouw | 32 | 25.0 | Overberg demand, weak position |
| bitumen waterproofing johannesburg | 5 | 21.6 | Gauteng bitumen intent |
| damp liner / dam waterproofing | 5 / 30 | 3.6 / 3.4 | mixed dam intent — keep separate from residential |

Takeaways: (1) the **Overstrand** is the strongest residential foothold (Betty's Bay #1); (2) **Pretoria/Gauteng residential** demand is not yet captured because there is no Pretoria residential content; (3) "bitumen waterproofing" has real volume the site should own properly.

**Competitor landscape** (web search, Oct 2026): the market is lead-gen directories (ProCompare, Bark, Kandua) plus local contractors (e.g. Omega Dampproofing, Hallco, TCT, MIG, Wilcote). Typical credible contractors run a **service-page + location-page** structure, explain problem → sign → system → process → quote, and separate *waterproofing* from *damp-proofing*. No competitor text was copied; no keyword volumes were invented.

## 2. Architecture decisions

The site already has `/waterproofing/` (built in the main optimisation; it replaced `/bitumen-waterproofing/` via 301 and ranks for Betty's Bay). **Decision: keep `/waterproofing/` as the residential hub** rather than introduce `/residential-waterproofing/` — it already holds the equity and avoids a second redirect. The brief's recommended `/residential-waterproofing/` URL is therefore not used; the hub URL is the superior existing convention the brief allows.

| Page | URL | Intent | Status |
|---|---|---|---|
| Residential hub | `/waterproofing/` | "waterproofing", "bitumen waterproofing", brand + home waterproofing | Existing → expanded |
| Roof waterproofing | `/roof-waterproofing/` | "roof waterproofing", "flat roof waterproofing", "leaking roof repair" | New |
| Foundation & damp-proofing | `/foundation-waterproofing/` | "damp proofing", "foundation waterproofing", "rising damp", "retaining wall waterproofing" | New |
| Pretoria region | `/waterproofing-pretoria/` | "waterproofing contractors Pretoria/Centurion", "roof waterproofing Pretoria" | New |
| Overstrand region | `/waterproofing-overstrand/` | "waterproofing Betty's Bay/Kleinmond/Hermanus/Gansbaai" | New |
| Torch-on guide | `/torch-on-waterproofing/` | "torch-on waterproofing" (homeowner roof intent) | New |
| Membranes vs coatings guide | `/waterproofing-membranes-and-coatings/` | "liquid rubber vs torch-on", "waterproofing membrane types" | New |

**Why two regional pages, not four.** The brief lists Pretoria, Betty's Bay/Kleinmond, Hermanus and Gansbaai. Damtech has two operating bases (Pretoria, Betty's Bay) and **no residential projects or photos in any coastal town**, so four near-identical coastal pages would be thin doorway pages — which the brief and the repo's own rules forbid. The coastal towns share one climate story (winter, wind-driven rain, salt air) and one service area from Betty's Bay. They are therefore consolidated into **one strong `/waterproofing-overstrand/` page** that names Betty's Bay, Kleinmond, Pringle Bay, Rooi-Els, Hermanus, Onrus, Vermont, Gansbaai, Stanford and De Kelders in genuinely area-specific content. Per-town pages can be added later **when real local projects with photos exist** (see image-requirements.md). This matches "consolidate rather than create thin geographic pages."

**Cannibalisation guard.** `/torch-on-dam-lining/` keeps cement-dam/reservoir intent; `/torch-on-waterproofing/` targets homeowner roof intent. Each states what it is *not* and links to the other, so they do not compete for the same query. The Overstrand page does not duplicate the agricultural `/western-cape-dam-liners/` page (different audience and content).

**Geography accuracy.** The Overstrand is part of the **Overberg** region of the Western Cape — never presented as a Cape Town suburb. Bases in Pretoria and Betty's Bay are described as operating bases, not walk-in offices; no street addresses, branches, staff, reviews or completed residential projects are invented.

## 3. Keyword-to-page map

No search volumes are quoted (no verified volume source). Positions above are from §1.

- `/waterproofing/` — waterproofing; bitumen waterproofing; home/residential waterproofing; waterproofing company South Africa; entry point to both service and regional pages.
- `/roof-waterproofing/` — roof waterproofing; flat concrete roof waterproofing; leaking roof repair; parapet/flashing waterproofing; torch-on roof; roof coating.
- `/foundation-waterproofing/` — damp proofing; rising damp treatment; foundation waterproofing; below-ground/basement waterproofing; retaining wall waterproofing; damp-proof course.
- `/waterproofing-pretoria/` — waterproofing contractors Pretoria; roof waterproofing Pretoria/Centurion; damp proofing Pretoria; roof leak repair Pretoria East/Centurion.
- `/waterproofing-overstrand/` — waterproofing Betty's Bay / Kleinmond / Hermanus / Gansbaai / Overstrand; roof leak repair Overberg; coastal waterproofing.
- `/torch-on-waterproofing/` — torch-on waterproofing; torch-on vs other systems; modified bitumen membrane roof.
- `/waterproofing-membranes-and-coatings/` — waterproofing membrane types; liquid rubber vs torch-on; acrylic roof coating vs waterproofing; which waterproofing system.

## 4. Technical accuracy guardrails (content rules)

- Distinguish **waterproofing** (stops water ingress through the building envelope) from **damp-proofing** (DPC/DPM against rising/ground damp), and **coatings** (a reflective/UV top layer) from **complete membrane systems**.
- A flat concrete roof (ponding, foot traffic), a moving metal-sheet roof (thermal movement, laps) and a below-ground wall (hydrostatic pressure) need **different** specifications — never "one product fits all".
- Do not present ordinary acrylic roof paint as a permanent cure for structural ingress.
- Systems named (torch-on modified bitumen, self-adhesive bitumen, reinforced liquid/acrylic, liquid rubber/bitumen emulsion, polyurethane, cementitious) are described as **options subject to on-site assessment**; the written quote specifies the actual system. No system is claimed as a standing Damtech product beyond what the repo/warranty already supports.
- Guarantees use the approved wording in `lib/warranty.ts` ("up to 10 years supplier-backed material warranty where stated in the quotation; 12 months workmanship") — never invented periods or "permanently leak-free" promises.
- No invented warranties, certifications, reviews or completed residential projects.

## 5. Conversion & local SEO

- Every page: prominent **Request a free assessment** (quote), **click-to-call** and **WhatsApp** actions; the quote link carries `?service=` so the residential service is pre-selected and the lead is classified for admin (via the existing attribution + `serviceRequired` fields — no separate backend).
- Each page: unique H1, title, meta description and intro; `Service` + `FAQPage` + `BreadcrumbList` structured data; regional pages add the relevant office `HomeAndConstructionBusiness` with `areaServed`.
- Internal links weave hub ↔ service ↔ regional ↔ guide, and connect to existing `/torch-on-dam-lining/`, `/dam-repair-services/` and `/contact/` without overwhelming dam-lining visitors.
- All new routes added to `sitemap.xml`, navigation (a Waterproofing grouping), footer, homepage path and the services overview.
