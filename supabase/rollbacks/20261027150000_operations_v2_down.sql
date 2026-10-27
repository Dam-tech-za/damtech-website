-- Rollback for 20261027150000_operations_v2.sql. Run only with the owner's approval.
-- Drops the review queue and reminder log (their rows are lost) and restores the
-- original supplier-order statuses, mapping new statuses to the closest old one.

drop table if exists public.ops_reminder_runs;
drop table if exists public.ops_xero_unmatched;

alter table public.ops_project_tasks drop column if exists owner;

alter table public.ops_projects drop constraint if exists ops_projects_archive_completed;
alter table public.ops_projects drop constraint if exists ops_projects_onedrive_url_check;
alter table public.ops_projects drop column if exists archived_at;
alter table public.ops_projects drop column if exists onedrive_url;
alter table public.ops_projects drop column if exists materials_by_client;
alter table public.ops_projects drop column if exists next_action_owner;

alter table public.ops_material_orders drop constraint if exists ops_material_orders_status_check;
update public.ops_material_orders set status = 'quote_requested' where status in ('not_ordered', 'quoted');
update public.ops_material_orders set status = 'ordered' where status in ('paid', 'problem');
update public.ops_material_orders set status = 'ready' where status = 'ready_for_collection';
update public.ops_material_orders set status = 'received' where status = 'collected_delivered';
alter table public.ops_material_orders alter column status set default 'quote_requested';
alter table public.ops_material_orders add constraint ops_material_orders_status_check check (status in (
  'quote_requested', 'ordered', 'ready', 'received', 'cancelled'
));
alter table public.ops_material_orders drop column if exists xero_bill_number;
alter table public.ops_material_orders drop column if exists fulfilment_notes;
alter table public.ops_material_orders drop column if exists received_date;
alter table public.ops_material_orders drop column if exists unit;

drop index if exists public.ops_material_orders_open_idx;
create index if not exists ops_material_orders_open_idx
  on public.ops_material_orders (status) where status not in ('received', 'cancelled');
