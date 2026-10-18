# Claude Code master mission — live ledger

Owner brief: `docs/development/owner-master-mission-2026-10-18.md`. Branch: `claude/project-thread-mfiulx` (from `main` @ 8d1acc8). Nothing deployed to production.

## Takeover findings (18 Oct 2026)
- Cowork bundle (`_claude_transfer/damtech-optimisation.bundle`, head 1ffa0ce) and change archive (`damtech-all-changes.tgz`, 88 files) are **already fully contained in `main`** (byte-identical / ancestor content). Status: *verified integrated*. No Cowork work at risk.
- Owner "old design" screenshots not present locally; `examples/` holds benchmark screenshots (Swell, Promax, Pomerleau). Grok report not present locally.
- 75 sitemap routes, 97 `page.tsx` files, 40 admin routes. Next 16.4.2, React 19.2, Tailwind 4, Supabase.

## Done (implemented + tested locally)
| Commit | Work |
|---|---|
| a4791f1 | New "Waterline" brand system (`app/brand.css`): ink/cream/vivid blue/cyan palette, Archivo variable display + Inter body. New header (transparent over home hero, phone link), new footer, full homepage rebuild (full-bleed crew photo + DAMTECH wordmark, numbered proof list, photo service tiles, dark process band, editorial project grid, blue service index, closing CTA). Mobile sticky bar now waits until past the hero. SEO snapshot tool `scripts/seo-snapshot.mjs`. |
| 626f1a4 | Inner templates (`app/brand-pages.css`): shared `Hero` with photo / blue / ink / cream variants; photo heroes on dam liners, services, projects, project detail, HDPE/PVC/torch-on/repair/reservoir pages, about, steel tanks. Residential pages + waterproofing hub: blue hero with enquiry card. Editorial prose rows, typographic FAQ/related links, dark process band, ink inline CTA. |
| (this commit) | Ledger, before/after comparisons in `docs/design/compare/`. |

## Verification
- `tsc` clean; `eslint` 0 errors (pre-existing warnings only); `npm test` 297/297; `next build` passes.
- SEO diff (`docs/seo/snapshots/diff-latest.md`, baseline rebuilt from `main`, both captured at network idle): **75 routes, titles/descriptions/canonicals/robots/OG/headings/JSON-LD/internal links unchanged.** Only change: four short duplicate mobile chip labels in the home hero trust strip removed (titles + details kept).
- No horizontal overflow at 390 px on 17 key routes.
- Vercel preview for 626f1a4: status "Deployment has completed" (preview is behind Vercel SSO; owner can open it from the GitHub commit status).

## Blocked / needs owner
- **Admin click-through not done**: no local Supabase env and no test admin login; production DB reads were refused by the session's permission policy. Supabase security advisor (read-only) reports: 14 SECURITY DEFINER functions executable by `anon` (incl. `next_rfq_number`, `next_quote_number`, `rls_auto_enable`), mutable search_path on `set_updated_at`, leaked-password protection disabled. Fixing these needs an approved migration.
- Residential pages have **no residential photography** — colour-block design used instead of stand-in photos. Shot list still to be written (`docs/branding/damtech-photography-requirements.md`).
- `gh` CLI not installed on this machine, so the draft PR was not opened automatically.
- Lighthouse/performance re-measurement not yet run.

## Next exact actions
1. Write remaining docs: brand guidelines, photography requirements, admin audit, performance benchmark, release verification, owner action items; slim CLAUDE.md rules.
2. Lighthouse (mobile + desktop) on preview vs production.
3. Admin: obtain test credentials or local `.env.local`, click through RFQ inbox with residential leads; prepare (not apply) advisor-fix migration.
4. Remaining templates still on legacy styling: calculators, blog/article, quote/contact forms, product detail body — restyle.
5. Open draft PR from `claude/project-thread-mfiulx`.

Restart: `git checkout claude/project-thread-mfiulx && npm run build && npx next start -p 3100`; SEO check: `node scripts/seo-snapshot.mjs http://127.0.0.1:3100 after.json && node scripts/seo-snapshot.mjs --diff docs/seo/snapshots/baseline.json after.json`.
