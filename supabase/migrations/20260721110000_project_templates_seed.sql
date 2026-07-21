-- Starter library of Damtech project templates.
-- Idempotent: templates keyed by code (on conflict do nothing); items guarded by
-- (template, requested_item_code). Suggested items are linked to pricing_items by
-- item_code when the code exists; otherwise the code is retained for later linking.

insert into public.project_templates (
  code, name, short_description, project_category,
  default_material_type, default_service_type, default_quote_title,
  default_project_description, default_scope, default_assumptions,
  default_exclusions, default_customer_message, default_internal_notes,
  default_warranty_text, default_validity_days, sort_order
) values
(
  'PT-HDPE-NEW',
  'New HDPE Geomembrane Installation',
  'Supply and installation of a new HDPE geomembrane lining system to a prepared dam, pond, reservoir or containment area.',
  'Dam lining', 'HDPE geomembrane', 'HDPE dam lining',
  'HDPE Geomembrane Lining Installation',
  'Supply and installation of a new HDPE geomembrane lining system to a prepared dam, pond, reservoir or containment area.',
  $scope$1. Confirm the lining limits and installation area from the approved measurements or site dimensions.
2. Inspect the prepared substrate before liner deployment.
3. Supply the selected HDPE geomembrane in the specified nominal thickness.
4. Deploy and position geomembrane panels to suit the site geometry and minimise unnecessary field seams.
5. Join primary field seams using suitable thermal welding equipment.
6. Complete extrusion-welded detailing at patches, penetrations, terminations and other areas unsuitable for primary wedge welding.
7. Carry out visual inspection and applicable non-destructive seam checks during installation.
8. Repair identified defects using compatible geomembrane material and approved welding methods.
9. Secure the liner at nominated perimeter terminations or anchor trenches where included in the quotation.
10. Leave the completed lining area reasonably clean and ready for the next agreed activity.$scope$,
  $ass$1. The quoted area is provisional until final site measurements are confirmed.
2. The client will provide safe and unobstructed access to the work area.
3. The substrate will be dry, stable, smooth and free from sharp stones, roots, debris, standing water and protrusions before liner installation.
4. Earthworks, compaction and final trimming are excluded unless specifically included as line items.
5. The selected HDPE thickness and grade are suitable for the intended application and stored liquid.
6. The client will disclose the nature and operating temperature of the contained liquid before material confirmation.
7. Work will be completed during suitable weather and wind conditions.
8. The installation area will be available continuously during the agreed working period.
9. Pipe locations, outlets and penetrations will be confirmed before panel deployment.
10. Water filling will occur only after Damtech releases the installed liner for filling.
11. Material quantities may include configured allowances for seams, laps, detailing and waste.
12. Additional work caused by inaccurate dimensions or changed geometry will be treated as a variation.$ass$,
  $exc$1. Excavation, bulk earthworks, imported fill and compaction unless specifically included.
2. Removal of water, sludge, vegetation, rubble or existing failed lining unless specifically included.
3. Geotechnical design, slope-stability assessment and structural design.
4. Under-drainage, groundwater relief and gas-management systems unless included.
5. Supply or modification of pipes, valves, pumps and civil structures unless listed.
6. Electrical work and permanent power supply.
7. Independent third-party construction quality assurance unless specifically included.
8. Laboratory destructive testing unless specifically listed.
9. Protection layers above the liner after completion unless included.
10. Damage caused after handover by animals, vandalism, vehicles, equipment, chemicals, fire, uncontrolled filling or third parties.
11. Work outside normal site access arrangements unless stated.
12. Statutory approvals, environmental authorisations and professional design fees.$exc$,
  $msg$Thank you for the opportunity to quote on the proposed HDPE geomembrane lining work. This quotation is based on the information and measurements presently available. Final quantities and detailing will be confirmed before procurement and installation.$msg$,
  $note$Confirm:
- dam dimensions and measured liner area
- side slopes
- anchor-trench length and dimensions
- substrate condition
- number and diameter of penetrations
- proposed HDPE thickness
- geotextile requirement
- access route and delivery restrictions
- water or chemical service
- travel distance
- wind exposure
- testing requirements
- filling programme$note$,
  $war$Material warranty is subject to the selected manufacturer or supplier's written warranty terms. Damtech workmanship warranty applies only to the agreed installation scope and excludes damage or failure arising from substrate movement, third-party damage, unsuitable contents, unauthorised alterations or conditions outside the quoted design basis.$war$,
  30, 10
),
(
  'PT-HDPE-REPAIR',
  'HDPE Geomembrane Repair',
  'Inspection and local repair of accessible defects in an existing HDPE geomembrane liner.',
  'Dam lining repair', 'HDPE geomembrane', 'Leak repair',
  'HDPE Geomembrane Inspection and Repair',
  'Inspection and local repair of accessible defects in an existing HDPE geomembrane liner.',
  $scope$1. Inspect accessible areas identified by the client or visible during attendance.
2. Mark accessible punctures, tears, failed welds and suspect details requiring repair.
3. Clean and prepare local repair areas sufficiently for welding.
4. Install compatible HDPE patches over approved repair locations.
5. Extrusion weld patches and accessible detailed repairs.
6. Perform visual checks and applicable local non-destructive checks on completed repair welds.
7. Record significant repaired locations where practical.
8. Advise the client of visible defects that cannot reasonably be repaired within the quoted attendance.$scope$,
  $ass$1. The dam or structure will be drained and made safely accessible before attendance.
2. The existing liner is confirmed as weldable HDPE.
3. The existing membrane has sufficient remaining integrity to accept local repairs.
4. Defects are accessible without major excavation or dismantling.
5. The quoted allowance is based on the stated number or estimated extent of repairs.
6. The substrate beneath repair areas is stable.
7. Suitable weather conditions will prevail.
8. Additional defects discovered after attendance may require a variation.$ass$,
  $exc$1. Leak detection over the entire liner unless specifically included.
2. Guaranteed identification of concealed leaks.
3. Complete replacement of deteriorated or incompatible liner.
4. Draining, cleaning, desludging or confined-space work.
5. Earthworks beneath the liner.
6. Repairs to concrete, pipes, valves or structural elements.
7. Damage that is inaccessible beneath permanent structures.
8. Repairs where the existing liner cannot be reliably welded.
9. A guarantee that local repairs will resolve leakage caused by unidentified or concealed defects.
10. Filling and operational monitoring after repair unless included.$exc$,
  $msg$The quotation provides for local repair of accessible HDPE liner defects. The full condition of an existing liner cannot always be established until it is drained, cleaned and inspected. Additional defects will be reported before extra work proceeds.$msg$,
  $note$Confirm:
- liner material and thickness
- approximate liner age
- dam drained and cleaned
- defect locations
- likely number of patches
- access and slope condition
- availability of original liner specification
- whether leak location is known
- whether full spark testing or other leak survey is requested$note$,
  null,
  30, 20
),
(
  'PT-PVC-NEW',
  'New Reinforced PVC Liner Installation',
  'Supply and installation of a new reinforced PVC liner to a prepared dam, reservoir or containment area.',
  'Dam lining', 'Reinforced PVC', 'PVC dam/reservoir lining',
  'Reinforced PVC Liner Supply and Installation',
  'Supply and installation of a new reinforced PVC liner to a prepared dam, reservoir or containment area.',
  $scope$1. Confirm dimensions and liner configuration.
2. Supply the selected reinforced PVC liner material.
3. Fabricate or prepare liner panels to the confirmed geometry where applicable.
4. Position and install the liner over the prepared substrate.
5. Complete seams and detailing using methods compatible with the selected PVC product.
6. Complete terminations and accessible pipe details included in the quotation.
7. Inspect completed seams and repair visible defects.
8. Prepare the completed liner for controlled filling.$scope$,
  $ass$1. Dimensions and geometry will be confirmed before fabrication.
2. The substrate will be smooth, stable, clean and free from sharp projections.
3. The contents and operating conditions are compatible with the selected PVC liner.
4. Suitable access and handling space will be available.
5. The liner will not be dragged across damaging surfaces.
6. Final dimensions differing from quoted dimensions may change the price.
7. Filling will be controlled to avoid displacement or damage.$ass$,
  $exc$1. Earthworks and substrate preparation unless listed.
2. Structural design of the dam or tank.
3. Pipework and fittings not explicitly included.
4. Removal of an existing liner.
5. Protection layers not listed.
6. Damage caused by incorrect filling, suction, animals or mechanical equipment.
7. Chemical compatibility assessment where the stored medium is not ordinary water.
8. Third-party testing unless included.$exc$,
  $msg$The liner will be based on the confirmed dimensions and selected reinforced PVC specification. Final fabrication and procurement will proceed only after dimensional approval.$msg$,
  $note$Confirm:
- prefabricated or site-seamed liner
- GSM and reinforcement
- exact dimensions
- freeboard
- outlets and overflow
- geotextile
- anchoring or clamping method
- stored liquid
- access for deployment$note$,
  null,
  30, 30
),
(
  'PT-PVC-TANK-REPLACE',
  'PVC Tank Liner Replacement',
  'Replacement of a reinforced PVC liner in an existing steel or similar water-storage tank.',
  'Steel tanks', 'Reinforced PVC', 'PVC dam/reservoir lining',
  'Replacement of Reinforced PVC Tank Liner',
  'Replacement of a reinforced PVC liner in an existing steel or similar water-storage tank.',
  $scope$1. Confirm tank diameter, wall height, capacity and fitting arrangement.
2. Inspect accessible internal tank surfaces after the tank is drained.
3. Remove the existing liner where specifically included.
4. Supply a replacement reinforced PVC liner manufactured to confirmed dimensions.
5. Install the liner and position it correctly within the tank.
6. Complete details at inlet, outlet, drain and overflow penetrations included in the quotation.
7. Check the liner installation visually before controlled filling.
8. Provide basic filling guidance following installation.$scope$,
  $ass$1. The tank will be drained, isolated and safe to access.
2. Tank dimensions will be verified before liner manufacture.
3. The tank shell, foundation and structural components remain serviceable.
4. Existing sharp edges or protrusions will be corrected before liner installation.
5. Fittings are in suitable condition for reuse unless replacement is quoted.
6. The replacement liner will be used for the disclosed stored liquid.
7. Access panels or roof openings permit safe liner installation.$ass$,
  $exc$1. Structural repair or corrosion repair to the steel tank.
2. Replacement of tank sheets, bolts, roof or foundation.
3. Confined-space work unless assessed and included.
4. Cleaning and disposal of sludge or contaminated contents.
5. New fittings unless itemised.
6. Crane hire or roof removal unless included.
7. Damage caused by defective tank structure or foundation movement.
8. Filling water and operational commissioning by others unless included.$exc$,
  $msg$The replacement liner will be manufactured only after the tank dimensions and fitting locations have been confirmed. Tank structure and fittings must be serviceable before installation.$msg$,
  $note$Confirm:
- manufacturer/model
- nominal capacity
- actual diameter and height
- roof type
- access opening
- liner GSM
- number and sizes of fittings
- existing liner removal
- geotextile or cushioning requirement
- corrosion condition
- confined-space controls$note$,
  null,
  30, 40
),
(
  'PT-DORTOM-NEW',
  'Dortom Liner Installation',
  'Supply and installation of a Dortom dam lining membrane to a prepared dam or reservoir.',
  'Dam lining', 'Dortom liner', 'Dortom lining',
  'Dortom Dam Liner Supply and Installation',
  'Supply and installation of a Dortom dam lining membrane to a prepared dam or reservoir.',
  $scope$1. Confirm dimensions and lining limits.
2. Inspect the prepared substrate.
3. Supply the selected Dortom lining membrane.
4. Position and join panels using the approved product-specific installation method.
5. Complete perimeter and penetration details included in the quotation.
6. Inspect the completed liner and repair visible defects.
7. Release the liner for controlled filling.$scope$,
  $ass$1. Product suitability will be confirmed for the intended application.
2. The substrate will be smooth, stable and free from damaging objects.
3. The quoted area is provisional until measured.
4. Installation will take place in suitable weather.
5. Required penetrations and terminations will be identified in advance.
6. Manufacturer installation requirements will take precedence where applicable.$ass$,
  $exc$1. Earthworks and major surface preparation.
2. Structural or geotechnical design.
3. Pipework and fittings not listed.
4. Removal of existing lining.
5. Independent testing.
6. Unauthorised post-installation traffic or equipment on the liner.
7. Damage caused by substrate movement or third parties.$exc$,
  $msg$Final material selection and quantities will be confirmed once dimensions, substrate condition and intended water-storage application have been reviewed.$msg$,
  $note$Confirm product supplier, roll dimensions, joining method, warranty, measured area, substrate, terminations and penetrations.$note$,
  null,
  30, 50
),
(
  'PT-TORCH-NEW',
  'Torch-on Waterproofing Installation',
  'Supply and installation of a torch-applied bituminous waterproofing system.',
  'Waterproofing', 'Torch-on membrane', 'Torch-on waterproofing',
  'Torch-applied Waterproofing System',
  'Supply and installation of a torch-applied bituminous waterproofing system.',
  $scope$1. Inspect accessible substrate and waterproofing details.
2. Prepare the substrate to receive the specified waterproofing system.
3. Apply compatible primer where required.
4. Install the selected torch-applied bituminous membrane.
5. Form laps, upstands, corners and terminations in accordance with the selected system requirements.
6. Detail nominated outlets and penetrations.
7. Inspect completed work and repair visible defects.
8. Leave completed waterproofing protected from avoidable damage until handover.$scope$,
  $ass$1. The substrate is structurally sound and suitable for torch application.
2. Falls and drainage paths are adequate unless remedial work is quoted.
3. Substrate moisture is within acceptable limits for the selected product.
4. Safe access and fire-control arrangements will be available.
5. Outlets and penetrations are correctly positioned and serviceable.
6. Weather conditions are suitable.
7. Quantities are based on measured plan area plus configured laps and waste.$ass$,
  $exc$1. Structural repairs and correction of inadequate falls unless listed.
2. Replacement of outlets, pipes and roof structures unless itemised.
3. Removal of hazardous materials.
4. Screeds, plastering and extensive concrete repairs unless listed.
5. Protection boards, tiles or finishes above the membrane unless included.
6. Work concealed beneath existing finishes until exposed.
7. Damage by following trades.
8. Statutory fire-watch or permit costs unless stated.
9. Flood testing unless included.$exc$,
  $msg$This quotation is based on the visible condition and stated dimensions of the waterproofing area. Concealed defects exposed during preparation will be reported before additional work proceeds.$msg$,
  $note$Confirm:
- substrate type
- existing membrane
- removal requirement
- falls
- outlets
- upstands
- penetrations
- membrane thickness and finish
- protection layer
- fire controls
- access height
- flood testing$note$,
  null,
  30, 60
),
(
  'PT-TORCH-REPAIR',
  'Torch-on Waterproofing Repair',
  'Local repair of accessible defects in an existing torch-on waterproofing system.',
  'Waterproofing repair', 'Torch-on membrane', 'Torch-on waterproofing',
  'Local Torch-on Waterproofing Repairs',
  'Local repair of accessible defects in an existing torch-on waterproofing system.',
  $scope$1. Inspect identified accessible repair areas.
2. Remove loose or failed membrane locally where required.
3. Clean and prepare repair surfaces.
4. Prime compatible areas.
5. Install torch-on patches or local replacement strips.
6. Seal local laps, corners and terminations included in the repair scope.
7. Inspect repaired areas on completion.$scope$,
  $ass$1. Repair locations are known and accessible.
2. Existing membrane is compatible with local torch-on repair.
3. The underlying structure is sound.
4. The quoted repair quantity is provisional.
5. Additional failures may be identified during preparation.$ass$,
  $exc$1. Guaranteeing the watertightness of the entire roof or structure.
2. Repair of concealed defects outside the listed areas.
3. Structural repairs and replacement of roof sheets or slabs.
4. Correction of drainage falls.
5. Full membrane replacement.
6. Interior damage, ceilings, finishes or mould treatment.
7. Flood testing unless listed.$exc$,
  $msg$Local repairs address the identified accessible defects only and do not constitute replacement or certification of the complete waterproofing system.$msg$,
  $note$Photograph defects, confirm membrane compatibility, measure repair areas, identify water-entry versus visible-damage locations, and clarify whether a full condition assessment is required.$note$,
  null,
  30, 70
),
(
  'PT-LIQUID-WPF',
  'Liquid-applied Waterproofing',
  'Supply and application of a liquid-applied waterproofing system.',
  'Waterproofing', 'Liquid membrane', 'Torch-on waterproofing',
  'Liquid-applied Waterproofing System',
  'Supply and application of a liquid-applied waterproofing system.',
  $scope$1. Inspect and prepare the substrate.
2. Repair minor surface defects where included.
3. Apply compatible primer where required by the selected system.
4. Reinforce corners, joints and details where specified.
5. Apply the selected liquid waterproofing system at the required number of coats and consumption rate.
6. Observe required drying or curing intervals.
7. Inspect the completed coating for visible discontinuities and incomplete areas.
8. Protect the finished application during curing.$scope$,
  $ass$1. The substrate is stable, suitably dry and compatible with the product.
2. Consumption is based on the manufacturer's product data and substrate condition.
3. Weather and temperature remain suitable during application and curing.
4. The area will remain closed to traffic during curing.
5. The client has disclosed exposure and chemical conditions.
6. Colour variation between batches is not a defect unless otherwise specified.$ass$,
  $exc$1. Structural movement and crack accommodation beyond the selected system capability.
2. Major substrate repairs.
3. Removal of incompatible existing coatings unless included.
4. Moisture-pressure or negative-side waterproofing unless specified.
5. Decorative finish coats unless included.
6. Protection against damage by following trades.
7. Ponding caused by inadequate falls.$exc$,
  $msg$Product selection and consumption will be confirmed against the substrate condition and manufacturer's application requirements before work begins.$msg$,
  $note$Confirm substrate, moisture, exposure, UV, traffic, number of coats, consumption, primer, reinforcement, curing, access and warranty requirements.$note$,
  null,
  30, 80
),
(
  'PT-CEMENTITIOUS-WPF',
  'Cementitious Waterproofing',
  'Supply and application of a cementitious waterproofing system to concrete or masonry.',
  'Waterproofing', 'Cementitious slurry', 'Concrete reservoir repair',
  'Cementitious Waterproofing System',
  'Supply and application of a cementitious waterproofing system to concrete or masonry.',
  $scope$1. Inspect the concrete or masonry substrate.
2. Remove loose material and prepare the surface.
3. Repair nominated voids and local defects where included.
4. Precondition the substrate as required by the selected product.
5. Apply the specified cementitious waterproofing system in the required coats.
6. Reinforce corners, joints or details where included.
7. Cure and protect the application in accordance with product requirements.
8. Inspect completed work before handover.$scope$,
  $ass$1. The substrate is structurally sound.
2. Active water ingress will be stopped before coating unless specifically included.
3. Movement joints are treated using separate compatible details.
4. Product consumption depends on surface profile and application thickness.
5. Suitable curing conditions will be maintained.
6. The area is accessible and free from stored contents.$ass$,
  $exc$1. Structural crack design and major concrete rehabilitation.
2. Active injection work unless itemised.
3. Movement joints not specifically listed.
4. Decorative finishes.
5. Mechanical protection layers.
6. Damage caused by structural movement or excessive water pressure outside the selected system rating.
7. Removal of contaminated coatings unless included.$exc$,
  $msg$The final cementitious system and consumption will be confirmed following substrate inspection and product selection.$msg$,
  $note$Confirm positive or negative side, water pressure, concrete condition, active leaks, cracks, joints, number of coats, curing and whether the area will contain potable water.$note$,
  null,
  30, 90
),
(
  'PT-STEEL-TANK-NEW',
  'Corrugated Steel Water Tank Supply and Installation',
  'Supply and installation of a corrugated steel water-storage tank with liner and fittings.',
  'Steel tanks', 'Corrugated steel tank', 'Corrugated steel reservoir',
  'Corrugated Steel Water-storage Tank',
  'Supply and installation of a corrugated steel water-storage tank with liner and fittings.',
  $scope$1. Confirm required usable storage capacity and site constraints.
2. Select the agreed corrugated steel tank model.
3. Supply the tank kit and specified liner.
4. Deliver components to the accessible project site where included.
5. Assemble the tank wall, structural components and roof where included.
6. Install the internal liner.
7. Install the quoted inlet, outlet, overflow and drain fittings.
8. Inspect the assembled tank before controlled filling.
9. Provide basic filling and operational guidance.$scope$,
  $ass$1. The selected site is level, accessible and suitable for the proposed tank.
2. The foundation is completed to the required dimensions and tolerances before tank installation unless included.
3. Required storage capacity is based on usable rather than nominal capacity where applicable.
4. Sufficient access exists for delivery, handling and assembly.
5. Water quality and service conditions are compatible with the selected liner.
6. Filling water is available after completion.
7. Fittings and pipework beyond the tank connection points are by others unless quoted.
8. Crane or mechanical lifting requirements will be confirmed before mobilisation.$ass$,
  $exc$1. Geotechnical investigation and foundation design unless included.
2. Bulk earthworks and access-road construction.
3. External pipelines, pumps, valves and electrical controls.
4. Water-treatment equipment.
5. Municipal or statutory approvals.
6. Perimeter fencing and security.
7. Lightning protection unless specified.
8. Damage caused by incorrect foundation, unauthorised modifications or abnormal filling and emptying conditions.
9. Ongoing maintenance and cleaning unless contracted separately.$exc$,
  $msg$The final tank model will be selected according to the confirmed usable capacity, site access, foundation arrangement and required fittings. Model-specific pricing will be confirmed before procurement.$msg$,
  $note$Confirm:
- usable capacity
- model and supplier
- diameter and height
- site coordinates
- delivery access
- foundation responsibility
- roof
- liner specification
- inlet, outlet, overflow and drain sizes
- level indicator
- ladder
- crane/offloading
- water service
- lead time
- installation crew and duration$note$,
  null,
  30, 100
),
(
  'PT-CONCRETE-RESERVOIR-REFURB',
  'Concrete Reservoir Waterproofing Refurbishment',
  'Refurbishment and waterproofing of an existing concrete reservoir.',
  'Reservoir refurbishment', 'Waterproofing system', 'Concrete reservoir repair',
  'Concrete Reservoir Waterproofing Refurbishment',
  'Refurbishment and waterproofing of an existing concrete reservoir.',
  $scope$1. Inspect accessible concrete surfaces after draining and cleaning.
2. Identify visible cracks, honeycombing, failed joints and coating defects.
3. Prepare surfaces by the quoted method.
4. Repair nominated local defects using compatible repair materials.
5. Treat accessible joints and penetrations included in the quotation.
6. Apply the selected waterproofing system.
7. Observe required curing periods.
8. Inspect completed work before controlled refilling.$scope$,
  $ass$1. The reservoir will be drained, isolated, cleaned and safely accessible.
2. Structural condition is adequate for waterproofing work.
3. The selected system is compatible with the stored water.
4. Existing coatings can be prepared or removed using the quoted allowance.
5. Active leaks and major structural cracks may require separate treatment.
6. Adequate ventilation, access and lighting will be available.
7. Final quantities depend on the exposed condition.$ass$,
  $exc$1. Structural engineering assessment unless included.
2. Major concrete replacement or reinforcement repair.
3. Confined-space rescue provision unless specifically included.
4. Cleaning, sludge removal and disposal.
5. Pipework, valves and mechanical equipment.
6. Water-quality testing.
7. Filling and disinfection unless included.
8. Concealed defects not visible before preparation.
9. Repairs required because of continuing structural movement.$exc$,
  $msg$The final scope and quantities will be confirmed after the reservoir is drained, cleaned and fully accessible. Concealed deterioration may require a variation.$msg$,
  $note$Confirm:
- reservoir dimensions
- potable or non-potable service
- access and confined-space classification
- existing coating
- cracks and joints
- active leakage
- preparation method
- moisture condition
- curing time
- disinfection requirement
- filling programme$note$,
  null,
  30, 110
)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Suggested items (linked by item_code where present, otherwise retained)
-- ---------------------------------------------------------------------------

create or replace function pg_temp.pt_seed_item(
  p_template_code text,
  p_requested_code text,
  p_line_role text,
  p_optional boolean,
  p_sort integer,
  p_qty_source text default 'manual'
) returns void
language plpgsql
as $fn$
declare
  v_tid uuid;
  v_pid uuid;
begin
  select id into v_tid from public.project_templates where code = p_template_code;
  if v_tid is null then
    return;
  end if;

  select id into v_pid from public.pricing_items where item_code = p_requested_code;

  if exists (
    select 1 from public.project_template_items
    where project_template_id = v_tid and requested_item_code = p_requested_code
  ) then
    return;
  end if;

  insert into public.project_template_items (
    project_template_id, pricing_item_id, requested_item_code, line_role,
    default_quantity_source, is_optional, is_selected_by_default, sort_order
  ) values (
    v_tid, v_pid, p_requested_code, p_line_role,
    p_qty_source, p_optional, not p_optional, p_sort
  );
end;
$fn$;

-- Template 1 — New HDPE Geomembrane Installation
select pg_temp.pt_seed_item('PT-HDPE-NEW', 'HDPE-15-SMOOTH', 'primary_material', false, 10, 'measured_area');
select pg_temp.pt_seed_item('PT-HDPE-NEW', 'INST-HDPE-WELD', 'installation', false, 20, 'installation_area');
select pg_temp.pt_seed_item('PT-HDPE-NEW', 'GEOTEXTILE-300', 'underlay', true, 30, 'measured_area');
select pg_temp.pt_seed_item('PT-HDPE-NEW', 'INST-GEOTEXTILE', 'installation', true, 40, 'measured_area');
select pg_temp.pt_seed_item('PT-HDPE-NEW', 'ANCHOR-TRENCH', 'accessory', true, 50, 'perimeter');
select pg_temp.pt_seed_item('PT-HDPE-NEW', 'PENETRATION-DETAIL', 'accessory', true, 60, 'penetration_count');
select pg_temp.pt_seed_item('PT-HDPE-NEW', 'SITE-ESTABLISHMENT', 'site_establishment', false, 70, 'fixed');
select pg_temp.pt_seed_item('PT-HDPE-NEW', 'TRAVEL-BAKKIE', 'travel', false, 80, 'distance');

-- Template 2 — HDPE Geomembrane Repair
select pg_temp.pt_seed_item('PT-HDPE-REPAIR', 'HDPE-PATCH-15', 'repair', false, 10, 'manual');
select pg_temp.pt_seed_item('PT-HDPE-REPAIR', 'HDPE-WELD-ROD-4MM', 'accessory', false, 20, 'manual');
select pg_temp.pt_seed_item('PT-HDPE-REPAIR', 'INST-HDPE-DETAIL', 'installation', false, 30, 'manual');
select pg_temp.pt_seed_item('PT-HDPE-REPAIR', 'PENETRATION-DETAIL', 'accessory', true, 40, 'penetration_count');
select pg_temp.pt_seed_item('PT-HDPE-REPAIR', 'SITE-ESTABLISHMENT', 'site_establishment', false, 50, 'fixed');
select pg_temp.pt_seed_item('PT-HDPE-REPAIR', 'TRAVEL-BAKKIE', 'travel', false, 60, 'distance');

-- Template 3 — New Reinforced PVC Liner Installation
select pg_temp.pt_seed_item('PT-PVC-NEW', 'PVC-850-REINFORCED', 'primary_material', false, 10, 'measured_area');
select pg_temp.pt_seed_item('PT-PVC-NEW', 'INST-PVC', 'installation', false, 20, 'installation_area');
select pg_temp.pt_seed_item('PT-PVC-NEW', 'GEOTEXTILE-300', 'underlay', true, 30, 'measured_area');
select pg_temp.pt_seed_item('PT-PVC-NEW', 'INST-GEOTEXTILE', 'installation', true, 40, 'measured_area');
select pg_temp.pt_seed_item('PT-PVC-NEW', 'PENETRATION-DETAIL', 'accessory', false, 50, 'penetration_count');
select pg_temp.pt_seed_item('PT-PVC-NEW', 'SITE-ESTABLISHMENT', 'site_establishment', false, 60, 'fixed');
select pg_temp.pt_seed_item('PT-PVC-NEW', 'TRAVEL-BAKKIE', 'travel', false, 70, 'distance');

-- Template 4 — PVC Tank Liner Replacement
select pg_temp.pt_seed_item('PT-PVC-TANK-REPLACE', 'PVC-PREFAB-TANK', 'primary_material', false, 10, 'manual');
select pg_temp.pt_seed_item('PT-PVC-TANK-REPLACE', 'INST-PVC', 'installation', false, 20, 'manual');
select pg_temp.pt_seed_item('PT-PVC-TANK-REPLACE', 'PENETRATION-DETAIL', 'accessory', false, 30, 'penetration_count');
select pg_temp.pt_seed_item('PT-PVC-TANK-REPLACE', 'PU-SEALANT-600ML', 'accessory', false, 40, 'manual');
select pg_temp.pt_seed_item('PT-PVC-TANK-REPLACE', 'SITE-ESTABLISHMENT', 'site_establishment', false, 50, 'fixed');
select pg_temp.pt_seed_item('PT-PVC-TANK-REPLACE', 'TRAVEL-BAKKIE', 'travel', false, 60, 'distance');

-- Template 5 — Dortom Liner Installation
select pg_temp.pt_seed_item('PT-DORTOM-NEW', 'DORTOM-STANDARD', 'primary_material', false, 10, 'measured_area');
select pg_temp.pt_seed_item('PT-DORTOM-NEW', 'INST-DORTOM', 'installation', false, 20, 'installation_area');
select pg_temp.pt_seed_item('PT-DORTOM-NEW', 'GEOTEXTILE-300', 'underlay', true, 30, 'measured_area');
select pg_temp.pt_seed_item('PT-DORTOM-NEW', 'INST-GEOTEXTILE', 'installation', true, 40, 'measured_area');
select pg_temp.pt_seed_item('PT-DORTOM-NEW', 'SITE-ESTABLISHMENT', 'site_establishment', false, 50, 'fixed');
select pg_temp.pt_seed_item('PT-DORTOM-NEW', 'TRAVEL-BAKKIE', 'travel', false, 60, 'distance');

-- Template 6 — Torch-on Waterproofing Installation
select pg_temp.pt_seed_item('PT-TORCH-NEW', 'TORCH-4MM', 'primary_material', false, 10, 'measured_area');
select pg_temp.pt_seed_item('PT-TORCH-NEW', 'TORCH-PRIMER-25L', 'surface_preparation', false, 20, 'measured_area');
select pg_temp.pt_seed_item('PT-TORCH-NEW', 'INST-TORCH', 'installation', false, 30, 'measured_area');
select pg_temp.pt_seed_item('PT-TORCH-NEW', 'SURFACE-PREP', 'surface_preparation', false, 40, 'measured_area');
select pg_temp.pt_seed_item('PT-TORCH-NEW', 'REINFORCING-MESH', 'accessory', true, 50, 'measured_area');
select pg_temp.pt_seed_item('PT-TORCH-NEW', 'SITE-ESTABLISHMENT', 'site_establishment', false, 60, 'fixed');

-- Template 7 — Torch-on Waterproofing Repair
select pg_temp.pt_seed_item('PT-TORCH-REPAIR', 'TORCH-4MM', 'repair', false, 10, 'manual');
select pg_temp.pt_seed_item('PT-TORCH-REPAIR', 'TORCH-PRIMER-25L', 'surface_preparation', false, 20, 'manual');
select pg_temp.pt_seed_item('PT-TORCH-REPAIR', 'INST-TORCH', 'installation', false, 30, 'manual');
select pg_temp.pt_seed_item('PT-TORCH-REPAIR', 'SURFACE-PREP', 'surface_preparation', false, 40, 'manual');
select pg_temp.pt_seed_item('PT-TORCH-REPAIR', 'SITE-ESTABLISHMENT', 'site_establishment', false, 50, 'fixed');

-- Template 8 — Liquid-applied Waterproofing
select pg_temp.pt_seed_item('PT-LIQUID-WPF', 'LIQUID-PU-20L', 'primary_material', false, 10, 'measured_area');
select pg_temp.pt_seed_item('PT-LIQUID-WPF', 'INST-LIQUID', 'installation', false, 20, 'measured_area');
select pg_temp.pt_seed_item('PT-LIQUID-WPF', 'SURFACE-PREP', 'surface_preparation', false, 30, 'measured_area');
select pg_temp.pt_seed_item('PT-LIQUID-WPF', 'REINFORCING-MESH', 'accessory', true, 40, 'measured_area');
select pg_temp.pt_seed_item('PT-LIQUID-WPF', 'SITE-ESTABLISHMENT', 'site_establishment', false, 50, 'fixed');

-- Template 9 — Cementitious Waterproofing
select pg_temp.pt_seed_item('PT-CEMENTITIOUS-WPF', 'CEMENTITIOUS-2K-25KG', 'primary_material', false, 10, 'measured_area');
select pg_temp.pt_seed_item('PT-CEMENTITIOUS-WPF', 'INST-CEMENTITIOUS', 'installation', false, 20, 'measured_area');
select pg_temp.pt_seed_item('PT-CEMENTITIOUS-WPF', 'SURFACE-PREP', 'surface_preparation', false, 30, 'measured_area');
select pg_temp.pt_seed_item('PT-CEMENTITIOUS-WPF', 'REPAIR-MORTAR-25KG', 'repair', true, 40, 'manual');
select pg_temp.pt_seed_item('PT-CEMENTITIOUS-WPF', 'SITE-ESTABLISHMENT', 'site_establishment', false, 50, 'fixed');

-- Template 10 — Corrugated Steel Water Tank Supply and Installation
select pg_temp.pt_seed_item('PT-STEEL-TANK-NEW', 'PVC-PREFAB-TANK', 'primary_material', false, 10, 'tank_count');
select pg_temp.pt_seed_item('PT-STEEL-TANK-NEW', 'INST-STEEL-TANK', 'installation', false, 20, 'tank_count');
select pg_temp.pt_seed_item('PT-STEEL-TANK-NEW', 'INST-PVC', 'installation', false, 30, 'tank_count');
select pg_temp.pt_seed_item('PT-STEEL-TANK-NEW', 'PENETRATION-DETAIL', 'accessory', false, 40, 'penetration_count');
select pg_temp.pt_seed_item('PT-STEEL-TANK-NEW', 'DELIVERY', 'delivery', false, 50, 'distance');
select pg_temp.pt_seed_item('PT-STEEL-TANK-NEW', 'SITE-ESTABLISHMENT', 'site_establishment', false, 60, 'fixed');

-- Template 11 — Concrete Reservoir Waterproofing Refurbishment
select pg_temp.pt_seed_item('PT-CONCRETE-RESERVOIR-REFURB', 'SURFACE-PREP', 'surface_preparation', false, 10, 'measured_area');
select pg_temp.pt_seed_item('PT-CONCRETE-RESERVOIR-REFURB', 'REPAIR-MORTAR-25KG', 'repair', false, 20, 'manual');
select pg_temp.pt_seed_item('PT-CONCRETE-RESERVOIR-REFURB', 'CEMENTITIOUS-2K-25KG', 'primary_material', false, 30, 'measured_area');
select pg_temp.pt_seed_item('PT-CONCRETE-RESERVOIR-REFURB', 'INST-CEMENTITIOUS', 'installation', false, 40, 'measured_area');
select pg_temp.pt_seed_item('PT-CONCRETE-RESERVOIR-REFURB', 'PENETRATION-DETAIL', 'accessory', false, 50, 'penetration_count');
select pg_temp.pt_seed_item('PT-CONCRETE-RESERVOIR-REFURB', 'SITE-ESTABLISHMENT', 'site_establishment', false, 60, 'fixed');
select pg_temp.pt_seed_item('PT-CONCRETE-RESERVOIR-REFURB', 'TRAVEL-BAKKIE', 'travel', false, 70, 'distance');

-- Record unresolved item codes on each template for administrator linking.
update public.project_templates t
set unresolved_item_codes = coalesce((
  select jsonb_agg(distinct i.requested_item_code order by i.requested_item_code)
  from public.project_template_items i
  where i.project_template_id = t.id
    and i.pricing_item_id is null
    and i.requested_item_code is not null
), '[]'::jsonb);

-- ---------------------------------------------------------------------------
-- Seed an initial immutable version snapshot per template.
-- ---------------------------------------------------------------------------

insert into public.project_template_versions (project_template_id, version_number, snapshot, change_summary)
select
  t.id,
  1,
  jsonb_build_object(
    'template', to_jsonb(t),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.sort_order)
      from public.project_template_items i
      where i.project_template_id = t.id
    ), '[]'::jsonb),
    'sections', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.sort_order)
      from public.project_template_sections s
      where s.project_template_id = t.id
    ), '[]'::jsonb),
    'fields', coalesce((
      select jsonb_agg(to_jsonb(f) order by f.sort_order)
      from public.project_template_fields f
      where f.project_template_id = t.id
    ), '[]'::jsonb)
  ),
  'Initial seeded version'
from public.project_templates t
where not exists (
  select 1 from public.project_template_versions v
  where v.project_template_id = t.id and v.version_number = 1
);
