-- Delivery tracking for online shop orders (admin "Online Purchases").
-- Additive only: nullable columns on the existing server-only table, so no
-- new grants or policies are needed.

alter table public.catalogue_orders
  add column if not exists courier_name text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists dispatched_on date,
  add column if not exists expected_delivery_on date,
  add column if not exists delivered_on date,
  add column if not exists fulfilment_notes text;

alter table public.catalogue_orders
  drop constraint if exists catalogue_orders_tracking_url_check;
alter table public.catalogue_orders
  add constraint catalogue_orders_tracking_url_check
  check (tracking_url is null or tracking_url ~ '^https://');
