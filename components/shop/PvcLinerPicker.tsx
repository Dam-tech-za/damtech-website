"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatZarExactAmount } from "@/lib/catalogue/format";
import {
  getPvcLinerBySku,
  PVC_LINER_CHECKOUT_PATH,
  PVC_LINER_COLOUR_IMAGES,
  PVC_LINER_COLOUR_LABELS,
  PVC_LINER_COLOURS,
  PVC_LINER_DEFAULT_COLOUR,
  PVC_LINER_GSM_OPTIONS,
  PVC_LINER_MANUFACTURE_LABEL,
  PVC_LINER_ROWS_OPTIONS,
  pvcLinerDiametersForRows,
  pvcLinerSku,
  type PvcLinerColour,
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

export function PvcLinerPicker({
  initialSku = null,
  syncUrl = false,
}: {
  initialSku?: string | null;
  /** Keep ?sku= in the address in step with the selection (PVC liner page only). */
  syncUrl?: boolean;
}) {
  const initial = initialSku ? getPvcLinerBySku(initialSku) : null;
  const [rows, setRows] = useState<PvcLinerRows>(initial?.rows ?? 3);
  const [diameter, setDiameter] = useState(initial?.diameterM ?? 5);
  const [gsm, setGsm] = useState<PvcLinerGsm>(initial?.gsm ?? 550);
  const [colour, setColour] = useState<PvcLinerColour>(PVC_LINER_DEFAULT_COLOUR);
  const touched = useRef(false);
  const image = PVC_LINER_COLOUR_IMAGES[colour];

  const diameters = useMemo(() => pvcLinerDiametersForRows(rows), [rows]);
  const safeDiameter = diameters.includes(diameter) ? diameter : diameters[diameters.length - 1];
  const liner = getPvcLinerBySku(pvcLinerSku(gsm, safeDiameter, rows));

  // Keep the address in step with the selection so each size can be shared
  // and matches the per-size link Google indexes.
  useEffect(() => {
    if (!syncUrl || !liner || (!touched.current && !initialSku)) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("sku") === liner.sku) return;
    url.searchParams.set("sku", liner.sku);
    window.history.replaceState(window.history.state, "", url);
  }, [liner, initialSku, syncUrl]);

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
            onChange={(e) => {
              touched.current = true;
              setRows(Number(e.target.value) as PvcLinerRows);
            }}
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
            onChange={(e) => {
              touched.current = true;
              setDiameter(Number(e.target.value));
            }}
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
                onChange={() => {
                  touched.current = true;
                  setGsm(option);
                }}
              />
              <span>{GSM_LABELS[option]}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="pvc-picker__gsm">
          <legend className="form-label">Colour (same price)</legend>
          {PVC_LINER_COLOURS.map((option) => (
            <label key={option} className="pvc-picker__radio">
              <input
                type="radio"
                name="pvc-colour"
                value={option}
                checked={colour === option}
                onChange={() => setColour(option)}
              />
              <span className={`pvc-picker__swatch pvc-picker__swatch--${option}`} aria-hidden />
              <span>{PVC_LINER_COLOUR_LABELS[option]}</span>
            </label>
          ))}
        </fieldset>
      </div>

      {liner ? (
        <div className="pvc-picker__result" aria-live="polite">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(min-width: 900px) 14rem, 60vw"
            className="pvc-picker__image"
          />
          <p className="pvc-picker__name">
            {liner.name}, {colour}
          </p>
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
            href={`${PVC_LINER_CHECKOUT_PATH}?sku=${encodeURIComponent(liner.sku)}&colour=${colour}&qty=1`}
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
