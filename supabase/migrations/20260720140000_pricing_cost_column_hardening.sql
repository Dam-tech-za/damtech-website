-- Harden cost exposure: sell-only RPCs. Base-table RLS is row-level only.

-- Sell-only catalogue RPC (no cost / markup / margin / supplier ids)
create or replace function public.get_pricing_catalogue_sell(
  p_limit integer default 40,
  p_q text default null,
  p_item_type text default null
)
returns table (
  id uuid,
  item_code text,
  item_type text,
  category text,
  name text,
  short_description text,
  quote_description text,
  purchase_unit text,
  quote_unit text,
  conversion_factor numeric,
  default_sell_price numeric,
  pricing_method text,
  tax_category text,
  waste_percent numeric,
  overlap_percent numeric,
  coverage_rate numeric,
  coverage_unit text,
  productivity_rate numeric,
  productivity_unit text,
  price_valid_from date,
  price_valid_to date,
  is_active boolean,
  requires_manual_quantity_confirmation boolean,
  metadata jsonb,
  legacy_material_item_id uuid,
  legacy_labour_item_id uuid,
  legacy_tank_model_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_active_admin() then
    raise exception 'not authorised';
  end if;
  if not public.has_admin_role(
    array['owner','admin','estimator','sales','viewer']::public.admin_role[]
  ) then
    raise exception 'not authorised';
  end if;

  return query
  select
    pi.id,
    pi.item_code,
    pi.item_type::text,
    pi.category,
    pi.name,
    pi.short_description,
    pi.quote_description,
    pi.purchase_unit,
    pi.quote_unit,
    pi.conversion_factor,
    pi.default_sell_price,
    pi.pricing_method::text,
    pi.tax_category::text,
    pi.waste_percent,
    pi.overlap_percent,
    pi.coverage_rate,
    pi.coverage_unit,
    pi.productivity_rate,
    pi.productivity_unit,
    pi.price_valid_from,
    pi.price_valid_to,
    pi.is_active,
    pi.requires_manual_quantity_confirmation,
    coalesce(pi.metadata, '{}'::jsonb) - 'supplier_cost' - 'internal_cost',
    pi.legacy_material_item_id,
    pi.legacy_labour_item_id,
    pi.legacy_tank_model_id,
    pi.created_at,
    pi.updated_at
  from public.pricing_items pi
  where pi.is_active = true
    and (p_item_type is null or pi.item_type::text = p_item_type)
    and (
      p_q is null
      or pi.name ilike '%' || p_q || '%'
      or pi.item_code ilike '%' || p_q || '%'
      or pi.category ilike '%' || p_q || '%'
    )
  order by pi.category, pi.name
  limit greatest(1, least(coalesce(p_limit, 40), 200));
end;
$$;

revoke all on function public.get_pricing_catalogue_sell(integer, text, text) from public;
grant execute on function public.get_pricing_catalogue_sell(integer, text, text) to authenticated;

-- Sell-only price history (no cost_price)
create or replace function public.get_pricing_item_price_history_sell(p_pricing_item_id uuid)
returns table (
  id uuid,
  sell_price numeric,
  source_type text,
  source_reference text,
  valid_from date,
  valid_to date,
  is_preferred boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_active_admin() then
    raise exception 'not authorised';
  end if;
  if not public.has_admin_role(
    array['owner','admin','estimator','sales','viewer']::public.admin_role[]
  ) then
    raise exception 'not authorised';
  end if;

  return query
  select
    p.id,
    p.sell_price,
    p.source_type,
    p.source_reference,
    p.valid_from,
    p.valid_to,
    p.is_preferred,
    p.created_at
  from public.pricing_item_prices p
  where p.pricing_item_id = p_pricing_item_id
  order by p.valid_from desc, p.created_at desc;
end;
$$;

revoke all on function public.get_pricing_item_price_history_sell(uuid) from public;
grant execute on function public.get_pricing_item_price_history_sell(uuid) to authenticated;

-- Travel sell rates without internal_cost_per_km
create or replace function public.get_travel_vehicles_sell()
returns table (
  id uuid,
  vehicle_code text,
  vehicle_name text,
  vehicle_type text,
  sell_rate_per_km numeric,
  base_call_out numeric,
  minimum_charge numeric,
  trailer_surcharge numeric,
  is_active boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_active_admin() then
    raise exception 'not authorised';
  end if;
  if not public.has_admin_role(
    array['owner','admin','estimator','sales','viewer']::public.admin_role[]
  ) then
    raise exception 'not authorised';
  end if;
  return query
  select
    v.id,
    v.vehicle_code,
    v.vehicle_name,
    v.vehicle_type,
    v.sell_rate_per_km,
    v.base_call_out,
    v.minimum_charge,
    v.trailer_surcharge,
    v.is_active
  from public.travel_vehicles v
  where v.is_active = true
  order by v.vehicle_name;
end;
$$;

revoke all on function public.get_travel_vehicles_sell() from public;
grant execute on function public.get_travel_vehicles_sell() to authenticated;

-- Restrict full travel_vehicles rows (incl. internal cost) to cost-authorised roles
drop policy if exists travel_vehicles_select on public.travel_vehicles;
create policy travel_vehicles_select_costs
  on public.travel_vehicles for select to authenticated
  using (public.can_view_internal_costs());

-- Labour sell-facing fields without hourly/daily costs
create or replace function public.get_labour_roles_sell()
returns table (
  id uuid,
  item_code text,
  category text,
  name text,
  unit text,
  sell_rate numeric,
  productivity_rate numeric,
  productivity_unit text,
  is_active boolean,
  pricing_item_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_active_admin() then
    raise exception 'not authorised';
  end if;
  if not public.has_admin_role(
    array['owner','admin','estimator','sales','viewer']::public.admin_role[]
  ) then
    raise exception 'not authorised';
  end if;
  return query
  select
    li.id,
    li.item_code,
    li.category,
    li.name,
    li.unit,
    li.sell_rate,
    li.productivity_rate,
    li.productivity_unit,
    li.is_active,
    li.pricing_item_id
  from public.labour_items li
  where li.is_active = true
  order by li.category, li.name;
end;
$$;

revoke all on function public.get_labour_roles_sell() from public;
grant execute on function public.get_labour_roles_sell() to authenticated;
