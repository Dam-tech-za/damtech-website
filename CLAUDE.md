@AGENTS.md

# Damtech website — standing rules

Current work and status: `docs/development/claude-code-master-mission.md` (live ledger). Owner brief: `docs/development/owner-master-mission-2026-10-18.md`.

## Brand
- "Waterline" system: tokens and `dt-*` components in `app/brand.css` (home, header, footer) and `app/brand-pages.css` (inner templates). Guidelines: `docs/branding/damtech-brand-guidelines.md`.
- Benchmark for quality is Swell Roofing (photo-first, big type, hard colour blocks) — never copy its assets, copy or code.
- Do not reintroduce navy-gradient text heroes or stacks of rounded white cards. Add new styles to the brand files, not `globals.css`.

## Never
- Edit, crop, regenerate, replace or delete files in `public/images/`. Frame with CSS `object-position` only. No stock or AI images presented as Damtech work; where no real photo exists, use a colour block and add the need to `docs/branding/damtech-photography-requirements.md`.
- Change URLs, titles, meta descriptions, canonicals, JSON-LD facts, H1–H6 wording, prices, warranties or substantive copy as a side effect of design work.
- Invent projects, testimonials, ratings, certifications, years, prices or service areas.
- Run destructive migrations, delete leads or reset Supabase; deploy to production without the owner's go-ahead.
- Disable or weaken marketing attribution to improve lab scores.

## Before committing template changes
```
npx tsc --noEmit && npm run lint && npm test && npm run build
npx next start -p 3100
node scripts/seo-snapshot.mjs http://127.0.0.1:3100 docs/seo/snapshots/after.json
node scripts/seo-snapshot.mjs --diff docs/seo/snapshots/baseline.json docs/seo/snapshots/after.json docs/seo/snapshots/diff-latest.md
```
Any heading/metadata/link/schema difference must be explained or reversed. Optional: `node scripts/perf-lab.mjs http://127.0.0.1:3100 3` and `node scripts/screenshots.mjs http://127.0.0.1:3100 docs/design/screenshots/after` (on Git Bash set `MSYS_NO_PATHCONV=1` when passing `/route/` arguments).

## Repo notes
- Files use CRLF line endings; multi-line scripted edits must normalise line endings.
- The owner may run `next dev` on port 3000 in this folder; don't kill it. Use a production build on another port for checks.
- Supabase: from 2026-10-30, new tables in `public` get no Data API access by default. Every migration that creates a `public` table or view must grant access in the same file (e.g. `grant select on public.x to anon;` and `grant select, insert, update, delete on public.x to authenticated, service_role;`, or only `service_role` for server-only tables), keep RLS on, and add policies.
- Admin is calmer and utilitarian (`styles/admin-*.css`); don't apply the public brand there.
