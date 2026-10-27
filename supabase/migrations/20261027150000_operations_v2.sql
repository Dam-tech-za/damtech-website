-- Operations 2.0, part 2 (27 Oct 2026). Additive and re-runnable.
--
-- * Supplier orders: the Monday status set (not ordered … problem), units,
--   received date, delivery/collection notes, Xero bill number.
-- * Projects: next-action owner, client supplies materials, OneDrive folder,
--   archive.
-- * Tasks: owner.
-- * ops_xero_unmatched: invoices the sync could not link with certainty,
--   reviewed and linked by a person once.
-- * ops_reminder_runs: one daily reminder email per day.
--
-- Rollback: supabase/rollbacks/20261027150000_operations_v2_down.sql

-- ---------------------------------------------------------------------------
-- Supplier orders
-- ---------------------------------------------------------------------------
alter table public.ops_material_orders drop constraint if exists ops_material_orders_status_check;

-- Map the original five statuses onto the new set (only 'ready' and
-- 'received' are renamed; existing rows keep their meaning).
update public.ops_material_orders set status = 'ready_for_collection' where status = 'ready';
update public.ops_material_orders set status = 'collected_delivered' where status = 'received';

alter table public.ops_material_orders alter column status set default 'not_ordered';
alter table public.ops_material_orders add constraint ops_material_orders_status_check check (status in (
  'not_ordered', 'quote_requested', 'quoted', 'ordered', 'paid',
  'ready_for_collection', 'collected_delivered', 'problem', 'cancelled'
));

alter table public.ops_material_orders add column if not exists unit text;
alter table public.ops_material_orders add column if not exists received_date date;
alter table public.ops_material_orders add column if not exists fulfilment_notes text;
alter table public.ops_material_orders add column if not exists xero_bill_number text;

drop index if exists public.ops_material_orders_open_idx;
create index if not exists ops_material_orders_open_idx
  on public.ops_material_orders (status) where status not in ('collected_delivered', 'cancelled');

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
alter table public.ops_projects add column if not exists next_action_owner text;
alter table public.ops_projects add column if not exists materials_by_client boolean not null default false;
alter table public.ops_projects add column if not exists onedrive_url text;
alter table public.ops_projects add column if not exists archived_at timestamptz;

alter table public.ops_projects drop constraint if exists ops_projects_onedrive_url_check;
alter table public.ops_projects add constraint ops_projects_onedrive_url_check
  check (onedrive_url is null or onedrive_url ~ '^https://');

-- Only completed projects can be archived.
alter table public.ops_projects drop constraint if exists ops_projects_archive_completed;
alter table public.ops_projects add constraint ops_projects_archive_completed
  check (archived_at is null or stage = 'completed');

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
alter table public.ops_project_tasks add column if not exists owner text;

-- ---------------------------------------------------------------------------
-- Unmatched Xero records
-- ---------------------------------------------------------------------------
create table if not exists public.ops_xero_unmatched (
  id uuid primary key default gen_random_uuid(),
  xero_invoice_id uuid not null,
  invoice_number text,
  reference text,
  contact_name text,
  xero_contact_id uuid,
  invoice_date date,
  due_date date,
  xero_status text not null,
  total_incl_vat numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  amount_due numeric(14,2) not null default 0,
  -- Why it was not linked automatically, in plain words for the reviewer.
  reason text not null,
  -- A likely project (same customer, one open job) offered for one-click confirmation.
  suggested_project_id uuid references public.ops_projects (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'linked', 'dismissed')),
  resolved_project_id uuid references public.ops_projects (id) on delete set null,
  resolved_by uuid references public.admin_profiles (id) on delete set null,
  resolved_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create unique index if not exists ops_xero_unmatched_invoice_uidx
  on public.ops_xero_unmatched (xero_invoice_id);
create index if not exists ops_xero_unmatched_open_idx
  on public.ops_xero_unmatched (first_seen_at desc) where status = 'open';

-- ---------------------------------------------------------------------------
-- Daily reminder bookkeeping (one send per South African day)
-- ---------------------------------------------------------------------------
create table if not exists public.ops_reminder_runs (
  run_date date primary key,
  sent_at timestamptz not null default now(),
  recipients text[] not null default '{}',
  item_count integer not null default 0,
  status text not null check (status in ('sent', 'nothing_due', 'failed', 'skipped')),
  error text
);

-- ---------------------------------------------------------------------------
-- Service role only, like the rest of ops_*
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['ops_xero_unmatched', 'ops_reminder_runs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end;
$$;

comment on table public.ops_xero_unmatched is
  'Xero sales invoices the sync could not link to exactly one project with certainty. A person links or dismisses each once.';
