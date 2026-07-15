# Public RFQ — simple quote + Quote Preparation calculator

## Routes

- `/quote/` — indexable single-page simple quote (`enquiry_channel = simple_public_rfq`, **no assets**)
- `/calculators/#project-budget` — **Quote Preparation**: 7-step wizard with company, site, services and assets (`enquiry_channel = calculator_quote_preparation`)
- `/quote/success/` — noindex confirmation
- `/contact/` — contact enquiry (`enquiry_channel = contact_enquiry`)

Legacy `/calculators/quote-preparation/` redirects to `/calculators/#project-budget`.

## Calculator hand-off

Other calculators: primary CTA → `/quote/`. Secondary “Continue in Quote Preparation” → draft token → `/calculators/?draft=TOKEN#project-budget`.
