-- Procurement: line items, partial receipts, supplier documents and Xero bill
-- links for the existing supplier orders (ops_material_orders).
--
-- Additive. ops_material_orders stays the supplier order record (one project,
-- one supplier, many lines). New columns are nullable or defaulted; the status
-- check is widened to a superset, so every existing value stays valid.
-- Nothing is deleted or rewritten.
--
-- Money: Xero is the authority for bills, VAT and payments. ops_order_bill_links
-- is a cache of Xero supplier bills (ACCPAY) that a person linked to an order;
-- it is refreshed from Xero, never typed in.
--
-- Access model: same as operations_foundation (RLS on, service role only;
-- server code checks the admin role). Documents live in the private
-- "procurement-documents" bucket and are served through short signed URLs.
--
-- Rollback: drop the ops_order_* / ops_procurement_* objects created here, drop
-- the added columns, and restore the original status check. No existing data
-- depends on them.

-- ---------------------------------------------------------------------------
-- Supplier orders: extra columns and a wider status list
-- ---------------------------------------------------------------------------
alter table public.ops_material_orders
  add column if not exists order_reference text,
  add column if not exists order_date date,
  add column if not exists required_on_site date,
  add column if not exists quote_valid_until date,
  add column if not exists lead_time_days integer check (lead_time_days is null or lead_time_days between 0 and 365),
  add column if not exists delivery_instructions text,
  add column if not exists xero_contact_id uuid,
  add column if not exists xero_purchase_order_id uuid,
  add column if not exists xero_purchase_order_number text,
  add column if not exists approved_by uuid references public.admin_profiles (id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists created_by uuid references public.admin_profiles (id) on delete set null,
  add column if not exists updated_by uuid references public.admin_profiles (id) on delete set null,
  add column if not exists version integer not null default 1;

-- Superset of the original nine statuses. "paid" stays valid for old rows but
-- the website no longer offers it: payment comes from Xero.
alter table public.ops_material_orders drop constraint if exists ops_material_orders_status_check;
alter table public.ops_material_orders add constraint ops_material_orders_status_check check (status in (
  'not_ordered', 'quote_requested', 'quoted', 'approved', 'ordered', 'manufacturing',
  'ready_for_collection', 'in_transit', 'partially_received', 'collected_delivered',
  'on_hold', 'problem', 'cancelled', 'paid'
));

create index if not exists ops_material_orders_project_idx on public.ops_material_orders (project_id);
create index if not exists ops_material_orders_expected_idx on public.ops_material_orders (expected_date) where status not in ('collected_delivered', 'cancelled');

-- ---------------------------------------------------------------------------
-- Order lines
-- ---------------------------------------------------------------------------
create table if not exists public.ops_order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ops_material_orders (id) on delete cascade,
  pricing_item_id uuid references public.pricing_items (id) on delete set null,
  description text not null check (length(btrim(description)) > 0),
  specification text,
  unit text not null default 'each',
  quantity numeric(14, 3) not null check (quantity > 0),
  unit_cost_excl_vat numeric(14, 2) check (unit_cost_excl_vat is null or unit_cost_excl_vat >= 0),
  discount_pct numeric(5, 2) not null default 0 check (discount_pct between 0 and 100),
  vat_rate numeric(5, 2) not null default 15 check (vat_rate between 0 and 100),
  allow_over_receipt boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ops_order_lines_order_idx on public.ops_order_lines (order_id, sort_order);

-- ---------------------------------------------------------------------------
-- Receipts: one row per line per delivery or collection. Reversal is a
-- flag, never a delete, so the history stays.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_order_receipts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ops_material_orders (id) on delete cascade,
  line_id uuid not null references public.ops_order_lines (id) on delete cascade,
  received_on date not null,
  quantity_accepted numeric(14, 3) not null default 0 check (quantity_accepted >= 0),
  quantity_rejected numeric(14, 3) not null default 0 check (quantity_rejected >= 0),
  delivery_note_ref text,
  notes text,
  received_by uuid references public.admin_profiles (id) on delete set null,
  received_by_label text,
  reversed_at timestamptz,
  reversed_by uuid references public.admin_profiles (id) on delete set null,
  reversal_reason text,
  created_at timestamptz not null default now(),
  constraint ops_order_receipts_qty check (quantity_accepted + quantity_rejected > 0),
  constraint ops_order_receipts_reversal check (reversed_at is null or nullif(btrim(reversal_reason), '') is not null)
);
create index if not exists ops_order_receipts_line_idx on public.ops_order_receipts (line_id) where reversed_at is null;

-- Refuse accepting more than was ordered unless the line allows it.
create or replace function public.ops_order_receipts_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_line public.ops_order_lines;
  v_total numeric;
begin
  if new.reversed_at is not null then
    return new;
  end if;
  select * into v_line from public.ops_order_lines where id = new.line_id for update;
  if v_line.order_id <> new.order_id then
    raise exception 'receipt_line_mismatch';
  end if;
  select coalesce(sum(quantity_accepted), 0) into v_total
    from public.ops_order_receipts
    where line_id = new.line_id and reversed_at is null and id <> new.id;
  if not v_line.allow_over_receipt and v_total + new.quantity_accepted > v_line.quantity then
    raise exception 'over_receipt';
  end if;
  return new;
end;
$$;

drop trigger if exists ops_order_receipts_guard on public.ops_order_receipts;
create trigger ops_order_receipts_guard before insert or update on public.ops_order_receipts
  for each row execute function public.ops_order_receipts_guard();

-- Per-line progress, always computed from receipts (never a stored balance).
create or replace view public.ops_order_line_progress
with (security_invoker = true) as
select
  l.id as line_id,
  l.order_id,
  l.quantity as quantity_ordered,
  coalesce(sum(r.quantity_accepted) filter (where r.reversed_at is null), 0) as quantity_received,
  coalesce(sum(r.quantity_rejected) filter (where r.reversed_at is null), 0) as quantity_rejected,
  greatest(l.quantity - coalesce(sum(r.quantity_accepted) filter (where r.reversed_at is null), 0), 0) as quantity_outstanding,
  round(l.quantity * coalesce(l.unit_cost_excl_vat, 0) * (1 - l.discount_pct / 100), 2) as line_total_excl_vat
from public.ops_order_lines l
left join public.ops_order_receipts r on r.line_id = l.id
group by l.id;

-- ---------------------------------------------------------------------------
-- Supplier documents (quotes, pro formas, delivery notes, ...)
-- ---------------------------------------------------------------------------
create table if not exists public.ops_procurement_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ops_projects (id) on delete restrict,
  order_id uuid references public.ops_material_orders (id) on delete set null,
  doc_type text not null check (doc_type in (
    'supplier_quote', 'pro_forma', 'purchase_order', 'tax_invoice', 'delivery_note',
    'proof_of_collection', 'correspondence', 'credit_note', 'other'
  )),
  file_name text not null,
  storage_path text not null unique,
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 20971520),
  sha256 text not null,
  version integer not null default 1,
  supersedes_id uuid references public.ops_procurement_documents (id) on delete set null,
  source text not null default 'upload' check (source in ('upload', 'xero')),
  xero_entity_type text,
  xero_entity_id uuid,
  uploaded_by uuid references public.admin_profiles (id) on delete set null,
  uploaded_by_label text,
  created_at timestamptz not null default now(),
  constraint ops_procurement_documents_unique_file unique (project_id, sha256)
);
create index if not exists ops_procurement_documents_order_idx on public.ops_procurement_documents (order_id);

-- ---------------------------------------------------------------------------
-- Xero supplier bills linked to an order (cache of Xero, refreshed from it)
-- ---------------------------------------------------------------------------
create table if not exists public.ops_order_bill_links (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ops_material_orders (id) on delete cascade,
  xero_invoice_id uuid not null,
  bill_number text,
  reference text,
  contact_name text,
  xero_status text,
  bill_date date,
  due_date date,
  total_incl_vat numeric(14, 2),
  amount_paid numeric(14, 2),
  amount_due numeric(14, 2),
  match_method text not null default 'manual' check (match_method in ('manual', 'exact_id')),
  linked_by uuid references public.admin_profiles (id) on delete set null,
  linked_at timestamptz not null default now(),
  last_synced_at timestamptz,
  constraint ops_order_bill_links_unique unique (order_id, xero_invoice_id)
);
create index if not exists ops_order_bill_links_bill_idx on public.ops_order_bill_links (xero_invoice_id);

-- ---------------------------------------------------------------------------
-- Private bucket for supplier documents
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'procurement-documents', 'procurement-documents', false, 20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Triggers and lock-down
-- ---------------------------------------------------------------------------
drop trigger if exists ops_order_lines_touch on public.ops_order_lines;
create trigger ops_order_lines_touch before update on public.ops_order_lines
  for each row execute function public.ops_touch_updated_at();

do $$
declare
  t text;
begin
  foreach t in array array['ops_order_lines', 'ops_order_receipts', 'ops_procurement_documents', 'ops_order_bill_links'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end;
$$;

revoke all on table public.ops_order_line_progress from anon, authenticated;
grant select on table public.ops_order_line_progress to service_role;
revoke all on function public.ops_order_receipts_guard() from public, anon, authenticated;
