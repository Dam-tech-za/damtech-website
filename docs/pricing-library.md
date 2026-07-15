# Pricing library

## Routes

- `/admin/pricing` hub
- `/admin/pricing/materials`
- `/admin/pricing/labour`
- `/admin/pricing/suppliers`
- `/admin/pricing/travel`
- `/admin/settings/estimating`

## Rules

- Do not hard-delete materials/labour referenced by quotes — archive (`is_active = false`).
- Supplier unit costs are RLS-restricted to owner/admin/estimator.
- Sales may see material sell prices where exposed, not supplier cost sheets.
- Estimating settings (VAT, markup, margin, waste, travel rates) are owner/admin writable.
- All writes are audited.

## Supplier comparison

When quoting, compare:

1. Lowest valid (non-expired) price
2. Preferred supplier price
3. Most recent price

Do not auto-pick cheapest without estimator review.
