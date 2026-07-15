# Public quote security

## Token model

1. Generate ≥32 bytes CSPRNG (`crypto.randomBytes`) → base64url token
2. Store **only** SHA-256 hex hash in `quotes.public_token_hash`
3. Raw token appears only in the emailed link (`/q/{token}/`)
4. Lookup compares hashes server-side (service role / security definer RPC)
5. Tokens expire (`public_token_expires_at`) and can be revoked (`public_token_revoked_at`)

## Public surface

Shows: branding, quote number, customer name, project, dates, sell-side lines, totals, terms, PDF, accept/reject.

Never exposes: cost prices, margins, internal notes, admin emails, other customers, full audit history.

## Hardening

- `robots: noindex, nofollow, noarchive` metadata + PDF `X-Robots-Tag`
- `/q/` excluded from sitemap
- In-memory rate limits on view/accept/reject/PDF (upgrade to Upstash for multi-instance)
- Acceptance stores optional **IP hash** only (documented one-way), never raw IP
- Rejection reasons notify Damtech only; not shown on public confirmation page
