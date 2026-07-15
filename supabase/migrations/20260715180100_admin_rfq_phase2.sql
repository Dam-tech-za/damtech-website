-- =============================================================================
-- Damtech RFQ — simple public RFQ fields + admin enrichment
-- Apply AFTER: 20260715180000_admin_rfq_phase2_enum.sql (separate transaction)
--
-- Architecture:
--   /quote/                         → source = simple_public_rfq
--   /calculators/quote-preparation/ → source = calculator_quote_preparation
--   /contact/                       → source = contact_enquiry (or similar)
--   Admin-created                   → source = admin_created
--
-- Simple RFQs are first-class leads. Zero assets is valid.
-- Estimators enrich later via assets / confirmed quantities / info requests.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Header-level measurement + simple-enquiry fields
-- ---------------------------------------------------------------------------

alter table public.rfqs
  -- Overall measurement posture (distinct from per-asset measurement_status)
  add column if not exists measurement_status text not null
    default 'information_not_yet_confirmed',
  -- Keep original customer size wording forever (never overwrite with parsed nums)
  add column if not exists approximate_project_size_text text,
  -- Soft parses only — never treat as confirmed quote quantities
  add column if not exists estimated_area_m2 numeric(14,4),
  add column if not exists estimated_capacity_kl numeric(14,4),
  add column if not exists estimated_diameter_m numeric(10,3),
  add column if not exists estimated_height_m numeric(10,3),
  add column if not exists material_preference text,
  add column if not exists number_of_assets_estimate integer
    check (number_of_assets_estimate is null or number_of_assets_estimate >= 1),
  add column if not exists preferred_timeframe text,
  -- Lightweight service-specific optional fields from simple form
  -- e.g. { damType, liningAreaValue, liningAreaUnit, tankCapacityKl, ... }
  add column if not exists simple_service_fields jsonb not null default '{}'::jsonb,
  add column if not exists has_calculator_data boolean not null default false,
  add column if not exists enquiry_channel text
    check (
      enquiry_channel is null
      or enquiry_channel in (
        'simple_public_rfq',
        'calculator_quote_preparation',
        'contact_enquiry',
        'admin_created',
        'other'
      )
    );

-- Backfill approximate_project_size_text from legacy approximate_project_size
update public.rfqs
set approximate_project_size_text = approximate_project_size
where approximate_project_size_text is null
  and approximate_project_size is not null
  and approximate_project_size <> '';

create index if not exists rfqs_measurement_status_idx
  on public.rfqs (measurement_status);
create index if not exists rfqs_enquiry_channel_idx
  on public.rfqs (enquiry_channel);
create index if not exists rfqs_has_calculator_idx
  on public.rfqs (has_calculator_data)
  where has_calculator_data = true;

comment on column public.rfqs.measurement_status is
  'Header measurement posture. Simple RFQs default to information_not_yet_confirmed.';
comment on column public.rfqs.approximate_project_size_text is
  'Exact customer-entered size wording. Prefer this over estimated_* for display.';
comment on column public.rfqs.estimated_area_m2 is
  'Optional soft parse from size text — not confirmed and not for silent quoting.';
comment on column public.rfqs.enquiry_channel is
  'Normalised source badge: simple_public_rfq | calculator_quote_preparation | contact_enquiry | admin_created.';

-- ---------------------------------------------------------------------------
-- Site measurement scheduling (admin) — calendar-ready, no full calendar yet
-- ---------------------------------------------------------------------------

alter table public.rfqs
  add column if not exists site_measurement_required boolean not null default false,
  add column if not exists measurement_proposed_date date,
  add column if not exists measurement_confirmed_date date,
  add column if not exists measurement_assigned_to uuid references auth.users (id),
  add column if not exists measurement_travel_km numeric(10,2),
  add column if not exists measurement_customer_confirmed boolean not null default false,
  add column if not exists measurement_notes text,
  add column if not exists measurement_report_attachment_id uuid
    references public.rfq_attachments (id);

-- ---------------------------------------------------------------------------
-- Estimator-confirmed quantities on assets (separate from public calc outputs)
-- ---------------------------------------------------------------------------

alter table public.rfq_assets
  add column if not exists confirmed_installation_area_m2 numeric(14,4),
  add column if not exists confirmed_material_area_m2 numeric(14,4),
  add column if not exists confirmed_geotextile_area_m2 numeric(14,4),
  add column if not exists confirmed_surface_prep_area_m2 numeric(14,4),
  add column if not exists confirmed_anchor_area_m2 numeric(14,4),
  add column if not exists confirmed_volume_m3 numeric(14,4),
  add column if not exists confirmed_capacity_kl numeric(14,4),
  add column if not exists confirmed_overlap_percent numeric(7,3),
  add column if not exists confirmed_waste_percent numeric(7,3),
  add column if not exists confirmed_roll_qty numeric(14,2),
  add column if not exists estimator_notes text,
  add column if not exists price_gaps jsonb not null default '[]'::jsonb,
  add column if not exists created_via text not null default 'public'
    check (created_via in ('public', 'admin', 'customer_enrichment', 'info_response'));

-- ---------------------------------------------------------------------------
-- Tokenised customer information requests (works for simple + detailed RFQs)
-- ---------------------------------------------------------------------------

create table if not exists public.rfq_information_requests (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs (id) on delete cascade,
  rfq_asset_id uuid references public.rfq_assets (id) on delete set null,
  token_hash text not null unique,
  token_expires_at timestamptz not null,
  status text not null default 'open'
    check (status in ('open', 'answered', 'cancelled', 'expired')),
  requested_fields jsonb not null default '[]'::jsonb,
  message text,
  response_payload jsonb,
  created_by uuid references auth.users (id),
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rfq_info_req_rfq_idx
  on public.rfq_information_requests (rfq_id, created_at desc);
create index if not exists rfq_info_req_token_idx
  on public.rfq_information_requests (token_hash)
  where status = 'open';

drop trigger if exists rfq_info_req_set_updated_at on public.rfq_information_requests;
create trigger rfq_info_req_set_updated_at
before update on public.rfq_information_requests
for each row execute function public.set_updated_at();

alter table public.rfq_information_requests enable row level security;

drop policy if exists rfq_info_req_select_staff on public.rfq_information_requests;
create policy rfq_info_req_select_staff on public.rfq_information_requests
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));

drop policy if exists rfq_info_req_write_staff on public.rfq_information_requests;
create policy rfq_info_req_write_staff on public.rfq_information_requests
for all to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]));

-- ---------------------------------------------------------------------------
-- Calculator quote-preparation draft (server-side; not URL-editable)
-- ---------------------------------------------------------------------------

create table if not exists public.calculator_quote_drafts (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  calculator_type text not null,
  inputs jsonb not null default '{}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists calculator_quote_drafts_expiry_idx
  on public.calculator_quote_drafts (expires_at)
  where consumed_at is null;

alter table public.calculator_quote_drafts enable row level security;

-- No authenticated policies: service role only (public never reads drafts table).
drop policy if exists calculator_quote_drafts_deny on public.calculator_quote_drafts;
create policy calculator_quote_drafts_deny on public.calculator_quote_drafts
for all to authenticated
using (false)
with check (false);

comment on table public.calculator_quote_drafts is
  'Server-side bridge from calculator results → /calculators/quote-preparation/. Token hash only.';

-- ---------------------------------------------------------------------------
-- Estimating seeds (suggestion defaults — not historical quote prices)
-- ---------------------------------------------------------------------------

insert into public.estimating_settings (setting_key, setting_value, description)
values
  ('site_establishment_minimum', '3500'::jsonb, 'Default site establishment minimum (ZAR)'),
  ('hdpe_geotextile_waste_percent', '5'::jsonb, 'Geotextile waste percent'),
  ('torch_on_overlap_percent', '8'::jsonb, 'Torch-on overlap percent'),
  ('torch_on_waste_percent', '5'::jsonb, 'Torch-on waste percent')
on conflict (setting_key) do nothing;
