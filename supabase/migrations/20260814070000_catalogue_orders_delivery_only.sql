-- Switch catalogue orders from collection to delivery-only fulfilmentment.
-- Pretoria may remain an internal dispatch origin; it is not a public collection point.

alter table public.catalogue_orders
  drop constraint if exists catalogue_orders_fulfilment_check;

update public.catalogue_orders
set fulfilment_method = 'delivery_south_africa'
where fulfilment_method = 'collection_customer_arranged';

alter table public.catalogue_orders
  alter column fulfilment_method set default 'delivery_south_africa';

alter table public.catalogue_orders
  add constraint catalogue_orders_fulfilment_check
  check (fulfilment_method = 'delivery_south_africa');

alter table public.catalogue_orders
  drop constraint if exists catalogue_orders_status_check;

update public.catalogue_orders
set status = 'ready_for_delivery'
where status = 'ready_for_collection';

alter table public.catalogue_orders
  add constraint catalogue_orders_status_check
  check (status in (
    'pending_invoice',
    'invoice_sent',
    'awaiting_payment',
    'paid',
    'processing',
    'ready_for_delivery',
    'completed',
    'cancelled'
  ));

comment on table public.catalogue_orders is
  'Genuine fixed-price supply-only kit orders for delivery throughout South Africa. Prices are server-side catalogue snapshots. Delivery charges are confirmed on the DamTech invoice and are never invented in the online total.';
