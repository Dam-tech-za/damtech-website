/**
 * Canonical tank-model CSV template + derived starter catalogue.
 *
 * The starter prices are PLANNING estimates derived from the Damtech reservoir
 * pricing model (calibrated to the reviewed 2.3 m-high anchors: 3 m ≈ R8 500,
 * 8 m ≈ R18 400, 13 m ≈ R47 000, all excluding the PVC liner). Every row is
 * flagged requires_manual_confirmation = true and must be confirmed before a
 * live customer quotation. No fake supplier SKUs are introduced.
 */

import { TANK_CANONICAL_HEADERS } from "./columns.ts";
import {
  buildTankCode,
  computeGeometry,
  computeNominalCapacityKl,
  DEFAULT_USABLE_FACTOR,
  expectedRingCount,
} from "./geometry.ts";

export const TANK_TEMPLATE_HEADER = TANK_CANONICAL_HEADERS.join(",");

const BOM = "\uFEFF";

const STARTER_DIAMETERS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const STARTER_HEIGHTS = [1.5, 2.3, 3.0];

const PRICE_DATE = "2026-07-21";
const VALID_FROM = "2026-07-21";
const VALID_TO = "2026-12-31";
const STARTER_NOTE =
  "Planning price derived from Damtech reservoir pricing model; confirm before final customer quotation.";

function round50(value: number): number {
  return Math.round(value / 50) * 50;
}

function csvEscape(value: string | number | boolean | null): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export type StarterTankRow = Record<(typeof TANK_CANONICAL_HEADERS)[number], string | number | boolean>;

export function buildStarterTankRows(): StarterTankRow[] {
  const rows: StarterTankRow[] = [];
  for (const diameter of STARTER_DIAMETERS) {
    for (const height of STARTER_HEIGHTS) {
      const rings = expectedRingCount(height) ?? 3;
      const nominal = computeNominalCapacityKl(diameter, height);
      const usable = Math.round(nominal * DEFAULT_USABLE_FACTOR * 10) / 10;
      const geometry = computeGeometry(diameter, height);

      // Steel structure planning price (calibrated economy-of-scale curve).
      const steelSell = round50(100 * nominal + 6900 + 0.08 * nominal * nominal);
      const steelCost = round50(steelSell * 0.72);
      // Reinforced PVC liner planning price from liner area.
      const linerSell = round50(geometry.linerAreaM2 * 145);
      const linerCost = round50(linerSell * 0.7);
      const total = steelSell + linerSell;

      rows.push({
        tank_code: buildTankCode(diameter, height, rings),
        model_name: `${diameter} m diameter \u00d7 ${height} m high corrugated steel reservoir`,
        diameter_m: diameter,
        height_m: height,
        ring_count: rings,
        nominal_capacity_kl: nominal,
        usable_capacity_kl: usable,
        steel_tank_cost_ex_vat_zar: steelCost,
        steel_tank_sell_ex_vat_zar: steelSell,
        pvc_liner_cost_ex_vat_zar: linerCost,
        pvc_liner_sell_ex_vat_zar: linerSell,
        total_sell_ex_vat_zar: total,
        roof_included: false,
        roof_sell_ex_vat_zar: 0,
        foundation_included: false,
        foundation_sell_ex_vat_zar: 0,
        installation_included: false,
        installation_sell_ex_vat_zar: 0,
        default_inlet_mm: 50,
        default_outlet_mm: 50,
        default_overflow_mm: 75,
        default_drain_mm: 50,
        supplier_name: "",
        supplier_model_code: "",
        lead_time_days: 14,
        price_date: PRICE_DATE,
        valid_from: VALID_FROM,
        valid_to: VALID_TO,
        confidence: "medium",
        requires_manual_confirmation: true,
        is_active: true,
        notes: STARTER_NOTE,
      });
    }
  }
  return rows;
}

function rowToCsvLine(row: StarterTankRow): string {
  return TANK_CANONICAL_HEADERS.map((header) => csvEscape(row[header])).join(",");
}

/** Empty canonical template plus one worked example row. */
export function buildTankTemplateCsv(): string {
  const example =
    "TNK-03M-23H-3R,3 m diameter \u00d7 2.3 m high corrugated steel reservoir,3,2.3,3,16.3,15,0,8500,0,0,8500,false,0,false,0,false,0,50,50,75,50,,,14,2026-07-21,2026-07-21,2026-12-31,medium,true,true,Steel tank price excludes PVC liner installation delivery foundation and fittings";
  return `${BOM}${TANK_TEMPLATE_HEADER}\n${example}\n`;
}

/** Full 39-model starter catalogue (13 diameters × 3 heights). */
export function buildTankStarterCsv(): string {
  const lines = buildStarterTankRows().map(rowToCsvLine);
  return `${BOM}${TANK_TEMPLATE_HEADER}\n${lines.join("\n")}\n`;
}
