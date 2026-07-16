-- =============================================================================
-- Public RFQ submission repair: rate-limit fallback, idempotency, communications
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Idempotency on public submissions
-- ---------------------------------------------------------------------------
alter table public.rfqs
  add column if not exists public_submission_id uuid;

create unique index if not exists rfqs_public_submission_id_uidx
  on public.rfqs (public_submission_id)
  where public_submission_id is not null;

comment on column public.rfqs.public_submission_id is
  'Client-generated UUID for idempotent public RFQ submits. Unique when present.';

-- ---------------------------------------------------------------------------
-- Supabase-backed public submission rate limits (Upstash fallback)
-- ---------------------------------------------------------------------------
create table if not exists public.public_submission_rate_limits (
  rate_key_hash text not null,
  action text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (rate_key_hash, action, window_started_at)
);

create index if not exists public_submission_rate_limits_updated_idx
  on public.public_submission_rate_limits (updated_at desc);

alter table public.public_submission_rate_limits enable row level security;

revoke all on table public.public_submission_rate_limits from anon, authenticated;
grant all on table public.public_submission_rate_limits to service_role;

-- Atomic check/increment. Keys must already be hashed server-side.
create or replace function public.check_public_submission_rate_limit(
  p_rate_key_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_rate_key_hash is null or length(trim(p_rate_key_hash)) < 8 then
    raise exception 'invalid rate key hash';
  end if;
  if p_action is null or length(trim(p_action)) < 1 then
    raise exception 'invalid action';
  end if;
  if p_limit is null or p_limit < 1 then
    raise exception 'invalid limit';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'invalid window';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  insert into public.public_submission_rate_limits as r (
    rate_key_hash,
    action,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    p_rate_key_hash,
    p_action,
    v_window_start,
    1,
    v_now
  )
  on conflict (rate_key_hash, action, window_started_at)
  do update
    set request_count = r.request_count + 1,
        updated_at = excluded.updated_at
  returning request_count into v_count;

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'remaining', greatest(p_limit - v_count, 0),
    'limit', p_limit,
    'resetAt', floor(extract(epoch from v_reset_at) * 1000)::bigint,
    'count', v_count
  );
end;
$$;

revoke all on function public.check_public_submission_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_public_submission_rate_limit(text, text, integer, integer)
  to service_role;

-- ---------------------------------------------------------------------------
-- RFQ notification / communication log
-- ---------------------------------------------------------------------------
create table if not exists public.rfq_communications (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs (id) on delete cascade,
  communication_type text not null,
  recipient text,
  subject text,
  provider_message_id text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'pending_configuration')),
  provider_error text,
  attempt_count integer not null default 0,
  metadata jsonb,
  attempted_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rfq_communications_rfq_idx
  on public.rfq_communications (rfq_id, created_at desc);

create index if not exists rfq_communications_status_idx
  on public.rfq_communications (status, created_at desc);

alter table public.rfq_communications enable row level security;

drop policy if exists rfq_comms_select_staff on public.rfq_communications;
create policy rfq_comms_select_staff on public.rfq_communications
  for select to authenticated
  using (public.is_active_admin());

drop policy if exists rfq_comms_write_staff on public.rfq_communications;
create policy rfq_comms_write_staff on public.rfq_communications
  for all to authenticated
  using (
    public.has_admin_role(
      array['owner', 'admin', 'estimator']::public.admin_role[]
    )
  )
  with check (
    public.has_admin_role(
      array['owner', 'admin', 'estimator']::public.admin_role[]
    )
  );

revoke all on table public.rfq_communications from anon;
grant select, insert, update on table public.rfq_communications to authenticated;
grant all on table public.rfq_communications to service_role;

-- ---------------------------------------------------------------------------
-- Notification outbox for durable retries
-- ---------------------------------------------------------------------------
create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  notification_type text not null,
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempt_count integer not null default 0,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (status, next_attempt_at)
  where status in ('pending', 'failed');

alter table public.notification_outbox enable row level security;

drop policy if exists notification_outbox_select_staff on public.notification_outbox;
create policy notification_outbox_select_staff on public.notification_outbox
  for select to authenticated
  using (
    public.has_admin_role(array['owner', 'admin']::public.admin_role[])
  );

revoke all on table public.notification_outbox from anon, authenticated;
grant select on table public.notification_outbox to authenticated;
grant all on table public.notification_outbox to service_role;

-- ---------------------------------------------------------------------------
-- Health probe helper for admin system checks
-- ---------------------------------------------------------------------------
create or replace function public.rfq_infrastructure_ping()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object(
    'ok', true,
    'rfqTable', to_regclass('public.rfqs') is not null,
    'rateLimitFn', to_regprocedure('public.check_public_submission_rate_limit(text,text,integer,integer)') is not null,
    'nextRfqNumberFn', to_regprocedure('public.next_rfq_number()') is not null,
    'checkedAt', now()
  );
end;
$$;

revoke all on function public.rfq_infrastructure_ping() from public, anon, authenticated;
grant execute on function public.rfq_infrastructure_ping() to service_role;
