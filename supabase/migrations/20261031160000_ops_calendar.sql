-- Operations Calendar: teams, bookings and the Outlook sync plumbing.
--
-- Additive only. Creates new ops_* tables, enables btree_gist (needed for the
-- per-team no-overlap constraint) and adds three functions. Touches no
-- existing table except to read ops_projects through foreign keys; nothing
-- here deletes or rewrites project data.
--
-- Access model: identical to operations_foundation. RLS on, no grants to anon
-- or authenticated; server code checks the admin role and uses the service
-- role. Booking writes go through ops_calendar_save_booking() so the booking,
-- its team allocations, the audit row and the Outlook outbox row are written
-- in one transaction.
--
-- Times: timestamptz (UTC), displayed in Africa/Johannesburg. Ranges are
-- half-open [start, end): 07:00-16:00 does not clash with 16:00-17:00.
--
-- Applied to production (Damtech Admin) on 31 Oct 2026 with the owner's
-- go-ahead, as migration "ops_calendar".
--
-- Rollback: drop the ops_calendar_* functions and the tables below in reverse
-- order. No other table depends on them.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Teams and resources
-- ---------------------------------------------------------------------------
create table if not exists public.ops_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  colour text not null default '#026BC6',
  leader_name text,
  leader_user_id uuid references public.admin_profiles (id) on delete set null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ops_teams_name_unique unique (name)
);

create table if not exists public.ops_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.ops_teams (id) on delete cascade,
  name text not null,
  user_id uuid references public.admin_profiles (id) on delete set null,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now()
);

create table if not exists public.ops_resources (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('vehicle', 'equipment', 'other')),
  name text not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bookings: one row per work session. A 3-day install is 3 bookings on one
-- project, or one booking spanning 3 days; both are allowed.
-- kind 'project' needs a project; 'leave' / 'maintenance' / 'other' do not.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_bookings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.ops_projects (id) on delete restrict,
  kind text not null default 'project' check (kind in ('project', 'leave', 'maintenance', 'travel', 'other')),
  title text not null,
  status text not null default 'tentative'
    check (status in ('tentative', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  notes text,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  allow_overlap boolean not null default false,
  overlap_reason text,
  version integer not null default 1,
  created_by uuid references public.admin_profiles (id) on delete set null,
  updated_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ops_bookings_range check (end_at > start_at),
  constraint ops_bookings_project_kind check (kind <> 'project' or project_id is not null),
  constraint ops_bookings_overlap_reason check (not allow_overlap or nullif(trim(overlap_reason), '') is not null)
);
create index if not exists ops_bookings_range_idx on public.ops_bookings using gist (tstzrange(start_at, end_at, '[)'));
create index if not exists ops_bookings_project_idx on public.ops_bookings (project_id);

-- Team allocations carry a copy of the booking's range so the database itself
-- refuses double-booking a team, even when two managers save at once.
create table if not exists public.ops_booking_teams (
  booking_id uuid not null references public.ops_bookings (id) on delete cascade,
  team_id uuid not null references public.ops_teams (id) on delete restrict,
  during tstzrange not null,
  blocks_time boolean not null default true,
  primary key (booking_id, team_id),
  constraint ops_booking_teams_no_overlap
    exclude using gist (team_id with =, during with &&) where (blocks_time)
);
create index if not exists ops_booking_teams_team_idx on public.ops_booking_teams (team_id);

create table if not exists public.ops_booking_resources (
  booking_id uuid not null references public.ops_bookings (id) on delete cascade,
  resource_id uuid not null references public.ops_resources (id) on delete restrict,
  during tstzrange not null,
  blocks_time boolean not null default true,
  primary key (booking_id, resource_id),
  constraint ops_booking_resources_no_overlap
    exclude using gist (resource_id with =, during with &&) where (blocks_time)
);

create table if not exists public.ops_booking_audit (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  project_id uuid,
  actor_id uuid,
  actor_label text,
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ops_booking_audit_booking_idx on public.ops_booking_audit (booking_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Outlook (Microsoft Graph) sync. Unused until the sync is switched on.
-- ---------------------------------------------------------------------------
create table if not exists public.ops_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.ops_teams (id) on delete set null,
  label text not null,
  mailbox text not null,
  calendar_id text,
  enabled boolean not null default false,
  is_test boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ops_calendar_connections_mailbox_unique unique (mailbox, calendar_id)
);

create table if not exists public.ops_calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.ops_bookings (id) on delete cascade,
  connection_id uuid not null references public.ops_calendar_connections (id) on delete cascade,
  event_id text,
  transaction_id text not null,
  etag text,
  synced_version integer,
  sync_status text not null default 'pending'
    check (sync_status in ('pending', 'synced', 'failed', 'conflict', 'removed')),
  last_error text,
  last_synced_at timestamptz,
  constraint ops_calendar_event_links_unique unique (booking_id, connection_id),
  constraint ops_calendar_event_links_txn_unique unique (transaction_id)
);
create unique index if not exists ops_calendar_event_links_event_idx
  on public.ops_calendar_event_links (connection_id, event_id) where event_id is not null;

create table if not exists public.ops_calendar_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  booking_version integer not null,
  operation text not null check (operation in ('upsert', 'cancel')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed', 'skipped')),
  attempts integer not null default 0,
  next_retry_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists ops_calendar_outbox_due_idx on public.ops_calendar_outbox (next_retry_at) where status = 'pending';

create table if not exists public.ops_calendar_sync_state (
  connection_id uuid primary key references public.ops_calendar_connections (id) on delete cascade,
  delta_link text,
  subscription_id text,
  subscription_expires_at timestamptz,
  client_state_hash text,
  last_delta_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_calendar_conflicts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.ops_bookings (id) on delete cascade,
  connection_id uuid references public.ops_calendar_connections (id) on delete cascade,
  event_id text,
  change_type text not null check (change_type in ('moved', 'deleted', 'edited', 'etag_mismatch')),
  external_payload jsonb,
  status text not null default 'open' check (status in ('open', 'accepted', 'rejected')),
  resolved_by uuid references public.admin_profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists ops_calendar_conflicts_open_idx
  on public.ops_calendar_conflicts (booking_id, connection_id) where status = 'open';

-- Non-DamTech Outlook appointments, shown as availability blockers only.
create table if not exists public.ops_calendar_external_events (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.ops_calendar_connections (id) on delete cascade,
  event_id text not null,
  subject text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  show_as text,
  updated_at timestamptz not null default now(),
  constraint ops_calendar_external_events_unique unique (connection_id, event_id)
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
drop trigger if exists ops_teams_touch on public.ops_teams;
create trigger ops_teams_touch before update on public.ops_teams
  for each row execute function public.ops_touch_updated_at();
drop trigger if exists ops_resources_touch on public.ops_resources;
create trigger ops_resources_touch before update on public.ops_resources
  for each row execute function public.ops_touch_updated_at();
drop trigger if exists ops_calendar_connections_touch on public.ops_calendar_connections;
create trigger ops_calendar_connections_touch before update on public.ops_calendar_connections
  for each row execute function public.ops_touch_updated_at();

-- ---------------------------------------------------------------------------
-- ops_calendar_save_booking: create or update one booking atomically.
--
-- p = { id?, expected_version?, project_id?, kind, title, status, start_at,
--       end_at, all_day, notes, allow_overlap, overlap_reason,
--       team_ids: uuid[], resource_ids: uuid[] }
-- Raises 'version_conflict' when expected_version is stale, and the
-- exclusion constraint's 23P01 when a team or resource is double-booked.
-- Writes the audit row and (when an Outlook connection exists) an outbox row.
-- ---------------------------------------------------------------------------
create or replace function public.ops_calendar_save_booking(p jsonb, p_actor uuid, p_actor_label text)
returns jsonb
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_before jsonb;
  v_row public.ops_bookings;
  v_range tstzrange;
  v_cancelled boolean;
  v_team uuid;
  v_res uuid;
begin
  if v_id is not null then
    select to_jsonb(b) into v_before from public.ops_bookings b where b.id = v_id for update;
    if v_before is null then
      raise exception 'booking_not_found';
    end if;
    if (p ? 'expected_version') and (v_before ->> 'version')::int <> (p ->> 'expected_version')::int then
      raise exception 'version_conflict';
    end if;
    update public.ops_bookings set
      project_id = case when p ? 'project_id' then nullif(p ->> 'project_id', '')::uuid else project_id end,
      kind = coalesce(p ->> 'kind', kind),
      title = coalesce(p ->> 'title', title),
      status = coalesce(p ->> 'status', status),
      start_at = coalesce((p ->> 'start_at')::timestamptz, start_at),
      end_at = coalesce((p ->> 'end_at')::timestamptz, end_at),
      all_day = coalesce((p ->> 'all_day')::boolean, all_day),
      notes = case when p ? 'notes' then nullif(p ->> 'notes', '') else notes end,
      allow_overlap = coalesce((p ->> 'allow_overlap')::boolean, allow_overlap),
      overlap_reason = case when p ? 'overlap_reason' then nullif(p ->> 'overlap_reason', '') else overlap_reason end,
      version = version + 1,
      updated_by = p_actor,
      updated_at = now()
    where id = v_id
    returning * into v_row;
  else
    insert into public.ops_bookings (
      project_id, kind, title, status, start_at, end_at, all_day, notes,
      allow_overlap, overlap_reason, created_by, updated_by
    ) values (
      nullif(p ->> 'project_id', '')::uuid,
      coalesce(p ->> 'kind', 'project'),
      p ->> 'title',
      coalesce(p ->> 'status', 'tentative'),
      (p ->> 'start_at')::timestamptz,
      (p ->> 'end_at')::timestamptz,
      coalesce((p ->> 'all_day')::boolean, false),
      nullif(p ->> 'notes', ''),
      coalesce((p ->> 'allow_overlap')::boolean, false),
      nullif(p ->> 'overlap_reason', ''),
      p_actor,
      p_actor
    )
    returning * into v_row;
  end if;

  v_range := tstzrange(v_row.start_at, v_row.end_at, '[)');
  v_cancelled := v_row.status = 'cancelled';

  if p ? 'team_ids' then
    delete from public.ops_booking_teams where booking_id = v_row.id;
    for v_team in select (jsonb_array_elements_text(p -> 'team_ids'))::uuid loop
      insert into public.ops_booking_teams (booking_id, team_id, during, blocks_time)
      values (v_row.id, v_team, v_range, not v_cancelled and not v_row.allow_overlap);
    end loop;
  else
    update public.ops_booking_teams
      set during = v_range, blocks_time = not v_cancelled and not v_row.allow_overlap
      where booking_id = v_row.id;
  end if;

  if p ? 'resource_ids' then
    delete from public.ops_booking_resources where booking_id = v_row.id;
    for v_res in select (jsonb_array_elements_text(p -> 'resource_ids'))::uuid loop
      insert into public.ops_booking_resources (booking_id, resource_id, during, blocks_time)
      values (v_row.id, v_res, v_range, not v_cancelled and not v_row.allow_overlap);
    end loop;
  else
    update public.ops_booking_resources
      set during = v_range, blocks_time = not v_cancelled and not v_row.allow_overlap
      where booking_id = v_row.id;
  end if;

  insert into public.ops_booking_audit (booking_id, project_id, actor_id, actor_label, action, before, after)
  values (
    v_row.id, v_row.project_id, p_actor, p_actor_label,
    case when v_before is null then 'created'
         when v_cancelled and (v_before ->> 'status') <> 'cancelled' then 'cancelled'
         else 'updated' end,
    v_before,
    to_jsonb(v_row) || jsonb_build_object(
      'team_ids', (select coalesce(jsonb_agg(team_id), '[]'::jsonb) from public.ops_booking_teams where booking_id = v_row.id)
    )
  );

  -- Queue an Outlook update only when a calendar is connected for one of the
  -- booking's teams (or was before a reassignment).
  if exists (
    select 1 from public.ops_calendar_connections c
    where c.enabled and (
      c.team_id in (select team_id from public.ops_booking_teams where booking_id = v_row.id)
      or c.id in (select connection_id from public.ops_calendar_event_links where booking_id = v_row.id)
    )
  ) then
    insert into public.ops_calendar_outbox (booking_id, booking_version, operation)
    values (v_row.id, v_row.version, case when v_cancelled then 'cancel' else 'upsert' end);
  end if;

  return to_jsonb(v_row);
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
    'ops_teams', 'ops_team_members', 'ops_resources', 'ops_bookings', 'ops_booking_teams',
    'ops_booking_resources', 'ops_booking_audit', 'ops_calendar_connections',
    'ops_calendar_event_links', 'ops_calendar_outbox', 'ops_calendar_sync_state',
    'ops_calendar_conflicts', 'ops_calendar_external_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end;
$$;

revoke all on function public.ops_calendar_save_booking(jsonb, uuid, text) from public, anon, authenticated;
grant execute on function public.ops_calendar_save_booking(jsonb, uuid, text) to service_role;
