-- Scope & Notes content flow.
--   1. Adds quotes.scope_reviewed so customer-facing content can be gated before Send.
--   2. Expands the default scope / assumptions / exclusions / customer message /
--      internal notes for the three primary templates to the approved wording.
--   3. Records a new immutable template version snapshot so existing quotes
--      (which reference their applied version) remain unchanged.
-- Idempotent: safe to re-run.

alter table public.quotes
  add column if not exists scope_reviewed boolean not null default false;

-- ---------------------------------------------------------------------------
-- PT-HDPE-NEW — New HDPE Geomembrane Installation
-- ---------------------------------------------------------------------------
update public.project_templates set
  default_scope = $scope$1. Confirm the lining limits and final installation area from the approved dimensions or verified site measurements.
2. Inspect the prepared earthworks and substrate before deployment of the liner.
3. Confirm that the receiving surface is smooth, stable, adequately compacted and free from sharp stones, roots, debris, standing water and other objects capable of damaging the geomembrane.
4. Supply the selected smooth or textured HDPE geomembrane in the specified nominal thickness.
5. Deliver, handle and temporarily store the geomembrane in a manner intended to prevent avoidable damage.
6. Deploy and position geomembrane panels to suit the dam or reservoir geometry and minimise unnecessary field seams.
7. Join primary field seams using suitable hot-wedge welding equipment.
8. Complete extrusion-welded detailing at penetrations, patches, corners, terminations and locations unsuitable for primary wedge welding.
9. Carry out visual inspection and applicable non-destructive field-seam checks during installation.
10. Repair identified defects using compatible HDPE material and approved welding methods.
11. Secure the geomembrane in the nominated anchor trench, termination detail or mechanical fixing arrangement where included in the quotation.
12. Complete the included pipe, outlet and overflow details.
13. Remove installation offcuts and leave the lined area reasonably clean.
14. Release the lining installation for controlled filling after completion of the agreed inspections.$scope$,
  default_assumptions = $ass$1. The quoted liner area is based on the measurements currently provided and remains subject to final verification.
2. The client or appointed earthworks contractor will complete bulk excavation, shaping, trimming and compaction unless those items are expressly included.
3. The earthworks will provide smooth and stable side slopes without unsupported voids, loose fill or sudden changes in geometry.
4. The substrate will be dry enough for safe liner deployment and welding.
5. Safe and unobstructed vehicle, staff and material access will be available.
6. Pipework, outlets, overflows and penetrations will be correctly positioned before liner installation.
7. The stored water or liquid is compatible with the selected geomembrane.
8. The selected HDPE thickness is suitable for the agreed application.
9. Installation will proceed during suitable weather and wind conditions.
10. The work area will remain available to Damtech during the agreed installation period.
11. Water filling will start only after Damtech has completed the agreed inspections and released the installation for controlled filling.
12. Material quantities may include allowances for seams, overlap, detailing, anchoring and waste.
13. Changes to the dam geometry, dimensions or penetration arrangement may require a price adjustment.
14. The quotation assumes normal daytime access unless specifically stated otherwise.$ass$,
  default_exclusions = $exc$1. Bulk earthworks, excavation, imported fill and compaction unless expressly listed.
2. Removal of unsuitable material, vegetation, sludge, water or an existing liner unless included.
3. Geotechnical design, slope-stability analysis or structural design.
4. Under-drainage, groundwater relief, leak-detection layers or gas-venting systems unless included.
5. Supply or modification of external pipework, valves, pumps or electrical systems.
6. Concrete construction and major concrete repair unless listed.
7. Independent third-party construction quality assurance.
8. Laboratory destructive seam testing unless specifically included.
9. Protection layers above the completed geomembrane unless included.
10. Animal protection, fencing or security measures.
11. Damage caused after handover by animals, vehicles, machinery, vandalism, uncontrolled filling, fire, chemicals or third parties.
12. Statutory approvals, environmental authorisations and professional consulting fees.
13. Additional work arising from concealed conditions not reasonably visible before installation.
14. Work delayed by unsuitable weather, unavailable access or incomplete earthworks.$exc$,
  default_customer_message = $msg$Thank you for the opportunity to provide a quotation for the proposed HDPE geomembrane lining work. The quotation is based on the dimensions and project information currently available. Final quantities, liner thickness, substrate readiness and penetration details will be confirmed before material procurement and installation.$msg$,
  default_internal_notes = $note$Confirm before approval:
- verified liner area
- dam length, width and depth
- side slopes
- perimeter and anchor-trench length
- HDPE thickness and surface finish
- roll dimensions
- geotextile requirement
- substrate and earthworks responsibility
- number and diameter of penetrations
- outlet and overflow details
- stored liquid
- access route
- delivery restrictions
- site security
- travel distance
- accommodation
- wind exposure
- seam-testing requirement
- expected filling date$note$,
  updated_at = now()
where code = 'PT-HDPE-NEW';

-- ---------------------------------------------------------------------------
-- PT-HDPE-REPAIR — HDPE Geomembrane Repair
-- ---------------------------------------------------------------------------
update public.project_templates set
  default_scope = $scope$1. Attend the site and inspect accessible areas identified by the client.
2. Confirm that the existing liner is HDPE and suitable for local welding repairs.
3. Mark accessible punctures, tears, failed seams and damaged details requiring repair.
4. Clean and prepare local repair areas.
5. Supply compatible HDPE patching material and extrusion-welding consumables.
6. Install patches over approved local defect areas.
7. Repair accessible failed seams and detailed areas where practical.
8. Perform visual checks and applicable local non-destructive checks on completed welds.
9. Record major repaired locations where practical.
10. Advise the client of visible defects that fall outside the quoted repair allowance.$scope$,
  default_assumptions = $ass$1. The dam or reservoir will be drained before attendance.
2. The liner will be cleaned sufficiently for inspection and welding.
3. Defects will be accessible without major excavation or dismantling.
4. The existing HDPE retains sufficient integrity for local repair.
5. The quoted repair quantity is based on the information presently supplied.
6. The substrate beneath the repair area is stable.
7. Weather and access conditions will permit welding.
8. Additional defects may be treated as a variation.$ass$,
  default_exclusions = $exc$1. Draining, pumping, desludging and cleaning unless listed.
2. Full leak detection or electrical leak-location surveys unless included.
3. Guaranteed identification of all concealed leaks.
4. Replacement of extensively deteriorated liner.
5. Repairs to incompatible or non-weldable liner.
6. Earthworks beneath the liner.
7. Repairs to pipes, valves, concrete or structural components.
8. A guarantee that local repairs will stop leakage caused by unidentified defects.
9. Operational filling and long-term monitoring unless listed.$exc$,
  default_customer_message = $msg$The quoted work covers local repair of accessible defects only. The complete condition of an existing liner can normally be assessed only once the dam has been drained and cleaned. Any additional defects discovered during attendance will be reported before extra work proceeds.$msg$,
  default_internal_notes = $note$Confirm:
- liner material
- thickness
- age
- original installer or specification
- estimated number of repairs
- defect locations
- dam drained
- dam cleaned
- access
- slope safety
- whether the leakage point is known
- whether a wider leak survey is requested$note$,
  updated_at = now()
where code = 'PT-HDPE-REPAIR';

-- ---------------------------------------------------------------------------
-- PT-PVC-TANK-REPLACE — PVC Tank Liner Replacement
-- ---------------------------------------------------------------------------
update public.project_templates set
  default_scope = $scope$1. Confirm the tank diameter, wall height, capacity and fitting arrangement.
2. Confirm the replacement-liner specification and intended stored liquid.
3. Inspect accessible internal tank surfaces once the tank has been drained and made safe to enter.
4. Remove the existing liner where specifically included in the quotation.
5. Identify sharp edges, protrusions or damaged surfaces that may affect the new liner.
6. Manufacture or procure a reinforced PVC replacement liner to the confirmed tank dimensions.
7. Deliver and position the replacement liner within the tank.
8. Install and correctly align the liner against the tank floor and walls.
9. Complete the included details at the inlet, outlet, overflow and drain penetrations.
10. Apply compatible seals or clamping details where included.
11. Inspect the completed liner installation before filling.
12. Provide guidance for controlled initial filling.$scope$,
  default_assumptions = $ass$1. The tank will be drained, isolated and safely accessible before work starts.
2. The tank dimensions and fitting positions will be verified before liner manufacture.
3. The steel shell, roof, foundation and structural components are serviceable.
4. The tank floor and internal surfaces are free from objects capable of damaging the replacement liner.
5. Existing fittings are suitable for reuse unless replacement items are included.
6. The stored liquid is compatible with the selected PVC liner.
7. Access openings are sufficient for liner removal and installation.
8. The work area provides safe access for personnel and materials.
9. The liner will be filled in a controlled manner following Damtech's release.
10. Final pricing may change if verified dimensions differ from those supplied.$ass$,
  default_exclusions = $exc$1. Structural repair to the tank shell, roof, foundation or supports.
2. Corrosion removal and protective coating of the steel structure unless included.
3. Replacement of steel sheets, bolts, roof components or ladders.
4. Draining, cleaning, sludge removal and waste disposal unless listed.
5. Confined-space rescue arrangements unless expressly included.
6. New pipework, valves and fittings not itemised.
7. Crane hire, roof removal or structural dismantling unless included.
8. Damage or failure caused by an unsuitable tank structure, foundation movement, sharp protrusions or incorrect filling.
9. Water treatment, disinfection or water-quality testing.
10. External pipe connections beyond the quoted tank fittings.$exc$,
  default_customer_message = $msg$The replacement liner will be manufactured only after the tank dimensions and fitting locations have been verified. The tank structure, foundation and fittings must be in a suitable condition before liner installation.$msg$,
  default_internal_notes = $note$Confirm:
- tank make and model
- diameter
- wall height
- capacity
- roof type
- access opening
- liner GSM
- stored liquid
- existing-liner removal
- tank cleaning
- confined-space requirements
- inlet
- outlet
- overflow
- drain
- geotextile or cushioning
- corrosion condition
- crane requirement
- filling date$note$,
  updated_at = now()
where code = 'PT-PVC-TANK-REPLACE';

-- ---------------------------------------------------------------------------
-- Record a new immutable version snapshot for the updated templates so version
-- history reflects the change. Existing quotes reference their applied version
-- and are unaffected.
-- ---------------------------------------------------------------------------
insert into public.project_template_versions (project_template_id, version_number, snapshot, change_summary)
select
  t.id,
  coalesce((
    select max(v.version_number) from public.project_template_versions v
    where v.project_template_id = t.id
  ), 0) + 1,
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
  'Expanded default scope, assumptions, exclusions, customer message and internal notes'
from public.project_templates t
where t.code in ('PT-HDPE-NEW', 'PT-HDPE-REPAIR', 'PT-PVC-TANK-REPLACE')
  and not exists (
    select 1 from public.project_template_versions v
    where v.project_template_id = t.id
      and v.change_summary = 'Expanded default scope, assumptions, exclusions, customer message and internal notes'
  );
