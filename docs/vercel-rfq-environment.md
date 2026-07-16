# Vercel RFQ environment checklist

Public RFQ submissions must succeed even when Resend or Upstash is unavailable.
Supabase persistence is the primary business operation.

## Required variables

Configure separately for **Production**, **Preview**, and **Development** in Vercel.

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

RESEND_API_KEY=
RFQ_FROM_EMAIL=
RFQ_REPLY_TO_EMAIL=
RFQ_INTERNAL_NOTIFICATION_EMAIL=

# Legacy aliases still supported:
# QUOTE_FROM_EMAIL / QUOTE_REPLY_TO_EMAIL / QUOTE_INTERNAL_NOTIFY_EMAIL / LEAD_INBOX_EMAIL

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RATE_LIMIT_HASH_SECRET=

NEXT_PUBLIC_SITE_URL=https://www.dam-tech.co.za

# Preview-only diagnostics (never leave on in Production)
RFQ_DEBUG_LOGGING=false
```

## Behaviour notes

| Layer | Missing config behaviour |
| --- | --- |
| Supabase service role | Public RFQ fails with safe database/config message |
| Upstash | Public RFQs fall back to Supabase rate-limit RPC, then allow with tiny memory burst |
| Resend | RFQ still saved; notifications marked failed / pending_configuration |

## After changing env vars

1. Save variables in Vercel for the correct environment.
2. **Redeploy** (env changes do not apply to already-running deployments).
3. Confirm Resend sender domain is verified.
4. Apply migration `20260716090000_public_rfq_submission_repair.sql` in production Supabase.
5. Open `/admin/settings/system/` and run **Test RFQ infrastructure**.
6. Submit a real Quote Preparation RFQ and confirm it appears in `/admin/rfqs/`.

## Rate limiting

- Hourly: 10 successful attempts / client key
- Burst: 3 / 5 minutes
- Quota is consumed only after validation, honeypot, and timing checks pass
- Client keys are HMAC-hashed — raw IPs are never stored

## Idempotency

Client sends `submissionId` (UUID). Duplicate submits return the original RFQ number without creating a second row.
