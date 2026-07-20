"use client";

import { AdminField, AdminInput, AdminSelect } from "@/components/admin/ui";

type FieldProps = {
  defaults?: Record<string, string | number | boolean | null | undefined>;
};

/** Coerce technical defaults to AdminInput-compatible values. */
function dv(
  value: string | number | boolean | null | undefined,
  fallback: string | number = "",
): string | number {
  if (value == null || value === "") return fallback;
  if (typeof value === "boolean") return value ? "1" : "0";
  return value;
}

export function HdpeMaterialFields({ defaults = {} }: FieldProps) {
  return (
    <div className="admin-form-grid">
      <AdminField label="Thickness (mm)">
        <AdminInput name="tech_thicknessMm" type="number" step="0.1" defaultValue={dv(defaults.thicknessMm)} />
      </AdminField>
      <AdminField label="Surface type">
        <AdminSelect name="tech_surfaceType" defaultValue={String(defaults.surfaceType ?? "smooth")}>
          <option value="smooth">Smooth</option>
          <option value="textured">Textured</option>
          <option value="other">Other</option>
        </AdminSelect>
      </AdminField>
      <AdminField label="Colour">
        <AdminInput name="tech_colour" defaultValue={String(defaults.colour ?? "")} />
      </AdminField>
      <AdminField label="Roll width (m)">
        <AdminInput name="tech_rollWidthM" type="number" step="0.01" defaultValue={dv(defaults.rollWidthM)} />
      </AdminField>
      <AdminField label="Roll length (m)">
        <AdminInput name="tech_rollLengthM" type="number" step="0.01" defaultValue={dv(defaults.rollLengthM)} />
      </AdminField>
      <AdminField label="Usable roll area (m²)">
        <AdminInput
          name="tech_usableRollAreaM2"
          type="number"
          step="0.01"
          defaultValue={dv(defaults.usableRollAreaM2)}
        />
      </AdminField>
      <AdminField label="Overlap %">
        <AdminInput name="overlap_percent" type="number" step="0.01" defaultValue={dv(defaults.overlapPercent, 10)} />
      </AdminField>
      <AdminField label="Waste %">
        <AdminInput name="waste_percent" type="number" step="0.01" defaultValue={dv(defaults.wastePercent, 10)} />
      </AdminField>
      <AdminField label="Minimum order">
        <AdminInput name="tech_minimumOrder" defaultValue={String(defaults.minimumOrder ?? "")} />
      </AdminField>
      <AdminField label="Warranty">
        <AdminInput name="tech_warranty" defaultValue={String(defaults.warranty ?? "")} />
      </AdminField>
    </div>
  );
}

export function PvcMaterialFields({ defaults = {} }: FieldProps) {
  return (
    <div className="admin-form-grid">
      <AdminField label="GSM / thickness">
        <AdminInput name="tech_gsmOrThickness" defaultValue={String(defaults.gsmOrThickness ?? "")} />
      </AdminField>
      <AdminField label="Form">
        <AdminSelect name="tech_form" defaultValue={String(defaults.form ?? "roll")}>
          <option value="roll">Roll</option>
          <option value="prefabricated">Prefabricated</option>
        </AdminSelect>
      </AdminField>
      <AdminField label="Roll width (m)">
        <AdminInput name="tech_rollWidthM" type="number" step="0.01" defaultValue={dv(defaults.rollWidthM)} />
      </AdminField>
      <AdminField label="Roll length (m)">
        <AdminInput name="tech_rollLengthM" type="number" step="0.01" defaultValue={dv(defaults.rollLengthM)} />
      </AdminField>
      <AdminField label="Usable area (m²)">
        <AdminInput
          name="tech_usableRollAreaM2"
          type="number"
          step="0.01"
          defaultValue={dv(defaults.usableRollAreaM2)}
        />
      </AdminField>
      <AdminField label="Seam allowance %">
        <AdminInput name="overlap_percent" type="number" step="0.01" defaultValue={dv(defaults.overlapPercent, 8)} />
      </AdminField>
      <AdminField label="Waste %">
        <AdminInput name="waste_percent" type="number" step="0.01" defaultValue={dv(defaults.wastePercent, 10)} />
      </AdminField>
      <AdminField label="Warranty">
        <AdminInput name="tech_warranty" defaultValue={String(defaults.warranty ?? "")} />
      </AdminField>
    </div>
  );
}

export function TorchOnMaterialFields({ defaults = {} }: FieldProps) {
  return (
    <div className="admin-form-grid">
      <AdminField label="Thickness (mm)">
        <AdminInput name="tech_thicknessMm" type="number" step="0.1" defaultValue={dv(defaults.thicknessMm)} />
      </AdminField>
      <AdminField label="Roll width (m)">
        <AdminInput name="tech_rollWidthM" type="number" step="0.01" defaultValue={dv(defaults.rollWidthM)} />
      </AdminField>
      <AdminField label="Roll length (m)">
        <AdminInput name="tech_rollLengthM" type="number" step="0.01" defaultValue={dv(defaults.rollLengthM)} />
      </AdminField>
      <AdminField label="Side lap (m)">
        <AdminInput name="tech_sideLapM" type="number" step="0.01" defaultValue={dv(defaults.sideLapM)} />
      </AdminField>
      <AdminField label="End lap (m)">
        <AdminInput name="tech_endLapM" type="number" step="0.01" defaultValue={dv(defaults.endLapM)} />
      </AdminField>
      <AdminField label="Waste %">
        <AdminInput name="waste_percent" type="number" step="0.01" defaultValue={dv(defaults.wastePercent, 10)} />
      </AdminField>
      <AdminField label="Primer required">
        <AdminSelect name="tech_primerRequired" defaultValue={String(defaults.primerRequired ?? "false")}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </AdminSelect>
      </AdminField>
      <AdminField label="Application layers">
        <AdminInput name="tech_applicationLayers" type="number" defaultValue={dv(defaults.applicationLayers, 1)} />
      </AdminField>
    </div>
  );
}

export function LiquidMembraneFields({ defaults = {} }: FieldProps) {
  return (
    <div className="admin-form-grid">
      <AdminField label="Pack size" required>
        <AdminInput name="tech_packSize" type="number" step="0.01" required defaultValue={dv(defaults.packSize)} />
      </AdminField>
      <AdminField label="Pack unit">
        <AdminInput name="tech_packUnit" defaultValue={String(defaults.packUnit ?? "kg")} />
      </AdminField>
      <AdminField label="Consumption rate">
        <AdminInput
          name="tech_consumptionRate"
          type="number"
          step="0.001"
          defaultValue={dv(defaults.consumptionRate)}
        />
      </AdminField>
      <AdminField label="Consumption unit">
        <AdminInput name="tech_consumptionUnit" defaultValue={String(defaults.consumptionUnit ?? "kg/m²")} />
      </AdminField>
      <AdminField label="Number of coats">
        <AdminInput name="tech_numberOfCoats" type="number" defaultValue={dv(defaults.numberOfCoats, 2)} />
      </AdminField>
      <AdminField label="Substrate factor">
        <AdminInput
          name="tech_substrateFactor"
          type="number"
          step="0.01"
          defaultValue={dv(defaults.substrateFactor, 1)}
        />
      </AdminField>
      <AdminField label="Waste %">
        <AdminInput name="waste_percent" type="number" step="0.01" defaultValue={dv(defaults.wastePercent, 10)} />
      </AdminField>
    </div>
  );
}

export function CementitiousMaterialFields({ defaults = {} }: FieldProps) {
  return (
    <div className="admin-form-grid">
      <AdminField label="Pack size (kg)">
        <AdminInput name="tech_packSize" type="number" step="0.01" defaultValue={dv(defaults.packSize)} />
      </AdminField>
      <AdminField label="kg/m² per coat">
        <AdminInput
          name="tech_kgPerM2PerCoat"
          type="number"
          step="0.01"
          defaultValue={dv(defaults.kgPerM2PerCoat)}
        />
      </AdminField>
      <AdminField label="Number of coats">
        <AdminInput name="tech_numberOfCoats" type="number" defaultValue={dv(defaults.numberOfCoats, 2)} />
      </AdminField>
      <AdminField label="Waste %">
        <AdminInput name="waste_percent" type="number" step="0.01" defaultValue={dv(defaults.wastePercent, 10)} />
      </AdminField>
      <AdminField label="Primer / bonding required">
        <AdminSelect name="tech_primerRequired" defaultValue={String(defaults.primerRequired ?? "false")}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </AdminSelect>
      </AdminField>
    </div>
  );
}

export function GeotextileMaterialFields({ defaults = {} }: FieldProps) {
  return (
    <div className="admin-form-grid">
      <AdminField label="GSM">
        <AdminInput name="tech_gsm" type="number" defaultValue={dv(defaults.gsm)} />
      </AdminField>
      <AdminField label="Roll width (m)">
        <AdminInput name="tech_rollWidthM" type="number" step="0.01" defaultValue={dv(defaults.rollWidthM)} />
      </AdminField>
      <AdminField label="Roll length (m)">
        <AdminInput name="tech_rollLengthM" type="number" step="0.01" defaultValue={dv(defaults.rollLengthM)} />
      </AdminField>
      <AdminField label="Lap %">
        <AdminInput name="overlap_percent" type="number" step="0.01" defaultValue={dv(defaults.overlapPercent, 10)} />
      </AdminField>
      <AdminField label="Waste %">
        <AdminInput name="waste_percent" type="number" step="0.01" defaultValue={dv(defaults.wastePercent, 10)} />
      </AdminField>
    </div>
  );
}

export function AccessoryMaterialFields({ defaults = {} }: FieldProps) {
  return (
    <div className="admin-form-grid">
      <AdminField label="Accessory type">
        <AdminSelect name="tech_accessoryType" defaultValue={String(defaults.accessoryType ?? "other")}>
          <option value="pipe_boot">Pipe boot</option>
          <option value="outlet">Outlet</option>
          <option value="drain">Drain</option>
          <option value="termination_bar">Termination bar</option>
          <option value="sealant">Sealant</option>
          <option value="adhesive">Adhesive</option>
          <option value="patch">Patch</option>
          <option value="corner_reinforcement">Corner reinforcement</option>
          <option value="fastener">Fastener</option>
          <option value="other">Other</option>
        </AdminSelect>
      </AdminField>
      <AdminField label="Unit">
        <AdminSelect name="tech_accessoryUnit" defaultValue={String(defaults.accessoryUnit ?? "each")}>
          <option value="each">each</option>
          <option value="m">m</option>
          <option value="box">box</option>
          <option value="cartridge">cartridge</option>
          <option value="kit">kit</option>
        </AdminSelect>
      </AdminField>
    </div>
  );
}

export function MaterialTechnicalFields({
  category,
  defaults,
}: {
  category: string;
  defaults?: FieldProps["defaults"];
}) {
  const lower = category.toLowerCase();
  if (lower.includes("hdpe")) return <HdpeMaterialFields defaults={defaults} />;
  if (lower.includes("pvc") || lower.includes("dortom")) return <PvcMaterialFields defaults={defaults} />;
  if (lower.includes("torch")) return <TorchOnMaterialFields defaults={defaults} />;
  if (lower.includes("liquid")) return <LiquidMembraneFields defaults={defaults} />;
  if (lower.includes("cement")) return <CementitiousMaterialFields defaults={defaults} />;
  if (lower.includes("geotextile")) return <GeotextileMaterialFields defaults={defaults} />;
  if (lower.includes("accessor") || lower.includes("weld")) {
    return <AccessoryMaterialFields defaults={defaults} />;
  }
  return null;
}
