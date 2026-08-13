-- Catalogue invoice-request line items for public RFQs.
-- Apply after 20260715180100_admin_rfq_phase2.sql
-- Structured product lines (SKU, VAT-inclusive prices) — do not flatten into message text.

alter table public.rfqs drop constraint if exists rfqs_enquiry_channel_check;

alter table public.rfqs
  add constraint rfqs_enquiry_channel_check
  check (
    enquiry_channel is null
    or enquiry_channel in (
      'simple_public_rfq',
      'calculator_quote_preparation',
      'contact_enquiry',
      'admin_created',
      'catalogue_invoice_request',
      'other'
    )
  );

comment on column public.rfqs.enquiry_channel is
  'Normalised source badge: simple_public_rfq | calculator_quote_preparation | contact_enquiry | admin_created | catalogue_invoice_request | other.';

create table if not exists public.rfq_catalogue_line_items (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs (id) on delete cascade,
  sku text not null,
  product_name text not null,
  quantity integer not null
    check (quantity >= 1 and quantity <= 99),
  unit_price_incl_vat_zar numeric(12,2) not null,
  line_total_incl_vat_zar numeric(12,2) not null,
  vat_included boolean not null default true,
  vat_rate_percent numeric(5,2) not null default 15,
  currency text not null default 'ZAR',
  transport_excluded boolean not null default true,
  installation_excluded boolean not null default true,
  catalogue_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rfq_catalogue_line_items_rfq_idx
  on public.rfq_catalogue_line_items (rfq_id);

create index if not exists rfq_catalogue_line_items_sku_idx
  on public.rfq_catalogue_line_items (sku);

alter table public.rfq_catalogue_line_items enable row level security;

drop policy if exists rfq_catalogue_lines_select_staff on public.rfq_catalogue_line_items;
create policy rfq_catalogue_lines_select_staff on public.rfq_catalogue_line_items
for select to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[]));

drop policy if exists rfq_catalogue_lines_write_staff on public.rfq_catalogue_line_items;
create policy rfq_catalogue_lines_write_staff on public.rfq_catalogue_line_items
for all to authenticated
using (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]))
with check (public.has_admin_role(array['owner','admin','sales','estimator']::public.admin_role[]));

comment on table public.rfq_catalogue_line_items is
  'Fixed-price catalogue kits attached to an RFQ. Unit price is always VAT-inclusive and derived server-side from the catalogue SKU.';
