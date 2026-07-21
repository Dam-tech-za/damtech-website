-- Quote project-information flow: manual RFQ references, template application
-- audit, project field values, fuller template descriptions and per-template
-- project-information field definitions. Idempotent.

-- ---------------------------------------------------------------------------
-- Quote columns
-- ---------------------------------------------------------------------------
alter table public.quotes
  add column if not exists manual_rfq_reference text,
  add column if not exists rfq_reference_snapshot text,
  add column if not exists template_applied_at timestamptz,
  add column if not exists template_applied_by uuid references auth.users (id),
  add column if not exists project_field_values jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Fuller default project descriptions (overwrite the short-subtitle defaults)
-- ---------------------------------------------------------------------------
update public.project_templates set default_project_description =
  'Supply and installation of a new HDPE geomembrane lining system to a prepared dam, pond, reservoir or containment area, including confirmation of the installation area, thermal welding of primary seams, extrusion detailing at penetrations and terminations, seam inspection and preparation of the completed liner for controlled filling.'
  where code = 'PT-HDPE-NEW';

update public.project_templates set default_project_description =
  'Inspection and local repair of accessible defects in an existing HDPE geomembrane liner, including marking of punctures, tears and failed welds, preparation and welding of compatible patches, and non-destructive checks on the completed repairs.'
  where code = 'PT-HDPE-REPAIR';

update public.project_templates set default_project_description =
  'Supply and installation of a new reinforced PVC liner to a prepared dam or reservoir, including dimensional verification, fabrication or preparation of liner panels, installation over the prepared substrate, seaming and detailing, and preparation for controlled filling.'
  where code = 'PT-PVC-NEW';

update public.project_templates set default_project_description =
  'Replacement of the existing reinforced PVC liner within a steel or similar water-storage tank, including dimensional verification, supply of a replacement liner, installation, detailing around the specified fittings and inspection before controlled filling.'
  where code = 'PT-PVC-TANK-REPLACE';

update public.project_templates set default_project_description =
  'Supply and installation of a Dortom lining membrane to a prepared dam or reservoir, including substrate inspection, panel positioning and joining using the approved product-specific method, perimeter and penetration detailing, and preparation for controlled filling.'
  where code = 'PT-DORTOM-NEW';

update public.project_templates set default_project_description =
  'Installation of a torch-applied bituminous waterproofing system to the specified substrate, including surface preparation, priming, membrane application, forming of laps, upstands and terminations, detailing of outlets and penetrations, and inspection of the completed work.'
  where code = 'PT-TORCH-NEW';

update public.project_templates set default_project_description =
  'Local repair of accessible torch-on waterproofing defects, including removal of failed membrane where required, surface preparation, priming and installation of torch-on patches or replacement strips, and inspection of the repaired areas.'
  where code = 'PT-TORCH-REPAIR';

update public.project_templates set default_project_description =
  'Application of a liquid-applied waterproofing system to the prepared substrate, including surface preparation, priming, reinforcement of details, application of the specified number of coats at the required consumption rate, and inspection of the cured coating.'
  where code = 'PT-LIQUID-WPF';

update public.project_templates set default_project_description =
  'Application of a cementitious waterproofing system to a concrete or masonry substrate, including surface preparation, local defect repair, application of the specified coats, detailing of corners and joints, and curing and inspection of the completed work.'
  where code = 'PT-CEMENTITIOUS-WPF';

update public.project_templates set default_project_description =
  'Supply and installation of a corrugated steel water-storage tank with internal liner, including confirmation of usable capacity, delivery, assembly of the tank structure and roof where included, liner installation, fitting of inlet, outlet, overflow and drain connections, and inspection before controlled filling.'
  where code = 'PT-STEEL-TANK-NEW';

update public.project_templates set default_project_description =
  'Waterproofing refurbishment of a concrete reservoir, including inspection of drained and cleaned surfaces, local defect and joint repair, application of the selected waterproofing system, curing, and inspection before controlled refilling.'
  where code = 'PT-CONCRETE-RESERVOIR-REFURB';

-- ---------------------------------------------------------------------------
-- Per-template project-information field definitions
-- ---------------------------------------------------------------------------
create or replace function pg_temp.pt_seed_field(
  p_code text,
  p_key text,
  p_label text,
  p_type text,
  p_required boolean,
  p_recommended boolean,
  p_sort integer,
  p_quantity_target text default null,
  p_unit text default null
) returns void language plpgsql as $$
declare
  v_id uuid;
begin
  select id into v_id from public.project_templates where code = p_code;
  if v_id is null then
    return;
  end if;
  insert into public.project_template_fields (
    project_template_id, field_key, label, field_type,
    is_required, is_recommended, sort_order, quantity_target, unit
  ) values (
    v_id, p_key, p_label, p_type,
    p_required, p_recommended, p_sort, p_quantity_target, p_unit
  )
  on conflict (project_template_id, field_key) do nothing;
end;
$$;

-- Template 1 — New HDPE Geomembrane Installation
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'project_location', 'Project location', 'text', true, true, 10);
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'province', 'Province', 'text', false, true, 20);
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'measured_area', 'Measured / installation area', 'area', false, true, 30, 'measured_area', 'm²');
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'perimeter', 'Perimeter', 'length', false, true, 40, 'perimeter', 'm');
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'depth', 'Depth', 'length', false, true, 50, null, 'm');
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'side_slope', 'Side slope', 'text', false, true, 60);
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'liner_thickness', 'HDPE thickness', 'text', false, true, 70);
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'penetration_count', 'Number of penetrations', 'number', false, true, 80, 'penetration_count');
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'substrate_condition', 'Substrate condition', 'text', false, true, 90);
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'stored_liquid', 'Stored liquid', 'text', false, true, 100);
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'geotextile_required', 'Geotextile required', 'boolean', false, true, 110);
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'anchor_trench_required', 'Anchor trench required', 'boolean', false, true, 120);
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'travel_distance', 'Travel distance', 'length', false, true, 130, 'distance', 'km');
select pg_temp.pt_seed_field('PT-HDPE-NEW', 'requested_completion_date', 'Requested completion date', 'date', false, false, 140);

-- Template 2 — HDPE Geomembrane Repair
select pg_temp.pt_seed_field('PT-HDPE-REPAIR', 'project_location', 'Project location', 'text', true, true, 10);
select pg_temp.pt_seed_field('PT-HDPE-REPAIR', 'liner_material', 'Existing liner material', 'text', false, true, 20);
select pg_temp.pt_seed_field('PT-HDPE-REPAIR', 'liner_thickness', 'Existing liner thickness', 'text', false, true, 30);
select pg_temp.pt_seed_field('PT-HDPE-REPAIR', 'penetration_count', 'Estimated number of repairs', 'number', false, true, 40, 'penetration_count');
select pg_temp.pt_seed_field('PT-HDPE-REPAIR', 'tank_drained', 'Dam drained and cleaned', 'boolean', false, true, 50);
select pg_temp.pt_seed_field('PT-HDPE-REPAIR', 'access_condition', 'Access and slope condition', 'text', false, true, 60);
select pg_temp.pt_seed_field('PT-HDPE-REPAIR', 'travel_distance', 'Travel distance', 'length', false, true, 70, 'distance', 'km');

-- Template 3 — New Reinforced PVC Liner Installation
select pg_temp.pt_seed_field('PT-PVC-NEW', 'project_location', 'Project location', 'text', true, true, 10);
select pg_temp.pt_seed_field('PT-PVC-NEW', 'measured_area', 'Measured area', 'area', false, true, 20, 'measured_area', 'm²');
select pg_temp.pt_seed_field('PT-PVC-NEW', 'perimeter', 'Perimeter', 'length', false, true, 30, 'perimeter', 'm');
select pg_temp.pt_seed_field('PT-PVC-NEW', 'depth', 'Depth / freeboard', 'length', false, true, 40, null, 'm');
select pg_temp.pt_seed_field('PT-PVC-NEW', 'gsm', 'Liner GSM / reinforcement', 'number', false, true, 50);
select pg_temp.pt_seed_field('PT-PVC-NEW', 'penetration_count', 'Outlets and penetrations', 'number', false, true, 60, 'penetration_count');
select pg_temp.pt_seed_field('PT-PVC-NEW', 'substrate_condition', 'Substrate condition', 'text', false, true, 70);
select pg_temp.pt_seed_field('PT-PVC-NEW', 'stored_liquid', 'Stored liquid', 'text', false, true, 80);
select pg_temp.pt_seed_field('PT-PVC-NEW', 'geotextile_required', 'Geotextile required', 'boolean', false, true, 90);
select pg_temp.pt_seed_field('PT-PVC-NEW', 'travel_distance', 'Travel distance', 'length', false, true, 100, 'distance', 'km');

-- Template 4 — PVC Tank Liner Replacement (full field set)
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'tank_manufacturer_model', 'Tank manufacturer or model', 'text', false, true, 10);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'nominal_capacity', 'Nominal capacity', 'capacity', false, true, 20, 'tank_count', 'kL');
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'tank_diameter', 'Tank diameter', 'length', true, true, 30, null, 'm');
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'tank_wall_height', 'Tank wall height', 'length', true, true, 40, null, 'm');
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'existing_liner_material', 'Existing liner material', 'text', false, true, 50);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'existing_liner_condition', 'Existing liner condition', 'text', false, true, 60);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'replacement_liner_gsm', 'Replacement liner GSM', 'number', false, true, 70);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'inlet_diameter', 'Inlet diameter', 'length', false, true, 80, null, 'mm');
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'outlet_diameter', 'Outlet diameter', 'length', false, true, 90, null, 'mm');
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'overflow_diameter', 'Overflow diameter', 'length', false, true, 100, null, 'mm');
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'drain_diameter', 'Drain diameter', 'length', false, true, 110, null, 'mm');
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'roof_type', 'Roof type', 'text', false, true, 120);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'access_opening', 'Access opening', 'text', false, true, 130);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'existing_liner_removal', 'Existing liner removal required', 'boolean', false, true, 140);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'tank_drained', 'Tank drained', 'boolean', false, true, 150);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'tank_cleaned', 'Tank cleaned', 'boolean', false, true, 160);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'geotextile_required', 'Geotextile or cushioning required', 'boolean', false, true, 170);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'stored_liquid', 'Stored liquid', 'text', false, true, 180);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'site_location', 'Site location', 'text', true, true, 190);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'delivery_access', 'Delivery access', 'text', false, true, 200);
select pg_temp.pt_seed_field('PT-PVC-TANK-REPLACE', 'target_installation_date', 'Target installation date', 'date', false, true, 210);

-- Template 5 — Dortom Liner Installation
select pg_temp.pt_seed_field('PT-DORTOM-NEW', 'project_location', 'Project location', 'text', true, true, 10);
select pg_temp.pt_seed_field('PT-DORTOM-NEW', 'measured_area', 'Measured area', 'area', false, true, 20, 'measured_area', 'm²');
select pg_temp.pt_seed_field('PT-DORTOM-NEW', 'perimeter', 'Perimeter', 'length', false, true, 30, 'perimeter', 'm');
select pg_temp.pt_seed_field('PT-DORTOM-NEW', 'substrate_condition', 'Substrate condition', 'text', false, true, 40);
select pg_temp.pt_seed_field('PT-DORTOM-NEW', 'penetration_count', 'Penetrations and terminations', 'number', false, true, 50, 'penetration_count');
select pg_temp.pt_seed_field('PT-DORTOM-NEW', 'geotextile_required', 'Geotextile required', 'boolean', false, true, 60);
select pg_temp.pt_seed_field('PT-DORTOM-NEW', 'travel_distance', 'Travel distance', 'length', false, true, 70, 'distance', 'km');

-- Template 6 — Torch-on Waterproofing Installation
select pg_temp.pt_seed_field('PT-TORCH-NEW', 'project_location', 'Project location', 'text', true, true, 10);
select pg_temp.pt_seed_field('PT-TORCH-NEW', 'measured_area', 'Measured plan area', 'area', false, true, 20, 'measured_area', 'm²');
select pg_temp.pt_seed_field('PT-TORCH-NEW', 'substrate_type', 'Substrate type', 'text', false, true, 30);
select pg_temp.pt_seed_field('PT-TORCH-NEW', 'existing_liner', 'Existing membrane present', 'boolean', false, true, 40);
select pg_temp.pt_seed_field('PT-TORCH-NEW', 'liner_thickness', 'Membrane thickness and finish', 'text', false, true, 50);
select pg_temp.pt_seed_field('PT-TORCH-NEW', 'penetration_count', 'Outlets and penetrations', 'number', false, true, 60, 'penetration_count');
select pg_temp.pt_seed_field('PT-TORCH-NEW', 'access_condition', 'Access / height', 'text', false, true, 70);
select pg_temp.pt_seed_field('PT-TORCH-NEW', 'travel_distance', 'Travel distance', 'length', false, true, 80, 'distance', 'km');

-- Template 7 — Torch-on Waterproofing Repair
select pg_temp.pt_seed_field('PT-TORCH-REPAIR', 'project_location', 'Project location', 'text', true, true, 10);
select pg_temp.pt_seed_field('PT-TORCH-REPAIR', 'measured_area', 'Repair area', 'area', false, true, 20, 'measured_area', 'm²');
select pg_temp.pt_seed_field('PT-TORCH-REPAIR', 'substrate_type', 'Existing membrane type', 'text', false, true, 30);
select pg_temp.pt_seed_field('PT-TORCH-REPAIR', 'access_condition', 'Access / height', 'text', false, true, 40);
select pg_temp.pt_seed_field('PT-TORCH-REPAIR', 'travel_distance', 'Travel distance', 'length', false, true, 50, 'distance', 'km');

-- Template 8 — Liquid-applied Waterproofing
select pg_temp.pt_seed_field('PT-LIQUID-WPF', 'project_location', 'Project location', 'text', true, true, 10);
select pg_temp.pt_seed_field('PT-LIQUID-WPF', 'measured_area', 'Measured area', 'area', false, true, 20, 'measured_area', 'm²');
select pg_temp.pt_seed_field('PT-LIQUID-WPF', 'substrate_type', 'Substrate type', 'text', false, true, 30);
select pg_temp.pt_seed_field('PT-LIQUID-WPF', 'substrate_condition', 'Substrate condition / moisture', 'text', false, true, 40);
select pg_temp.pt_seed_field('PT-LIQUID-WPF', 'access_condition', 'Traffic / exposure', 'text', false, true, 50);
select pg_temp.pt_seed_field('PT-LIQUID-WPF', 'travel_distance', 'Travel distance', 'length', false, true, 60, 'distance', 'km');

-- Template 9 — Cementitious Waterproofing
select pg_temp.pt_seed_field('PT-CEMENTITIOUS-WPF', 'project_location', 'Project location', 'text', true, true, 10);
select pg_temp.pt_seed_field('PT-CEMENTITIOUS-WPF', 'measured_area', 'Measured area', 'area', false, true, 20, 'measured_area', 'm²');
select pg_temp.pt_seed_field('PT-CEMENTITIOUS-WPF', 'substrate_condition', 'Concrete condition / active leaks', 'text', false, true, 30);
select pg_temp.pt_seed_field('PT-CEMENTITIOUS-WPF', 'stored_liquid', 'Potable / non-potable service', 'text', false, true, 40);
select pg_temp.pt_seed_field('PT-CEMENTITIOUS-WPF', 'travel_distance', 'Travel distance', 'length', false, true, 50, 'distance', 'km');

-- Template 10 — Corrugated Steel Water Tank Supply and Installation
select pg_temp.pt_seed_field('PT-STEEL-TANK-NEW', 'site_location', 'Site location', 'text', true, true, 10);
select pg_temp.pt_seed_field('PT-STEEL-TANK-NEW', 'tank_capacity', 'Required usable capacity', 'capacity', true, true, 20, 'tank_count', 'kL');
select pg_temp.pt_seed_field('PT-STEEL-TANK-NEW', 'tank_diameter', 'Tank diameter', 'length', false, true, 30, null, 'm');
select pg_temp.pt_seed_field('PT-STEEL-TANK-NEW', 'tank_height', 'Tank height', 'length', false, true, 40, null, 'm');
select pg_temp.pt_seed_field('PT-STEEL-TANK-NEW', 'roof_type', 'Roof required', 'boolean', false, true, 50);
select pg_temp.pt_seed_field('PT-STEEL-TANK-NEW', 'liner_material', 'Liner specification', 'text', false, true, 60);
select pg_temp.pt_seed_field('PT-STEEL-TANK-NEW', 'penetration_count', 'Inlet / outlet / overflow / drain count', 'number', false, true, 70, 'penetration_count');
select pg_temp.pt_seed_field('PT-STEEL-TANK-NEW', 'delivery_access', 'Delivery access', 'text', false, true, 80);
select pg_temp.pt_seed_field('PT-STEEL-TANK-NEW', 'stored_liquid', 'Water service', 'text', false, true, 90);
select pg_temp.pt_seed_field('PT-STEEL-TANK-NEW', 'travel_distance', 'Travel distance', 'length', false, true, 100, 'distance', 'km');

-- Template 11 — Concrete Reservoir Waterproofing Refurbishment
select pg_temp.pt_seed_field('PT-CONCRETE-RESERVOIR-REFURB', 'project_location', 'Project location', 'text', true, true, 10);
select pg_temp.pt_seed_field('PT-CONCRETE-RESERVOIR-REFURB', 'measured_area', 'Measured area', 'area', false, true, 20, 'measured_area', 'm²');
select pg_temp.pt_seed_field('PT-CONCRETE-RESERVOIR-REFURB', 'stored_liquid', 'Potable / non-potable service', 'text', false, true, 30);
select pg_temp.pt_seed_field('PT-CONCRETE-RESERVOIR-REFURB', 'access_condition', 'Access / confined-space classification', 'text', false, true, 40);
select pg_temp.pt_seed_field('PT-CONCRETE-RESERVOIR-REFURB', 'substrate_condition', 'Existing coating / cracks / leakage', 'text', false, true, 50);
select pg_temp.pt_seed_field('PT-CONCRETE-RESERVOIR-REFURB', 'travel_distance', 'Travel distance', 'length', false, true, 60, 'distance', 'km');
