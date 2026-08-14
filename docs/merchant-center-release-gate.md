# Merchant Center release gate

Damtech’s steel-tank catalogue uses a **gated, scheduled TSV feed** as the controlled Merchant product source. Product JSON-LD remains consistent with the catalogue and can also support Google’s automatic website import if enabled later.

Feed URL:

`https://www.dam-tech.co.za/feeds/google-merchant.tsv`

`MERCHANT_CENTER_RELEASE_GATE.feedEnabled` is **true**. The feed returns HTTP 200 with seven eligible rows when validation passes. It is excluded from the XML sitemap and tagged `noindex`. It is **not** disallowed in robots.txt.

## Delivery compliance warning

The feed assumes that Merchant Center account-level delivery settings contain the actual delivery charges or rates customers will pay. Handling time is **5–10 business days** and transit time is **3–5 business days**. If compulsory delivery charges are not configured accurately in Merchant Center, products may be disapproved.

Delivery cost and delivery time are separate requirements. Configuring lead times on the website does **not** verify Merchant Center delivery-cost compliance.

## Google product category

| SKUs | Category ID | Path |
| --- | --- | --- |
| DMT-WT-10000, DMT-WT-20000, DMT-WT-50000, DMT-WT-100000, DMT-FP-10000, DMT-FP-15000 | `1910` | Hardware > Storage Tanks |
| DMT-LT-1500 | `6990` | Business & Industrial > Agriculture > Animal Husbandry > Livestock Feeders & Waterers |

## Fulfilment

Catalogue orders are **delivery only** throughout South Africa.

- DamTech does **not** offer customer collection.
- There is **no** public collection point.
- Pretoria may be used internally as a dispatch origin only.
- Product prices include VAT and exclude delivery and installation.
- DamTech confirms the delivery charge on the formal invoice.

## Availability and lead times

All seven kits are made to order and available to order.

| Window | Business days |
| --- | --- |
| Manufacturing / handling | 5–10 after cleared payment |
| Delivery / transit after manufacture | 3–5 |
| Combined fulfilment estimate | 8–15 after cleared payment |

Merchant and Schema.org availability: `in_stock` / `https://schema.org/InStock`.

No `availability_date` for `in_stock` products.

## Identifiers

- Brand: `DamTech`
- MPN: existing catalogue SKU
- `identifier_exists`: `yes`
- No GTIN invented

## Image mapping

| SKU | Merchant `image_link` |
| --- | --- |
| DMT-WT-10000 / 20000 / 50000 / 100000 | Reservoir white/light-neutral WebP |
| DMT-FP-10000 / DMT-FP-15000 / DMT-LT-1500 | Livestock/fish-pond white/light-neutral WebP with safety bar |
| Domestic roofed tank WebP | Unused — no roof-included SKU |

The safety bar shown on the shallow-basin image is an illustrative optional safety feature and is not listed as a kit inclusion.

Static `https://www.dam-tech.co.za/images/*.webp` URLs only. Not `/_next/image`.

## Eligible SKUs

All seven catalogue SKUs are `merchantEligible: true` when validation passes:

- DMT-WT-10000
- DMT-WT-20000
- DMT-WT-50000
- DMT-WT-100000
- DMT-FP-10000
- DMT-FP-15000
- DMT-LT-1500

If the feed is enabled but unexpectedly has zero valid rows, the endpoint returns **HTTP 503**, not an empty TSV.
