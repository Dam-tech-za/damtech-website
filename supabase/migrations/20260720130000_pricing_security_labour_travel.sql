-- Damtech Pricing Phase 2 — security helpers, labour sync, crews, travel, vehicles

-- ---------------------------------------------------------------------------
-- Security helpers (search_path fixed; narrow grants)
-- ---------------------------------------------------------------------------

create or replace function public.can_view_internal_costs()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_admin()
    and public.has_admin_role(
      array['owner', 'admin', 'estimator']::public.admin_role[]
    );
$$;

create or replace function public.can_manage_pricing()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_admin()
    and public.has_admin_role(
      array['owner', 'admin', 'estimator']::public.admin_role[]
    );
$$;

create or replace function public.can_override_price()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_admin()
    and public.has_admin_role(
      array['owner', 'admin', 'estimator']::public.admin_role[]
    );
$$;

revoke all on function public.can_view_internal_costs() from public;
revoke all on function public.can_manage_pricing() from public;
revoke all on function public.can_override_price() from public;

grant execute on function public.can_view_internal_costs() to authenticated;
grant execute on function public.can_manage_pricing() to authenticated;
grant execute on function public.can_override_price() to authenticated;

-- ---------------------------------------------------------------------------
-- Tighten pricing_items / pricing_item_prices RLS
-- ---------------------------------------------------------------------------

drop policy if exists pricing_items_select_authenticated on public.pricing_items;
drop policy if exists pricing_item_prices_select_authenticated on public.pricing_item_prices;

create policy pricing_items_select_staff
  on public.pricing_items for select to authenticated
  using (
    public.has_admin_role(
      array['owner', 'admin', 'estimator', 'viewer', 'sales']::public.admin_role[]
    )
  );

create policy pricing_items_write_staff
  on public.pricing_items for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

create policy pricing_item_prices_select_staff
  on public.pricing_item_prices for select to authenticated
  using (
    case
      when public.can_view_internal_costs() then true
      else false
    end
  );

create policy pricing_item_prices_write_staff
  on public.pricing_item_prices for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

-- Sell-only view for sales/viewer (no cost columns)
create or replace view public.pricing_items_sell_only
with (security_invoker = true)
as
select
  id,
  item_code,
  item_type,
  category,
  name,
  short_description,
  quote_description,
  purchase_unit,
  quote_unit,
  conversion_factor,
  default_sell_price,
  pricing_method,
  tax_category,
  waste_percent,
  overlap_percent,
  coverage_rate,
  coverage_unit,
  productivity_rate,
  productivity_unit,
  price_valid_from,
  price_valid_to,
  is_active,
  requires_manual_quantity_confirmation,
  legacy_material_item_id,
  legacy_labour_item_id,
  legacy_tank_model_id,
  created_at,
  updated_at
from public.pricing_items
where is_active = true;

grant select on public.pricing_items_sell_only to authenticated;

-- Full costing view for authorised roles only (RLS still applies on base table)
create or replace view public.pricing_items_with_costs
with (security_invoker = true)
as
select *
from public.pricing_items;

grant select on public.pricing_items_with_costs to authenticated;

-- ---------------------------------------------------------------------------
-- Labour ↔ catalogue link
-- ---------------------------------------------------------------------------

alter table public.labour_items
  add column if not exists pricing_item_id uuid references public.pricing_items (id);

alter table public.labour_items
  add column if not exists burden_percent numeric(8, 3) not null default 0;

alter table public.labour_items
  add column if not exists overtime_multiplier numeric(8, 3) not null default 1.5;

alter table public.labour_items
  add column if not exists daily_cost numeric(14, 4);

alter table public.labour_items
  add column if not exists travel_hour_cost numeric(14, 4);

alter table public.labour_items
  add column if not exists sell_rate numeric(14, 4);

create index if not exists labour_items_pricing_item_idx
  on public.labour_items (pricing_item_id);

-- Back-link existing catalogue labour rows
update public.labour_items li
set pricing_item_id = pi.id
from public.pricing_items pi
where pi.legacy_labour_item_id = li.id
  and li.pricing_item_id is null;

-- ---------------------------------------------------------------------------
-- Crew templates
-- ---------------------------------------------------------------------------

create table if not exists public.labour_crews (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  productivity_rate numeric(18, 6),
  productivity_unit text,
  minimum_hours numeric(14, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labour_crew_members (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.labour_crews (id) on delete cascade,
  labour_item_id uuid not null references public.labour_items (id),
  quantity numeric(10, 2) not null default 1,
  unique (crew_id, labour_item_id)
);

create trigger labour_crews_set_updated_at
before update on public.labour_crews
for each row execute function public.set_updated_at();

alter table public.labour_crews enable row level security;
alter table public.labour_crew_members enable row level security;

create policy labour_crews_select on public.labour_crews
  for select to authenticated
  using (public.has_admin_role(array['owner','admin','estimator','viewer']::public.admin_role[]));

create policy labour_crews_write on public.labour_crews
  for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

create policy labour_crew_members_select on public.labour_crew_members
  for select to authenticated
  using (public.has_admin_role(array['owner','admin','estimator','viewer']::public.admin_role[]));

create policy labour_crew_members_write on public.labour_crew_members
  for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

grant select on public.labour_crews to authenticated;
grant select on public.labour_crew_members to authenticated;

-- ---------------------------------------------------------------------------
-- Travel vehicles, origins, delivery rules
-- ---------------------------------------------------------------------------

create table if not exists public.travel_vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_code text not null unique,
  vehicle_name text not null,
  vehicle_type text not null default 'Other',
  internal_cost_per_km numeric(14, 4),
  sell_rate_per_km numeric(14, 4) not null default 0,
  base_call_out numeric(14, 4) not null default 0,
  minimum_charge numeric(14, 4) not null default 0,
  trailer_surcharge numeric(14, 4) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.travel_origins (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  province text,
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  default_for_region text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  delivery_type text not null default 'delivery',
  calculation_method text not null default 'per_km',
  fixed_amount numeric(14, 4),
  rate_per_km numeric(14, 4),
  rate_per_load numeric(14, 4),
  minimum_charge numeric(14, 4) not null default 0,
  crane_offloading numeric(14, 4) not null default 0,
  waiting_time_rate numeric(14, 4) not null default 0,
  remote_access_surcharge numeric(14, 4) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger travel_vehicles_set_updated_at
before update on public.travel_vehicles
for each row execute function public.set_updated_at();

create trigger travel_origins_set_updated_at
before update on public.travel_origins
for each row execute function public.set_updated_at();

create trigger delivery_rules_set_updated_at
before update on public.delivery_rules
for each row execute function public.set_updated_at();

alter table public.travel_vehicles enable row level security;
alter table public.travel_origins enable row level security;
alter table public.delivery_rules enable row level security;

create policy travel_vehicles_select on public.travel_vehicles
  for select to authenticated
  using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));
create policy travel_vehicles_write on public.travel_vehicles
  for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

create policy travel_origins_select on public.travel_origins
  for select to authenticated
  using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));
create policy travel_origins_write on public.travel_origins
  for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

create policy delivery_rules_select on public.delivery_rules
  for select to authenticated
  using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));
create policy delivery_rules_write on public.delivery_rules
  for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

grant select on public.travel_vehicles to authenticated;
grant select on public.travel_origins to authenticated;
grant select on public.delivery_rules to authenticated;

-- Seed common origins (idempotent)
insert into public.travel_origins (name, province, default_for_region)
values
  ('Pretoria office', 'Gauteng', 'Gauteng'),
  ('Cape Town office', 'Western Cape', 'Western Cape')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Material technical metadata helper columns (stored in metadata jsonb;
-- optional typed columns for common HDPE fields)
-- ---------------------------------------------------------------------------

alter table public.material_items
  add column if not exists pricing_item_id uuid references public.pricing_items (id);

update public.material_items mi
set pricing_item_id = pi.id
from public.pricing_items pi
where pi.legacy_material_item_id = mi.id
  and mi.pricing_item_id is null;
