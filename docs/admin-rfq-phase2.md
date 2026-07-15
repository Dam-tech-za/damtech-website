# Admin RFQ Phase 2

Administrative RFQ inbox, estimator verification, information requests, measurement scheduling, and quote conversion — sharing the same Supabase RFQ / customer / asset / calculation tables as the public `/quote/` wizard.

## Migrations (run in order)

1. `20260715180000_admin_rfq_phase2_enum.sql` — `site_measurement_required`, `archived` on `rfq_status`
2. `20260715180100_admin_rfq_phase2.sql` — scheduling columns, confirmed quantity columns, `rfq_information_requests`, estimating seeds

## Routes

| Route | Purpose |
| --- | --- |
| `/admin/rfqs/` | Inbox with status cards, URL filters, asset quantity columns |
| `/admin/rfqs/[id]/` | Detail, estimator review, info request, measurement, prepare quote |
| `/quote/info/[token]/` | Secure customer follow-up (no pricing / internal notes) |
| `/quote/info/[token]/success/` | Confirmation after customer response |
| `/admin/` | Dashboard RFQ pipeline metrics (estimates clearly labelled) |

## Workflow

1. Public multi-asset RFQ lands in `/admin/rfqs/` immediately.
2. Estimator assigns, reviews each asset, overrides (new calc snapshot), confirms.
3. Optional: request missing info → customer `/quote/info/{token}/`.
4. Optional: schedule site measurement fields (calendar-ready columns).
5. **Prepare quote** → draft quote with separate HDPE / steel / torch-on suggestions; `PRICE REQUIRED` until priced.
6. Duplicate conversion blocked unless deliberate second-quote action.

## Quantity rules

Never sum unlike units. Summaries stay separate, e.g.:

- HDPE/PVC material: m²
- Steel storage: kL
- Torch-on area: m²

Material procurement area ≠ installation area.

## Permissions

Enforced via `assertAdmin` + RLS (viewer read-only; manage RFQs/quotes roles for writes). Hidden UI is not the security boundary.

## Manual setup

1. Apply the two Phase 2 migrations in Supabase SQL editor.
2. Confirm `estimating_settings` and pricing catalogue are populated for real rates.
3. Load `tank_models` when supplier catalogue data is approved (until then steel suggestions flag PRICE REQUIRED).
