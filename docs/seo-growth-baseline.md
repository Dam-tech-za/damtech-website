# SEO & Lead-Generation Baseline (October 2026)

Source of truth for measuring the October 2026 optimisation work. All figures below come from the GA4 "Reports snapshot" export supplied by the owner (property *Damtech Website*, 19 Sep – 16 Oct 2026, 28 days). No Search Console, keyword-tool or ranking data was available in this session, so none is quoted.

## 1. Verified GA4 baseline (19 Sep – 16 Oct 2026)

| Metric | Value | Note |
|---|---|---|
| Active users (rolling 30 days, 16 Oct) | 818 | Matches the owner's 800–900/month estimate |
| New users | 749 | |
| Sessions | 907 | Organic 616 · Direct 261 · AI Assistant 22 · Unassigned 8 |
| Organic share of sessions | 68% | |
| Page views | 1 585 | |
| `form_start` events | 61 | GA4 enhanced measurement |
| **Key events (conversions)** | **0 configured** | No conversion is being measured |
| Revenue | R0 | Expected — no online payments |
| Active users from South Africa | 517 | |
| Active users from Singapore | 120 | Almost certainly automated/bot traffic — filter or ignore when judging growth |

**Top landing content by views:** Steel water tanks (287), Homepage (193), Contact (106), 100 000 L tank (92), Calculators (78), 10 000 L tank (73), Dam liners hub (61), 10 000 L fish pond (60), Quote page (55), 20 000 L tank (54), Livestock trough (51), HDPE dam lining (41).

**Conversion proxies in the period:** "Quote request received" page 13 views, "Thank You" (contact) 4 views, "Order placed" 2 views. These are page views, not deduplicated leads; the RFQ inbox in the admin panel is the authoritative lead count.

### Measurement problems found in the baseline

1. **No key events.** GA4 has nothing marked as a conversion, so organic growth cannot be tied to enquiries.
2. **Custom dataLayer events never reached GA4.** The site already pushed `simple_quote_submitted` and catalogue ecommerce events, but none appear in the event list → the GTM container has no tag forwarding custom events.
3. **An event literally named "Google Analytics Tag" fired 971 times** (about once per session). This points to a misconfigured GA4 event tag in GTM. It inflates event counts and should be removed or renamed.
4. **Singapore traffic (≈15% of users)** with no matching business reason; likely crawlers. Consider a GA4 data filter / segment.

## 2. What the site now sends (implemented this session)

All events are pushed to `window.dataLayer`; no names, emails or phone numbers are included.

| Event | When | Parameters |
|---|---|---|
| `generate_lead` | Successful simple quote, contact form or detailed RFQ submission | `lead_form` (`simple_quote` / `contact_form` / `detailed_rfq`), `lead_service`, `rfq_number`, `page_path` |
| `generate_lead` (catalogue) | Supply-only kit invoice request | GA4 ecommerce `items` (existing) |
| `phone_click` | Any `tel:` link | `contact_method`, `link_location` (`header`/`footer`/`content`/`mobile_sticky_bar`), `page_path` |
| `whatsapp_click` | Any `wa.me` link | as above |
| `email_click` | Any `mailto:` link | as above |
| `simple_quote_submitted` | Existing event, kept for continuity | `rfq_channel`, `rfq_number` |

Every RFQ created from the simple quote form or contact form now stores **first-touch attribution** in `rfqs.simple_service_fields.attribution` (visible on the admin RFQ detail page): landing page, external referrer (origin + path only), UTM tags, `gclid`/`gbraid`/`wbraid`/`fbclid`, the page the form was submitted from, and the capture time.

Analytics (GTM + Meta Pixel) no longer loads on admin pages or on pages with private tokens in the URL (`/q/…`, `/quote/info/…`, `/quote/…/upload`).

## 3. GTM configuration required (owner action — needs GTM access)

Container `GTM-M5RQM6JW`, GA4 measurement ID `G-F01WG96KRG`:

1. **Trigger** "Lead & contact events": Custom Event, event name matches RegEx `^(generate_lead|phone_click|whatsapp_click|email_click)$`.
2. **Data Layer Variables:** `lead_form`, `lead_service`, `contact_method`, `link_location`, `page_path`.
3. **Tag** "GA4 – Lead & contact events": Google Analytics: GA4 Event, measurement ID `G-F01WG96KRG`, event name `{{Event}}`, event parameters mapped from the variables above. Fire on the trigger in step 1.
4. **Find and fix the tag producing the "Google Analytics Tag" event** (likely a GA4 Event tag with its event name left as the tag name). Pause it, then confirm in GTM Preview that only `page_view` and the events above fire.
5. **Publish** the container, then in GA4 → Admin → Events mark `generate_lead`, `phone_click` and `whatsapp_click` as **key events**.
6. Optional: register `lead_form`, `lead_service`, `link_location` as event-scoped custom dimensions so they can be reported.

Until this is done, the new events are visible in GTM Preview / the browser dataLayer but not in GA4 reports.

## 4. Keyword-to-page map

Search volumes, difficulty and rankings are **not** included: no verified keyword data source was available. Map is based on search intent and existing page content; validate with Search Console queries once the property has 28+ days of data after deployment.

| Intent / query family | Primary page | Supporting pages |
|---|---|---|
| dam liners, dam lining contractors, dam liners South Africa | `/dam-liners/` | `/services/`, `/projects/` |
| HDPE dam liners, HDPE geomembrane installation | `/hdpe-dam-lining/` | HDPE blog guide, Stellenbosch/Centurion/Grabouw case studies |
| PVC dam liners | `/pvc-dam-lining/` | `/dam-liners/` comparison |
| farm dam lining, farm dam liners | `/farm-dam-liners/` | `/agricultural-water-storage/`, farm-dam blog guides |
| dam lining cost / price per m² | `/dam-lining-cost-south-africa/` | `/calculators/` (now linked from menu + footer) |
| leaking dam repair, dam liner repair | `/dam-repair-services/` | leak-diagnosis blog guide |
| reservoir lining / relining | `/reservoir-lining/` | steel reservoir leak-repair guides |
| torch-on dam lining, cement dam waterproofing | `/torch-on-dam-lining/` | Tzaneen / Hoedspruit case studies |
| corrugated steel water tanks, galvanised reservoirs, water tank prices | `/steel-water-storage-tanks/` | 10 000–100 000 L product pages |
| NNN litre water tank price | `/steel-water-storage-tanks/<size>/` | |
| fish farming pond, livestock trough | product pages | |
| agricultural water storage | `/agricultural-water-storage/` | |
| mining dam liners, process water containment | `/mining-dam-liners/` | |
| dam liners Pretoria / Johannesburg / Limpopo / Mpumalanga / Western Cape | regional pages | regional case studies |
| waterproofing Pretoria, roof waterproofing Pretoria/Centurion, damp proofing, flat roof waterproofing | `/waterproofing/` | — |
| waterproofing Hermanus / Kleinmond / Betty's Bay / Gansbaai | `/waterproofing/#overstrand` | — |

**Deliberately not created:** separate town pages for each suburb or Overstrand town. With no local projects, reviews or distinct content to show, those would be thin doorway pages. Revisit once real local residential projects (with photos) exist — see `docs/image-requirements.md`.

## 5. 90-day measurement plan

| When | Check | Target / decision |
|---|---|---|
| Day 0 (deploy) | Vercel deployment healthy; GTM Preview shows `generate_lead` + click events; Search Console sitemap resubmitted; URL inspection on `/waterproofing/` and `/bitumen-waterproofing/` (expect 301) | — |
| Week 1 | GA4 key events recording; RFQs show `attribution` in admin | Fix GTM if events missing |
| Week 2 | Speed Insights (real users) LCP/INP/CLS for `/`, `/steel-water-storage-tanks/`, `/waterproofing/` | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75 |
| Day 30 | Search Console: impressions/clicks for pages in §4; `/waterproofing/` indexed; legacy `/bitumen-waterproofing/` replaced in index | Baseline for Search Console |
| Day 30 | Leads per channel from RFQ attribution (organic vs direct vs paid) | First lead-source baseline |
| Day 60 | Compare blog CTR after the new meta titles/descriptions (Search Console → Pages) | Rewrite any post with impressions but CTR < 1% |
| Day 90 | Organic sessions (ZA only, excluding SG), `generate_lead` count, lead-to-quote rate from admin | Decide next content investment (residential projects, regional proof) |

Report growth on **South African organic sessions and qualified leads**, not total users (bot traffic distorts totals).
