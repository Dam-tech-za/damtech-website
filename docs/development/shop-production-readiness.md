# Online shop (PVC liners): production readiness

Branch `claude/payfast-pvc-liners`. Last updated 2026-11-11.

Tick each item before merging to `main` and switching PayFast to live.

## 1. Database (Supabase)

Apply these migrations, in order, before the code reaches production. The
admin Online Purchases board and checkout fail without them.

- [ ] `20261110190000_catalogue_orders_payfast.sql`
- [ ] `20261110200000_catalogue_orders_tracking.sql`
- [ ] `20261111090000_catalogue_orders_courier_status.sql`
- [ ] Supabase advisors show no new security warnings (RLS on, grants present).

## 2. Vercel environment variables

Set for **Production** (and **Preview** where noted), then redeploy.

| Setting | Production | Preview |
| --- | --- | --- |
| `PAYFAST_MODE` | `live` | `sandbox` |
| `PAYFAST_MERCHANT_ID` | live merchant ID | leave empty (shared sandbox) |
| `PAYFAST_MERCHANT_KEY` | live merchant key | leave empty |
| `PAYFAST_PASSPHRASE` | same as PayFast dashboard | leave empty |
| `COURIER_GUY_API_KEY`, `COURIER_SENDER_*`, `COURIER_SENDER_BETTYS_BAY_*` | set | set |
| `COURIER_CHECKOUT_RATES` | `true` once item 4 passes | `true` |
| `CRON_SECRET` | set (courier tracking cron) | â€” |
| `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL` | already set | â€” |

Live mode refuses to start unless merchant ID, key and passphrase are all set;
checkout then shows "Online payment is temporarily unavailable".

## 3. PayFast account

- [ ] Account verified by PayFast (business documents and bank account approved).
- [ ] Settings > Developer settings: Salt Passphrase set, same value as `PAYFAST_PASSPHRASE`.
- [ ] Merchant ID and key copied from the live dashboard, not the sandbox.
- [ ] Payment methods wanted (card, Instant EFT, etc.) switched on.
- [ ] The notification URL is sent with every payment
      (`https://www.dam-tech.co.za/api/payfast/notify/`); nothing to set in the dashboard.

## 4. Courier Guy

- [ ] Admin > Online Purchases > The Courier Guy: "Test Courier Guy connection" shows OK for both depots.
- [ ] A small and a large liner to a Gauteng and a Western Cape address both quote, from the nearer depot.
- [ ] Then set `COURIER_CHECKOUT_RATES=true` in Production.

## 5. End-to-end checks

On a Preview deployment (PayFast sandbox):

- [ ] Delivery order: fee shown before paying, PayFast sandbox payment, order shows **Paid on PayFast**.
- [ ] Collection order (Pretoria and Betty's Bay): no delivery fee.
- [ ] Cancel on PayFast: order shows **Payment cancelled**, no paid emails.
- [ ] Customer and internal emails arrive; admin order page shows the email status.
- [ ] A liner or quantity over R30 000 incl. VAT shows "Request a quote" instead of the buy button.

On Production, after switching to live:

- [ ] One real purchase of the cheapest liner (collection), marked paid in the admin within a minute.
- [ ] Refund it from the PayFast dashboard.
- [ ] Book the courier for a real order from the admin and check tracking updates the next morning.

## 6. Already reviewed in code

- PayFast notifications (`app/api/payfast/notify/route.ts`) mark an order paid only when
  the signature, merchant ID, amount (to the cent), order token and PayFast's
  server-to-server confirmation all pass. Every notification is logged.
- With live courier rates on, the fixed province fee is never charged; the customer is asked to retry or contact us.
- Courier quotes are cached per address, so repeat quotes do not hit the rate limit.
- Declared value is capped at R30 000; a 400 from the courier is retried without a declared value.
