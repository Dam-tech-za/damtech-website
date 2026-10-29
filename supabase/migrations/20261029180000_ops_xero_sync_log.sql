-- Log every board "Update Xero" contact fill so staff can undo.
-- Additive. Safe to re-run.

create table if not exists public.ops_xero_sync_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  change_count integer not null default 0,
  changes jsonb not null default '[]'::jsonb,
  sync_counts jsonb not null default '{}'::jsonb,
  undone_at timestamptz,
  undone_by uuid
);

create index if not exists ops_xero_sync_log_created_at_idx
  on public.ops_xero_sync_log (created_at desc);

comment on table public.ops_xero_sync_log is
  'Board Update Xero runs: who, when, which empty fields were filled (for undo).';

-- Allow "Deposit not invoiced" as a staff payment override (Monday label).
alter table public.ops_projects drop constraint if exists ops_projects_payment_label_override_check;
alter table public.ops_projects
  add constraint ops_projects_payment_label_override_check check (
    payment_label_override is null or payment_label_override in (
      'deposit_not_invoiced',
      'deposit_invoiced',
      'portion_of_deposit_paid',
      'deposit_paid',
      'balance_due',
      'paid_in_full'
    )
  );

-- Optional note when a project has two different Xero contacts (quote vs invoice).
alter table public.ops_projects
  add column if not exists xero_dual_contact boolean not null default false;

comment on column public.ops_projects.xero_dual_contact is
  'True when linked quote and invoice point at different Xero ContactIDs (needs merge).';
