-- Tank Models CSV import: extend catalogue, add versioned pricing, audit links.
-- Idempotent and safe to re-run.

-- 1. Extend tank_models with structural, geometry, fitting and supplier fields.
alter table public.tank_models
  add column if not exists supplier_model_code text,
  add column if not exists lead_time_days integer,
  add column if not exists default_inlet_mm integer,
  add column if not exists default_outlet_mm integer,
  add column if not exists default_overflow_mm integer,
  add column if not exists default_drain_mm integer,
  add column if not exists wall_area_m2 numeric(14,3),
  add column if not exists floor_area_m2 numeric(14,3),
  add column if not exists liner_area_m2 numeric(14,3),
  add column if not exists confidence text,
  add column if not exists requires_manual_confirmation boolean not null default false;

-- 2. Versioned tank pricing (price history). Steel structure and PVC liner are
--    stored separately, alongside optional roof / foundation / installation.
create table if not exists public.tank_model_prices (
  id uuid primary key default gen_random_uuid(),
  tank_model_id uuid not null references public.tank_models (id) on delete cascade,
  steel_tank_cost_ex_vat_zar numeric(14,2),
  steel_tank_sell_ex_vat_zar numeric(14,2),
  pvc_liner_cost_ex_vat_zar numeric(14,2),
  pvc_liner_sell_ex_vat_zar numeric(14,2),
  roof_included boolean not null default false,
  roof_sell_ex_vat_zar numeric(14,2),
  foundation_included boolean not null default false,
  foundation_sell_ex_vat_zar numeric(14,2),
  installation_included boolean not null default false,
  installation_sell_ex_vat_zar numeric(14,2),
  total_sell_ex_vat_zar numeric(14,2),
  valid_from date,
  valid_to date,
  price_date date,
  confidence text,
  requires_manual_confirmation boolean not null default false,
  is_current boolean not null default true,
  source_reference text,
  source_url text,
  import_batch_id uuid references public.pricing_import_batches (id),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists tank_model_prices_model_idx
  on public.tank_model_prices (tank_model_id, is_current);
create index if not exists tank_model_prices_effective_idx
  on public.tank_model_prices (tank_model_id, valid_from desc);

alter table public.tank_model_prices enable row level security;

drop policy if exists tank_model_prices_select_staff on public.tank_model_prices;
create policy tank_model_prices_select_staff on public.tank_model_prices
for select to authenticated
using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));

drop policy if exists tank_model_prices_write_staff on public.tank_model_prices;
create policy tank_model_prices_write_staff on public.tank_model_prices
for all to authenticated
using (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]));

-- 3. Link import audit rows to created tank records (reuse pricing_import_rows).
alter table public.pricing_import_rows
  add column if not exists tank_model_id uuid references public.tank_models (id),
  add column if not exists tank_model_price_id uuid references public.tank_model_prices (id);

comment on table public.tank_model_prices is
  'Versioned tank pricing (steel structure, PVC liner and optional roof / foundation / installation). Never overwrite history; new imports add versions.';
