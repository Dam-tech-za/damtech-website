# Project drawer and live Xero quote view

31 Oct 2026.

## What changed

- The board's project drawer opens as a read-only overview: header (service, location, stage, lead, quote numbers, Xero link state), a value card (quotation value, payment state, View quote) and four tabs: Overview, Financials, Operations, Documents. Editing moved behind **Edit** (the previous form, unchanged; fields still save on leaving them).
- The drawer is 580 px wide on desktop, full width on phones.
- **View quote** reads the quote live from Xero through the bridge (`get_quote`) and shows title, customer, dates, summary, lines (description, quantity, unit amount, item code, line amount), subtotal, VAT, total and terms. Nothing is stored in Supabase.

## Safety

- `quoteDetailAction` only opens a quote linked to that project in `ops_xero_quote_links` (by QuoteID), or a quote number recorded on the project. A number-only match is labelled, and warns when Xero's customer differs from the project's Xero contact.
- Responses are server actions behind the admin login; no Xero token reaches the browser.
- Totals are Xero's own; the website does not recalculate them. A difference between the project value and the Xero quote total is shown, not overwritten.

## Not yet possible (bridge)

The bridge has no read tool for quote PDFs and does not return line discount, `LineAmountTypes` (tax inclusive/exclusive) or the quote's updated date. Prompt for the bridge builder:

> Add a read-only tool `get_quote_pdf` (args `quote_id`) that returns the quote PDF as base64 using the existing `getPdf("Quotes/{id}")` helper, max 10 MB, no caching. Extend `get_quote` to also return `line_amount_types` (Exclusive/Inclusive/NoTax), `updated_at` (UpdatedDateUTC) and each line's `discount_rate`. No write tools.

When it ships, the website adds a **View PDF** button that streams the PDF through a protected route with `Cache-Control: no-store` and never saves it.

## Optional later

An accepted-version snapshot of the quote (compact JSON, with source timestamp) for contractual scope. Not built: it needs a database change.
