-- PROPOSED, NOT APPLIED. Review and apply only with the owner's approval,
-- first on a Supabase branch, then production.
--
-- Addresses Supabase security advisor warnings (18 Oct 2026).
--
-- Deliberately NOT revoked here: is_active_admin(), has_admin_role(),
-- current_admin_role(), can_manage_pricing(), can_override_price(),
-- can_view_internal_costs(). They are used inside RLS policies; revoking
-- EXECUTE from a role makes every query by that role on those tables fail
-- with "permission denied for function". They only report the caller's own
-- role, so anonymous execution leaks nothing.
--
-- Before applying, confirm in pg_proc / table defaults that next_rfq_number()
-- and next_quote_number() are only called by the service role (the app calls
-- them from server code with the service-role client). If a column default
-- calls them for anon inserts, keep EXECUTE for anon on that function.

begin;

revoke execute on function public.next_rfq_number() from anon;
revoke execute on function public.next_quote_number() from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
-- Public quote acceptance reads this through the service-role client (lib/quotes/public.ts).
revoke execute on function public.get_quote_id_by_token_hash(text) from anon, authenticated;
-- Admin pages call these as the signed-in admin; anonymous callers never need them.
revoke execute on function public.get_labour_roles_sell() from anon;
revoke execute on function public.get_travel_vehicles_sell() from anon;
revoke execute on function public.get_pricing_catalogue_sell(integer, text, text) from anon;
revoke execute on function public.get_pricing_item_price_history_sell(uuid) from anon;

alter function public.set_updated_at() set search_path = public;

commit;

-- Rollback:
-- grant execute on function public.next_rfq_number() to anon;
-- grant execute on function public.next_quote_number() to anon, authenticated;
-- grant execute on function public.rls_auto_enable() to anon, authenticated;
-- grant execute on function public.get_quote_id_by_token_hash(text) to anon, authenticated;
-- grant execute on function public.get_labour_roles_sell() to anon;
-- grant execute on function public.get_travel_vehicles_sell() to anon;
-- grant execute on function public.get_pricing_catalogue_sell(integer, text, text) to anon;
-- grant execute on function public.get_pricing_item_price_history_sell(uuid) to anon;
-- alter function public.set_updated_at() reset search_path;
--
-- Owner action (dashboard, not SQL): Authentication → Policies → enable
-- leaked-password protection.
