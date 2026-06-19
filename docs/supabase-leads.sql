-- Run in Supabase SQL editor before enabling production form submissions.
-- Use SUPABASE_SERVICE_ROLE_KEY on the server only (never in the browser).

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  company text,
  phone text,
  email text,
  province text,
  service_required text,
  project_size text,
  project_location text,
  message text,
  source_page text
);

alter table public.leads enable row level security;

-- Optional: allow anon inserts if using SUPABASE_ANON_KEY instead of service role
-- create policy "Allow public lead inserts"
--   on public.leads for insert
--   to anon
--   with check (true);
