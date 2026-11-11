-- Liner courier quotes: Courier Guy rates worked out in admin for custom
-- liners (WhatsApp / RFQ jobs that are not shop orders).
-- Additive only. Server-only table: admin code checks the role, then uses the
-- service role (same as catalogue_orders). Not applied automatically: apply
-- after the owner's go-ahead (see docs/development/liner-courier-quotes.md).

create table if not exists public.liner_courier_quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles (id) on delete set null,
  reference text,
  customer_name text,
  shape text not null,
  inputs jsonb not null default '{}'::jsonb,
  area_m2 numeric(10, 2) not null,
  gsm integer not null,
  quantity integer not null default 1,
  weight_kg numeric(10, 1) not null,
  parcel_length_cm numeric(8, 1) not null,
  parcel_width_cm numeric(8, 1) not null,
  parcel_height_cm numeric(8, 1) not null,
  parcel_source text not null default 'folded',
  depot text not null,
  delivery_address jsonb not null default '{}'::jsonb,
  declared_value numeric(12, 2),
  courier_rates jsonb,
  rated_at timestamptz,
  chosen_service_code text,
  chosen_service_name text,
  chosen_amount numeric(12, 2),
  formal_quote_status text not null default 'none',
  formal_quote_ref text,
  rfq_id uuid references public.rfqs (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete set null,
  notes text,
  constraint liner_courier_quotes_shape_check check (shape in ('circular', 'rectangular')),
  constraint liner_courier_quotes_parcel_source_check check (parcel_source in ('folded', 'catalogue_rule', 'manual')),
  constraint liner_courier_quotes_depot_check check (depot in ('pretoria', 'bettys-bay')),
  constraint liner_courier_quotes_formal_status_check
    check (formal_quote_status in ('none', 'brief_copied', 'portal_opened', 'api_submitted'))
);

create index if not exists liner_courier_quotes_created_idx on public.liner_courier_quotes (created_at desc);
create index if not exists liner_courier_quotes_quote_idx on public.liner_courier_quotes (quote_id);
create index if not exists liner_courier_quotes_rfq_idx on public.liner_courier_quotes (rfq_id);

comment on table public.liner_courier_quotes is
  'Admin Liner courier tool: liner size, folded parcel, Courier Guy rates and the quotation it was added to. Server only (service role).';

alter table public.liner_courier_quotes enable row level security;

revoke all on public.liner_courier_quotes from anon, authenticated;
grant select, insert, update, delete on public.liner_courier_quotes to service_role;

-- RLS stays on with no policy for anon or authenticated: only the service role reads or writes it.
drop policy if exists liner_courier_quotes_service_role on public.liner_courier_quotes;
create policy liner_courier_quotes_service_role on public.liner_courier_quotes
  for all to service_role using (true) with check (true);
