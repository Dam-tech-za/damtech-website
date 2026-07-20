-- Unified pricing & inventory catalogue (extends existing material/labour tables)
-- Idempotent: safe to re-run after a partial apply.

do $$ begin
  create type public.pricing_item_type as enum (
    'material',
    'installation_service',
    'labour',
    'travel',
    'delivery',
    'equipment',
    'site_establishment',
    'tank_model',
    'subcontractor',
    'allowance',
    'fixed_price',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.pricing_method as enum (
    'unit_rate',
    'fixed_price',
    'calculated_consumption',
    'labour_productivity',
    'travel_calculation',
    'supplier_price',
    'manual'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.pricing_items (
  id uuid primary key default gen_random_uuid(),
  item_code text not null unique,
  item_type public.pricing_item_type not null,
  category text not null,
  name text not null,
  short_description text,
  quote_description text,
  internal_description text,

  purchase_unit text,
  quote_unit text not null,
  conversion_factor numeric(18, 6) not null default 1,

  default_cost numeric(14, 4),
  default_sell_price numeric(14, 4),
  pricing_method public.pricing_method not null default 'unit_rate',

  default_markup_percent numeric(8, 3),
  target_margin_percent numeric(8, 3),
  minimum_sell_price numeric(14, 4),

  tax_category text not null default 'standard',
  waste_percent numeric(8, 3) not null default 0,
  overlap_percent numeric(8, 3) not null default 0,

  coverage_rate numeric(18, 6),
  coverage_unit text,
  productivity_rate numeric(18, 6),
  productivity_unit text,

  supplier_id uuid references public.suppliers (id),
  preferred_supplier_price_id uuid references public.supplier_prices (id),

  price_valid_from date,
  price_valid_to date,

  is_active boolean not null default true,
  requires_manual_quantity_confirmation boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,

  legacy_material_item_id uuid references public.material_items (id),
  legacy_labour_item_id uuid references public.labour_items (id),
  legacy_tank_model_id uuid references public.tank_models (id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_items_type_idx on public.pricing_items (item_type);
create index if not exists pricing_items_category_idx on public.pricing_items (category);
create index if not exists pricing_items_active_idx on public.pricing_items (is_active);
create index if not exists pricing_items_legacy_material_idx on public.pricing_items (legacy_material_item_id);
create index if not exists pricing_items_legacy_labour_idx on public.pricing_items (legacy_labour_item_id);

drop trigger if exists pricing_items_set_updated_at on public.pricing_items;
create trigger pricing_items_set_updated_at
before update on public.pricing_items
for each row execute function public.set_updated_at();

create table if not exists public.pricing_item_prices (
  id uuid primary key default gen_random_uuid(),
  pricing_item_id uuid not null references public.pricing_items (id) on delete cascade,
  supplier_id uuid references public.suppliers (id),

  cost_price numeric(14, 4),
  sell_price numeric(14, 4),
  currency text not null default 'ZAR',

  valid_from date not null,
  valid_to date,
  source_type text not null,
  source_reference text,
  is_preferred boolean not null default false,

  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists pricing_item_prices_item_idx on public.pricing_item_prices (pricing_item_id);
create index if not exists pricing_item_prices_valid_idx on public.pricing_item_prices (valid_from, valid_to);

alter table public.quote_line_items
  add column if not exists source_pricing_item_id uuid references public.pricing_items (id);

alter table public.supplier_prices
  add column if not exists pricing_item_id uuid references public.pricing_items (id);

-- Backfill materials
insert into public.pricing_items (
  item_code,
  item_type,
  category,
  name,
  short_description,
  quote_description,
  purchase_unit,
  quote_unit,
  conversion_factor,
  default_cost,
  default_sell_price,
  waste_percent,
  tax_category,
  legacy_material_item_id,
  metadata
)
select
  m.item_code,
  'material'::public.pricing_item_type,
  m.category,
  m.name,
  m.description,
  coalesce(m.description, m.name),
  coalesce((m.metadata ->> 'purchase_unit'), m.unit),
  case when m.unit in ('m2', 'm²') then 'm²' else m.unit end,
  coalesce((m.metadata ->> 'conversion_factor')::numeric, 1),
  m.default_cost,
  m.default_sell_price,
  coalesce(m.waste_percent, 0),
  coalesce(m.metadata ->> 'tax_category', 'standard'),
  m.id,
  coalesce(m.metadata, '{}'::jsonb)
from public.material_items m
on conflict (item_code) do nothing;

-- Backfill labour as installation_service or labour type
insert into public.pricing_items (
  item_code,
  item_type,
  category,
  name,
  quote_unit,
  conversion_factor,
  default_cost,
  default_sell_price,
  pricing_method,
  productivity_rate,
  productivity_unit,
  legacy_labour_item_id,
  metadata
)
select
  l.item_code,
  case
    when l.category ilike '%install%' then 'installation_service'::public.pricing_item_type
    else 'labour'::public.pricing_item_type
  end,
  l.category,
  l.name,
  case when l.unit in ('m2', 'm²') then 'm²' else l.unit end,
  1,
  coalesce(l.unit_cost, l.hourly_cost),
  null,
  case when l.productivity_rate is not null then 'labour_productivity'::public.pricing_method else 'unit_rate'::public.pricing_method end,
  l.productivity_rate,
  l.productivity_unit,
  l.id,
  jsonb_build_object('notes', l.notes, 'hourly_cost', l.hourly_cost, 'unit_cost', l.unit_cost)
from public.labour_items l
on conflict (item_code) do nothing;

-- Link supplier prices to pricing items
update public.supplier_prices sp
set pricing_item_id = pi.id
from public.pricing_items pi
where pi.legacy_material_item_id = sp.material_item_id
  and sp.pricing_item_id is null;

-- RLS: mirror material_items visibility for estimators
alter table public.pricing_items enable row level security;
alter table public.pricing_item_prices enable row level security;

drop policy if exists pricing_items_select_authenticated on public.pricing_items;
create policy pricing_items_select_authenticated
  on public.pricing_items for select
  to authenticated
  using (true);

drop policy if exists pricing_item_prices_select_authenticated on public.pricing_item_prices;
create policy pricing_item_prices_select_authenticated
  on public.pricing_item_prices for select
  to authenticated
  using (true);

grant select on public.pricing_items to authenticated;
grant select on public.pricing_item_prices to authenticated;
