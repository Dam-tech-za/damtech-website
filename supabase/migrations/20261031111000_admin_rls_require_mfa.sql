-- Require two-step verification (Supabase MFA, aal2) for admin data access
-- at the database level, not only in the app.
--
-- Every admin RLS policy goes through is_active_admin() or
-- current_admin_role() (has_admin_role and the can_* helpers call them).
-- A password-only session (aal1) now gets no admin rows, so a stolen password
-- cannot read data by calling the Supabase API directly.
--
-- Unaffected: the service-role client (bypasses RLS) and the
-- admin_profiles "select self" policy (id = auth.uid()), which the
-- two-step page needs before the code is entered.
--
-- APPLY ONLY AFTER the app with the /admin/mfa/ page is deployed and every
-- admin has enrolled an authenticator app; otherwise admins at aal1 see empty
-- lists until they verify.

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    and exists (
      select 1
      from public.admin_profiles
      where id = auth.uid()
        and is_active = true
    );
$$;

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
    and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
  limit 1;
$$;

-- Rollback: re-create both functions without the aal check
-- (see supabase/migrations/20260715120000_admin_auth_phase1.sql).
