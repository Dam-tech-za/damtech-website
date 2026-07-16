# Upstash rate limiting

Damtech uses [@upstash/ratelimit](https://github.com/upstash/ratelimit) with Redis REST for production-safe limits across Vercel serverless instances.

## Setup

1. Create an Upstash Redis database (regional or global).
2. Copy the **REST URL** and **REST TOKEN**.
3. Add Vercel / `.env.local` variables:

```txt
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

4. Redeploy. Confirm `/admin/settings/system/` shows Upstash as **Configured**.

## Policies

| Policy | Limit | Window | Failure |
| --- | --- | --- | --- |
| Public RFQ submit | 15 | 1 hour / IP hash | Fail closed |
| Calculator draft create | 30 | 1 hour / IP hash | Fail closed |
| Public RFQ upload init | 20 | 1 hour / IP hash | Fail closed |
| Public quote view | 60 | 1 hour / token+IP hash | Fail closed |
| Quote accept/reject | 10 | 1 hour / token+IP hash | Fail closed |
| Admin sensitive | 30 | 1 hour / user+IP hash | Fail closed |

Identifiers are SHA-256 truncated — raw IPs are not stored in Redis keys.

## Failure behaviour

- If Upstash is configured and the API errors: **deny** sensitive public writes (`fail_closed`).
- If Upstash is **not** configured in **production**: deny fail-closed policies (no silent in-memory).
- Local development (`NODE_ENV !== production`) may use an in-memory Map fallback — documented only for DX.

## Changing limits

Edit the policy constants in:

- `lib/rate-limit/public-rfq.ts`
- `lib/rate-limit/public-quote.ts`
- `lib/rate-limit/admin-sensitive.ts`
- or `lib/security/rate-limit.ts` (`RATE_LIMITS`)

## Testing 429 responses

1. Temporarily set a policy limit to `1`.
2. Submit twice from the same client.
3. Expect JSON `{ "error": "Too many requests..." }` with status **429** and `Retry-After`, or a friendly form error for server actions.
4. Restore the limit.
