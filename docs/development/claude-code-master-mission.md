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
| 3ef6712 | Ledger, before/after comparisons in `docs/design/compare/`. |
| c548c9d | Blog article masthead → cream editorial; `scripts/perf-lab.mjs` lab probe. |
| 8b78b55 | Admin RFQ detail "Enquiry source" panel (attribution was stored but only shown as raw JSON); brand, photography, SEO-diff, performance docs. |
| c886c5b | Admin audit, Cowork takeover audit, visual results, residential plan, release verification, owner action items; CLAUDE.md standing rules. |
| 5733871 | Polish: forms, sidebar/legacy cards, dark bands, focus ring, 320 px fix; contrast + overflow sweeps of all 75 routes. |

## Verification
- `tsc` clean; `eslint` 0 errors (pre-existing warnings only); `npm test` 300/300; `next build` passes.
- Performance (lab, `docs/performance/benchmark-comparison.md`): mobile LCP 1.85–2.14 s (was 1.68–1.94 s), CLS ≤0.046 (font swap), TBT unchanged; GTM + Meta Pixel account for ~450 ms of the ~520 ms mobile TBT. Tag deferral tested, no lab gain, reverted.
- SEO diff (`docs/seo/snapshots/diff-latest.md`, baseline rebuilt from `main`, both captured at network idle): **75 routes, titles/descriptions/canonicals/robots/OG/headings/JSON-LD/internal links unchanged.** Only change: four short duplicate mobile chip labels in the home hero trust strip removed (titles + details kept).
- No horizontal overflow at 390 px on 17 key routes.
- Vercel preview for 626f1a4: status "Deployment has completed" (preview is behind Vercel SSO; owner can open it from the GitHub commit status).

## Blocked / needs owner
- **Admin click-through not done**: no local Supabase env and no test admin login; production DB reads were refused by the session's permission policy. Supabase security advisor (read-only) reports: 14 SECURITY DEFINER functions executable by `anon` (incl. `next_rfq_number`, `next_quote_number`, `rls_auto_enable`), mutable search_path on `set_updated_at`, leaked-password protection disabled. Fixing these needs an approved migration.
- Residential pages have **no residential photography** — colour-block design used instead of stand-in photos. Shot list: `docs/branding/damtech-photography-requirements.md`.
- `gh` CLI not installed and no GitHub API access here, so the draft PR must be opened from the compare link.
- Lighthouse not installed; lab probe used instead.

## Next exact actions
1. Open draft PR (compare link) and get owner review of the Vercel preview.
2. Admin: with test credentials/`.env.local`, click through RFQ inbox + detail (check the new Enquiry source panel) using a non-production residential test enquiry; draft (not apply) the advisor-fix migration.
3. Lighthouse (mobile + desktop, 5 runs) on preview vs production.
4. Remaining polish: calculator widget internals, product detail body, blog index cards; prune dead `home-*` CSS from `globals.css`.
5. Screen-reader pass on header dropdown and mobile menu.
6. Consider `display: "optional"` for Archivo to remove font-swap CLS (brand trade-off).

Restart: `git checkout claude/project-thread-mfiulx && npm run build && npx next start -p 3100`; SEO check: `node scripts/seo-snapshot.mjs http://127.0.0.1:3100 after.json && node scripts/seo-snapshot.mjs --diff docs/seo/snapshots/baseline.json after.json`.
