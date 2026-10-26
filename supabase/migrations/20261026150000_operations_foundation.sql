-- Operations 2.0 foundation: won projects, supplier orders and Xero links.
--
-- Additive only. Creates new ops_* tables and two functions; touches no
-- existing table. Xero stays the source of truth for money: payment columns on
-- ops_projects are a cache written by the sync, never typed in by hand.
--
-- Access model (same as catalogue_orders): RLS on, no grants to anon or
-- authenticated. The website reads and writes through server code that checks
-- the admin role first and then uses the service role.
--
-- NOT YET APPLIED. Apply to a Supabase branch first; production only with the
-- owner's go-ahead. See docs/operations/operations-2.0-design.md.

-- ---------------------------------------------------------------------------
-- Projects: one operational record per won job
-- ---------------------------------------------------------------------------
create table if not exists public.ops_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  customer_name text not null,
  xero_contact_id uuid,
  contact_person text,
  contact_email text,
  contact_phone text,
  service text not null default 'unclassified',
  is_supply_only boolean not null default false,
  site_location text,
  one_way_km numeric(8,1),
  scope text,
  stage text not null default 'awaiting_deposit',
  on_hold boolean not null default false,
  on_hold_reason text,
  next_action text,
  next_action_due date,
  project_lead_id uuid references public.admin_profiles (id) on delete set null,
  crew text,
  scheduled_start date,
  scheduled_end date,
  -- Quote numbers this project answers for (QU0283, QU0285). Used to attach a
  -- Xero quote to a project created by hand or by the Monday migration, so the
  -- sync never creates a duplicate.
  xero_quote_numbers text[] not null default '{}',
  -- Invoice numbers known to belong to this job (from Monday), so the sync can
  -- link invoices whose reference does not name the quote.
  xero_invoice_numbers text[] not null default '{}',
  quoted_total_incl_vat numeric(14,2),
  quoted_total_excl_vat numeric(14,2),
  currency text not null default 'ZAR',
  -- Cache of Xero invoice state (written by the sync only).
  payment_status text not null default 'not_invoiced',
  amount_invoiced numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  amount_due numeric(14,2) not null default 0,
  payment_synced_at timestamptz,
  source text not null default 'manual',
  needs_review boolean not null default false,
  monday_item_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint ops_projects_stage_check check (stage in (
    'awaiting_deposit', 'planning', 'scheduled', 'in_progress', 'handover', 'completed'
  )),
  constraint ops_projects_service_check check (service in (
    'hdpe_dam_lining', 'pvc_lining', 'reservoir_lining', 'steel_reservoir',
    'torch_on_bitumen', 'roof_waterproofing', 'foundation_waterproofing',
    'material_supply', 'repairs', 'other', 'unclassified'
  )),
  constraint ops_projects_payment_status_check check (payment_status in (
    'not_invoiced', 'awaiting_payment', 'part_paid', 'paid_up_to_date', 'paid_in_full', 'overdue'
  )),
  constraint ops_projects_source_check check (source in ('xero_quote', 'monday_migration', 'manual')),
  constraint ops_projects_currency_check check (currency = 'ZAR'),
  -- Every open project has a next action and a date. This is the one Monday
  -- habit worth keeping.
  constraint ops_projects_next_action_required check (
    stage = 'completed'
    or (next_action is not null and length(btrim(next_action)) > 0 and next_action_due is not null)
  ),
  constraint ops_projects_schedule_order check (
    scheduled_start is null or scheduled_end is null or scheduled_end >= scheduled_start
  )
);

-- Plain unique indexes (NULLs never collide) so ON CONFLICT (monday_item_id) works.
create unique index if not exists ops_projects_monday_item_uidx
  on public.ops_projects (monday_item_id);
create index if not exists ops_projects_stage_idx on public.ops_projects (stage);
create index if not exists ops_projects_next_action_due_idx
  on public.ops_projects (next_action_due) where stage <> 'completed';
create index if not exists ops_projects_quote_numbers_idx
  on public.ops_projects using gin (xero_quote_numbers);

comment on table public.ops_projects is
  'Won jobs (Operations 2.0). Operational stage is set by staff; payment_* columns are a cache of Xero, written by the sync only.';

-- ---------------------------------------------------------------------------
-- Xero links (Xero UUIDs, never just numbers)
-- ---------------------------------------------------------------------------
create table if not exists public.ops_xero_quote_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ops_projects (id) on delete restrict,
  xero_quote_id uuid not null,
  quote_number text not null,
  xero_status text not null,
  total_incl_vat numeric(14,2),
  quote_date date,
  first_seen_accepted_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now()
);

create unique index if not exists ops_xero_quote_links_quote_uidx
  on public.ops_xero_quote_links (xero_quote_id);
create index if not exists ops_xero_quote_links_project_idx
  on public.ops_xero_quote_links (project_id);

create table if not exists public.ops_xero_invoice_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ops_projects (id) on delete restrict,
  xero_invoice_id uuid not null,
  invoice_number text,
  reference text,
  kind text not null default 'unclassified',
  xero_status text not null,
  total_incl_vat numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  amount_due numeric(14,2) not null default 0,
  invoice_date date,
  due_date date,
  match_method text not null,
  last_synced_at timestamptz not null default now(),
  constraint ops_xero_invoice_links_kind_check check (kind in (
    'deposit', 'progress', 'final', 'variation', 'full', 'unclassified'
  )),
  constraint ops_xero_invoice_links_match_check check (match_method in ('reference', 'contact', 'manual'))
);

create unique index if not exists ops_xero_invoice_links_invoice_uidx
  on public.ops_xero_invoice_links (xero_invoice_id);
create index if not exists ops_xero_invoice_links_project_idx
  on public.ops_xero_invoice_links (project_id);

-- Quotes the sync must not turn into projects: everything already accepted
-- or invoiced when the system went live (the baseline run), plus any quote a
-- person dismissed. Without this the first sync would recreate months of
-- finished jobs as "Awaiting deposit".
create table if not exists public.ops_xero_quote_ignores (
  xero_quote_id uuid primary key,
  quote_number text not null,
  reason text not null check (reason in ('baseline', 'dismissed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tasks, supplier orders, documents, activity
-- ---------------------------------------------------------------------------
create table if not exists public.ops_project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ops_projects (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  kind text not null default 'task' check (kind in ('task', 'quality', 'handover')),
  due_date date,
  done boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ops_project_tasks_project_idx on public.ops_project_tasks (project_id);

create table if not exists public.ops_material_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ops_projects (id) on delete restrict,
  supplier_id uuid references public.suppliers (id) on delete set null,
  supplier_name text not null check (length(btrim(supplier_name)) > 0),
  description text not null check (length(btrim(description)) > 0),
  quantity text,
  supplier_reference text,
  status text not null default 'quote_requested',
  fulfilment text not null default 'tbc',
  expected_date date,
  cost_excl_vat numeric(14,2),
  xero_bill_id uuid,
  notes text,
  monday_item_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ops_material_orders_status_check check (status in (
    'quote_requested', 'ordered', 'ready', 'received', 'cancelled'
  )),
  constraint ops_material_orders_fulfilment_check check (fulfilment in (
    'delivery', 'collection', 'customer_collects', 'tbc'
  )),
  constraint ops_material_orders_cost_check check (cost_excl_vat is null or cost_excl_vat >= 0)
);
create index if not exists ops_material_orders_project_idx on public.ops_material_orders (project_id);
create index if not exists ops_material_orders_open_idx
  on public.ops_material_orders (status) where status not in ('received', 'cancelled');
create unique index if not exists ops_material_orders_monday_item_uidx
  on public.ops_material_orders (monday_item_id);

create table if not exists public.ops_project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ops_projects (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  -- A link into OneDrive. Files themselves stay in OneDrive.
  url text not null check (url ~ '^https://'),
  kind text not null default 'other' check (kind in (
    'safety_file', 'supplier_quote', 'drawing', 'photo', 'handover', 'other'
  )),
  created_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists ops_project_documents_project_idx on public.ops_project_documents (project_id);

create table if not exists public.ops_project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.ops_projects (id) on delete cascade,
  at timestamptz not null default now(),
  actor_id uuid references public.admin_profiles (id) on delete set null,
  actor_label text not null,
  kind text not null,
  summary text not null,
  data jsonb not null default '{}'::jsonb
);
create index if not exists ops_project_activity_project_idx
  on public.ops_project_activity (project_id, at desc);

-- ---------------------------------------------------------------------------
-- Xero sync bookkeeping and cached reports
-- ---------------------------------------------------------------------------
create table if not exists public.ops_sync_runs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('xero_projects', 'xero_financials')),
  trigger text not null check (trigger in ('cron', 'manual')),
  status text not null default 'running' check (status in ('running', 'ok', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  quotes_seen integer not null default 0,
  projects_created integer not null default 0,
  invoices_linked integer not null default 0,
  projects_updated integer not null default 0,
  error text,
  detail jsonb not null default '{}'::jsonb
);
-- At most one running sync of each kind, so overlapping cron calls cannot
-- both import the same quote.
create unique index if not exists ops_sync_runs_one_running_uidx
  on public.ops_sync_runs (kind) where status = 'running';
create index if not exists ops_sync_runs_recent_idx on public.ops_sync_runs (kind, started_at desc);

create table if not exists public.ops_financial_snapshots (
  id uuid primary key default gen_random_uuid(),
  report text not null check (report in (
    'profit_and_loss', 'balance_sheet', 'bank_summary', 'receivables', 'payables'
  )),
  period_from date,
  period_to date,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  sync_run_id uuid references public.ops_sync_runs (id) on delete set null
);
create index if not exists ops_financial_snapshots_recent_idx
  on public.ops_financial_snapshots (report, fetched_at desc);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.ops_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ops_projects_touch on public.ops_projects;
create trigger ops_projects_touch before update on public.ops_projects
  for each row execute function public.ops_touch_updated_at();
drop trigger if exists ops_material_orders_touch on public.ops_material_orders;
create trigger ops_material_orders_touch before update on public.ops_material_orders
  for each row execute function public.ops_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Import one accepted Xero quote, exactly once.
--
-- Returns the project id and whether it was created. Safe to call on every
-- sync: a quote already linked only has its status refreshed, and a quote
-- whose number is already listed on a project (Monday migration, manual entry)
-- is attached to that project instead of creating another.
-- ---------------------------------------------------------------------------
create or replace function public.ops_import_accepted_quote(p jsonb)
returns table (result_project_id uuid, result_created boolean)
language plpgsql
set search_path = ''
as $$
declare
  v_quote_id uuid := (p ->> 'xero_quote_id')::uuid;
  v_number text := nullif(btrim(p ->> 'quote_number'), '');
  v_project uuid;
begin
  if v_quote_id is null or v_number is null then
    raise exception 'xero_quote_id and quote_number are required';
  end if;

  select l.project_id into v_project
  from public.ops_xero_quote_links l
  where l.xero_quote_id = v_quote_id
  for update;

  if v_project is not null then
    update public.ops_xero_quote_links
       set xero_status = coalesce(p ->> 'xero_status', xero_status),
           last_synced_at = now()
     where xero_quote_id = v_quote_id;
    return query select v_project, false;
    return;
  end if;

  select pr.id into v_project
  from public.ops_projects pr
  where v_number = any (pr.xero_quote_numbers)
  order by pr.created_at
  limit 1
  for update;

  if v_project is null then
    insert into public.ops_projects (
      title, customer_name, xero_contact_id, contact_email, service, is_supply_only,
      site_location, scope, stage, next_action, next_action_due, xero_quote_numbers,
      quoted_total_incl_vat, quoted_total_excl_vat, source, needs_review
    ) values (
      coalesce(nullif(btrim(p ->> 'title'), ''), v_number),
      coalesce(nullif(btrim(p ->> 'customer_name'), ''), 'Unknown customer'),
      nullif(p ->> 'xero_contact_id', '')::uuid,
      nullif(btrim(p ->> 'contact_email'), ''),
      coalesce(nullif(p ->> 'service', ''), 'unclassified'),
      coalesce((p ->> 'is_supply_only')::boolean, false),
      nullif(btrim(p ->> 'site_location'), ''),
      nullif(btrim(p ->> 'scope'), ''),
      'awaiting_deposit',
      coalesce(nullif(btrim(p ->> 'next_action'), ''), 'Confirm deposit invoice and payment status in Xero'),
      coalesce(nullif(p ->> 'next_action_due', '')::date, current_date),
      array[v_number],
      nullif(p ->> 'total_incl_vat', '')::numeric,
      nullif(p ->> 'total_excl_vat', '')::numeric,
      'xero_quote',
      coalesce((p ->> 'needs_review')::boolean, true)
    )
    returning id into v_project;

    insert into public.ops_project_activity (project_id, actor_label, kind, summary, data)
    values (v_project, 'Xero sync', 'project.created_from_quote',
            'Project created from accepted Xero quote ' || v_number,
            jsonb_build_object('xero_quote_id', v_quote_id));

    insert into public.ops_xero_quote_links (
      project_id, xero_quote_id, quote_number, xero_status, total_incl_vat, quote_date
    ) values (
      v_project, v_quote_id, v_number, coalesce(p ->> 'xero_status', 'ACCEPTED'),
      nullif(p ->> 'total_incl_vat', '')::numeric, nullif(p ->> 'quote_date', '')::date
    );
    return query select v_project, true;
    return;
  end if;

  insert into public.ops_xero_quote_links (
    project_id, xero_quote_id, quote_number, xero_status, total_incl_vat, quote_date
  ) values (
    v_project, v_quote_id, v_number, coalesce(p ->> 'xero_status', 'ACCEPTED'),
    nullif(p ->> 'total_incl_vat', '')::numeric, nullif(p ->> 'quote_date', '')::date
  );
  insert into public.ops_project_activity (project_id, actor_label, kind, summary, data)
  values (v_project, 'Xero sync', 'project.quote_linked',
          'Linked Xero quote ' || v_number, jsonb_build_object('xero_quote_id', v_quote_id));
  return query select v_project, false;
exception
  when unique_violation then
    -- A parallel call linked the same quote first; report that project.
    return query
      select l.project_id, false from public.ops_xero_quote_links l where l.xero_quote_id = v_quote_id;
end;
$$;

-- Start a sync run, clearing runs that died without finishing (serverless
-- timeouts). Returns null when another run of the same kind is in progress.
create or replace function public.ops_start_sync_run(p_kind text, p_trigger text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.ops_sync_runs
     set status = 'failed', finished_at = now(), error = coalesce(error, 'Run did not finish (timed out)')
   where kind = p_kind and status = 'running' and started_at < now() - interval '15 minutes';

  insert into public.ops_sync_runs (kind, trigger) values (p_kind, p_trigger)
  on conflict do nothing
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lock everything down: service role only
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'ops_projects', 'ops_xero_quote_links', 'ops_xero_invoice_links', 'ops_xero_quote_ignores', 'ops_project_tasks',
    'ops_material_orders', 'ops_project_documents', 'ops_project_activity',
    'ops_sync_runs', 'ops_financial_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end;
$$;

-- Functions are not callable by the public API roles (see the advisor
-- finding on publicly callable functions).
revoke all on function public.ops_import_accepted_quote(jsonb) from public, anon, authenticated;
revoke all on function public.ops_start_sync_run(text, text) from public, anon, authenticated;
revoke all on function public.ops_touch_updated_at() from public, anon, authenticated;
grant execute on function public.ops_import_accepted_quote(jsonb) to service_role;
grant execute on function public.ops_start_sync_run(text, text) to service_role;
