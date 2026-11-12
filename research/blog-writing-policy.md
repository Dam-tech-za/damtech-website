# Damtech blog writing policy

Version 1, 12 November 2026. Owner: Tiaan de Lange.
Data: `research/search-console-2026-11-05/` (Google Search Console, 3 May – 2 Nov 2026).

## 1. The one rule

**Every post must target a real search query from Search Console and send the reader to a page that makes money.**

Before a post is written, the brief must name:

1. The **main query** it targets, copied from `queries-tagged.csv` (or a close variant with evidence).
2. The **evidence**: impressions, clicks and position for that query and its close variants.
3. The **money page** it supports: a service page, product page, the shop, the calculator or the quote form.
4. The **one action** the reader should take at the end.

If a topic has no query evidence, it needs a written reason (for example a new product, a season like El Niño, or a question customers keep asking). "It would be interesting" is not a reason.

## 2. What the data tells us

These are the facts the targets below are built on. All numbers are from the 6-month export.

1. **The blog barely earns clicks.** All 17 older posts together: 114 clicks from 11 069 impressions, a 1.0% CTR. The site as a whole gets 2.6%. Posts show up in search but people do not click them.
2. **Most posts are stuck on page 2.** Average blog position is 10 to 20. Titles and opening lines do not match what people typed.
3. **The demand is commercial.** Queries with "price", "cost" or "for sale" got 149 clicks. Queries starting "how/what/why" got almost none. People searching for us want to buy or price something.
4. **Steel tank searches are big but we rank low.** "steel water tanks" (668 impressions, position 31), "steel water tank" (507, 30), "steel water storage tanks" (443, 35), "steel reservoirs" (384, 26), "galvanized water tank" (227, 39). These belong to `/steel-water-storage-tanks/` (23 406 impressions, position 20). Blog posts should support that page, not compete with it.
5. **Dam liners already rank well.** "dam liners south africa" position 2.7, "dam lining" 5.7, "pvc dam liners south africa" 5.6. Price queries are close: "dam liner prices in south africa" (165, position 9.7).
6. **Residential waterproofing is small but real, and we have no blog posts on it.** 68 queries, 1 338 impressions, 9 clicks. "torch on waterproofing" (313, position 9.5) and "bitumen waterproofing" (355, position 30) are the biggest. Local queries exist for Hermanus, Grabouw, Betty's Bay and the Overberg, and for Pretoria.
7. **Mobile wins.** 59% of clicks come from phones, at average position 6.8 (desktop 20.2). Write for a phone screen first.
8. **What worked in the new posts.** The November posts (steel tank series, tank base guides) follow the right pattern: a specific question, a quick answer near the top, tables, a named engineer, and links to the tank pages. They were not live during the export window, so their results come in the next export.

## 3. SEO targets

Work in this order. Each new post should be paired with one refresh of an older post.

### Priority A: fix the posts Google already shows (refresh, do not rewrite from scratch)

**Status 12 Nov 2026:** all 17 older posts were rewritten to this policy (new titles, quick answers, tables, FAQs and a drawing each), keeping every URL. Judge the result in the export after about 28 and 90 days.

These posts have impressions but a CTR under 1%. Rewrite the meta title, meta description, H1 and first paragraph around the query people actually use. Add a quick-answer box and a link to the money page. Keep the URL.

| Post | Impr. | CTR | Pos. | Retarget to (evidence) | Money page |
|---|---:|---:|---:|---|---|
| `/blog/hdpe-dam-liner-benefits/` | 2 094 | 0.7% | 10.5 | "hdpe dam liner" (85, pos 6.3), "uv resistant dam linings" (115, pos 5.0). Check in GSC which page Google shows for "hdpe liner" (298, pos 20) before deciding; the service page must stay the main target. | `/hdpe-dam-lining/` |
| `/blog/integrating-borehole-water-farm-dams/` | 1 740 | 0.9% | 11.6 | "borehole irrigation systems" (47, pos 16), "borehole water storage tanks" (31, pos 18) | `/steel-water-storage-tanks/` |
| `/blog/farm-dam-drought-water-levels/` | 1 571 | 1.0% | 14.7 | Drought and El Niño; link into the new El Niño series | `/dam-liners/` |
| `/blog/farm-dam-water-saving-tips/` | 1 436 | 0.6% | 13.9 | Same drought cluster; merge into the post above if more than half the advice overlaps | `/dam-liners/` |
| `/blog/farm-dam-water-quality-livestock/` | 873 | 0.9% | 20.5 | "farm dam water quality" (154, pos 12), "water storage for livestock" (88, pos 7.6) | `/steel-water-storage-tanks/livestock-water-trough/` |
| `/blog/farm-dam-leak-repair/` | 750 | 1.3% | 10.7 | "leaking farm dam" (25, pos 13.6), "dam leakage" (43, pos 29) | `/dam-repair-services/` |

### Priority B: new posts that support the tank and liner pages

| Working title | Main query (evidence) | Money page | Author |
|---|---|---|---|
| Steel water tank sizes and prices in South Africa | "steel water tanks prices" (129, pos 3.2, 1 click), "water tanks sizes and prices" (48, pos 8.4), "10 000 litre steel water tank" (104, pos 12), "what is the diameter of a 10000 litre tank" | Tank product pages, `/shop/` | Tiaan |
| Steel dams: corrugated, galvanised and panel tanks compared | "steel dams south africa" (235, pos 18), "corrugated steel dams" (203, pos 10), "pressed steel dams" (211, pos 21), "steel panel dam" (186, pos 17), "bolted steel dams" (193, pos 25), "galvanized steel dams" (111, pos 8) | `/steel-water-storage-tanks/` | Tiaan |
| Farm dams in South Africa: earth, lined or steel? | "farm dams south africa" (193, pos 7.2, 0 clicks), "lined farm dams" (106, pos 5.0), "affordable farm dams" (88, pos 8.8), "agricultural dams south africa" (55, pos 9.2) | `/farm-dam-liners/` (499 impressions at pos 33, needs the support). Partly covered by the 12 Nov rewrite of `/blog/dam-lining-sandy-clay-soils/` ("lined farm dams"). | Tiaan |
| How to size and price a PVC dam liner | "pvc dam liners south africa" (152, pos 5.6), "dam liner prices in south africa" (165, pos 9.7), "how to calculate pond liner size", "dam size calculator" | `/pvc-tank-liners/`, `/calculators/` | Tiaan |
| Steel fish ponds: sizes and what they cost | "fish pond for sale" (423, pos 7.3, 4 clicks), "how much is a fish pond" (8) | Fish pond product pages | Tiaan |
| ~~Farm dam maintenance checklist~~ Done 12 Nov 2026: `/blog/prevent-farm-dam-liner-failure/` now targets it | "farm dam maintenance" (135, pos 11.8, 0 clicks), "dam maintenance" (18) | `/dam-repair-services/` | Tiaan |

The steel dam comparison must be honest: say clearly that Damtech supplies corrugated tanks and does not sell pressed steel or sectional panel tanks.

### Priority C: residential waterproofing, Overstrand first

We have zero waterproofing posts. Volumes are small, so expect slow results. Name Overstrand towns (Betty's Bay, Kleinmond, Pringle Bay, Rooi Els, Hermanus, Grabouw, Gansbaai) first, Pretoria and Centurion second.

| Working title | Main query (evidence) | Money page |
|---|---|---|
| Torch-on waterproofing: what it is and how long it lasts | "torch on waterproofing" (313, pos 9.5, 1 click), "torch on" (59, pos 8.6), "what is torch on waterproofing" (7), "how to do torch on waterproofing" (3) | `/torch-on-waterproofing/` (828 impr, 0.5% CTR) |
| Bitumen waterproofing types explained | "bitumen waterproofing" (355, pos 30), "bituminous waterproofing" (10) | `/bitumen-waterproofing/` |
| Flat roof waterproofing at the coast: wind, salt and winter rain | "waterproofing services hermanus" (21, pos 13), "waterproofing contractor grabouw" (36, pos 24), "waterproofing contractors overberg" (13), "waterproofing company betty's bay" (13, pos 1.9) | `/waterproofing-overstrand/`, town pages, `/roof-waterproofing/` |
| Rising damp or penetrating damp? How to tell and fix it | "dampproofing pretoria" (36, pos 11), "damp proofing pretoria" (13, pos 6), "dampproofing and waterproofing" (6), "foundation damp proof membrane" | `/foundation-waterproofing/`, `/waterproofing-pretoria/` |
| How to find a leak on a flat concrete roof | "roof leak" (12, pos 6.8), "roof leaks" (3) | `/roof-waterproofing/` |

Rules for these posts:

- Write one general post per topic and mention the towns where they genuinely apply. **Never** make copies of a post with only the town name changed.
- Free on-site assessments are only offered in Betty's Bay, Kleinmond, Pringle Bay and Rooi Els. Everywhere else: contact us for a quote or call-out fee.
- Do not explain where the business is based or why it works in a region. Just describe the service and the area.
- Do not say all waterproofing systems are interchangeable. Say which system suits which roof.

### Do not target

| Query | Why not |
|---|---|
| "water tanks for sale" (2 753, pos 8.3, 0.3% CTR) | Mostly people shopping for plastic tanks. Leave it to the shop and product pages. |
| "water trough" (1 160, pos 5.4, 0.2% CTR) | Intent mismatch (many want concrete or plastic troughs, or the Afrikaans word). Check the results page before writing anything. |
| Competitor brand names (e.g. "duraflex dams & linings") | Not ours to target. |
| "geomembrane manufacturers / suppliers" | We install; we do not manufacture. |
| Pressed steel, sectional and welded tanks as products | We do not sell them. Only mention them in the honest comparison post. |
| "mining water storage tanks" (pos 59), international queries | No matching service or market. |
| "western cape bedliner services" | Truck bed liners, not dam liners. |

## 4. How to write: keep it simple

Tiaan wants posts that a farmer or homeowner understands on the first read.

- **Write for one reader.** A farmer, a homeowner or a site manager. Pick one per post.
- **Answer first.** The answer to the main query goes in the first 100 words, then a "Quick answer" table or short list.
- **Short sentences.** Aim for under 20 words. One idea per paragraph. Two to four sentences per paragraph.
- **Plain words.** Say "the wall of the tank", not "the shell". Explain every technical term the first time ("a ring beam, the concrete ring the tank stands on").
- **Show, don't lecture.** Every post uses sketches, illustrations and tables so people understand it at a glance. See section 4a.
- **Headings as questions.** Write H2s the way people search ("How thick should a sand pad be?"). Use the query list for wording.
- **Length.** 900 to 1 500 words for most posts. Engineering guides may go to about 2 500 words only when the reader needs the detail; the tank base posts are the upper limit.
- **Phone first.** No wide tables with more than four columns. Check the post on a phone before publishing.
- **South African English** (galvanised, metre, colour). Where people search with the US spelling, mention it once naturally, e.g. "galvanised (often spelled galvanized)".
- **Units.** Metric, with a space: 150 mm, 10 000 litres, 2.3 m.

## 4a. Sketches, illustrations and tables

A drawing or a table often explains more than three paragraphs. Every post must have them.

**What every post needs**

- **At least one table.** Use it for the quick answer, and for any sizes, prices or comparisons.
- **At least one sketch or illustration** of the main idea. If the post compares options, draw each option. If it gives sizes, draw the sizes on the sketch. The tank base posts are the standard: [sand pad, ring beam or slab](/blog/steel-water-tank-base-ring-beam-vs-slab/) and [tank base sizes](/blog/steel-water-tank-base-sizes/).
- **Put the visual next to the text it explains.** Don't stack all the drawings at the end.

**How the drawings look**

- Flat, simple cross-sections or plan views in the brand colours (the `base-diagram__*` styles), like the tank base drawings.
- Labels in plain words ("Steel wall", "Liner on compacted fill"), not codes. Dimensions in mm, in bold.
- Say "Not to scale" in the caption when it is not to scale.
- A drawing is a drawing. Never make it look like a photo of a Damtech job.

**How to publish them: WebP images, not HTML**

1. Draw the sketch as an SVG in `docs/design/diagrams/<file-name>.svg`, using the `base-diagram__*` classes. The six tank base drawings in that folder are the templates.
2. Render it to WebP: `node scripts/render-diagrams.mjs docs/design/diagrams/<file-name>.svg`. It writes `public/images/<file-name>.webp` at 3x size (1260 px wide) and prints the width and height.
3. Put it in the post like this:

   ```html
   <figure class="base-diagram"><img src="/images/steel-water-tank-ring-beam-size-diagram.webp" alt="Steel water tank ring beam size: 300 mm wide by 500 mm deep, 150 mm above the ground, with four Y12 bars and links" width="1260" height="912" class="base-diagram__img" loading="lazy" /><figcaption class="base-diagram__caption"><strong>Ring beam sizes.</strong> 300 mm wide and 500 mm deep … Not to scale.</figcaption></figure>
   ```

   The site serves it in the right size for each screen.

**Image SEO**

| Item | Rule | Example |
|---|---|---|
| File name | Lower case, hyphens, says what the drawing shows, with the main query | `steel-water-tank-ring-beam-size-diagram.webp` |
| Alt text | One sentence of up to about 125 characters. Says what the drawing shows, with the key numbers. Uses the main query once, naturally. No "image of", no keyword lists. | "Steel water tank sand pad size: 150 mm thick at the wall, rising 1 in 120 to the centre and 575 mm wider than the tank" |
| Caption | Bold label, then one or two plain sentences | "**Sand pad sizes.** 150 mm thick at the wall …" |
| Width and height | Always set, from the render script output | `width="1260" height="810"` |
| Format | WebP. Photos stay as they are; only drawings go through the render script. | |

## 5. SEO checklist for every post

| Item | Rule |
|---|---|
| Meta title | 50 characters or fewer, because the site adds " \| Damtech" (10 characters) and Google shows about 60. Main query near the start. No clickbait. |
| Meta description | 140 to 155 characters. Says what the reader will get, in plain words. |
| H1 | Matches the main query. One per page. |
| Slug | Short, lower case, the main query only, no dates. Never change it after publishing. |
| Opening | Main query (or a natural variant) in the first sentence. |
| Internal links | At least one link to the money page with a descriptive anchor ("steel water tank sizes", not "click here"). One or two links to related posts. Add a link **back** from the money page or a related post to the new post. |
| End of post | One clear action: quote form, calculator, shop or WhatsApp. One, not five. |
| Visuals | At least one table and one sketch or illustration, published as WebP with a descriptive file name, alt text, caption, width and height (section 4a). |
| FAQ | Three to five questions, taken from real queries in the export. |
| Category | Set `category` in `lib/posts-data.json` (Dam Liner Guides, Steel Reservoirs, Borehole & Irrigation, Leak Repair, Waterproofing). |
| Dates | `date` is the publish date; update `modified` when the content changes materially. |
| Cannibalisation | Search `lib/posts-data.json` and the service pages for the main query first. If a page already ranks for it, improve that page instead of writing a new post. |

## 6. Accuracy rules (never break these)

- **No invented numbers.** No made-up search volumes, prices, project counts, lifespans or test results.
- **Prices:** only prices already approved and published on the site (product pages, the PVC liner prices in the shop). Otherwise say "ask us for a quote".
- **Technical claims** need a source. For anything beyond everyday knowledge, write or reuse a research file in `research/` first (as done for the Aluzinc and tank base posts) and keep the sources there.
- **No invented projects, testimonials, guarantees or certifications.** Only real Damtech projects from `/projects/`.
- **Images:** only real Damtech photos already in `public/images/`, or simple diagrams made as in section 4a. No stock or AI images shown as our work. Never edit existing photos. If a post needs a photo we do not have, list it in `docs/branding/damtech-photography-requirements.md`.
- **Author:** every post is by Tiaan de Lange (Pr.Eng, ECSA), as Tiaan decided on 12 Nov 2026. He reads each post before it goes live.
- **Publish dates:** one post a week, on a Monday. New posts take the next free Monday after the newest post.

## 7. Workflow

1. **Pick** a target from section 3 (or new data). Write the four-line brief from section 1.
2. **Check** nothing on the site already targets it.
3. **Research** facts into `research/<topic>.md` if needed.
4. **Draft** in plain language using section 4.
5. **Review**: the author checks technical accuracy; someone reads it on a phone for clarity.
6. **Publish** via `lib/posts-data.json` (future dates publish automatically through the daily cron). Add the return link from the money page.
7. **Measure** at 28 and 90 days in Search Console (filter by page, compare to the previous period).

## 8. Measuring and updating this policy

- Export Search Console every month into `research/search-console-YYYY-MM-DD/` and run `python3 -I research/scripts/gsc_summary.py <export-dir> . <out-dir>`.
- **Success is clicks and enquiries, not impressions.** Track RFQs by source in the admin enquiries panel.
- Any post with 500+ impressions and a CTR under 1% goes back into Priority A for a title and intro refresh.
- After 90 days with no impressions, check indexing and internal links before writing more on the same topic.
- Update section 3 after each monthly export. Remove targets that are done; add new ones from the data.
