-- Rollback for 20261026150000_operations_foundation.sql (Operations 2.0).
--
-- NOT a migration: kept outside supabase/migrations so it never runs by
-- accident. Run by hand, with the owner's go-ahead, only to remove the
-- Operations tables completely.
--
-- Refuses to run while any project, supplier order or sync record exists, so
-- it cannot delete real work. To remove data deliberately, export it first,
-- then set ops.allow_drop_with_data = 'on' in the same session.

do $$
declare
  n bigint := 0;
begin
  if to_regclass('public.ops_projects') is not null then
    select (select count(*) from public.ops_projects)
         + (select count(*) from public.ops_material_orders)
         + (select count(*) from public.ops_sync_runs)
      into n;
  end if;
  if n > 0 and coalesce(current_setting('ops.allow_drop_with_data', true), 'off') <> 'on' then
    raise exception 'Operations tables hold % rows. Export them, then set ops.allow_drop_with_data = on to drop.', n;
  end if;
end;
$$;

drop function if exists public.ops_import_accepted_quote(jsonb);
drop function if exists public.ops_start_sync_run(text, text);

-- Children first; ops_projects last.
drop table if exists public.ops_financial_snapshots;
drop table if exists public.ops_sync_runs;
drop table if exists public.ops_project_activity;
drop table if exists public.ops_project_documents;
drop table if exists public.ops_material_orders;
drop table if exists public.ops_project_tasks;
drop table if exists public.ops_xero_quote_ignores;
drop table if exists public.ops_xero_invoice_links;
drop table if exists public.ops_xero_quote_links;
drop table if exists public.ops_projects;

drop function if exists public.ops_touch_updated_at();

-- Remove the migration record so the migration can be applied again cleanly.
delete from supabase_migrations.schema_migrations where name = 'operations_foundation';
