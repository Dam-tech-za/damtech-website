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

/** Each liner has its own product page, e.g. /pvc-tank-liners/dmt-pvc-550-05m-3r/. */
export function pvcLinerSlug(liner: PvcLiner): string {
  return liner.sku.toLowerCase();
}

export function pvcLinerProductPath(liner: PvcLiner): string {
  return `${PVC_LINER_PAGE_PATH}${pvcLinerSlug(liner)}/`;
}

export function getPvcLinerBySlug(slug: string): PvcLiner | null {
  const liner = getPvcLinerBySku(slug);
  return liner && pvcLinerSlug(liner) === slug ? liner : null;
}

export function pvcLinerSizeLabel(liner: PvcLiner): string {
  return `${liner.diameterM} m × ${liner.heightM.toFixed(2)} m`;
}

export function pvcLinerProductTitle(liner: PvcLiner): string {
  return `${liner.gsm} gsm PVC Tank Liner for ${pvcLinerSizeLabel(liner)} Corrugated Steel Tank (${Math.round(liner.volumeKl)} kL)`;
}

export function pvcLinerDiametersForRows(rows: number): number[] {
  return PVC_LINER_PRICE_ROWS.filter((r) => r.rows === rows).map((r) => r.diameterM);
}

/** Cheapest VAT-inclusive liner price, for "from" copy on the product page. */
export function cheapestPvcLinerInclVat(): number {
  return Math.min(...PVC_LINERS.map((l) => l.priceInclVatZar));
}

/** Liner colours. Same price for both (Tiaan, 2026-11-10). */
export const PVC_LINER_COLOURS = ["blue", "black"] as const;
export type PvcLinerColour = (typeof PVC_LINER_COLOURS)[number];
export const PVC_LINER_DEFAULT_COLOUR: PvcLinerColour = "blue";

export const PVC_LINER_COLOUR_LABELS: Record<PvcLinerColour, string> = {
  blue: "Blue",
  black: "Black",
};

/**
 * Owner-supplied product illustrations (AI-rendered; the WebP files carry
 * IPTC DigitalSourceType=trainedAlgorithmicMedia). They show the material
 * and colour, not a Damtech installation, and alt text must say no more.
 */
export const PVC_LINER_COLOUR_IMAGES: Record<PvcLinerColour, { src: string; alt: string; width: number; height: number }> = {
  blue: {
    src: "/images/blue-pvc-tank-liner-folded-damtech.webp",
    alt: "Folded blue PVC tank liner for a corrugated steel water tank",
    width: 1200,
    height: 1200,
  },
  black: {
    src: "/images/black-pvc-tank-liner-folded-damtech.webp",
    alt: "Folded black PVC tank liner for a corrugated steel water tank",
    width: 1200,
    height: 1200,
  },
};

export function parsePvcLinerColour(value: unknown): PvcLinerColour | null {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  return (PVC_LINER_COLOURS as readonly string[]).includes(v) ? (v as PvcLinerColour) : null;
}

/** Product name as stored on the order, e.g. "…, 5 m × 2.29 m, blue". */
export function pvcLinerOrderName(liner: PvcLiner, colour: PvcLinerColour): string {
  return `${liner.name}, ${colour}`;
}

/**
 * Above this liner value (incl. VAT) delivery is not charged at checkout.
 * Courier Guy will not cover a declared value above R30 000, so we quote the
 * delivery afterwards and charge it separately, or the customer collects.
 * Change this one number to move the cut-off.
 */
export const PVC_DELIVERY_SEPARATE_ABOVE_ZAR = 30_000;

/** Whether delivery for this many liners is charged separately (not at checkout). */
export function pvcDeliveryChargedSeparately(goodsInclVatZar: number): boolean {
  return goodsInclVatZar > PVC_DELIVERY_SEPARATE_ABOVE_ZAR;
}

/** A paid delivery order with no delivery fee: delivery is charged separately. */
export function isDeliveryChargedSeparately(fulfilmentMethod: string | null | undefined, deliveryFeeZar: unknown): boolean {
  return fulfilmentMethod === "delivery_south_africa" && Number(deliveryFeeZar ?? 0) === 0;
}

export const PVC_DELIVERY_SEPARATE_NOTE =
  "Delivery will be charged separately. Orders over R30 000 are above the courier's cover limit, so we send you the delivery cost before dispatch. Or choose collection.";
