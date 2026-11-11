/**
 * Made-up liner area, weight and folded parcel size, for courier quotes on
 * custom (non-catalogue) PVC liners. Pure maths: no React, no env, no network.
 *
 * Circular (steel tank) liner, the same formula the catalogue prices use
 * (lib/shop/pvc-liner-prices.generated.ts, reservoir pricing model):
 *
 *   material m² = (π·D²/4 + π·D·(H + fold-over)) × (1 + waste%)
 *
 * where H is the lined wall height. Corrugated tank rows are 762 mm sheets
 * that overlap the row below by 50 mm, so n rows line to
 * n × 0.762 − (n − 1) × 0.05 m (2 rows 1.474 m, 3 rows 2.186 m, 4 rows 2.898 m),
 * not the listed n × 0.762 m. With that height every catalogue area is
 * reproduced to 0.1 m². Waste is applied once (catalogue default 5%).
 *
 * Rectangular liner (pond, trough, rectangular tank or earth dam): the same
 * geometry as lib/rfq/calculations/rectangular-dam.ts (top L × W, depth h,
 * optional side slope z H:1V), plus a fold-over / upstand and an optional
 * anchor run-out round the top perimeter, then overlap and waste via the
 * shared applyOverlapWaste helper.
 */

import { applyOverlapWaste } from "../rfq/calculations/common.ts";
import { pvcLinerPackedParcel, pvcLinerWeightKg, type PackedParcel } from "../shop/pvc-packing.ts";
import type { PvcLinerGsm } from "../shop/pvc-liners.ts";

/** The shop helpers only type catalogue gsm (550/800); the maths is the same for any gsm. */
const asLiner = (areaM2: number, gsm: number) => ({ linerAreaM2: areaM2, gsm: gsm as PvcLinerGsm });

export const TANK_ROW_HEIGHT_M = 0.762;
export const TANK_ROW_OVERLAP_M = 0.05;
export const DEFAULT_FOLD_OVER_M = 0.3;
export const DEFAULT_WASTE_PERCENT = 5;
export const DEFAULT_OVERLAP_PERCENT = 5;

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const positive = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;
const nonNegative = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;

/** Listed tank height for a number of 762 mm rows (2 rows = 1.524 m). */
export function listedHeightForRows(rows: number): number {
  return round3(rows * TANK_ROW_HEIGHT_M);
}

/** Lined wall height for a number of rows, after the 50 mm row overlaps. */
export function linedWallHeightForRows(rows: number): number {
  return round3(rows * TANK_ROW_HEIGHT_M - Math.max(0, rows - 1) * TANK_ROW_OVERLAP_M);
}

export type LinerArea = {
  /** Area of the shape itself (floor + walls), before fold-over or allowances. */
  installationAreaM2: number;
  /** Area to make up and ship: with fold-over, allowances, overlap and waste. */
  materialAreaM2: number;
  overlapPercentApplied: number;
  wastePercentApplied: number;
  /** The sheet laid flat (approximate), for the fold model. */
  flatLengthM: number;
  flatWidthM: number;
  parts: { label: string; areaM2: number }[];
};

export type AreaResult = { ok: true; area: LinerArea } | { ok: false; error: string };

export type CircularLinerInput = {
  diameterM: number;
  /** Lined wall height in m. Use linedWallHeightForRows() for tank rows. */
  wallHeightM: number;
  foldOverM?: number;
  wastePercent?: number;
};

export function circularLinerArea(input: CircularLinerInput): AreaResult {
  const { diameterM: d, wallHeightM: h } = input;
  const fold = input.foldOverM ?? DEFAULT_FOLD_OVER_M;
  const waste = input.wastePercent ?? DEFAULT_WASTE_PERCENT;
  if (!positive(d) || !positive(h)) return { ok: false, error: "Enter the diameter and wall height in metres." };
  if (d > 60 || h > 10) return { ok: false, error: "That size is outside what this tool handles (60 m diameter, 10 m wall)." };
  if (!nonNegative(fold) || !nonNegative(waste)) return { ok: false, error: "Fold-over and waste cannot be negative." };
  const floor = (Math.PI * d * d) / 4;
  const wall = Math.PI * d * h;
  const foldOver = Math.PI * d * fold;
  const material = (floor + wall + foldOver) * (1 + waste / 100);
  // A made-up tank liner laid flat with the wall folded in is roughly square;
  // the fold model works from a square of the same area.
  const side = Math.sqrt(material);
  return {
    ok: true,
    area: {
      installationAreaM2: round2(floor + wall),
      materialAreaM2: round1(material),
      overlapPercentApplied: 0,
      wastePercentApplied: waste,
      flatLengthM: round3(side),
      flatWidthM: round3(side),
      parts: [
        { label: "Floor", areaM2: round2(floor) },
        { label: "Wall", areaM2: round2(wall) },
        { label: `Fold-over ${Math.round(fold * 1000)} mm`, areaM2: round2(foldOver) },
      ],
    },
  };
}

export type RectangularLinerInput = {
  /** Top (or internal) length and width, m. */
  lengthM: number;
  widthM: number;
  /** Depth / wall height, m. */
  depthM: number;
  /** Side slope z (z horizontal : 1 vertical). 0 = vertical walls. */
  sideSlopeZH?: number;
  /** Upstand / fold-over round the top edge, m. */
  foldOverM?: number;
  /** Anchor run-out past the top edge (earth dams usually 1.2 m), m. */
  anchorRunoutM?: number;
  overlapPercent?: number;
  wastePercent?: number;
};

export function rectangularLinerArea(input: RectangularLinerInput): AreaResult {
  const { lengthM: lt, widthM: wt, depthM: h } = input;
  const z = input.sideSlopeZH ?? 0;
  const fold = input.foldOverM ?? DEFAULT_FOLD_OVER_M;
  const anchor = input.anchorRunoutM ?? 0;
  const overlap = input.overlapPercent ?? DEFAULT_OVERLAP_PERCENT;
  const waste = input.wastePercent ?? DEFAULT_WASTE_PERCENT;
  if (![lt, wt, h].every(positive)) return { ok: false, error: "Enter the length, width and depth in metres." };
  if (lt > 200 || wt > 200 || h > 15) return { ok: false, error: "That size is outside what this tool handles." };
  if (![z, fold, anchor, overlap, waste].every(nonNegative)) {
    return { ok: false, error: "Slope, allowances, overlap and waste cannot be negative." };
  }
  const lb = lt - 2 * z * h;
  const wb = wt - 2 * z * h;
  if (!(lb > 0 && wb > 0)) return { ok: false, error: "The side slope is too flat for this depth: the floor comes out at zero." };
  const slope = Math.sqrt(h * h + (z * h) ** 2);
  const floor = lb * wb;
  const walls = (lt + lb) * slope + (wt + wb) * slope;
  const perimeter = 2 * (lt + wt);
  const allowance = perimeter * (fold + anchor);
  const { materialAreaM2, overlapPercentApplied, wastePercentApplied } = applyOverlapWaste(
    floor + walls + allowance,
    overlap,
    waste,
  );
  // Flat net: floor with each wall, fold-over and run-out laid out beside it.
  const edge = slope + fold + anchor;
  const parts = [
    { label: "Floor", areaM2: round2(floor) },
    { label: "Walls", areaM2: round2(walls) },
  ];
  if (fold > 0) parts.push({ label: `Fold-over ${Math.round(fold * 1000)} mm`, areaM2: round2(perimeter * fold) });
  if (anchor > 0) parts.push({ label: `Anchor run-out ${round2(anchor)} m`, areaM2: round2(perimeter * anchor) });
  return {
    ok: true,
    area: {
      installationAreaM2: round2(floor + walls),
      // Same rounding as the catalogue (0.1 m²); the before-allowance figure stays at 2 decimals.
      materialAreaM2: round1(materialAreaM2),
      overlapPercentApplied,
      wastePercentApplied,
      flatLengthM: round3(lb + 2 * edge),
      flatWidthM: round3(wb + 2 * edge),
      parts,
    },
  };
}

// ---------------------------------------------------------------------------
// Folding
// ---------------------------------------------------------------------------

/**
 * ASSUMPTION (to confirm against a weighed and measured liner): PVC-coated
 * polyester tank liner fabric is about 1.3 g/cm³, so 550 gsm ≈ 0.42 mm and
 * 800 gsm ≈ 0.62 mm thick.
 */
export const PVC_DENSITY_G_PER_CM3 = 1.3;
/**
 * ASSUMPTION: a hand-folded liner takes about twice its solid volume (air
 * between layers, welded seams, rounded fold edges). Raise it for a looser pack.
 */
export const DEFAULT_BULK_FACTOR = 2;
export const DEFAULT_MAX_EDGE_CM = 100;
/** Folds closer than this are not practical in liner fabric. */
export const DEFAULT_MIN_PANEL_CM = 20;
/** Wrapping (plastic + strapping) added to each side of the bundle. */
export const DEFAULT_WRAP_CM = 1;
/** Usual courier volumetric divisor (cm³ per kg). The Courier Guy applies its own on the rate. */
export const VOLUMETRIC_DIVISOR = 5000;

export function sheetThicknessMm(gsm: number, densityGPerCm3 = PVC_DENSITY_G_PER_CM3): number {
  return round3(gsm / (densityGPerCm3 * 1000));
}

export type FoldOptions = {
  maxEdgeCm?: number;
  minPanelCm?: number;
  bulkFactor?: number;
  wrapCm?: number;
  densityGPerCm3?: number;
};

export type FoldedParcel = PackedParcel & {
  layers: number;
  panelsAlongLength: number;
  panelsAlongWidth: number;
  thicknessMm: number;
  volumetricWeightKg: number;
  fitsMaxEdge: boolean;
  note: string;
};

/**
 * Smallest folded bundle for a flat sheet of `flatLengthM` × `flatWidthM`
 * (scaled to `areaM2`).
 *
 * Model: the sheet is concertina-folded into nx equal panels along its length,
 * then the strip into ny panels along its width, giving a stack of nx·ny layers
 * with footprint (L/nx) × (W/ny) and height nx·ny × thickness × bulk factor.
 * Every (nx, ny) with panels no narrower than minPanelCm is tried; the one
 * with the shortest longest side wins (ties: smaller volume, then fewer folds).
 * Folding the finished bundle in half again is the same as doubling nx or ny,
 * so it is covered. If nothing fits under maxEdgeCm the most compact bundle is
 * returned with fitsMaxEdge = false.
 *
 * Because PVC packs at roughly 600–700 kg/m³, the courier normally charges on
 * actual weight, not volume; the folded size mainly proves the parcel fits.
 */
export function foldLinerParcel(
  sheet: { flatLengthM: number; flatWidthM: number; areaM2: number; gsm: number },
  options: FoldOptions = {},
): FoldedParcel {
  const maxEdge = options.maxEdgeCm ?? DEFAULT_MAX_EDGE_CM;
  const minPanel = options.minPanelCm ?? DEFAULT_MIN_PANEL_CM;
  const bulk = options.bulkFactor ?? DEFAULT_BULK_FACTOR;
  const wrap = options.wrapCm ?? DEFAULT_WRAP_CM;
  const thicknessMm = sheetThicknessMm(sheet.gsm, options.densityGPerCm3);
  const scale = Math.sqrt(sheet.areaM2 / (sheet.flatLengthM * sheet.flatWidthM)) || 1;
  const lengthCm = sheet.flatLengthM * scale * 100;
  const widthCm = sheet.flatWidthM * scale * 100;
  const layerCm = (thicknessMm / 10) * bulk;
  const maxNx = Math.max(1, Math.floor(lengthCm / minPanel));
  const maxNy = Math.max(1, Math.floor(widthCm / minPanel));

  type Candidate = { nx: number; ny: number; dims: [number, number, number]; longest: number; volume: number };
  let best: Candidate | null = null;
  let bestFitting: Candidate | null = null;
  const better = (a: Candidate, b: Candidate | null) =>
    !b ||
    a.longest < b.longest ||
    (a.longest === b.longest && (a.volume < b.volume || (a.volume === b.volume && a.nx + a.ny < b.nx + b.ny)));

  for (let nx = 1; nx <= maxNx; nx += 1) {
    for (let ny = 1; ny <= maxNy; ny += 1) {
      const a = Math.ceil(lengthCm / nx + 2 * wrap);
      const b = Math.ceil(widthCm / ny + 2 * wrap);
      const c = Math.ceil(nx * ny * layerCm + 2 * wrap);
      const dims = [a, b, c].sort((x, y) => y - x) as [number, number, number];
      const candidate: Candidate = { nx, ny, dims, longest: dims[0], volume: a * b * c };
      if (better(candidate, best)) best = candidate;
      if (candidate.longest <= maxEdge && better(candidate, bestFitting)) bestFitting = candidate;
    }
  }
  const chosen = (bestFitting ?? best)!;
  const weightKg = pvcLinerWeightKg(asLiner(sheet.areaM2, sheet.gsm));
  const [l, w, h] = chosen.dims;
  const layers = chosen.nx * chosen.ny;
  const flat = `${round1(lengthCm / 100)} × ${round1(widthCm / 100)} m`;
  return {
    lengthCm: l,
    widthCm: w,
    heightCm: h,
    weightKg,
    layers,
    panelsAlongLength: chosen.nx,
    panelsAlongWidth: chosen.ny,
    thicknessMm,
    volumetricWeightKg: round1((l * w * h) / VOLUMETRIC_DIVISOR),
    fitsMaxEdge: Boolean(bestFitting),
    note:
      `Laid flat about ${flat}; folded into ${chosen.nx} panel${chosen.nx === 1 ? "" : "s"} one way and ` +
      `${chosen.ny} the other (${layers} layers of ${thicknessMm} mm, ×${bulk} for air and seams), ` +
      `plus ${wrap} cm wrapping each side → ${l} × ${w} × ${h} cm.` +
      (bestFitting ? "" : ` Even folded tightly the longest side is over ${maxEdge} cm.`),
  };
}

/** The online-checkout rule of thumb (1.0 × 0.4 × 0.4 m up to 100 kg), for comparison. */
export function catalogueRuleParcel(areaM2: number, gsm: number): PackedParcel {
  return pvcLinerPackedParcel(asLiner(areaM2, gsm));
}

export function volumetricWeightKg(parcel: Pick<PackedParcel, "lengthCm" | "widthCm" | "heightCm">): number {
  return round1((parcel.lengthCm * parcel.widthCm * parcel.heightCm) / VOLUMETRIC_DIVISOR);
}
