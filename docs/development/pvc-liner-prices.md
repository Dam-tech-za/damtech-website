# PVC tank liners and PayFast checkout

Added 2026-11-10 (thread "Sell PVC linings online with PayFast").

## What it is
- `/pvc-tank-liners/` lists 76 made-to-order PVC liners: 38 standard corrugated-tank sizes
  (2 rows: 3–15 m, 3 rows: 3–17 m, 4 rows: 3–12 m diameter) in 550 gsm and 800 gsm.
- Checkout `/pvc-tank-liners/checkout/?sku=…` saves a `catalogue_orders` row
  (`payment_method = 'payfast'`, `status = 'awaiting_payment'`) and posts a signed form to PayFast.
- PayFast calls `/api/payfast/notify/` (ITN). Only a notification with a valid signature,
  matching merchant, PayFast server confirmation ("VALID"), the exact amount and the order's
  view token marks the order `paid`. Then customer + internal emails are sent.
  Every notification is logged in `catalogue_order_payment_events`.

## Prices
Generated into `lib/shop/pvc-liner-prices.generated.ts` from the reservoir pricing model in
`damtech-ai-operations` (`pricing/reservoir_pricing.py`, parameter file version in the file
header). Sell excl. VAT = liner m² × rate ÷ (1 − 35% GP), rounded up to R10; VAT 15% added.
Tiaan approved these prices for online sale on 2026-11-10 although the PVC rates are marked
provisional in the parameter file. To regenerate after a rate change, run the snippet below in
the damtech-ai-operations checkout and replace the generated file:

```python
from pricing.reservoir_pricing import load_parameters, standard_sizes, geometry, round_up
from decimal import Decimal as D
p = load_parameters()
for dia, r in standard_sizes(p):
    g = geometry(D(dia), r, False, p)
    ex = [round_up(g["liner"] * p.rate(k) / (1 - p.com["gp_liner"]) / 10, 0) * 10 for k in ("pvc_550", "pvc_800")]
    print(dia, r, g["h_listed"], g["vol"], g["liner"], *ex)
```

## Delivery
`lib/shop/delivery.ts`: fixed fee per province = average one-way road km from the nearer base
(Pretoria or Betty's Bay) × 2 × R11.50, rounded up to R10, plus VAT. Temporary until the
Courier Guy (Ship Logic) API gives live rates.

## Environment variables (Vercel, server only)
| Name | Value |
|---|---|
| `PAYFAST_MODE` | `sandbox` (default) or `live` |
| `PAYFAST_MERCHANT_ID` | from PayFast dashboard |
| `PAYFAST_MERCHANT_KEY` | from PayFast dashboard |
| `PAYFAST_PASSPHRASE` | Settings → Developer settings (letters and digits only). Required in live mode |

With no credentials in sandbox mode the public PayFast sandbox merchant is used.

## Database
Migration `20261110190000_catalogue_orders_payfast.sql` (additive). Must be applied before
the checkout is used.

## Google visibility
- Each liner has its own URL, `/pvc-tank-liners/?sku=<SKU>`; the picker is server-rendered with that
  size selected so the visible price matches the structured data.
- The page carries `ProductGroup` JSON-LD with all 76 variants (`lib/shop/pvc-merchant.ts`).
- Merchant feed rows for the liners are built but **gated on `PVC_LINER_MERCHANT_IMAGE`**. Set it to
  an approved real photo of a PVC liner (static `.webp` under `public/images/`) to publish the 76
  rows in `/feeds/google-merchant.tsv`. In Merchant Center, add per-province delivery rates for the
  shipping label `pvc-tank-liner`.
