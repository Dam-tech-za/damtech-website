-- Security advisor fixes (approved by the owner 31 Oct 2026).
-- Source: docs/admin/proposed-advisor-fixes.sql.
--
-- The app calls next_rfq_number, next_quote_number and
-- get_quote_id_by_token_hash only through the service-role client, and the
-- *_sell pricing functions only as a signed-in admin. No column default,
-- trigger or other function calls them.
--
-- Deliberately NOT revoked: is_active_admin(), has_admin_role(),
-- current_admin_role(), can_manage_pricing(), can_override_price(),
-- can_view_internal_costs(). RLS policies call them as anon/authenticated.

revoke execute on function public.next_rfq_number() from anon, authenticated;
revoke execute on function public.next_quote_number() from anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.get_quote_id_by_token_hash(text) from anon, authenticated;
revoke execute on function public.get_labour_roles_sell() from anon;
revoke execute on function public.get_travel_vehicles_sell() from anon;
revoke execute on function public.get_pricing_catalogue_sell(integer, text, text) from anon;
revoke execute on function public.get_pricing_item_price_history_sell(uuid) from anon;

alter function public.set_updated_at() set search_path = public;

-- Rollback:
-- grant execute on function public.next_rfq_number() to anon, authenticated;
-- grant execute on function public.next_quote_number() to anon, authenticated;
-- grant execute on function public.rls_auto_enable() to public, anon, authenticated;
-- grant execute on function public.get_quote_id_by_token_hash(text) to anon, authenticated;
-- grant execute on function public.get_labour_roles_sell() to anon;
-- grant execute on function public.get_travel_vehicles_sell() to anon;
-- grant execute on function public.get_pricing_catalogue_sell(integer, text, text) to anon;
-- grant execute on function public.get_pricing_item_price_history_sell(uuid) to anon;
-- alter function public.set_updated_at() reset search_path;
