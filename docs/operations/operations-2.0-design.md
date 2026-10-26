# Operations 2.0 — replace Monday, simplify the admin

Owner brief: thread "DamTech Operations 2.0" (26 Oct 2026). Branch `claude/project-thread-yssxtx`.
Status: **design done, foundations built and unit-tested. Migration applied to production and code merged to `main` on 26 Oct 2026 (owner approved). Xero sync stays off until the bridge key is set and the baseline run is done.**

One authoritative system per kind of information:

| Information | Owner | Website admin |
|---|---|---|
| Quotes, invoices, payments, credit notes, P&L, VAT | **Xero** | Reads and displays (via the Xero bridge) |
| Won jobs, stage, next action, crew, site dates, supplier orders, documents | **DamTech Admin (Supabase `ops_*`)** | Edits |
| Pricing policies, workbooks, safety files, supplier PDFs | **OneDrive** | Links only |
| RFQ triage, estimating, procurement drafts | **Claude agents** | Optional, through defined interfaces |

---

## 1. Current-system audit (26 Oct 2026)

**Stack.** Next.js 16.4.2, React 19.2, Supabase project *Damtech Admin* (`ziyjuftbbrjqerjlitav`), Vercel (personal account, no team, so crons are once a day each). Admin auth: Supabase Auth + `admin_profiles` roles (owner/admin/sales/estimator/viewer), `requireAdmin()`/`assertAdmin()` server gates, RLS on every table.

**Admin routes (40).** Overview dashboard, Enquiries (RFQs), Quotations (builder, PDF, revisions, public `/q/[token]` links, two crons), Orders (online tank kits), Customers, Pricing (materials, labour, travel, services, equipment, tank models, CSV/inventory import, review), Project templates, Suppliers, Settings (company, email, estimating, PDF, quotes, system health), Audit log.

**Live data (row counts, read-only query 26 Oct).** rfqs 77, rfq_communications 136, customers 70, catalogue_orders 5, quotes **2**, quote_line_items 22, pricing_items 39, material_items 39, project_templates 11, suppliers 2, tank_models 0, labour_items 0, admin_profiles 1. The website quote/pricing engine is built but barely used; real quoting happens in Xero.

**Xero.** Already connected through the **Xero bridge**: a Supabase Edge Function `xero-bridge` in the same project (guide: OneDrive `01 Company & Compliance/Systems/Xero Bridge/`). It holds the only OAuth tokens (standard web app; Custom Connections are not sold in ZA), refreshes them under a Postgres lock, keeps them alive with pg_cron, and exposes `POST /api/<tool>` with a static Bearer key. `WRITE_MODE=full`. Starter tier ≈1,000 Xero calls/day; bridge caches reads for 120 s. **A second Xero app or client would rotate the refresh token and sign every agent out, so the website must use the bridge.** No Xero code existed in this repo before this branch.

**Monday.** Two boards (read 26 Oct): *Projects – Won Jobs* (7 items, 8 stage labels, payment/safety/material status columns, 10–14 subitem checklist per job) and *Material Orders & Collections* (4 items). Cross-check against Xero found Monday already wrong: Kingdom Pumps shows "collect R5,750 balance" but Xero INV0142 is PAID (settled by a R5,750 credit note).

**Known open risks carried over.** No admin test login and no Supabase branch (so no end-to-end DB tests); the 14 publicly callable DB functions migration still awaits approval. New functions on this branch revoke `public/anon/authenticated` execute from the start.

## 2. Keep / remove / rebuild

| Feature | Decision | Why / condition |
|---|---|---|
| Public RFQ forms, calculators, quote-preparation flow | **Keep** | Lead generation; untouched |
| Enquiries (RFQ inbox) | **Keep** | Source of leads; estimator prepares the quote in Xero |
| Online tank-kit orders | **Keep** | Real public orders (5); invoiced in Xero |
| Overview dashboard (RFQ KPIs) | **Keep for now**, later merge into Operations Overview | Avoid two "morning" screens once Operations is live |
| Customers (70, created from RFQs) | **Keep read-only**, stop treating as customer master | Xero contacts are the customer master |
| Quotations module (builder, PDF, revisions, `/q/[token]`, expire/reminder crons) | **Retire** after Operations goes live | 2 quotes ever; Xero owns quotes. First confirm no customer holds a live `/q/` link, export the 2 quotes, then hide nav → remove routes in a separate PR |
| Pricing library, labour, travel, equipment, tank models, imports | **Retire from admin** (data kept) | Pricing policy lives in OneDrive workbooks and Xero items; agents read those. Remove only after the estimator agent no longer reads these tables |
| Project templates (quote scope text) | **Retire** with Quotations | Only used by the quote builder |
| Suppliers (2 rows) | **Rebuild** as the supplier list for Procurement | `ops_material_orders.supplier_id` already references it |
| Settings: company, email, system health | **Keep** | Settings › quotes / PDF / estimating retire with Quotations |
| Audit log | **Keep** | Ops actions also write to it |
| Monday boards | **Run in parallel**, then cancel | Only after section 7 acceptance tests pass |

Nothing is removed on this branch. Retirements are separate, reversible PRs after the owner confirms.

## 3. Admin design and routes

Five sections, matching the brief:

| Section | Route | State on this branch |
|---|---|---|
| Overview | `/admin/operations/` | **Built**: Xero sync line + "Sync now", 4 figures (active, awaiting deposit, open supplier orders, owed on active jobs from Xero), "What needs attention" list, active projects ordered by next-action date |
| Projects | `/admin/operations/projects/`, `/admin/operations/projects/[id]/` | **Built**: stage filter; detail with next action, stage path (supply-only path is shorter), on-hold flag, supplier orders (add/update), details form, money from Xero (read-only), activity |
| Procurement | `/admin/operations/procurement/` | **Built**: open supplier orders across jobs |
| Financials | `/admin/operations/financials/` | Stage 4 (not built; no placeholder screen) |
| Settings | existing `/admin/settings/` | Add "Xero connection" card in stage 2 |

Sidebar gains an **Operations** group (Projects, Procurement) above Sales. Old sections stay until retired. Everyone with admin access can view; owner/admin/sales/estimator can edit; only owner/admin can run a Xero sync; Financials will be owner/admin only. Every screen says plainly when tables are not installed or the bridge key is missing, so empty screens are never mistaken for data. Calm admin styling (`styles/admin-layout.css`), not the public brand.

**Lifecycle.** Awaiting deposit → Planning → Scheduled → In progress → Handover → Completed. Supply-only: Awaiting deposit → Preparing goods → Dispatch or collection booked → Completed. On hold is a flag with a reason. Payment status (Not invoiced / Awaiting payment / Part paid / Invoices paid, balance not yet invoiced / Paid in full / Overdue) is computed from Xero invoices and never moves the stage. Leaving Awaiting deposit with nothing paid needs an explicit "Proceed without a deposit" tick. Next action + date are mandatory on every open project (enforced in the database too).

## 4. Supabase schema and migration plan

Migration `supabase/migrations/20261026150000_operations_foundation.sql` — additive only. **Applied to production 26 Oct 2026** (owner approved). Security advisors afterwards: no new warnings; the ops_* tables show only the expected INFO notice "RLS enabled, no policy" (service role only by design).

| Table | Purpose |
|---|---|
| `ops_projects` | One record per won job. Stage, hold, next action (required), site, crew, dates, service, supply-only, quote/invoice numbers, cached Xero payment fields, `needs_review` |
| `ops_xero_quote_links` | Xero quote UUID (unique) → project |
| `ops_xero_invoice_links` | Xero invoice UUID (unique) → project; kind (deposit/progress/final/variation/full), amounts, match method |
| `ops_xero_quote_ignores` | Quotes already accepted/invoiced at go-live (baseline) or dismissed, so the first sync does not recreate old jobs |
| `ops_material_orders` | Supplier orders per project: supplier, materials, qty, ref, status, delivery/collection, expected date, cost excl. VAT, Xero bill id |
| `ops_project_tasks` | Optional quality/handover tasks (no universal 14-step checklist) |
| `ops_project_documents` | OneDrive links (https only) |
| `ops_project_activity` | Activity history per project |
| `ops_sync_runs` | Every sync: trigger, status, counts, errors. Partial unique index allows one running sync at a time |
| `ops_financial_snapshots` | Cached Xero reports (stage 4) |

Functions: `ops_import_accepted_quote(jsonb)` (atomic, idempotent: existing link → refresh; quote number already on a project → link; else create project + link + activity; concurrent duplicate → returns the existing one) and `ops_start_sync_run()` (clears runs stuck >15 min, then takes the single running slot). RLS on all tables, no grants to `anon`/`authenticated`, functions executable by `service_role` only; screens check the role in server code and then use the service role (same pattern as catalogue orders).

Verified on this branch with an in-memory Postgres (PGlite): applies cleanly twice, import is idempotent, a claimed quote links instead of duplicating, next-action rule enforced, sync lock and stale-run recovery work, anon has no table or function access, RLS on for all 10 tables.

**Apply order (needs owner go-ahead):** Supabase branch (or a restored copy) → apply → run the 7-job Monday import and a baseline sync there → owner checks the screens → apply to production → set env vars → baseline sync → enable cron.

## 5. Xero integration architecture

```
Xero ──OAuth (only here)── Supabase Edge Function xero-bridge ──Bearer key──► Next.js server (lib/operations)
                                                                              │  read-only tool allowlist
pg_cron every 15 min (06:00–19:00 SAST) ──POST /api/cron/xero-sync/ (CRON_SECRET)──┘
Vercel cron 04:45 UTC daily (safety net) ─────┘          │
Admin "Sync now" (owner/admin) ───────────────────────┘
                                                     ▼
                                          Supabase ops_* tables
```

- **Client** `lib/operations/xero-bridge.ts`: refuses any tool not on the read list (`get_quotes`, `get_quote`, `get_invoices`, `get_invoice`, P&L, balance sheet, bank summary, receivables), 20 s timeout, never logs the key.
- **Sync** `lib/operations/sync.ts` (pure, unit-tested) + `sync-store.ts` (Supabase):
  1. Read quotes with status ACCEPTED and INVOICED from the last 120 days (both, because a quote can be accepted and invoiced between syncs). Unknown quote → `get_quote` → `ops_import_accepted_quote`. Known quotes cost no extra calls.
  2. Read sales invoices (AUTHORISED, PAID, VOIDED) from the last 180 days. Link new ones by: invoice number listed on exactly one project → quote number in the reference → the Xero contact has exactly one open project and the invoice is dated on/after its quote. Anything ambiguous is left for a person. Existing links are refreshed, never re-matched.
  3. Recompute payment status per project from its invoices only; write and log only on change.
- **Baseline:** the first run records every quote already accepted/invoiced as pre-existing (except quotes listed on migrated Monday jobs, which are linked). Regular runs refuse to start until a baseline exists.
- **Budget:** ~4–6 Xero calls per run; 52 runs/day in working hours ≈ 250–300 calls, inside the ~1,000/day Starter limit shared with the agents.
- **Webhooks:** Xero has no quote-accepted webhook; invoice webhooks could later trigger an immediate sync, but polling stays as the reconciliation path.
- **Gate:** `/api/cron/xero-sync/` does nothing until `OPS_XERO_SYNC_ENABLED=true`.

**Recommended bridge change (other repo, bridge maintainer):** add a second, read-only key for the website so a leaked website key cannot send invoices. Until then the website's allowlist is the only guard.

## 6. Monday migration mapping

Mapping code: `lib/operations/monday.ts` (unit-tested). Payment, balance and checklist columns are **not** copied; Xero fills payment after the first sync.

| Monday | New |
|---|---|
| Awaiting deposit | Awaiting deposit |
| Planning & materials | Planning |
| Scheduled | Scheduled |
| On site | In progress |
| Snags / handover | Handover |
| Final invoice | Handover + "confirm whether work is finished" |
| Closed – paid | Completed (payment from Xero) |
| On hold | Planning + On hold flag + review |
| Payment / Balance due columns | Dropped; Xero reconciliation |
| Material status column + Material Orders board | `ops_material_orders` rows |
| Next action / date | Next action / date (missing date → migration date, flagged) |
| Subitem checklists | Not migrated |

Dry run against the live boards (26 Oct) and Xero:

| Job | New stage | Xero numbers | Notes for review |
|---|---|---|---|
| Hire Engineering – 69 kL reservoir, Modimolle | Planning | QU0321 / INV0144 | Xero: R55,000 paid, R16,311.73 due 28 Oct (part paid) |
| Clinton – HDPE relining, Lanseria | Planning | QU0314 / INV0143 | Xero: R100,000 due 27 Oct (part paid) |
| TMS Redec – Lindley reservoir relining | Planning | QU0288 | Quote still SENT in Xero; mark Accepted |
| Francois Joubert (PPCF) – 2 HDPE dams | Planning | QU0294 / INV0137 | Xero: R39,635.26 due 31 Oct |
| Boscobel Trading – 97 kL reservoir | Planning | QU0337 / INV0153 | No next-action date on Monday; Xero paid in full |
| Pexmart – 116 kL reservoir, Boksburg | Handover | QU0283+QU0285 / INV0139+INV0140 | Was "Final invoice": confirm complete. Xero: R18,331 due 31 Oct |
| Kingdom Pumps – torch-on lining | Handover | QU0251 / INV0142 | Was "Final invoice". Xero PAID (credit note); Monday's "collect R5,750" is stale |

Supplier orders: Youngman plates (Hire Eng., Ordered), Gundle GG26834 (Francois, Received), Gundle quote (Clinton, Quote requested), Fibertex SO4010749 (Francois, Ordered; Monday cost R7,020 kept as a note because VAT basis is unrecorded).

The import is `scripts/ops-monday-import.ts <export.json> [--write]` (dry run by default; the export stays outside the repo because it holds phone numbers and emails). It writes `source = 'monday_migration'` with `monday_item_id` (unique) so it can be re-run safely. Monday data is not changed or deleted.

## 7. Implementation plan and acceptance tests

| Stage | Work | Status |
|---|---|---|
| 1 Audit & design | This document | **Done** |
| 2 Xero → Projects | Migration, bridge client, sync engine, cron route, Sync now, baseline | **Code done, unit-tested**; needs DB apply + bridge key |
| 3 Operations screens | Overview, Projects, Procurement, project detail; Monday import | **Screens built**; import script + live check after DB apply |
| 4 Financials & AI | Xero P&L/balance/bank/debtors/creditors cache and dashboard with ACTUAL/ESTIMATE/FORECAST labels and last-sync time; procurement-agent interface | Not started |
| 5 Retire | Hide then remove Quotations/Pricing/Templates; cancel Monday | After parallel run |

Acceptance tests (✓ = automated on this branch, ☐ = needs branch DB / live bridge):

- ✓ Accepted quote → exactly one project; repeated syncs and ACCEPTED→INVOICED do not duplicate (unit + PGlite SQL).
- ✓ Quote listed on a migrated job links to it, no new project.
- ✓ Baseline required before imports; old accepted quotes ignored.
- ✓ Deposit invoice links and moves payment Not invoiced → Part paid → Paid in full; voided/draft invoices ignored; credit-note settlement = paid in full (Kingdom Pumps case).
- ✓ Ambiguous invoices (two open jobs, old invoice) are not auto-linked.
- ✓ Stage rules: no install stages for supply-only; deposit guard; next action mandatory.
- ✓ Bridge client refuses write tools; overlapping syncs skipped; bridge failure recorded without side effects.
- ✓ Cron route rejects missing/wrong secret (401) on a production build; admin routes redirect unauthenticated users.
- ☐ Migration applied on a Supabase branch; Monday import of 7 jobs + 4 orders; baseline sync against the real bridge; screens checked on desktop and phone with a real admin login.
- ☐ Mark a test quote Accepted in Xero (or use the next real one) → project appears within 15 min.

## What the owner needs to provide or approve

1. ~~Database go-ahead~~ Done: migration applied to production on 26 Oct 2026.
2. **The bridge key for the website**: set `XERO_BRIDGE_API_KEY` in Vercel (Production + Preview). Preferably a new read-only key added by the bridge maintainer. Never paste it into chat.
3. **A test admin login** (or sign in yourself on the preview) so the screens can be checked end to end.
4. After checking: approval to schedule the pg_cron job (every 15 min, 06:00–19:00 SAST) and set `OPS_XERO_SYNC_ENABLED=true`.
5. Decision on retiring the website Quotations module (2 quotes on record) and the Pricing screens.
