-- Reservoir designs for the admin "Reservoir BOQ" tool (/admin/operations/reservoir-boq/).
--
-- One row per design, written by the DamTech pricing calculator
-- (damtech-ai-operations: docs/website-boq-tool/export_designs.py):
--   settings            the constants the BOQ needs (sheet cover, waste, stock bar length ...)
--   wall:<D>:<rings>:<roofed>   gauge, sheets, cut length and bolt lines per ring, wind rings
--   roof:<D>            trusses, chords, ribs, diagonals, ties, bolts and the truss table
-- The website only reads these rows; it never recalculates the design.
--
-- Additive. Server-only: no access for anon or authenticated; the admin page
-- checks the signed-in admin and then reads with the service role, the same
-- pattern as the ops_* tables.
--
-- Rollback: drop table public.reservoir_designs;

create table if not exists public.reservoir_designs (
  design_key text primary key,
  kind text not null check (kind in ('settings', 'wall', 'roof')),
  diameter_m numeric(5, 2),
  rings integer check (rings is null or rings between 1 and 6),
  roofed boolean,
  data jsonb not null,
  parameter_version text not null,
  updated_at timestamptz not null default now()
);

comment on table public.reservoir_designs is
  'Reservoir wall and roof designs from the DamTech calculator, read by the admin Reservoir BOQ tool. Regenerate with export_designs.py; do not edit by hand.';

create index if not exists reservoir_designs_kind_idx on public.reservoir_designs (kind, diameter_m, rings, roofed);

alter table public.reservoir_designs enable row level security;

revoke all on public.reservoir_designs from anon, authenticated;
grant select, insert, update, delete on public.reservoir_designs to service_role;

-- RLS stays on with no policy for anon or authenticated: only the service role reads it.
drop policy if exists reservoir_designs_service_role on public.reservoir_designs;
create policy reservoir_designs_service_role on public.reservoir_designs
  for all to service_role using (true) with check (true);
