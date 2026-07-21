/** Pure tank geometry, capacity and price-per-kL helpers. */

export const CAPACITY_TOLERANCE = 0.03; // 3%
export const DEFAULT_USABLE_FACTOR = 0.9;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Theoretical cylindrical volume in kL (1 m³ = 1 kL). */
export function computeNominalCapacityKl(diameterM: number, heightM: number): number {
  return roundTo((Math.PI * diameterM * diameterM) / 4 * heightM, 1);
}

/** Ring count expected for the current Damtech corrugated-sheet catalogue. */
export function expectedRingCount(heightM: number): number | null {
  const key = Math.round(heightM * 10);
  if (key === 15) return 2;
  if (key === 23) return 3;
  if (key === 30) return 4;
  return null;
}

export type TankGeometry = {
  wallAreaM2: number;
  floorAreaM2: number;
  linerAreaM2: number;
};

export function computeGeometry(diameterM: number, heightM: number): TankGeometry {
  const wall = Math.PI * diameterM * heightM;
  const floor = (Math.PI * diameterM * diameterM) / 4;
  return {
    wallAreaM2: roundTo(wall, 3),
    floorAreaM2: roundTo(floor, 3),
    linerAreaM2: roundTo(wall + floor, 3),
  };
}

/** Sum of included commercial components. */
export function computeTotalSell(input: {
  steelSell: number | null;
  linerSell: number | null;
  roofIncluded: boolean;
  roofSell: number | null;
  foundationIncluded: boolean;
  foundationSell: number | null;
  installationIncluded: boolean;
  installationSell: number | null;
}): number {
  let total = (input.steelSell ?? 0) + (input.linerSell ?? 0);
  if (input.roofIncluded) total += input.roofSell ?? 0;
  if (input.foundationIncluded) total += input.foundationSell ?? 0;
  if (input.installationIncluded) total += input.installationSell ?? 0;
  return roundTo(total, 2);
}

export function pricePerUsableKl(sell: number | null, usableKl: number | null): number | null {
  if (sell == null || usableKl == null || usableKl <= 0) return null;
  return roundTo(sell / usableKl, 2);
}

export function withinTolerance(actual: number, expected: number, tolerance = CAPACITY_TOLERANCE): boolean {
  if (expected <= 0) return actual <= 0;
  return Math.abs(actual - expected) / expected <= tolerance;
}

/** Damtech tank code: TNK-{DD}M-{HH}H-{R}R (e.g. TNK-08M-23H-3R). */
export function buildTankCode(diameterM: number, heightM: number, ringCount: number): string {
  const dia = String(Math.round(diameterM)).padStart(2, "0");
  const height = String(Math.round(heightM * 10));
  return `TNK-${dia}M-${height}H-${ringCount}R`;
}
