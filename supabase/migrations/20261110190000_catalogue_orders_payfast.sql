-- Online card/EFT payment through PayFast for catalogue orders (first used for
-- made-to-order PVC tank liners). Additive only: existing invoice orders keep
-- payment_method = 'invoice' and payment_status = 'not_applicable'.

alter table public.catalogue_orders
  add column if not exists payment_method text not null default 'invoice',
  add column if not exists payment_status text not null default 'not_applicable',
  add column if not exists delivery_fee_snapshot numeric(12,2) not null default 0,
  add column if not exists delivery_one_way_km_snapshot numeric(8,1),
  add column if not exists amount_due_snapshot numeric(12,2),
  add column if not exists price_version text,
  add column if not exists payfast_payment_id text,
  add column if not exists amount_paid numeric(12,2),
  add column if not exists paid_at timestamptz;

alter table public.catalogue_orders
  drop constraint if exists catalogue_orders_payment_method_check;
alter table public.catalogue_orders
  add constraint catalogue_orders_payment_method_check
  check (payment_method in ('invoice', 'payfast'));

alter table public.catalogue_orders
  drop constraint if exists catalogue_orders_payment_status_check;
alter table public.catalogue_orders
  add constraint catalogue_orders_payment_status_check
  check (payment_status in ('not_applicable', 'pending', 'paid', 'failed', 'cancelled'));

alter table public.catalogue_orders
  drop constraint if exists catalogue_orders_delivery_fee_check;
alter table public.catalogue_orders
  add constraint catalogue_orders_delivery_fee_check
  check (delivery_fee_snapshot >= 0);

create unique index if not exists catalogue_orders_payfast_payment_uidx
  on public.catalogue_orders (payfast_payment_id)
  where payfast_payment_id is not null;

create index if not exists catalogue_orders_payment_idx
  on public.catalogue_orders (payment_method, payment_status, created_at desc);

-- Audit log of every PayFast notification (ITN), valid or not.
create table if not exists public.catalogue_order_payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.catalogue_orders(id) on delete set null,
  provider text not null default 'payfast',
  m_payment_id text,
  provider_payment_id text,
  provider_status text,
  amount_gross numeric(12,2),
  signature_valid boolean not null default false,
  source_ip text,
  source_ip_recognised boolean not null default false,
  server_confirmed boolean not null default false,
  amount_matches boolean not null default false,
  outcome text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint catalogue_order_payment_events_provider_check
    check (provider in ('payfast'))
);

create index if not exists catalogue_order_payment_events_order_idx
  on public.catalogue_order_payment_events (order_id, created_at desc);

comment on table public.catalogue_order_payment_events is
  'Raw PayFast ITN log for catalogue orders. Written only by the server (service role).';

alter table public.catalogue_order_payment_events enable row level security;

revoke all on table public.catalogue_order_payment_events from anon;
revoke all on table public.catalogue_order_payment_events from authenticated;
grant all on table public.catalogue_order_payment_events to service_role;

drop policy if exists catalogue_order_payment_events_select_staff
  on public.catalogue_order_payment_events;
create policy catalogue_order_payment_events_select_staff
  on public.catalogue_order_payment_events
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));
