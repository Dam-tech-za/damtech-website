-- Operations board v3: structured site location and km from each office.
-- Additive. Do not apply to production without the owner's go-ahead.

alter table public.ops_projects
  add column if not exists site_province text,
  add column if not exists site_town text,
  add column if not exists km_from_pretoria numeric(8,1),
  add column if not exists km_from_western_cape numeric(8,1);

alter table public.ops_projects drop constraint if exists ops_projects_site_province_check;
alter table public.ops_projects
  add constraint ops_projects_site_province_check check (
    site_province is null or site_province in (
      'Eastern Cape',
      'Free State',
      'Gauteng',
      'KwaZulu-Natal',
      'Limpopo',
      'Mpumalanga',
      'North West',
      'Northern Cape',
      'Western Cape'
    )
  );

alter table public.ops_projects drop constraint if exists ops_projects_km_pretoria_check;
alter table public.ops_projects
  add constraint ops_projects_km_pretoria_check check (
    km_from_pretoria is null or (km_from_pretoria >= 0 and km_from_pretoria <= 5000)
  );

alter table public.ops_projects drop constraint if exists ops_projects_km_wc_check;
alter table public.ops_projects
  add constraint ops_projects_km_wc_check check (
    km_from_western_cape is null or (km_from_western_cape >= 0 and km_from_western_cape <= 5000)
  );

comment on column public.ops_projects.site_province is
  'South African province picked on the operations board; used for distance filters.';
comment on column public.ops_projects.site_town is
  'Town picked from the curated SA list, or typed when the town is not listed.';
comment on column public.ops_projects.km_from_pretoria is
  'One-way km from the Villieria (Pretoria) yard, computed from the town pin.';
comment on column public.ops_projects.km_from_western_cape is
  'One-way km from the Betty''s Bay yard, computed from the town pin.';
