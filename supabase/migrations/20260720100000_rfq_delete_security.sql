-- RFQ delete security: restrict hard delete to owner/admin and fix attachment FK.

alter table public.rfqs
  drop constraint if exists rfqs_measurement_report_attachment_id_fkey;

alter table public.rfqs
  add constraint rfqs_measurement_report_attachment_id_fkey
  foreign key (measurement_report_attachment_id)
  references public.rfq_attachments (id)
  on delete set null;

drop policy if exists rfqs_write_staff on public.rfqs;

create policy rfqs_insert_staff on public.rfqs
  for insert to authenticated
  with check (
    public.has_admin_role(
      array['owner', 'admin', 'sales', 'estimator']::public.admin_role[]
    )
  );

create policy rfqs_update_staff on public.rfqs
  for update to authenticated
  using (
    public.has_admin_role(
      array['owner', 'admin', 'sales', 'estimator']::public.admin_role[]
    )
  )
  with check (
    public.has_admin_role(
      array['owner', 'admin', 'sales', 'estimator']::public.admin_role[]
    )
  );

create policy rfqs_delete_owner_admin on public.rfqs
  for delete to authenticated
  using (
    public.has_admin_role(array['owner', 'admin']::public.admin_role[])
  );
