# PDF quotations

## Library

Server-side PDF generation uses **`@react-pdf/renderer`** (`renderToBuffer`).

Why:

- Runs on Vercel Node serverless without Chromium
- Bundled Helvetica fonts (no missing system fonts)
- Suitable for structured commercial documents

## Behaviour

- Preview: `/admin/quotes/[id]/preview/`
- Storage: private Supabase bucket `quote-pdfs`
- Admin download: short-lived signed URL
- Public download: `/q/[token]/pdf/` after token validation
- File name: `Damtech-Quotation-{number}-Rev-{n}.pdf`
- Never includes cost, markup, margin, or internal notes
- UK English labels; ZAR formatting via `en-ZA`

## Settings

`/admin/settings/pdf/` controls brand colours, banking visibility, and header/footer style flags.
