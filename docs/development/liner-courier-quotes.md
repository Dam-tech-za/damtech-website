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

## Formal Courier Guy quote: finding
The code uses only `POST /rates`, `POST /shipments` and `GET /tracking/shipments`. `POST /shipments` books a real
collection, so it must not be used as a "quote". No live key was available in the build sandbox and the Ship Logic
docs host was blocked, so no draft/quote endpoint could be confirmed. The button is therefore honest: **Copy quote brief**
and **Open portal with brief** (opens portal.thecourierguy.co.za and copies the brief). The attempt is recorded in history.
To revisit: check the Ship Logic API docs with the live key for a draft or quote endpoint before adding an API submit.

## Database (not applied)
`supabase/migrations/20261111120000_liner_courier_quotes.sql` adds `public.liner_courier_quotes` (additive, RLS on,
service role only). Until applied the page works but shows a note and keeps no history.
Apply after the owner's go-ahead, e.g. Supabase SQL editor (paste the file) or `supabase db push`.
