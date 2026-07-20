# Pricing legacy migration

## Current state

Damtech maintains both:

- **Legacy tables:** `material_items`, `labour_items`, `supplier_prices`, `tank_models`, `estimating_settings`
- **Unified catalogue:** `pricing_items`, `pricing_item_prices`

Quote lines store snapshots in `quote_line_items` (`cost_unit_price`, `sell_unit_price`, `metadata.pricingSource`, `source_pricing_item_id`).

## Feature readiness checks

| Capability | Status | Notes |
|---|---|---|
| Material catalogue | Operational / Partial until migration applied | Materials sync on upsert |
| Labour synchronisation | Operational after migration + sync action | `pricing_item_id` link + reconcile |
| Crew templates | Operational after migration | `labour_crews` / `labour_crew_members` |
| Travel rates | Partial | Vehicles/origins/delivery rules + settings defaults |
| Tank models | Operational | Picker in quote builder |
| Price history | Partial | Table + UI component; write flow via supplier prices |
| RLS cost protection | Operational after security migration | `can_view_internal_costs()` + sell-only view |
| CSV importer | Partial | Materials/labour transactional import |
| Legacy fallback | **Still enabled** | Quote inventory falls back to material/labour search if catalogue query fails |

## Switching off legacy fallback

Do **not** disable legacy fallback until all checks are Operational and verified in production:

1. Apply migrations `20260720120000`, `20260720130000`, and `20260720140000`
2. Run **Synchronise labour catalogue**
3. Confirm sales role cannot retrieve costs via actions/RPC
4. Confirm inventory picker returns catalogue items without duplicates
5. Confirm draft stale-price warnings work
6. Confirm historical quotes still render from snapshots

Then set a server flag / remove the legacy branch in `searchPricingItemsAction`.

Also apply `20260720140000_pricing_cost_column_hardening.sql` for sell-only RPCs and travel cost column restriction.

## Deprecation rules

- Do not delete legacy tables in this phase
- Keep historical foreign keys on quote lines
- Prefer writing through catalogue sync helpers
- Archive rather than hard-delete priced items referenced by quotes
