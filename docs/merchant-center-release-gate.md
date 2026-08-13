# Merchant Center release gate

Damtech’s steel-tank product pages keep **on-page content, visible price and JSON-LD price consistent**. Product JSON-LD may include catalogue images. That is **not** the same as being eligible to advertise those products as Google Shopping offers.

## What the product pages already support

- One product per URL under `/steel-water-storage-tanks/{slug}/`.
- VAT-inclusive ZAR prices with no “from”, “starting at”, estimated or ex-VAT consumer price.
- Visible price equals the catalogue price and the Offer `price` in JSON-LD.
- Brand Damtech, SKU/MPN from the catalogue, `NewCondition`.
- No fabricated GTINs, ratings, reviews or shipping amounts.
- Product.image points at original static WebP URLs on `https://www.dam-tech.co.za` (not `/_next/image`).
- `merchantEligible` stays false until checkout and model-accurate pack shots exist.

## What still blocks a Shopping feed

1. **Collection location.** The invoice-payment order flow exists at `/order/?sku={SKU}&qty=1` for collection / customer-arranged transport. A genuine public collection address is **not** configured or displayed before checkout. Do not invent one. Merchant eligibility stays closed until that address is shown on the order page.
2. **Production verification.** A complete live test order, production Resend confirmation, and invoice-email path have not been signed off. See `lib/orders/merchant-readiness.ts`.
3. **Availability.** Kits are made to order. There is no confirmed `InStock` status and no factual `availabilityDate`.
4. **Images.** Current WebPs are shared interim representations (and AI composites). They are suitable for the website and Product JSON-LD, not as unique Merchant `image_link` pack shots for every capacity. The shallow-basin primary image also shows a safety crossbar that is not a verified kit inclusion.
5. **No roofed domestic SKU.** The roofed tank images are unused until a residential product includes that roof in the advertised price.

## Release rule

`MERCHANT_CENTER_RELEASE_GATE.feedEnabled` in `lib/catalogue/merchant.ts` is **false**.

`getMerchantFeedProducts()` therefore returns an empty list. **No product should be submitted as an online Shopping offer** until Damtech has:

- a complete online order flow as listed above, and
- a genuine, model-accurate primary image per SKU, and
- factual availability.

A normal RFQ must **not** be presented internally as guaranteed Merchant-compliant checkout.
