-- =============================================================================
-- Damtech RFQ — assets + calculator support (optional detailed path)
-- Apply AFTER: 20260715120000, 20260715140000, 20260715160000, 20260715160100
--
-- Purpose:
--   Keep multi-asset calculation capability for CALCULATOR quote-preparation
--   and admin enrichment. Simple /quote/ submissions do NOT require assets.
-- =============================================================================

create type public.rfq_asset_type as enum (
  'earth_dam',
  'circular_open_reservoir',
  'corrugated_steel_tank',
  'concrete_rectangular_reservoir',
  'concrete_circular_reservoir',
  'existing_liner_repair',
  'torch_on',
  'other'
);

create type public.measurement_method as enum (
  'known_total_area',
  'dimensions',
  'separate_areas',
  'known_capacity',
  'catalogue_selection',
  'drawings',
  'site_measurement_required',
  'not_provided'
);

-- Project fields used by calculator quote-preparation (and admin enrichment)
alter table public.rfqs
  add column if not exists farm_project_name text,
  add column if not exists address_line text,
  add column if not exists town text,
  add column if not exists postal_code text,
  add column if not exists gps_lat numeric(10,7),
  add column if not exists gps_lng numeric(10,7),
  add column if not exists maps_link text,
  add column if not exists access_notes text,
  add column if not exists distance_from_town_km numeric(10,2),
  add column if not exists site_conditions jsonb not null default '{}'::jsonb,
  add column if not exists services_requested text[] not null default '{}'::text[],
  add column if not exists vat_number text,
  add column if not exists company_registration text,
  add column if not exists alternative_phone text,
  add column if not exists public_upload_token_hash text,
  add column if not exists public_upload_token_expires_at timestamptz,
  add column if not exists submission_payload jsonb;

create index if not exists rfqs_upload_token_idx
  on public.rfqs (public_upload_token_hash)
  where public_upload_token_hash is not null;

-- Assets exist for calculator_quote_preparation and admin-added details.
-- Simple public RFQs legitimately have zero rows here.
create table if not exists public.rfq_assets (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs (id) on delete cascade,
  asset_sequence integer not null,
  asset_name text not null,
  asset_type public.rfq_asset_type not null,
  quantity integer not null default 1 check (quantity > 0),
  measurement_method public.measurement_method not null default 'not_provided',
  material_preference text,
  -- customer_estimate | calculated_estimate | information_not_yet_confirmed |
  -- drawing_received | site_measurement_required | under_review |
  -- confirmed_for_quote | superseded | admin_added
  measurement_status text not null default 'information_not_yet_confirmed',
  raw_inputs jsonb not null default '{}'::jsonb,
  calculated_outputs jsonb not null default '{}'::jsonb,
  calculation_version text,
  calculation_warnings jsonb not null default '[]'::jsonb,
  site_conditions jsonb not null default '{}'::jsonb,
  estimator_confirmed boolean not null default false,
  estimator_confirmed_by uuid references auth.users (id),
  estimator_confirmed_at timestamptz,
  estimator_override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rfq_id, asset_sequence)
);

create index if not exists rfq_assets_rfq_idx on public.rfq_assets (rfq_id);
create index if not exists rfq_assets_measurement_status_idx
  on public.rfq_assets (measurement_status);

drop trigger if exists rfq_assets_set_updated_at on public.rfq_assets;
create trigger rfq_assets_set_updated_at
before update on public.rfq_assets
for each row execute function public.set_updated_at();

-- Calculation snapshots (public calc + estimator overrides). Never delete history.
create table if not exists public.rfq_asset_calculations (
  id uuid primary key default gen_random_uuid(),
  rfq_asset_id uuid not null references public.rfq_assets (id) on delete cascade,
  calculation_type text not null,
  calculation_version text not null,
  inputs jsonb not null,
  outputs jsonb not null,
  assumptions jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  actor_type text not null default 'public',
  actor_user_id uuid references auth.users (id),
  calculated_at timestamptz not null default now()
);

create index if not exists rfq_asset_calc_asset_idx
  on public.rfq_asset_calculations (rfq_asset_id, calculated_at desc);

alter table public.rfq_attachments
  add column if not exists rfq_asset_id uuid references public.rfq_assets (id) on delete set null,
  add column if not exists category text,
  add column if not exists uploaded_via text not null default 'admin';

create table if not exists public.tank_models (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers (id),
  model_code text not null,
  model_name text,
  nominal_capacity_kl numeric(14,3) not null,
  internal_diameter_m numeric(10,3) not null,
  shell_height_m numeric(10,3) not null,
  usable_capacity_kl numeric(14,3),
  ring_count integer,
  liner_type text,
  base_price numeric(14,2),
  installation_price numeric(14,2),
  valid_from date,
  valid_to date,
  is_active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_code)
);

drop trigger if exists tank_models_set_updated_at on public.tank_models;
create trigger tank_models_set_updated_at
before update on public.tank_models
for each row execute function public.set_updated_at();

alter table public.rfq_assets enable row level security;
alter table public.rfq_asset_calculations enable row level security;
alter table public.tank_models enable row level security;

drop policy if exists rfq_assets_select_staff on public.rfq_assets;
create policy rfq_assets_select_staff on public.rfq_assets
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));

drop policy if exists rfq_assets_write_staff on public.rfq_assets;
create policy rfq_assets_write_staff on public.rfq_assets
for all to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]));

drop policy if exists rfq_asset_calc_select_staff on public.rfq_asset_calculations;
create policy rfq_asset_calc_select_staff on public.rfq_asset_calculations
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));

drop policy if exists rfq_asset_calc_write_staff on public.rfq_asset_calculations;
create policy rfq_asset_calc_write_staff on public.rfq_asset_calculations
for all to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]));

drop policy if exists tank_models_select_staff on public.tank_models;
create policy tank_models_select_staff on public.tank_models
for select to authenticated
using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));

drop policy if exists tank_models_write_staff on public.tank_models;
create policy tank_models_write_staff on public.tank_models
for all to authenticated
using (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]));

comment on table public.rfq_assets is
  'Optional structured assets. Required for calculator_quote_preparation; usually empty for simple_public_rfq.';
