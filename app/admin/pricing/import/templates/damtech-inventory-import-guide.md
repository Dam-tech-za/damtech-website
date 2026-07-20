# Damtech inventory CSV import guide

Use this guide with `damtech-inventory-import-template.csv` or the simpler starter format.

## Admin location

`/admin/pricing/import/`

Also linked from Pricing hub, Materials, Services, Labour and Travel pages.

## Simple starter format (supported)

```csv
item_code,category,name,purchase_unit,quote_unit,conversion_factor,cost,sell_price,tax_category,waste_percent,overlap_percent
```

Column aliases are auto-mapped:

| CSV header | Canonical field |
|---|---|
| name | product_name |
| cost | default_cost_ex_vat_zar |
| sell_price | recommended_sell_ex_vat_zar |
| unit | quote_unit |
| description | quote_description |
| code | item_code |

`item_type` is inferred from category when omitted (default `material`).

## Full canonical headers

See `damtech-inventory-import-template.csv`.

## Workflow

1. Upload `.csv` (UTF-8, BOM recommended for Excel)
2. Confirm column mapping
3. Validate / preview
4. Choose duplicate behaviour (default: skip)
5. Choose import mode (default: valid rows only)
6. Confirm import
7. Review history at `/admin/pricing/import/history/`

## Quote builder

Imported rows write to `pricing_items` (and materials for material types). They appear in **Add from Inventory** on quote new/edit after refresh.

## Permissions

- Import: owner / admin / estimator (`managePricing`)
- Full cost export: owner / admin / estimator (`viewCostPrices`)
- Sell-only export: any pricing viewer
- Rollback: owner / admin only

## Notes

- Costs and sell prices are **ex VAT**
- Do not double travel distances in CSV — quote calculator handles one-way/return
- Price changes create history versions; they do not rewrite locked quote snapshots
