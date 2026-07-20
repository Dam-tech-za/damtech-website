-- Pricing inventory CSV import batches and row results

create table if not exists public.pricing_import_batches (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  file_hash text,
  imported_by uuid references auth.users (id),
  imported_at timestamptz not null default now(),
  row_count integer not null default 0,
  success_count integer not null default 0,
  warning_count integer not null default 0,
  failure_count integer not null default 0,
  skipped_count integer not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'validated', 'committed', 'failed', 'rolled_back', 'partial')),
  import_mode text not null default 'valid_rows_only'
    check (import_mode in ('valid_rows_only', 'all_or_nothing')),
  duplicate_mode text not null default 'skip'
    check (duplicate_mode in ('skip', 'update_fields', 'add_price', 'reactivate', 'create_new')),
  summary jsonb not null default '{}'::jsonb,
  error_report text,
  original_csv text,
  rollback_status text
    check (rollback_status is null or rollback_status in ('eligible', 'blocked', 'completed', 'not_applicable')),
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.pricing_import_batches (id) on delete cascade,
  row_number integer not null,
  item_code text,
  status text not null default 'pending'
    check (status in (
      'ready',
      'ready_with_warning',
      'duplicate',
      'invalid',
      'missing_price',
      'manual_confirmation',
      'imported',
      'skipped',
      'failed',
      'excluded',
      'rolled_back'
    )),
  action text not null default 'import'
    check (action in ('import', 'skip', 'update_fields', 'add_price', 'reactivate', 'create_new', 'exclude')),
  payload jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  pricing_item_id uuid references public.pricing_items (id),
  material_item_id uuid references public.material_items (id),
  labour_item_id uuid references public.labour_items (id),
  created_at timestamptz not null default now()
);

create index if not exists pricing_import_batches_imported_at_idx
  on public.pricing_import_batches (imported_at desc);

create index if not exists pricing_import_rows_batch_idx
  on public.pricing_import_rows (batch_id, row_number);

alter table public.pricing_import_batches enable row level security;
alter table public.pricing_import_rows enable row level security;

drop policy if exists pricing_import_batches_select on public.pricing_import_batches;
create policy pricing_import_batches_select
  on public.pricing_import_batches for select to authenticated
  using (public.can_manage_pricing());

drop policy if exists pricing_import_batches_write on public.pricing_import_batches;
create policy pricing_import_batches_write
  on public.pricing_import_batches for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

drop policy if exists pricing_import_rows_select on public.pricing_import_rows;
create policy pricing_import_rows_select
  on public.pricing_import_rows for select to authenticated
  using (public.can_manage_pricing());

drop policy if exists pricing_import_rows_write on public.pricing_import_rows;
create policy pricing_import_rows_write
  on public.pricing_import_rows for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

grant select, insert, update, delete on public.pricing_import_batches to authenticated;
grant select, insert, update, delete on public.pricing_import_rows to authenticated;
