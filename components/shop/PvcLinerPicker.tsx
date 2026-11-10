"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatZarExactAmount } from "@/lib/catalogue/format";
import {
  getPvcLinerBySku,
  PVC_LINER_CHECKOUT_PATH,
  PVC_LINER_GSM_OPTIONS,
  PVC_LINER_MANUFACTURE_LABEL,
  PVC_LINER_ROWS_OPTIONS,
  pvcLinerDiametersForRows,
  pvcLinerSku,
  type PvcLinerGsm,
  type PvcLinerRows,
} from "@/lib/shop/pvc-liners";

const ROW_LABELS: Record<PvcLinerRows, string> = {
  2: "2 rows (about 1.5 m high)",
  3: "3 rows (about 2.3 m high)",
  4: "4 rows (about 3.0 m high)",
};

const GSM_LABELS: Record<PvcLinerGsm, string> = {
  550: "550 gsm (standard)",
  800: "800 gsm (heavy duty)",
};

export function PvcLinerPicker() {
  const [rows, setRows] = useState<PvcLinerRows>(3);
  const [diameter, setDiameter] = useState(5);
  const [gsm, setGsm] = useState<PvcLinerGsm>(550);

  const diameters = useMemo(() => pvcLinerDiametersForRows(rows), [rows]);
  const safeDiameter = diameters.includes(diameter) ? diameter : diameters[diameters.length - 1];
  const liner = getPvcLinerBySku(pvcLinerSku(gsm, safeDiameter, rows));

  return (
    <div className="pvc-picker">
      <div className="pvc-picker__fields">
        <div className="form-field">
          <label htmlFor="pvc-rows" className="form-label">
            Tank height
          </label>
          <select
            id="pvc-rows"
            className="form-input"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value) as PvcLinerRows)}
          >
            {PVC_LINER_ROWS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROW_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="pvc-diameter" className="form-label">
            Tank diameter
          </label>
          <select
            id="pvc-diameter"
            className="form-input"
            value={safeDiameter}
            onChange={(e) => setDiameter(Number(e.target.value))}
          >
            {diameters.map((d) => (
              <option key={d} value={d}>
                {d} m
              </option>
            ))}
          </select>
        </div>
        <fieldset className="pvc-picker__gsm">
          <legend className="form-label">Liner thickness</legend>
          {PVC_LINER_GSM_OPTIONS.map((option) => (
            <label key={option} className="pvc-picker__radio">
              <input
                type="radio"
                name="pvc-gsm"
                value={option}
                checked={gsm === option}
                onChange={() => setGsm(option)}
              />
              <span>{GSM_LABELS[option]}</span>
            </label>
          ))}
        </fieldset>
      </div>

      {liner ? (
        <div className="pvc-picker__result" aria-live="polite">
          <p className="pvc-picker__name">{liner.name}</p>
          <p className="pvc-picker__price">
            {formatZarExactAmount(liner.priceInclVatZar)} <span>incl. VAT</span>
          </p>
          <dl className="pvc-picker__facts">
            <div>
              <dt>Fits</dt>
              <dd>
                {liner.diameterM} m × {liner.heightM.toFixed(2)} m tank, about {Math.round(liner.volumeKl)} kL
              </dd>
            </div>
            <div>
              <dt>Liner area</dt>
              <dd>About {liner.linerAreaM2} m², floor and walls with a 300 mm fold-over</dd>
            </div>
            <div>
              <dt>Lead time</dt>
              <dd>{PVC_LINER_MANUFACTURE_LABEL}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>Fixed fee per province, shown at checkout</dd>
            </div>
          </dl>
          <Link
            href={`${PVC_LINER_CHECKOUT_PATH}?sku=${encodeURIComponent(liner.sku)}&qty=1`}
            className="btn-primary pvc-picker__buy"
          >
            Buy now
          </Link>
          <p className="pvc-picker__note">Secure payment by card or Instant EFT through PayFast.</p>
        </div>
      ) : null}
    </div>
  );
}
