# Upstash + Supabase rate limiting

Damtech uses [@upstash/ratelimit](https://github.com/upstash/ratelimit) when configured, with a **Supabase-backed fallback** for public RFQ submissions.

## Setup

1. (Optional) Create an Upstash Redis database and set:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
2. Set `RATE_LIMIT_HASH_SECRET` (HMAC salt for client keys).
3. Apply migration `20260716090000_public_rfq_submission_repair.sql` for:
   - `check_public_submission_rate_limit`
   - `public_submission_rate_limits`
4. Redeploy. Confirm `/admin/settings/system/` shows Upstash and/or Supabase fallback status.

## Policies

| Policy | Limit | Window | Failure |
| --- | --- | --- | --- |
| Public RFQ submit (hourly) | 10 | 1 hour / hashed client key | Fail open → Supabase → memory burst → allow |
| Public RFQ submit (burst) | 3 | 5 minutes | Same |
| Public RFQ upload init | 20 | 1 hour | Fail open (public) |
| Public quote view | 60 | 1 hour / token+IP hash | Fail closed |
| Quote accept/reject | 10 | 1 hour / token+IP hash | Fail closed |
| Admin sensitive | 30 | 1 hour / user+IP hash | Fail closed |

Identifiers are HMAC-SHA256 truncated — raw IPs are not stored.

## Public RFQ failure behaviour

1. Try Upstash when configured.
2. On miss/error: try Supabase `check_public_submission_rate_limit`.
3. If both unavailable: log the outage, apply a tiny per-instance memory burst, then **allow** the legitimate enquiry.
4. Admin / sensitive actions remain fail-closed in production without Upstash.

## Changing limits

Edit:

- `lib/rate-limit/public-rfq.ts`
- `lib/rate-limit/public-quote.ts`
- `lib/rate-limit/admin-sensitive.ts`
- or `lib/security/rate-limit.ts` (`RATE_LIMITS`)
