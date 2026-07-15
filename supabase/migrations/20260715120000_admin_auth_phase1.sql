-- Damtech Administration — Phase 1 auth schema
-- Enums, profiles, allowlist, audit log, RLS helpers and policies.

create extension if not exists "pgcrypto";

create type public.admin_role as enum (
  'owner',
  'admin',
  'sales',
  'estimator',
  'viewer'
);

create table public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  role public.admin_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index admin_profiles_role_idx on public.admin_profiles (role);
create index admin_profiles_active_idx on public.admin_profiles (is_active);

create table public.admin_email_allowlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  assigned_role public.admin_role not null default 'viewer',
  is_active boolean not null default true,
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  constraint admin_email_allowlist_email_lowercase
    check (email = lower(email))
);

create index admin_email_allowlist_active_idx
  on public.admin_email_allowlist (is_active);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id),
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_user_id);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS helpers (security definer — read caller's profile safely)
-- ---------------------------------------------------------------------------

create or replace function public.current_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.admin_profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.has_admin_role(required_roles public.admin_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_admin_role() = any (required_roles),
    false
  );
$$;

revoke all on function public.current_admin_role() from public;
revoke all on function public.is_active_admin() from public;
revoke all on function public.has_admin_role(public.admin_role[]) from public;

grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.is_active_admin() to authenticated;
grant execute on function public.has_admin_role(public.admin_role[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.admin_profiles enable row level security;
alter table public.admin_email_allowlist enable row level security;
alter table public.audit_log enable row level security;

-- Deny by default: no policies for anon.

-- Profiles: active admins can read their own row; owners/admins can read all.
create policy admin_profiles_select_self_or_managers
on public.admin_profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.has_admin_role(array['owner', 'admin']::public.admin_role[])
);

-- Profiles: only owners may insert/update/delete (service role used at login upsert).
create policy admin_profiles_owner_insert
on public.admin_profiles
for insert
to authenticated
with check (public.has_admin_role(array['owner']::public.admin_role[]));

create policy admin_profiles_owner_update
on public.admin_profiles
for update
to authenticated
using (public.has_admin_role(array['owner']::public.admin_role[]))
with check (public.has_admin_role(array['owner']::public.admin_role[]));

create policy admin_profiles_owner_delete
on public.admin_profiles
for delete
to authenticated
using (public.has_admin_role(array['owner']::public.admin_role[]));

-- Allowlist: owner-only management; owners/admins may read.
create policy admin_allowlist_select_managers
on public.admin_email_allowlist
for select
to authenticated
using (public.has_admin_role(array['owner', 'admin']::public.admin_role[]));

create policy admin_allowlist_owner_insert
on public.admin_email_allowlist
for insert
to authenticated
with check (public.has_admin_role(array['owner']::public.admin_role[]));

create policy admin_allowlist_owner_update
on public.admin_email_allowlist
for update
to authenticated
using (public.has_admin_role(array['owner']::public.admin_role[]))
with check (public.has_admin_role(array['owner']::public.admin_role[]));

create policy admin_allowlist_owner_delete
on public.admin_email_allowlist
for delete
to authenticated
using (public.has_admin_role(array['owner']::public.admin_role[]));

-- Audit log: owners/admins read; inserts via service role (no authenticated insert policy).
create policy audit_log_select_managers
on public.audit_log
for select
to authenticated
using (public.has_admin_role(array['owner', 'admin']::public.admin_role[]));

-- ---------------------------------------------------------------------------
-- Bootstrap note (run manually after migration — do NOT commit real emails)
-- ---------------------------------------------------------------------------
-- insert into public.admin_email_allowlist (email, assigned_role, is_active)
-- values ('REPLACE_WITH_APPROVED_GOOGLE_EMAIL', 'owner', true);
