-- =============================================================================
-- Damtech Admin Phase 3 — Quote lifecycle
-- Evolves Phase 2 quotes (does NOT recreate quote_status / quotes).
-- Requires 20260715160000_admin_quotes_phase3_enum.sql first.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Evolve quotes table
-- ---------------------------------------------------------------------------
update public.quotes
set title = coalesce(nullif(title, ''), 'Untitled quotation')
where title is null or title = '';

alter table public.quotes
  alter column title set default 'Untitled quotation';

alter table public.quotes
  alter column title set not null;

-- customer_id remains nullable for orphan edge cases; app requires it on create

-- Drop single-column unique; revisions share quote_number
alter table public.quotes drop constraint if exists quotes_quote_number_key;

alter table public.quotes
  add column if not exists revision_number integer not null default 0,
  add column if not exists parent_quote_id uuid references public.quotes (id),
  add column if not exists currency text not null default 'ZAR',
  add column if not exists issue_date date not null default (timezone('Africa/Johannesburg', now()))::date,
  add column if not exists valid_until date,
  add column if not exists project_reference text,
  add column if not exists customer_message text,
  add column if not exists terms_snapshot jsonb,
  add column if not exists company_snapshot jsonb,
  add column if not exists customer_snapshot jsonb,
  add column if not exists calculation_snapshot jsonb,
  add column if not exists public_token_hash text,
  add column if not exists public_token_expires_at timestamptz,
  add column if not exists public_token_revoked_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists first_viewed_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists acceptance_metadata jsonb,
  add column if not exists approved_by uuid references auth.users (id),
  add column if not exists approved_at timestamptz,
  add column if not exists direct_cost numeric(14,2),
  add column if not exists gross_profit numeric(14,2),
  add column if not exists scope_summary text,
  add column if not exists assumptions text,
  add column if not exists exclusions text,
  add column if not exists payment_terms text,
  add column if not exists programme_notes text,
  add column if not exists warranty_wording text,
  add column if not exists deposit_percent numeric(7,3),
  add column if not exists pdf_storage_path text,
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists duplicated_from_quote_id uuid references public.quotes (id),
  add column if not exists revision_reason text,
  add column if not exists is_latest_revision boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Backfill valid_until from expires_at / validity_days
update public.quotes
set valid_until = coalesce(
  valid_until,
  (expires_at at time zone 'Africa/Johannesburg')::date,
  issue_date + make_interval(days => coalesce(validity_days, 30)),
  (timezone('Africa/Johannesburg', now()))::date + 30
)
where valid_until is null;

alter table public.quotes
  alter column valid_until set not null;

-- Map legacy declined → rejected where possible (after enum value exists)
update public.quotes
set status = 'rejected'
where status::text = 'declined';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quotes_number_revision_uq'
  ) then
    alter table public.quotes
      add constraint quotes_number_revision_uq unique (quote_number, revision_number);
  end if;
end $$;

create index if not exists quotes_valid_until_idx on public.quotes (valid_until);
create index if not exists quotes_token_hash_idx on public.quotes (public_token_hash)
  where public_token_hash is not null;
create index if not exists quotes_parent_idx on public.quotes (parent_quote_id);
create index if not exists quotes_latest_idx on public.quotes (is_latest_revision, status);

-- ---------------------------------------------------------------------------
-- Quote line items (normalised)
-- ---------------------------------------------------------------------------
create table if not exists public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  sort_order integer not null default 0,
  line_type text not null default 'item',
  item_code text,
  category text,
  description text not null,
  quantity numeric(14,4) not null default 1,
  unit text not null default 'ea',
  cost_unit_price numeric(14,4),
  sell_unit_price numeric(14,4) not null default 0,
  discount_percent numeric(7,3) not null default 0,
  tax_category text not null default 'standard',
  line_total_ex_vat numeric(14,2) not null default 0,
  metadata jsonb,
  source_material_item_id uuid references public.material_items (id),
  source_labour_item_id uuid references public.labour_items (id),
  source_supplier_price_id uuid references public.supplier_prices (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_line_items_quote_idx
  on public.quote_line_items (quote_id, sort_order);

drop trigger if exists quote_line_items_set_updated_at on public.quote_line_items;
create trigger quote_line_items_set_updated_at
before update on public.quote_line_items
for each row execute function public.set_updated_at();

-- Migrate jsonb line_items → rows (once)
insert into public.quote_line_items (
  quote_id, sort_order, line_type, item_code, category, description,
  quantity, unit, cost_unit_price, sell_unit_price, discount_percent,
  tax_category, line_total_ex_vat, metadata
)
select
  q.id,
  coalesce((ord.ordinality - 1)::integer, 0),
  coalesce(nullif(elem->>'line_type', ''), nullif(elem->>'kind', ''), 'item'),
  elem->>'code',
  elem->>'category',
  coalesce(nullif(elem->>'description', ''), 'Line item'),
  coalesce((elem->>'quantity')::numeric, 1),
  coalesce(nullif(elem->>'unit', ''), 'ea'),
  nullif(elem->>'unitCost', '')::numeric,
  coalesce(nullif(elem->>'unitSell', '')::numeric, nullif(elem->>'sell_unit_price', '')::numeric, 0),
  coalesce(nullif(elem->>'discount_percent', '')::numeric, 0),
  case
    when (elem->>'taxable')::boolean is false then 'exempt'
    else coalesce(nullif(elem->>'tax_category', ''), 'standard')
  end,
  coalesce(
    nullif(elem->>'line_total_ex_vat', '')::numeric,
    round(
      coalesce((elem->>'quantity')::numeric, 1)
      * coalesce(nullif(elem->>'unitSell', '')::numeric, 0)
      * (1 - coalesce(nullif(elem->>'discount_percent', '')::numeric, 0) / 100)
    , 2)
  ),
  jsonb_build_object('migrated_from_jsonb', true, 'source', elem->>'source')
from public.quotes q
cross join lateral jsonb_array_elements(coalesce(q.line_items, '[]'::jsonb)) with ordinality as ord(elem, ordinality)
where not exists (
  select 1 from public.quote_line_items li where li.quote_id = q.id
)
and jsonb_typeof(coalesce(q.line_items, '[]'::jsonb)) = 'array'
and jsonb_array_length(coalesce(q.line_items, '[]'::jsonb)) > 0;

-- ---------------------------------------------------------------------------
-- Communications & events
-- ---------------------------------------------------------------------------
create table if not exists public.quote_communications (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  communication_type text not null,
  recipient_email text,
  subject text,
  provider_message_id text,
  status text,
  metadata jsonb,
  sent_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists quote_communications_quote_idx
  on public.quote_communications (quote_id, created_at desc);

create table if not exists public.quote_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  event_type text not null,
  actor_type text not null,
  actor_user_id uuid references auth.users (id),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quote_events_quote_idx
  on public.quote_events (quote_id, created_at desc);

create table if not exists public.quote_notification_log (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  notification_key text not null,
  sent_at timestamptz not null default now(),
  metadata jsonb,
  unique (quote_id, notification_key)
);

-- ---------------------------------------------------------------------------
-- Company / quote / PDF settings (singleton rows)
-- ---------------------------------------------------------------------------
create table if not exists public.company_settings (
  id smallint primary key default 1 check (id = 1),
  legal_business_name text not null default 'Damtech',
  trading_name text,
  registration_number text,
  vat_number text,
  address_line1 text,
  address_line2 text,
  city text,
  province text,
  postal_code text,
  country text not null default 'South Africa',
  phone text,
  email text,
  website text,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_branch_code text,
  bank_swift text,
  logo_storage_path text,
  quote_footer text,
  terms_and_conditions text,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.company_settings (id, legal_business_name, trading_name, email, website)
values (1, 'Damtech', 'Damtech', 'info@dam-tech.co.za', 'https://www.dam-tech.co.za')
on conflict (id) do nothing;

drop trigger if exists company_settings_set_updated_at on public.company_settings;
create trigger company_settings_set_updated_at
before update on public.company_settings
for each row execute function public.set_updated_at();

create table if not exists public.quote_settings (
  id smallint primary key default 1 check (id = 1),
  number_prefix text not null default 'DT-Q',
  yearly_reset boolean not null default true,
  default_validity_days integer not null default 30,
  default_vat_rate numeric(7,4) not null default 15,
  default_payment_terms text,
  default_deposit_percent numeric(7,3) not null default 0,
  default_terms text,
  default_exclusions text,
  default_assumptions text,
  minimum_gross_margin_percent numeric(7,3) not null default 15,
  approval_threshold_total numeric(14,2),
  public_token_ttl_days integer not null default 60,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.quote_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists quote_settings_set_updated_at on public.quote_settings;
create trigger quote_settings_set_updated_at
before update on public.quote_settings
for each row execute function public.set_updated_at();

create table if not exists public.quote_pdf_settings (
  id smallint primary key default 1 check (id = 1),
  logo_storage_path text,
  brand_primary_hex text not null default '#1B4D3E',
  brand_accent_hex text not null default '#C4A35A',
  header_style text not null default 'classic',
  footer_style text not null default 'classic',
  show_signature_block boolean not null default true,
  show_page_numbers boolean not null default true,
  terms_location text not null default 'end',
  show_banking_details boolean not null default true,
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.quote_pdf_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists quote_pdf_settings_set_updated_at on public.quote_pdf_settings;
create trigger quote_pdf_settings_set_updated_at
before update on public.quote_pdf_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Atomic quote numbering (configurable prefix + yearly reset)
-- ---------------------------------------------------------------------------
create or replace function public.next_quote_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y integer := extract(year from timezone('Africa/Johannesburg', now()))::integer;
  n integer;
  prefix text := 'DT-Q';
  yearly boolean := true;
  seq_year integer;
begin
  select coalesce(nullif(qs.number_prefix, ''), 'DT-Q'), qs.yearly_reset
  into prefix, yearly
  from public.quote_settings qs
  where qs.id = 1;

  if not found then
    prefix := 'DT-Q';
    yearly := true;
  end if;

  seq_year := case when yearly then y else 0 end;

  insert into public.quote_number_sequences as seq (year, last_value)
  values (seq_year, 1)
  on conflict (year) do update
    set last_value = seq.last_value + 1
  returning last_value into n;

  if yearly then
    return prefix || '-' || y::text || '-' || lpad(n::text, 5, '0');
  end if;

  return prefix || '-' || lpad(n::text, 5, '0');
end;
$$;

revoke all on function public.next_quote_number() from public;
grant execute on function public.next_quote_number() to service_role;
grant execute on function public.next_quote_number() to authenticated;

-- ---------------------------------------------------------------------------
-- Public token lookup (service_role / authenticated staff only — not anon)
-- ---------------------------------------------------------------------------
create or replace function public.get_quote_id_by_token_hash(p_token_hash text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id
  from public.quotes
  where public_token_hash = p_token_hash
    and public_token_revoked_at is null
    and (public_token_expires_at is null or public_token_expires_at > now())
    and status in ('sent', 'viewed', 'accepted', 'rejected', 'expired')
  limit 1;
$$;

revoke all on function public.get_quote_id_by_token_hash(text) from public;
grant execute on function public.get_quote_id_by_token_hash(text) to service_role;

-- ---------------------------------------------------------------------------
-- Storage: quote PDFs (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quote-pdfs',
  'quote-pdfs',
  false,
  20971520,
  array['application/pdf']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.quote_line_items enable row level security;
alter table public.quote_communications enable row level security;
alter table public.quote_events enable row level security;
alter table public.quote_notification_log enable row level security;
alter table public.company_settings enable row level security;
alter table public.quote_settings enable row level security;
alter table public.quote_pdf_settings enable row level security;

-- Deny anon entirely (no policies for anon)

drop policy if exists quote_line_items_select_staff on public.quote_line_items;
create policy quote_line_items_select_staff on public.quote_line_items
for select to authenticated
using (public.is_active_admin());

drop policy if exists quote_line_items_write_staff on public.quote_line_items;
create policy quote_line_items_write_staff on public.quote_line_items
for all to authenticated
using (
  public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[])
)
with check (
  public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[])
);

drop policy if exists quote_comms_select_staff on public.quote_communications;
create policy quote_comms_select_staff on public.quote_communications
for select to authenticated
using (public.is_active_admin());

drop policy if exists quote_comms_write_staff on public.quote_communications;
create policy quote_comms_write_staff on public.quote_communications
for all to authenticated
using (
  public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[])
)
with check (
  public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[])
);

drop policy if exists quote_events_select_staff on public.quote_events;
create policy quote_events_select_staff on public.quote_events
for select to authenticated
using (public.is_active_admin());

drop policy if exists quote_events_write_staff on public.quote_events;
create policy quote_events_write_staff on public.quote_events
for insert to authenticated
with check (
  public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[])
);

drop policy if exists quote_notif_select_staff on public.quote_notification_log;
create policy quote_notif_select_staff on public.quote_notification_log
for select to authenticated
using (
  public.has_admin_role(array['owner','admin']::public.admin_role[])
);

-- Settings: read for staff; write owner/admin
drop policy if exists company_settings_select on public.company_settings;
create policy company_settings_select on public.company_settings
for select to authenticated
using (public.is_active_admin());

drop policy if exists company_settings_write on public.company_settings;
create policy company_settings_write on public.company_settings
for all to authenticated
using (public.has_admin_role(array['owner','admin']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin']::public.admin_role[]));

drop policy if exists quote_settings_select on public.quote_settings;
create policy quote_settings_select on public.quote_settings
for select to authenticated
using (public.is_active_admin());

drop policy if exists quote_settings_write on public.quote_settings;
create policy quote_settings_write on public.quote_settings
for all to authenticated
using (public.has_admin_role(array['owner','admin']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin']::public.admin_role[]));

drop policy if exists quote_pdf_settings_select on public.quote_pdf_settings;
create policy quote_pdf_settings_select on public.quote_pdf_settings
for select to authenticated
using (public.is_active_admin());

drop policy if exists quote_pdf_settings_write on public.quote_pdf_settings;
create policy quote_pdf_settings_write on public.quote_pdf_settings
for all to authenticated
using (public.has_admin_role(array['owner','admin']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin']::public.admin_role[]));

-- Storage policies for quote-pdfs (staff only; public access via signed URL / service role)
drop policy if exists quote_pdfs_select_staff on storage.objects;
create policy quote_pdfs_select_staff on storage.objects
for select to authenticated
using (
  bucket_id = 'quote-pdfs'
  and public.is_active_admin()
);

drop policy if exists quote_pdfs_write_staff on storage.objects;
create policy quote_pdfs_write_staff on storage.objects
for all to authenticated
using (
  bucket_id = 'quote-pdfs'
  and public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[])
)
with check (
  bucket_id = 'quote-pdfs'
  and public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[])
);

-- Seed estimating keys used by Phase 3 if missing
insert into public.estimating_settings (setting_key, setting_value, description)
values
  ('quote_number_prefix', '"DT-Q"'::jsonb, 'Legacy mirror — use quote_settings.number_prefix'),
  ('minimum_gross_margin_warning', '15'::jsonb, 'Warn when quote margin below this percent')
on conflict (setting_key) do nothing;
