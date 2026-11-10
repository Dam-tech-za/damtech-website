import { toCents } from "../estimating/money.ts";
import { PVC_LINER_PRICE_ROWS, PVC_LINER_PRICE_VERSION } from "./pvc-liner-prices.generated.ts";

export { PVC_LINER_PRICE_VERSION };

export const PVC_LINER_GSM_OPTIONS = [550, 800] as const;
export type PvcLinerGsm = (typeof PVC_LINER_GSM_OPTIONS)[number];

export const PVC_LINER_ROWS_OPTIONS = [2, 3, 4] as const;
export type PvcLinerRows = (typeof PVC_LINER_ROWS_OPTIONS)[number];

export const PVC_LINER_PAGE_PATH = "/pvc-tank-liners/" as const;
export const PVC_LINER_CHECKOUT_PATH = "/pvc-tank-liners/checkout/" as const;
export const PVC_LINER_MANUFACTURE_LABEL = "Made to order in 3 to 5 business days";
export const PVC_LINER_MAX_QUANTITY = 10;

const VAT_RATE_PERCENT = 15;
const SKU_RE = /^DMT-PVC-(550|800)-(\d{2})M-([234])R$/;

export type PvcLiner = {
  sku: string;
  gsm: PvcLinerGsm;
  diameterM: number;
  rows: PvcLinerRows;
  heightM: number;
  volumeKl: number;
  linerAreaM2: number;
  name: string;
  summary: string;
  priceExVatZar: number;
  priceInclVatCents: number;
  priceInclVatZar: number;
};

export function pvcLinerSku(gsm: number, diameterM: number, rows: number): string {
  return `DMT-PVC-${gsm}-${String(diameterM).padStart(2, "0")}M-${rows}R`;
}

function heightLabel(heightM: number): string {
  return `${heightM.toFixed(2).replace(/0$/, "")} m`;
}

function build(row: (typeof PVC_LINER_PRICE_ROWS)[number], gsm: PvcLinerGsm): PvcLiner {
  const priceExVatZar = gsm === 550 ? row.exVat550 : row.exVat800;
  const priceInclVatCents = Math.round((toCents(priceExVatZar) * (100 + VAT_RATE_PERCENT)) / 100);
  const rows = row.rows as PvcLinerRows;
  return {
    sku: pvcLinerSku(gsm, row.diameterM, rows),
    gsm,
    diameterM: row.diameterM,
    rows,
    heightM: row.heightM,
    volumeKl: row.volumeKl,
    linerAreaM2: row.linerAreaM2,
    name: `${gsm} gsm PVC tank liner, ${row.diameterM} m × ${heightLabel(row.heightM)}`,
    summary: `Made-up ${gsm} gsm PVC liner for a ${row.diameterM} m diameter, ${rows}-row (${heightLabel(row.heightM)}) corrugated steel tank of about ${Math.round(row.volumeKl)} kL. Floor, walls and a 300 mm fold-over, about ${row.linerAreaM2} m².`,
    priceExVatZar,
    priceInclVatCents,
    priceInclVatZar: priceInclVatCents / 100,
  };
}

export const PVC_LINERS: readonly PvcLiner[] = PVC_LINER_PRICE_ROWS.flatMap((row) =>
  PVC_LINER_GSM_OPTIONS.map((gsm) => build(row, gsm)),
);

const BY_SKU = new Map(PVC_LINERS.map((liner) => [liner.sku, liner]));

export function isPvcLinerSku(value: string): boolean {
  return SKU_RE.test(value) && BY_SKU.has(value);
}

export function getPvcLinerBySku(sku: string): PvcLiner | null {
  return BY_SKU.get(sku.trim().toUpperCase()) ?? null;
}

export function pvcLinerDiametersForRows(rows: number): number[] {
  return PVC_LINER_PRICE_ROWS.filter((r) => r.rows === rows).map((r) => r.diameterM);
}

/** Cheapest VAT-inclusive liner price, for "from" copy on the product page. */
export function cheapestPvcLinerInclVat(): number {
  return Math.min(...PVC_LINERS.map((l) => l.priceInclVatZar));
}
