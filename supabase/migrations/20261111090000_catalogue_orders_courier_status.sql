-- Courier status for online shop orders, filled in by the Courier Guy
-- (Ship Logic) tracking check. Additive only: nullable columns on the
-- existing server-only table, so no new grants or policies are needed.

alter table public.catalogue_orders
  add column if not exists courier_status text,
  add column if not exists courier_status_at timestamptz,
  add column if not exists courier_last_message text,
  add column if not exists courier_events jsonb,
  add column if not exists courier_checked_at timestamptz,
  add column if not exists courier_cost numeric(12, 2),
  add column if not exists courier_depot text;
