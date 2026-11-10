"use client";

import { useState } from "react";
import { AdminButton, AdminInput, AdminSelect } from "@/components/admin/ui";

export type ReservoirBoqFormValues = {
  sizeType: "standard" | "custom";
  diameter: string;
  height: "2" | "3" | "4" | "custom";
  customRings: string;
  roof: "yes" | "no";
  liner: "550" | "800";
  reference: string;
};

type Props = {
  values: ReservoirBoqFormValues;
  ringHeightM: number;
  /** Every design diameter in the table (0.5 m steps). */
  diameters: number[];
  /** Ring counts in the table, e.g. 1 to 5. */
  rings: number[];
};

const heightLabel = (rings: number, ringHeightM: number) => `${(rings * ringHeightM).toFixed(3)} m (${rings} ring${rings === 1 ? "" : "s"})`;

/** Selection boxes for the BOQ. A plain GET form: the choices live in the address, so a design can be bookmarked or shared. */
export function ReservoirBoqForm({ values, ringHeightM, diameters, rings }: Props) {
  const [sizeType, setSizeType] = useState(values.sizeType);
  const [height, setHeight] = useState(values.height);
  const whole = diameters.filter((d) => Number.isInteger(d));
  const list = sizeType === "standard" ? whole : diameters;
  const diameter = list.map(String).includes(values.diameter) ? values.diameter : String(list[0] ?? "");

  return (
    <form method="get" action="/admin/operations/reservoir-boq/" className="rboq-form">
      <label className="rboq-form__field">
        <span>Size</span>
        <AdminSelect name="type" value={sizeType} onChange={(e) => setSizeType(e.target.value as "standard" | "custom")}>
          <option value="standard">Standard size</option>
          <option value="custom">Custom size</option>
        </AdminSelect>
      </label>
      <label className="rboq-form__field">
        <span>Diameter (m)</span>
        <AdminSelect name="d" defaultValue={diameter} key={sizeType}>
          {list.map((d) => (
            <option key={d} value={d}>
              {d.toFixed(1)}
            </option>
          ))}
        </AdminSelect>
      </label>
      <label className="rboq-form__field">
        <span>Height</span>
        <AdminSelect name="h" value={height} onChange={(e) => setHeight(e.target.value as ReservoirBoqFormValues["height"])}>
          {[2, 3, 4].map((r) => (
            <option key={r} value={r}>
              {heightLabel(r, ringHeightM)}
            </option>
          ))}
          <option value="custom">Custom</option>
        </AdminSelect>
      </label>
      {height === "custom" ? (
        <label className="rboq-form__field">
          <span>Custom height</span>
          <AdminSelect name="rings" defaultValue={values.customRings}>
            {rings.map((r) => (
              <option key={r} value={r}>
                {heightLabel(r, ringHeightM)}
              </option>
            ))}
          </AdminSelect>
        </label>
      ) : null}
      <label className="rboq-form__field">
        <span>Roof</span>
        <AdminSelect name="roof" defaultValue={values.roof}>
          <option value="yes">Roof</option>
          <option value="no">No roof</option>
        </AdminSelect>
      </label>
      <label className="rboq-form__field">
        <span>Liner</span>
        <AdminSelect name="liner" defaultValue={values.liner}>
          <option value="550">PVC 550 gsm</option>
          <option value="800">PVC 800 gsm</option>
        </AdminSelect>
      </label>
      <label className="rboq-form__field rboq-form__field--wide">
        <span>Customer or quote reference (optional)</span>
        <AdminInput name="ref" defaultValue={values.reference} maxLength={80} placeholder="e.g. QU0431 Van Jaarsveld" />
      </label>
      <div className="rboq-form__actions">
        <AdminButton type="submit" variant="primary">
          Calculate
        </AdminButton>
      </div>
    </form>
  );
}
