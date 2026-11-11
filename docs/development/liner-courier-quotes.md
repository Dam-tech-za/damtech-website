# Liner courier (admin)

`/admin/operations/liner-courier/`, the left-menu heading directly under Online purchases.
Roles: owner, admin, sales, estimator (same as `manageOrders`). Adding the line to a quotation also needs `manageQuotes`.

## What it does
1. Liner size: circular (diameter + tank rows or wall height) or rectangular (L × W × depth, optional side slope, fold-over, anchor run-out).
2. Area, weight and folded parcel: `lib/courier/liner-pack.ts` (pure, tested in `lib/courier/liner-courier.test.ts`).
   - Circular: `(π·D²/4 + π·D·(H + fold-over)) × (1 + waste%)`, waste applied once (default 5%).
     Tank rows line to `rows × 0.762 − (rows − 1) × 0.05 m` (50 mm row overlaps). With this, every catalogue
     area in `pvc-liner-prices.generated.ts` is reproduced to 0.1 m².
   - Rectangular: same geometry as the RFQ dam calculator, then `applyOverlapWaste` (defaults 5% / 5%).
   - Weight = area × gsm ÷ 1000. Folded parcel: concertina folds, assuming 1.3 g/cm³ fabric and ×2 looseness
     (both **assumptions to confirm** against a weighed, measured liner). The online-checkout rule
     (100 × 40 × 40 cm) and a manual size are offered as alternatives.
3. "Get Courier Guy rate": `courierRatesForParcelAction` uses the existing `getCourierRates` with any address. No shop order, nothing booked.
4. "Add to quotation": a `delivery` line (cost = rate excl. VAT, sell = cost + markup or as entered) on a draft
   quotation, totals recalculated with `calculateQuote` (`lib/quotes/add-courier-line.ts`). Re-adding replaces the earlier line.

## Formal Courier Guy quote: finding (docs read 2026-11-11)
Source: https://www.shiplogic.com/api-docs (the old api-docs.shiplogic.com now serves the portal app) and its Postman collection.
- The account API has no "create quote" or "draft" endpoint: only rates, opt-in rates, create / get / cancel shipment, labels, tracking.
- Ship Logic does have a shipment **status `quote`** ("a quote has been generated but the shipment has not been booked yet"), plus `quote-expired`.
- `POST /shipments` validates a `status` field ("{value} is not a valid status"), but the docs only show setting a status on the courier's Admin API.
- `POST /shipments/cancel` reverses all charges if the shipment has not been collected.

So **Send quote to Courier Guy** (side panel) sends `POST /shipments` with `status: "quote"`, `mute_notifications: true`
and `collection_min_date` a week out (`buildQuoteShipmentPayload`). The answer's status is checked:
`quote` = saved as a quote in the portal; anything else (e.g. `submitted`) = it was booked, the admin is warned and gets a
**Cancel booking** button (`POST /shipments/cancel`). The reference and status are stored in `formal_quote_ref`.
**Not yet proven with the live key**: the first real send confirms whether Courier Guy honours the quote status.
Copy brief / Open portal remain in the ⋯ menu as the manual fallback.

## Database
`supabase/migrations/20261111120000_liner_courier_quotes.sql` adds `public.liner_courier_quotes` (additive, RLS on,
service role only). **Applied to the Damtech Admin project on 2026-11-11** (owner's request, via the Supabase connector).
Checked after: RLS on, grants to service_role only, one service-role policy, no new security advisor findings.
