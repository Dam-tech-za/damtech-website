-- =============================================================================
-- Company brand assets storage + optional branding paths
-- Apply after quote phase 3 settings tables exist.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists company_assets_storage_select on storage.objects;
create policy company_assets_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'company-assets'
  and public.has_admin_role(array['owner','admin','sales','estimator','viewer']::public.admin_role[])
);

drop policy if exists company_assets_storage_insert on storage.objects;
create policy company_assets_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'company-assets'
  and public.has_admin_role(array['owner','admin']::public.admin_role[])
);

drop policy if exists company_assets_storage_update on storage.objects;
create policy company_assets_storage_update on storage.objects
for update to authenticated
using (
  bucket_id = 'company-assets'
  and public.has_admin_role(array['owner','admin']::public.admin_role[])
)
with check (
  bucket_id = 'company-assets'
  and public.has_admin_role(array['owner','admin']::public.admin_role[])
);

drop policy if exists company_assets_storage_delete on storage.objects;
create policy company_assets_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'company-assets'
  and public.has_admin_role(array['owner','admin']::public.admin_role[])
);

alter table public.company_settings
  add column if not exists signature_storage_path text,
  add column if not exists header_image_storage_path text;

alter table public.quote_pdf_settings
  add column if not exists signature_storage_path text,
  add column if not exists header_image_storage_path text;
