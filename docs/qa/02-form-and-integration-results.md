# 02 — Form and integration results

## Public write paths (code review + local tests)
| Path | Server action | Protections verified in code | Local result |
|---|---|---|---|
| Simple quote `/quote/` and embedded forms | `app/actions/submit-simple-quote.ts` | zod parse (`parsePublicRfqFormData`), email + province compulsory, 4 s min fill time, honeypot `website` (spam stored as spam, rate-limited), Upstash rate limit, idempotent `submissionId`, DB-failure → email fallback → clear customer message with incident ID, admin + customer emails recorded in `rfq_communications`, failed admin email queued to outbox | PASS (validation, bot guard, graceful failure) |
| Quote-preparation wizard | `app/actions/submit-public-rfq.ts` | zod `publicMultiRfqSchema` (1–30 assets), `checkRequiredRfqContact`, bot guard, honeypot (silent accept), rate limit, fallback | Step validation PASS; **defect fixed**: submit-time asset re-check (see journey matrix) |
| Calculator → draft | `app/actions/create-calculator-draft.ts` | rate limit | BLOCKED (writes a DB draft) |
| Post-submit upload | `app/actions/rfq-upload.ts` | rate limit, token per RFQ | BLOCKED (needs DB token + storage) |
| Info-request response `/quote/info/<token>` | `app/actions/submit-info-response.ts` | rate limit, token | BLOCKED |
| Order / invoice request | `app/actions/submit-order.ts` | — | BLOCKED |
| Legacy lead form | `app/actions/submit-lead.ts` | honeypot within rate limit | NOT RUN |

Unit tests covering this logic (`npm test`, all pass, 329 total): `lib/rfq/contact-requirements.test.ts`, `rfq.test.ts`, `phase2.test.ts`, `simple-quote.test.ts`, `submission-repair.test.ts`, `lib/fallback/fallback.test.ts`, `lib/analytics/attribution.test.ts`, `events.test.ts`, `private-paths.test.ts`.

## Integrations
| Integration | Status | Notes |
|---|---|---|
| Supabase (RFQs, customers, communications) | Not exercised | No test branch. Earlier session's read-only advisor flagged 14 `SECURITY DEFINER` functions executable by `anon` and leaked-password protection off — still open, needs an approved migration (see execution plan P1-6). |
| Resend email (admin + customer) | Not exercised | Fallback path verified to skip cleanly when unconfigured. |
| Upstash rate limit | Not exercised against Redis | In-memory fallback used locally. |
| GA4 / GTM / Meta Pixel | Present once per page (114/114) | `trackLeadSubmitted` fires on success only (code). Tests and audit scripts now block analytics so they cannot create fake sessions or conversions. Duplicate-conversion check in GA4 itself needs owner access. |
| Vercel Speed Insights | Present | Field data not accessible (API 403). |
| Xero / accounting | Not in codebase | Nothing to protect. |
| Vercel cron jobs | Config present (`vercel.json`) | Unit tests `lib/cron/*.test.ts` pass; live runs not visible (API 403). |

## How to finish the blocked tests (owner)
1. Create a Supabase **branch** (or a separate free project) and give its URL/anon/service keys to a local `.env.local` only.
2. Create a test admin user on that branch.
3. Point Resend at a test domain or set `RFQ_INTERNAL_NOTIFICATION_EMAIL` to a mailbox you control.
4. Then run the wizard and simple-quote scenarios end to end and check the admin RFQ inbox, the Enquiry source panel and the uploads page. Nothing in this flow should run against production.
