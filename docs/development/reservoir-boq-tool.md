# Reservoir BOQ tool (admin)

Page: `/admin/operations/reservoir-boq/` (Projects section, tab "Reservoir BOQ"). Pick size type, diameter, height (three standard heights or custom), roof or no roof and liner, then **Calculate**. The page shows:

1. the bill of quantities (wall sheets per ring with cut lengths, bolts, fittings, liner, roof sheet and screws, and with a roof the raw steel as 6 m lengths),
2. the roof steel cutting list and a roof-sheet cutting guide,
3. a line sketch of the trusses (plan, one elevation per different truss, rib-height table); the members of each truss sit behind an info icon on screen and print as a table beside the truss,
4. **Print Design**, which opens the browser print window; "Save as PDF" gives the PDF (A4 landscape print layout in `styles/admin-reservoir-boq.css`).

## Where the numbers come from

The website does **not** calculate the design. It reads rows from the Supabase table `public.reservoir_designs`, written by the DamTech pricing calculator in the `damtech-ai-operations` repository (`docs/website-boq-tool/export_designs.py`, parameter file r14: truss ribs and diagonals in angle L 25x25x2.5, with L 25x25x2 shown in brackets as the stand-in). Row keys:

| Key | Content |
|---|---|
| `settings` | constants: ring height, sheet cover, waste, stock bar length, list of diameters and rings, standard sizes |
| `wall:<D>:<rings>:<0 or 1 roofed>` | gauge, sheets, cut length, bolt lines and end lap per ring; wind rings |
| `roof:<D>` | trusses, chords, ribs, diagonals, ties, bolts and the truss table |

Diameters run from 3 m to 17 m in 0.5 m steps, rings 1 to 5. A diameter between two steps uses the design of the next 0.5 m size up; the sheet cut lengths follow the diameter typed.

## Files

| File | Purpose |
|---|---|
| `supabase/migrations/20261110090000_reservoir_designs.sql` | table (RLS on, service role only) |
| `supabase/migrations/20261110090100_reservoir_designs_seed.sql` | the 320 design rows, r13 (upserts, safe to re-run) |
| `supabase/migrations/20261110120000_reservoir_designs_r14.sql` | the same 320 rows on r14; **run this one to update a database already loaded with r13** |
| `lib/reservoir-boq/boq.ts` | pure BOQ logic: order lines, 6 m bar packing, sheet cutting guide |
| `lib/reservoir-boq/boq.test.ts`, `fixture.json` | unit tests against calculator output |
| `lib/reservoir-boq/store.ts` | reads the rows |
| `app/admin/operations/reservoir-boq/page.tsx` | the page (server component, GET form) |
| `components/admin/operations/reservoir-boq/*` | form, result, truss sketch (SVG), print button |
| `styles/admin-reservoir-boq.css` | screen and print styles (imported in `app/globals.css`) |
| `lib/auth/types.ts`, `lib/auth/permissions.ts`, `lib/admin/navigation.ts` | new nav item `reservoir-boq` |

## To switch it on (steps for the assistant that pushes and connects Supabase)

Work on branch `feat/admin-reservoir-boq`.

1. `git fetch origin && git checkout feat/admin-reservoir-boq`
2. `npm install`
3. Apply the two migrations to the website's Supabase project ("Damtech Admin", ref `ziyjuftbbrjqerjlitav`), in order. Both are additive and safe to re-run:
   - `supabase/migrations/20261110090000_reservoir_designs.sql`
   - `supabase/migrations/20261110090100_reservoir_designs_seed.sql` (about 630 KB)
   With the Supabase CLI: `supabase db push`. Or paste each file into the SQL editor.
4. Check the rows: `select kind, count(*) from public.reservoir_designs group by kind;` must give settings 1, wall 290, roof 29.
5. Checks: `npx tsc --noEmit && npm run lint && npm test && npm run build`.
6. Run the site, sign in to the admin, open `/admin/operations/reservoir-boq/`, choose 9 m, 2.286 m, Roof, Calculate. Expect 10 sheets per ring (ring 1 at 2.978 m, rings 2 and 3 at 2.928 m), 1 078 seam bolts, liner 143.6 m2, 5 trusses, 251 kg to galvanise, ribs and diagonals "L 25x25x2.5 (L 25x25x2 where it is not available)". Press Print Design and save the PDF.
7. Open a pull request into `main`; deploy only on the owner's go-ahead.

Until step 3 is done the page shows "The reservoir designs are not loaded yet" and nothing else is affected.

## When the design changes

In `damtech-ai-operations`, after a parameter change: `PYTHONPATH=. python docs/website-boq-tool/export_designs.py`. Copy the new `reservoir_designs_seed.sql` over the seed migration under a new timestamped file name (or run it in the SQL editor), and copy `reservoir_designs_fixture.json` to `lib/reservoir-boq/fixture.json`; update the expected numbers in `boq.test.ts` if they moved.

## Limits

- Standard roof only (0.25 kPa uplift). The high-strength roof is not in the table.
- Quantities are for ordering; they do not replace the engineer's sign-off.
- Not priced: ridge cap along the centre truss. Bar counts assume 6 m stock and no cutting allowance beyond offcuts.
