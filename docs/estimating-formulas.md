# Estimating formulas

Money helpers use integer cents (`lib/estimating/money.ts`) before rounding to 2 decimals.

## HDPE liner

```txt
base_area = calculator_estimate
        OR measured_total
        OR floor + walls + anchor

overlap = base_area × (overlap_percent / 100)
after_overlap = base_area + overlap
waste = after_overlap × (waste_percent / 100)
commercial_area = ceil_to_2dp(after_overlap + waste)
```

## Material commercial quantity

```txt
commercial_quantity = base_quantity × (1 + waste_percent / 100)
```

## Labour hours

```txt
labour_hours = quantity / productivity_rate
```

Manual override requires a reason (enforced in UI/actions when used).

## Costs

```txt
direct_material_cost = commercial_quantity × unit_cost
direct_labour_cost = labour_hours × labour_rate
direct_cost = materials + labour + travel + delivery + subcontractors + contingency
```

## Markup vs margin

```txt
markup:  sell = cost × (1 + markup%/100)
margin:  sell = cost / (1 - margin%/100)
```

Never interchange them.

## Travel / delivery

```txt
distance_cost = return_km × trips × rate_per_km
```

## VAT

```txt
subtotal_ex_vat
- discount
= net_ex_vat
taxable = net_ex_vat - vat_exempt
vat = taxable × vat_rate%
total_inc_vat = net_ex_vat + vat
```

VAT-exempt amounts only via explicit tax category.
