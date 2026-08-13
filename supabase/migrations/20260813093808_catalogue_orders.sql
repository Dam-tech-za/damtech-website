-- Fixed-price catalogue orders (invoice payment, collection/customer-arranged transport).
-- Public inserts go through the service role only. Anonymous users must not read,
-- update or enumerate orders.

create table if not exists public.catalogue_orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null,
  confirmation_view_token uuid not null default gen_random_uuid(),
  idempotency_token uuid not null,
  status text not null default 'pending_invoice',
  sku text not null,
  product_name_snapshot text not null,
  quantity integer not null
    check (quantity >= 1 and quantity <= 99),
  unit_price_snapshot numeric(12,2) not null,
  vat_rate_snapshot numeric(5,2) not null default 15,
  vat_amount_snapshot numeric(12,2) not null,
  total_price_snapshot numeric(12,2) not null,
  currency text not null default 'ZAR',
  customer_type text not null,
  customer_name text not null,
  business_name text,
  email text not null,
  phone text not null,
  vat_number text,
  customer_po_number text,
  billing_line1 text not null,
  billing_line2 text,
  billing_suburb text not null,
  billing_city text not null,
  billing_province text not null,
  billing_postal_code text not null,
  fulfilment_method text not null default 'collection_customer_arranged',
  notes text,
  terms_accepted_at timestamptz not null,
  privacy_accepted_at timestamptz not null,
  exclusions_accepted_at timestamptz not null,
  confirmation_email_status text not null default 'pending',
  internal_email_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalogue_orders_reference_format
    check (order_reference ~ '^DT-[0-9]{8}-[A-Z2-9]{8}$'),
  constraint catalogue_orders_status_check
    check (status in (
      'pending_invoice',
      'invoice_sent',
      'awaiting_payment',
      'paid',
      'processing',
      'ready_for_collection',
      'completed',
      'cancelled'
    )),
  constraint catalogue_orders_customer_type_check
    check (customer_type in ('individual', 'business')),
  constraint catalogue_orders_currency_check
    check (currency = 'ZAR'),
  constraint catalogue_orders_fulfilment_check
    check (fulfilment_method = 'collection_customer_arranged'),
  constraint catalogue_orders_email_status_check
    check (confirmation_email_status in (
      'pending', 'sent', 'failed', 'skipped', 'pending_configuration'
    )),
  constraint catalogue_orders_internal_email_status_check
    check (internal_email_status in (
      'pending', 'sent', 'failed', 'skipped', 'pending_configuration'
    ))
);

create unique index if not exists catalogue_orders_reference_uidx
  on public.catalogue_orders (order_reference);

create unique index if not exists catalogue_orders_idempotency_uidx
  on public.catalogue_orders (idempotency_token);

create unique index if not exists catalogue_orders_view_token_uidx
  on public.catalogue_orders (confirmation_view_token);

create index if not exists catalogue_orders_created_idx
  on public.catalogue_orders (created_at desc);

create index if not exists catalogue_orders_status_idx
  on public.catalogue_orders (status, created_at desc);

create index if not exists catalogue_orders_sku_idx
  on public.catalogue_orders (sku);

comment on table public.catalogue_orders is
  'Genuine fixed-price supply-only kit orders. Prices are server-side catalogue snapshots. Anonymous clients have no direct access.';

alter table public.catalogue_orders enable row level security;

revoke all on table public.catalogue_orders from anon;
revoke all on table public.catalogue_orders from authenticated;
grant all on table public.catalogue_orders to service_role;

drop policy if exists catalogue_orders_select_staff on public.catalogue_orders;
create policy catalogue_orders_select_staff on public.catalogue_orders
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));

drop policy if exists catalogue_orders_update_staff on public.catalogue_orders;
create policy catalogue_orders_update_staff on public.catalogue_orders
for update to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]));

-- No INSERT or DELETE policies for anon/authenticated. Public creates orders
-- only through a server action using the service role.
