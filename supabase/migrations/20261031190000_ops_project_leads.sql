-- Saved list of project leads for the Projects board "Person" menu.
--
-- Additive: one new table, seeded with the three names the board used to have
-- written into code. Projects keep storing the lead's name on the project
-- (ops_projects.project_lead_name); this table is only the pick list.
-- Same access model as the other ops_* tables (service role only).
--
-- Rollback: drop table public.ops_project_leads.

create table if not exists public.ops_project_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  created_by uuid references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists ops_project_leads_name_idx on public.ops_project_leads (lower(btrim(name)));

insert into public.ops_project_leads (name)
values ('Andre'), ('Annemieke De Lange'), ('Arno')
on conflict do nothing;

alter table public.ops_project_leads enable row level security;
revoke all on table public.ops_project_leads from anon, authenticated;
grant all on table public.ops_project_leads to service_role;
