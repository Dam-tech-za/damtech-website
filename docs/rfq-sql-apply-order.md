# RFQ SQL apply order — simple public + calculator preparation

Rewritten so **simple `/quote/`** enquiries and **calculator quote-preparation** share one RFQ backend. Assets are optional.

## Do not re-run if already applied

If you already ran older copies of `151700` / `151800` / `151801` in Supabase, **do not re-run them**. Ask for a delta migration instead.

If they were **never** applied, run the files below in order.

---

## Prerequisites (must already be applied)

| Order | File | What it is |
| --- | --- | --- |
| 1 | `20260715120000_admin_auth_phase1.sql` | Admin auth / roles / RLS helpers |
| 2 | `20260715120100_admin_seed_placeholder.sql` | Allowlist seed (edit email first) |
| 3 | `20260715140000_admin_rfq_pricing_phase2.sql` | Customers, RFQs, quotes foundation, pricing |
| 4 | `20260715160000_admin_quotes_phase3_enum.sql` | Quote status enum values |
| 5 | `20260715160100_admin_quotes_phase3.sql` | Quote lifecycle tables |

---

## New RFQ migrations (this correction)

| Order | File | What it adds |
| --- | --- | --- |
| 6 | `20260715170000_public_rfq_assets_phase1.sql` | `rfq_assets`, calculations, tank models, project fields. **Simple RFQs may have 0 assets.** |
| 7 | `20260715180000_admin_rfq_phase2_enum.sql` | `site_measurement_required`, `archived` on `rfq_status` (**own transaction**) |
| 8 | `20260715180100_admin_rfq_phase2.sql` | Simple RFQ columns, measurement status, scheduling, info requests, calculator drafts, confirmed qty fields |

Run **7 and 8 as separate SQL editor runs** (Postgres enum rule).

---

## Column / source mapping (simple form)

| Form field | Database |
| --- | --- |
| Name | `rfqs.contact_name` |
| Email / Phone | `rfqs.email` / `rfqs.phone` |
| Service | `rfqs.service_required` |
| Message | `rfqs.project_description` |
| Company | `rfqs.company_name` |
| Province | `rfqs.province` |
| Approximate size (text) | `rfqs.approximate_project_size_text` (+ legacy `approximate_project_size`) |
| Soft parses | `estimated_area_m2`, `estimated_capacity_kl`, `estimated_diameter_m`, `estimated_height_m` |
| Location | `rfqs.project_location` |
| Material preference | `rfqs.material_preference` |
| Number of assets | `rfqs.number_of_assets_estimate` |
| Timeframe | `rfqs.preferred_timeframe` |
| Lightweight service fields | `rfqs.simple_service_fields` (jsonb) |
| Uploads | `rfq_attachments` |
| Source | `source` text + `enquiry_channel = 'simple_public_rfq'` |
| Status | `status = 'new'` |
| Measurement | `measurement_status = 'information_not_yet_confirmed'` |
| Calculator flag | `has_calculator_data = false` |

Calculator preparation uses the same `rfqs` row with:

- `enquiry_channel = 'calculator_quote_preparation'`
- `has_calculator_data = true`
- one or more `rfq_assets` + `rfq_asset_calculations`
- draft bridge via `calculator_quote_drafts` (token hash only)

---

## App work after SQL (implementation order)

Documented for the next coding pass — apply SQL first.

1. Restore single-page simple form on `/quote/`
2. Keep multi-asset wizard on `/calculators/quote-preparation/`
3. Wire calculator CTAs → draft token → detailed flow
4. Admin inbox source badges + simple vs detailed summaries
5. Admin detail empty-state for simple RFQs + enrich actions
6. Tests + CTA audit

See correction prompt sections 1–19 for product behaviour.
