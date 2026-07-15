-- Damtech Admin Phase 2 — customers, RFQs, pricing library, draft quotes, RLS

-- ---------------------------------------------------------------------------
-- Sequences / helpers
-- ---------------------------------------------------------------------------

create table public.rfq_number_sequences (
  year integer primary key,
  last_value integer not null default 0
);

create or replace function public.next_rfq_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y integer := extract(year from timezone('Africa/Johannesburg', now()))::integer;
  n integer;
begin
  insert into public.rfq_number_sequences as seq (year, last_value)
  values (y, 1)
  on conflict (year) do update
    set last_value = seq.last_value + 1
  returning last_value into n;

  return 'RFQ-' || y::text || '-' || lpad(n::text, 5, '0');
end;
$$;

revoke all on function public.next_rfq_number() from public;
grant execute on function public.next_rfq_number() to service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_type text not null default 'individual',
  name text not null,
  company_name text,
  email text,
  phone text,
  vat_number text,
  registration_number text,
  billing_address jsonb,
  site_address jsonb,
  province text,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_email_idx on public.customers (lower(email));
create index customers_phone_idx on public.customers (phone);
create index customers_name_idx on public.customers (lower(name));
create index customers_company_idx on public.customers (lower(company_name));

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Quotes foundation (Phase 2 convert target; Phase 3 expands)
-- ---------------------------------------------------------------------------

create type public.quote_status as enum (
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
  'cancelled'
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  status public.quote_status not null default 'draft',
  customer_id uuid references public.customers (id),
  rfq_id uuid,
  title text,
  contact_name text,
  company_name text,
  email text,
  phone text,
  province text,
  project_location text,
  service_required text,
  project_description text,
  calculator_type text,
  calculator_input jsonb,
  calculator_result jsonb,
  line_items jsonb not null default '[]'::jsonb,
  subtotal_ex_vat numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  net_ex_vat numeric(14,2) not null default 0,
  vat_amount numeric(14,2) not null default 0,
  total_inc_vat numeric(14,2) not null default 0,
  markup_percent numeric(7,3),
  gross_margin_percent numeric(7,3),
  vat_rate numeric(7,3),
  validity_days integer not null default 30,
  expires_at timestamptz,
  internal_notes text,
  created_by uuid references auth.users (id),
  assigned_to uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotes_status_idx on public.quotes (status);
create index quotes_customer_idx on public.quotes (customer_id);
create index quotes_rfq_idx on public.quotes (rfq_id);

create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

create table public.quote_number_sequences (
  year integer primary key,
  last_value integer not null default 0
);

create or replace function public.next_quote_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y integer := extract(year from timezone('Africa/Johannesburg', now()))::integer;
  n integer;
begin
  insert into public.quote_number_sequences as seq (year, last_value)
  values (y, 1)
  on conflict (year) do update
    set last_value = seq.last_value + 1
  returning last_value into n;

  return 'Q-' || y::text || '-' || lpad(n::text, 5, '0');
end;
$$;

revoke all on function public.next_quote_number() from public;
grant execute on function public.next_quote_number() to service_role;
grant execute on function public.next_quote_number() to authenticated;

-- ---------------------------------------------------------------------------
-- RFQs
-- ---------------------------------------------------------------------------

create type public.rfq_status as enum (
  'new',
  'reviewing',
  'information_required',
  'ready_for_quote',
  'converted',
  'closed',
  'spam'
);

create table public.rfqs (
  id uuid primary key default gen_random_uuid(),
  rfq_number text not null unique,
  status public.rfq_status not null default 'new',
  source text not null default 'website',
  source_page text,
  customer_id uuid references public.customers (id),
  contact_name text not null,
  company_name text,
  email text,
  phone text,
  province text,
  project_location text,
  service_required text,
  project_description text,
  approximate_project_size text,
  preferred_contact_method text,
  calculator_type text,
  calculator_input jsonb,
  calculator_result jsonb,
  internal_notes text,
  assigned_to uuid references auth.users (id),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  converted_quote_id uuid references public.quotes (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quotes
  add constraint quotes_rfq_id_fkey
  foreign key (rfq_id) references public.rfqs (id);

create index rfqs_status_idx on public.rfqs (status);
create index rfqs_submitted_at_idx on public.rfqs (submitted_at desc);
create index rfqs_customer_idx on public.rfqs (customer_id);
create index rfqs_assigned_idx on public.rfqs (assigned_to);
create index rfqs_service_idx on public.rfqs (service_required);
create index rfqs_province_idx on public.rfqs (province);
create index rfqs_search_email_idx on public.rfqs (lower(email));
create index rfqs_search_company_idx on public.rfqs (lower(company_name));

create trigger rfqs_set_updated_at
before update on public.rfqs
for each row execute function public.set_updated_at();

create table public.rfq_attachments (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  uploaded_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index rfq_attachments_rfq_idx on public.rfq_attachments (rfq_id);

create table public.rfq_events (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs (id) on delete cascade,
  actor_user_id uuid references auth.users (id),
  actor_email text,
  event_type text not null,
  message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index rfq_events_rfq_idx on public.rfq_events (rfq_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Pricing library
-- ---------------------------------------------------------------------------

create table public.material_items (
  id uuid primary key default gen_random_uuid(),
  item_code text not null unique,
  category text not null,
  name text not null,
  description text,
  unit text not null,
  default_cost numeric(14,2) not null default 0,
  default_sell_price numeric(14,2),
  waste_percent numeric(7,3) not null default 0,
  is_active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index material_items_category_idx on public.material_items (category);
create index material_items_active_idx on public.material_items (is_active);

create trigger material_items_set_updated_at
before update on public.material_items
for each row execute function public.set_updated_at();

create table public.labour_items (
  id uuid primary key default gen_random_uuid(),
  item_code text not null unique,
  category text not null,
  name text not null,
  unit text not null,
  hourly_cost numeric(14,2),
  unit_cost numeric(14,2),
  productivity_rate numeric(14,4),
  productivity_unit text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index labour_items_category_idx on public.labour_items (category);
create index labour_items_active_idx on public.labour_items (is_active);

create trigger labour_items_set_updated_at
before update on public.labour_items
for each row execute function public.set_updated_at();

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  payment_terms text,
  lead_time_days integer,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

create table public.supplier_prices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  material_item_id uuid not null references public.material_items (id),
  supplier_sku text,
  unit_cost numeric(14,2) not null,
  currency text not null default 'ZAR',
  minimum_quantity numeric(14,3),
  price_valid_from date,
  price_valid_to date,
  lead_time_days integer,
  is_preferred boolean not null default false,
  quote_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index supplier_prices_material_idx on public.supplier_prices (material_item_id);
create index supplier_prices_supplier_idx on public.supplier_prices (supplier_id);
create index supplier_prices_valid_to_idx on public.supplier_prices (price_valid_to);

create trigger supplier_prices_set_updated_at
before update on public.supplier_prices
for each row execute function public.set_updated_at();

create table public.estimating_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  description text,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

-- Seed default estimating settings
insert into public.estimating_settings (setting_key, setting_value, description) values
  ('default_markup_percent', '25', 'Default markup % applied to direct cost'),
  ('default_gross_margin_percent', '20', 'Default target gross margin %'),
  ('vat_rate_percent', '15', 'South Africa VAT rate percent'),
  ('liner_waste_percent', '10', 'Default liner waste/overlap percent'),
  ('welding_overlap_percent', '5', 'Welding overlap allowance percent'),
  ('anchor_trench_allowance_m2_per_m', '1.2', 'Anchor trench m² per perimeter metre'),
  ('labour_burden_percent', '15', 'Labour burden/overhead percent'),
  ('contingency_percent', '5', 'Contingency percent on direct cost'),
  ('travel_rate_per_km', '8.50', 'Travel rate ZAR per km'),
  ('delivery_rate_per_km', '12.00', 'Delivery rate ZAR per km'),
  ('minimum_charge', '3500', 'Minimum quote charge ex VAT (ZAR)'),
  ('quote_validity_days', '30', 'Default quote validity in days');

-- ---------------------------------------------------------------------------
-- Storage bucket (private) for RFQ attachments
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rfq-attachments',
  'rfq-attachments',
  false,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.customers enable row level security;
alter table public.rfqs enable row level security;
alter table public.rfq_attachments enable row level security;
alter table public.rfq_events enable row level security;
alter table public.quotes enable row level security;
alter table public.material_items enable row level security;
alter table public.labour_items enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_prices enable row level security;
alter table public.estimating_settings enable row level security;
alter table public.rfq_number_sequences enable row level security;
alter table public.quote_number_sequences enable row level security;

-- No anon policies → public cannot read admin tables.

-- Customers
create policy customers_select_staff on public.customers
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));

create policy customers_write_staff on public.customers
for all to authenticated
using (public.has_admin_role(array['owner','admin','sales']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','sales']::public.admin_role[]));

-- RFQs
create policy rfqs_select_staff on public.rfqs
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));

create policy rfqs_write_staff on public.rfqs
for all to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]));

create policy rfq_attachments_select_staff on public.rfq_attachments
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));

create policy rfq_attachments_write_staff on public.rfq_attachments
for all to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]));

create policy rfq_events_select_staff on public.rfq_events
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));

create policy rfq_events_insert_staff on public.rfq_events
for insert to authenticated
with check (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]));

-- Quotes
create policy quotes_select_staff on public.quotes
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));

create policy quotes_write_staff on public.quotes
for all to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]));

-- Pricing — viewers/estimators can read; write restricted
create policy materials_select_pricing on public.material_items
for select to authenticated
using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));

create policy materials_write_pricing on public.material_items
for all to authenticated
using (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]));

create policy labour_select_pricing on public.labour_items
for select to authenticated
using (public.has_admin_role(array['owner','admin','estimator','viewer']::public.admin_role[]));

create policy labour_write_pricing on public.labour_items
for all to authenticated
using (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]));

create policy suppliers_select_pricing on public.suppliers
for select to authenticated
using (public.has_admin_role(array['owner','admin','estimator','viewer']::public.admin_role[]));

create policy suppliers_write_pricing on public.suppliers
for all to authenticated
using (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]));

-- Supplier unit costs: sales excluded from cost visibility
create policy supplier_prices_select_costs on public.supplier_prices
for select to authenticated
using (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]));

create policy supplier_prices_write_costs on public.supplier_prices
for all to authenticated
using (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]));

-- Estimating settings: owners/admins write; estimators read
create policy estimating_settings_select on public.estimating_settings
for select to authenticated
using (public.has_admin_role(array['owner','admin','estimator']::public.admin_role[]));

create policy estimating_settings_write on public.estimating_settings
for all to authenticated
using (public.has_admin_role(array['owner','admin']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin']::public.admin_role[]));

-- Sequences: no authenticated access (service role only)
create policy rfq_seq_deny on public.rfq_number_sequences
for all to authenticated using (false) with check (false);

create policy quote_seq_deny on public.quote_number_sequences
for all to authenticated using (false) with check (false);

-- Storage policies for rfq-attachments
create policy rfq_attachments_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'rfq-attachments'
  and public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[])
);

create policy rfq_attachments_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'rfq-attachments'
  and public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[])
);

create policy rfq_attachments_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'rfq-attachments'
  and public.has_admin_role(array['owner','admin']::public.admin_role[])
);

-- Grant next_rfq_number to authenticated for rare admin tooling is NOT needed —
-- public RFQ creation always uses service role.
grant execute on function public.next_rfq_number() to authenticated;
