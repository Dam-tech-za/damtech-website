alter table public.ops_projects drop constraint if exists ops_projects_site_province_check;
alter table public.ops_projects drop constraint if exists ops_projects_km_pretoria_check;
alter table public.ops_projects drop constraint if exists ops_projects_km_wc_check;
alter table public.ops_projects drop column if exists site_province;
alter table public.ops_projects drop column if exists site_town;
alter table public.ops_projects drop column if exists km_from_pretoria;
alter table public.ops_projects drop column if exists km_from_western_cape;
