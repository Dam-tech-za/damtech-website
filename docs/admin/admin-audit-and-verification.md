# Admin audit and verification

## Scope actually covered (18 Oct 2026)
| Check | How | Result |
|---|---|---|
| Route inventory | `find app/admin -name page.tsx` | 40 admin routes (overview, RFQs, quotes, customers, orders, pricing ×15, suppliers, settings ×7, audit, login, unauthorised) |
| Unauthenticated access | `curl` against local production build | Every admin route 307-redirects to `/admin/login/` (with `error=auth_not_configured` locally because no Supabase env is set). `/admin/*` sends `X-Robots-Tag: noindex` and `Cache-Control: private, no-store`. |
| Server-side authorisation | Code review | `proxy.ts` gate + `requireAdmin()` in server components + role checks via `canPerform`/`canAccessNavItem`; RLS enabled on all 47 public tables. |
| Placeholder / dead controls | Code search for mock data, "coming soon", `href="#"`, no-op handlers | No fake dashboard data found. `AdminModulePlaceholder` ("coming soon") exists but is not used by any route. Unused state setters in the quote editor/send dialog (`setBcc`, `setStatus`, …) are not rendered as controls. |
| Unit tests | `npm test` | 300/300 pass (includes admin dashboard, RFQ inbox, delete-RFQ guard, permissions, auth guards, attribution). |
| Supabase security advisor | Supabase MCP (read-only) | See findings below. |
| Residential lead classification | Code trace | Residential pages link to `/quote/?service=Roof / home waterproofing`, a real `SERVICE_OPTIONS` value. RFQ inbox filters by service (`RfqInboxFilters.service`), so residential leads are separable from linings/tanks. |
| Lead attribution in admin | Code trace | First-touch landing page/referrer/campaign is stored in `rfqs.simple_service_fields.attribution` but was only shown as raw JSON on simple leads. **Fixed:** new "Enquiry source" panel on every RFQ detail (`describeLeadSource`, unit-tested), including a region hint for the Pretoria/Overstrand residential pages. |

## Not verified (blocked)
- **Clicking through the authenticated admin UI.** No local `.env.local`/Supabase credentials and no test admin account in this environment; a read-only production query was refused by the session's permission policy. Nothing was bypassed. The new Enquiry source panel is type-checked and unit-tested but has **not been seen rendered** with a real RFQ.
- Mutation flows (status changes, notes, quote conversion) were not exercised; they need non-production fixtures or a Supabase branch.

## Supabase advisor findings (production project "Damtech Admin")
| Level | Finding | Suggested fix (needs approved migration) |
|---|---|---|
| WARN | 14 `SECURITY DEFINER` functions executable by `anon` and `authenticated` via `/rest/v1/rpc/…`, incl. `next_rfq_number`, `next_quote_number`, `rls_auto_enable`, `get_pricing_catalogue_sell`, `get_quote_id_by_token_hash` | `REVOKE EXECUTE … FROM anon` (and from `authenticated` where only the service role calls them). Check each caller first: public quote-acceptance may legitimately use `get_quote_id_by_token_hash`. `next_*_number` being callable anonymously lets anyone burn sequence numbers. |
| WARN | `public.set_updated_at` has a mutable `search_path` | `ALTER FUNCTION public.set_updated_at() SET search_path = public;` |
| WARN | Leaked-password protection disabled | Enable in Supabase Auth settings (owner action). |
| INFO | `public_submission_rate_limits` has RLS on but no policy | Intentional if only the service role writes to it; document or add an explicit deny policy. |

## Next steps
1. Owner: provide a test admin login (or local `.env.local` pointing at a Supabase branch) so the admin can be clicked through end to end, including a fresh residential test enquiry on a non-production project.
2. Draft (not apply) a migration for the advisor findings and review each RPC caller before revoking.
