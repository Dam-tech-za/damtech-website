-- Project Templates: reusable estimating & quotation content for recurring
-- Damtech project types. Idempotent / additive: safe to re-run.

-- ---------------------------------------------------------------------------
-- project_templates
-- ---------------------------------------------------------------------------

create table if not exists public.project_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  short_description text,
  project_category text,
  default_material_type text,
  default_service_type text,
  default_quote_title text,
  default_project_description text,
  default_scope text,
  default_assumptions text,
  default_exclusions text,
  default_customer_message text,
  default_internal_notes text,

  -- optional
  recommended_material_item_id uuid references public.pricing_items (id),
  recommended_installation_item_id uuid references public.pricing_items (id),
  recommended_geotextile_item_id uuid references public.pricing_items (id),
  recommended_site_establishment_item_id uuid references public.pricing_items (id),
  default_warranty_text text,
  default_validity_days integer,
  default_lead_time_text text,
  default_duration_text text,
  technical_guidance text,
  required_information text,
  recommended_information text,
  risk_flags jsonb not null default '[]'::jsonb,

  -- item codes requested by seeds that could not be resolved to a pricing_item
  unresolved_item_codes jsonb not null default '[]'::jsonb,

  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_templates_category_idx on public.project_templates (project_category);
create index if not exists project_templates_active_idx on public.project_templates (is_active);
create index if not exists project_templates_sort_idx on public.project_templates (sort_order);

drop trigger if exists project_templates_set_updated_at on public.project_templates;
create trigger project_templates_set_updated_at
before update on public.project_templates
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_template_items (suggested quote lines)
-- ---------------------------------------------------------------------------

create table if not exists public.project_template_items (
  id uuid primary key default gen_random_uuid(),
  project_template_id uuid not null references public.project_templates (id) on delete cascade,
  pricing_item_id uuid references public.pricing_items (id),
  -- retained item code for later linking when pricing_item_id is null
  requested_item_code text,
  line_role text not null default 'other',
  default_quantity_source text not null default 'manual',
  default_quantity numeric(18, 4),
  default_unit text,
  description_override text,
  is_optional boolean not null default false,
  is_selected_by_default boolean not null default true,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_template_items_template_idx
  on public.project_template_items (project_template_id);
create index if not exists project_template_items_pricing_idx
  on public.project_template_items (pricing_item_id);

drop trigger if exists project_template_items_set_updated_at on public.project_template_items;
create trigger project_template_items_set_updated_at
before update on public.project_template_items
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_template_sections (structured, ordered clauses)
-- ---------------------------------------------------------------------------

create table if not exists public.project_template_sections (
  id uuid primary key default gen_random_uuid(),
  project_template_id uuid not null references public.project_templates (id) on delete cascade,
  section_type text not null,
  heading text,
  content text not null default '',
  sort_order integer not null default 0,
  is_default boolean not null default true,
  is_required boolean not null default false,
  is_customer_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_template_sections_template_idx
  on public.project_template_sections (project_template_id);
create index if not exists project_template_sections_type_idx
  on public.project_template_sections (section_type);

drop trigger if exists project_template_sections_set_updated_at on public.project_template_sections;
create trigger project_template_sections_set_updated_at
before update on public.project_template_sections
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_template_fields (required / recommended project-info fields)
-- ---------------------------------------------------------------------------

create table if not exists public.project_template_fields (
  id uuid primary key default gen_random_uuid(),
  project_template_id uuid not null references public.project_templates (id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null default 'text',
  is_required boolean not null default false,
  is_recommended boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  unit text,
  help_text text,
  -- which line_role / quantity_source this field can feed (auto-populate)
  quantity_target text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_template_id, field_key)
);

create index if not exists project_template_fields_template_idx
  on public.project_template_fields (project_template_id);

drop trigger if exists project_template_fields_set_updated_at on public.project_template_fields;
create trigger project_template_fields_set_updated_at
before update on public.project_template_fields
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_template_versions (immutable snapshots)
-- ---------------------------------------------------------------------------

create table if not exists public.project_template_versions (
  id uuid primary key default gen_random_uuid(),
  project_template_id uuid not null references public.project_templates (id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  change_summary text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (project_template_id, version_number)
);

create index if not exists project_template_versions_template_idx
  on public.project_template_versions (project_template_id);

-- ---------------------------------------------------------------------------
-- Quote linkage columns + customer snapshot audit
-- ---------------------------------------------------------------------------

alter table public.quotes
  add column if not exists project_template_id uuid references public.project_templates (id),
  add column if not exists project_template_version_id uuid references public.project_template_versions (id),
  add column if not exists project_template_snapshot jsonb,
  add column if not exists customer_snapshot_refreshed_at timestamptz;

-- Quote line: quantity source + suggestion flag live in the existing metadata jsonb.

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.project_templates enable row level security;
alter table public.project_template_items enable row level security;
alter table public.project_template_sections enable row level security;
alter table public.project_template_fields enable row level security;
alter table public.project_template_versions enable row level security;

-- Read: estimating + sales staff. Write: can_manage_pricing (owner/admin/estimator).

drop policy if exists project_templates_select_staff on public.project_templates;
create policy project_templates_select_staff
  on public.project_templates for select to authenticated
  using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));

drop policy if exists project_templates_write_staff on public.project_templates;
create policy project_templates_write_staff
  on public.project_templates for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

drop policy if exists project_template_items_select_staff on public.project_template_items;
create policy project_template_items_select_staff
  on public.project_template_items for select to authenticated
  using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));

drop policy if exists project_template_items_write_staff on public.project_template_items;
create policy project_template_items_write_staff
  on public.project_template_items for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

drop policy if exists project_template_sections_select_staff on public.project_template_sections;
create policy project_template_sections_select_staff
  on public.project_template_sections for select to authenticated
  using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));

drop policy if exists project_template_sections_write_staff on public.project_template_sections;
create policy project_template_sections_write_staff
  on public.project_template_sections for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

drop policy if exists project_template_fields_select_staff on public.project_template_fields;
create policy project_template_fields_select_staff
  on public.project_template_fields for select to authenticated
  using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));

drop policy if exists project_template_fields_write_staff on public.project_template_fields;
create policy project_template_fields_write_staff
  on public.project_template_fields for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

drop policy if exists project_template_versions_select_staff on public.project_template_versions;
create policy project_template_versions_select_staff
  on public.project_template_versions for select to authenticated
  using (public.has_admin_role(array['owner','admin','estimator','viewer','sales']::public.admin_role[]));

drop policy if exists project_template_versions_write_staff on public.project_template_versions;
create policy project_template_versions_write_staff
  on public.project_template_versions for all to authenticated
  using (public.can_manage_pricing())
  with check (public.can_manage_pricing());

grant select on public.project_templates to authenticated;
grant select on public.project_template_items to authenticated;
grant select on public.project_template_sections to authenticated;
grant select on public.project_template_fields to authenticated;
grant select on public.project_template_versions to authenticated;
