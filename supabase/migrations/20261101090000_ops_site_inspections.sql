-- Site inspection bookings (before a quote is accepted, so no project yet).
--
-- Additive: a new booking kind, five nullable columns on ops_bookings, the
-- save function taught the new fields, and a trigger that links an inspection
-- to its project when that quote is linked to a project (any path: sync,
-- import, "Link quote"). Existing bookings are unchanged.
--
-- Rollback: drop the trigger and function ops_link_inspections_to_project,
-- restore the previous kind check and save function, drop the five columns.

alter table public.ops_bookings
  add column if not exists quote_number text,
  add column if not exists quote_contact_id text,
  add column if not exists quote_snapshot jsonb,
  add column if not exists client_name_manual text,
  add column if not exists site_manual text;

alter table public.ops_bookings drop constraint if exists ops_bookings_kind_check;
alter table public.ops_bookings add constraint ops_bookings_kind_check
  check (kind in ('project', 'site_inspection', 'leave', 'maintenance', 'travel', 'other'));

-- An inspection needs a quote or a client name typed by hand.
alter table public.ops_bookings drop constraint if exists ops_bookings_inspection_client;
alter table public.ops_bookings add constraint ops_bookings_inspection_client
  check (kind <> 'site_inspection' or quote_number is not null or nullif(btrim(client_name_manual), '') is not null);

create index if not exists ops_bookings_quote_idx on public.ops_bookings (upper(quote_number)) where quote_number is not null;

create or replace function public.ops_calendar_save_booking(p jsonb, p_actor uuid, p_actor_label text)
returns jsonb
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_before jsonb;
  v_row public.ops_bookings;
  v_range tstzrange;
  v_cancelled boolean;
  v_team uuid;
  v_res uuid;
  v_project uuid;
begin
  if v_id is not null then
    select to_jsonb(b) into v_before from public.ops_bookings b where b.id = v_id for update;
    if v_before is null then
      raise exception 'booking_not_found';
    end if;
    if (p ? 'expected_version') and (v_before ->> 'version')::int <> (p ->> 'expected_version')::int then
      raise exception 'version_conflict';
    end if;
    update public.ops_bookings set
      project_id = case when p ? 'project_id' then nullif(p ->> 'project_id', '')::uuid else project_id end,
      kind = coalesce(p ->> 'kind', kind),
      title = coalesce(p ->> 'title', title),
      status = coalesce(p ->> 'status', status),
      start_at = coalesce((p ->> 'start_at')::timestamptz, start_at),
      end_at = coalesce((p ->> 'end_at')::timestamptz, end_at),
      all_day = coalesce((p ->> 'all_day')::boolean, all_day),
      notes = case when p ? 'notes' then nullif(p ->> 'notes', '') else notes end,
      allow_overlap = coalesce((p ->> 'allow_overlap')::boolean, allow_overlap),
      overlap_reason = case when p ? 'overlap_reason' then nullif(p ->> 'overlap_reason', '') else overlap_reason end,
      quote_number = case when p ? 'quote_number' then nullif(p ->> 'quote_number', '') else quote_number end,
      quote_contact_id = case when p ? 'quote_contact_id' then nullif(p ->> 'quote_contact_id', '') else quote_contact_id end,
      quote_snapshot = case when p ? 'quote_snapshot' then nullif(p -> 'quote_snapshot', 'null'::jsonb) else quote_snapshot end,
      client_name_manual = case when p ? 'client_name_manual' then nullif(p ->> 'client_name_manual', '') else client_name_manual end,
      site_manual = case when p ? 'site_manual' then nullif(p ->> 'site_manual', '') else site_manual end,
      version = version + 1,
      updated_by = p_actor,
      updated_at = now()
    where id = v_id
    returning * into v_row;
  else
    insert into public.ops_bookings (
      project_id, kind, title, status, start_at, end_at, all_day, notes,
      allow_overlap, overlap_reason, quote_number, quote_contact_id, quote_snapshot,
      client_name_manual, site_manual, created_by, updated_by
    ) values (
      nullif(p ->> 'project_id', '')::uuid,
      coalesce(p ->> 'kind', 'project'),
      p ->> 'title',
      coalesce(p ->> 'status', 'tentative'),
      (p ->> 'start_at')::timestamptz,
      (p ->> 'end_at')::timestamptz,
      coalesce((p ->> 'all_day')::boolean, false),
      nullif(p ->> 'notes', ''),
      coalesce((p ->> 'allow_overlap')::boolean, false),
      nullif(p ->> 'overlap_reason', ''),
      nullif(p ->> 'quote_number', ''),
      nullif(p ->> 'quote_contact_id', ''),
      nullif(p -> 'quote_snapshot', 'null'::jsonb),
      nullif(p ->> 'client_name_manual', ''),
      nullif(p ->> 'site_manual', ''),
      p_actor,
      p_actor
    )
    returning * into v_row;
  end if;

  -- An inspection whose quote is already on a project joins that project.
  if v_row.kind = 'site_inspection' and v_row.project_id is null and v_row.quote_number is not null then
    select l.project_id into v_project
      from public.ops_xero_quote_links l
      where upper(l.quote_number) = upper(v_row.quote_number)
      limit 1;
    if v_project is not null then
      update public.ops_bookings set project_id = v_project where id = v_row.id returning * into v_row;
    end if;
  end if;

  v_range := tstzrange(v_row.start_at, v_row.end_at, '[)');
  v_cancelled := v_row.status = 'cancelled';

  if p ? 'team_ids' then
    delete from public.ops_booking_teams where booking_id = v_row.id;
    for v_team in select (jsonb_array_elements_text(p -> 'team_ids'))::uuid loop
      insert into public.ops_booking_teams (booking_id, team_id, during, blocks_time)
      values (v_row.id, v_team, v_range, not v_cancelled and not v_row.allow_overlap);
    end loop;
  else
    update public.ops_booking_teams
      set during = v_range, blocks_time = not v_cancelled and not v_row.allow_overlap
      where booking_id = v_row.id;
  end if;

  if p ? 'resource_ids' then
    delete from public.ops_booking_resources where booking_id = v_row.id;
    for v_res in select (jsonb_array_elements_text(p -> 'resource_ids'))::uuid loop
      insert into public.ops_booking_resources (booking_id, resource_id, during, blocks_time)
      values (v_row.id, v_res, v_range, not v_cancelled and not v_row.allow_overlap);
    end loop;
  else
    update public.ops_booking_resources
      set during = v_range, blocks_time = not v_cancelled and not v_row.allow_overlap
      where booking_id = v_row.id;
  end if;

  insert into public.ops_booking_audit (booking_id, project_id, actor_id, actor_label, action, before, after)
  values (
    v_row.id, v_row.project_id, p_actor, p_actor_label,
    case when v_before is null then 'created'
         when v_cancelled and (v_before ->> 'status') <> 'cancelled' then 'cancelled'
         else 'updated' end,
    v_before,
    to_jsonb(v_row) || jsonb_build_object(
      'team_ids', (select coalesce(jsonb_agg(team_id), '[]'::jsonb) from public.ops_booking_teams where booking_id = v_row.id)
    )
  );

  if exists (
    select 1 from public.ops_calendar_connections c
    where c.enabled and (
      c.team_id in (select team_id from public.ops_booking_teams where booking_id = v_row.id)
      or c.id in (select connection_id from public.ops_calendar_event_links where booking_id = v_row.id)
    )
  ) then
    insert into public.ops_calendar_outbox (booking_id, booking_version, operation)
    values (v_row.id, v_row.version, case when v_cancelled then 'cancel' else 'upsert' end);
  end if;

  return to_jsonb(v_row);
end;
$$;

-- When a quote is linked to a project, its site inspections join that project.
create or replace function public.ops_link_inspections_to_project()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.ops_bookings
    set project_id = new.project_id, updated_at = now()
    where kind = 'site_inspection'
      and project_id is null
      and upper(quote_number) = upper(new.quote_number);
  return new;
end;
$$;

drop trigger if exists ops_link_inspections_to_project on public.ops_xero_quote_links;
create trigger ops_link_inspections_to_project after insert or update of project_id on public.ops_xero_quote_links
  for each row execute function public.ops_link_inspections_to_project();

revoke all on function public.ops_calendar_save_booking(jsonb, uuid, text) from public, anon, authenticated;
grant execute on function public.ops_calendar_save_booking(jsonb, uuid, text) to service_role;
revoke all on function public.ops_link_inspections_to_project() from public, anon, authenticated;
