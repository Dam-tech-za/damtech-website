import { toCents } from "../estimating/money.ts";

/**
 * Fixed delivery fee for online PVC liner orders (Tiaan, 2026-11-10):
 * average one-way road distance per province from the nearer Damtech base
 * (Pretoria, or Betty's Bay where that is closer) x R11.50 per return km.
 *
 * Distances: mean straight-line km from the nearer base to the towns in
 * lib/operations/sa-places.ts for that province, x 1.2 for road distance.
 * Temporary until the courier API quotes live rates.
 */
export const DELIVERY_RATE_PER_RETURN_KM_EX_VAT = 11.5;
export const DELIVERY_VAT_RATE_PERCENT = 15;

export const DELIVERY_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export type DeliveryProvince = (typeof DELIVERY_PROVINCES)[number];

export const PROVINCE_AVERAGE_ONE_WAY_KM: Record<DeliveryProvince, number> = {
  "Eastern Cape": 840,
  "Free State": 355,
  Gauteng: 63,
  "KwaZulu-Natal": 515,
  Limpopo: 223,
  Mpumalanga: 220,
  "Northern Cape": 631,
  "North West": 216,
  "Western Cape": 132,
};

/** Optional ceiling on the delivery fee excl. VAT (null = no cap). */
export const DELIVERY_FEE_CAP_EX_VAT: number | null = null;

export function isDeliveryProvince(value: string): value is DeliveryProvince {
  return (DELIVERY_PROVINCES as readonly string[]).includes(value);
}

export type DeliveryQuote = {
  province: DeliveryProvince;
  oneWayKm: number;
  feeExVatZar: number;
  feeInclVatCents: number;
  feeInclVatZar: number;
};

/** Fee excl. VAT rounded up to the next R10, then 15% VAT added. */
export function deliveryQuoteForProvince(province: string): DeliveryQuote | null {
  if (!isDeliveryProvince(province)) return null;
  const oneWayKm = PROVINCE_AVERAGE_ONE_WAY_KM[province];
  let feeExVatZar = Math.ceil((oneWayKm * 2 * DELIVERY_RATE_PER_RETURN_KM_EX_VAT) / 10) * 10;
  if (DELIVERY_FEE_CAP_EX_VAT !== null) feeExVatZar = Math.min(feeExVatZar, DELIVERY_FEE_CAP_EX_VAT);
  const feeInclVatCents = Math.round(
    (toCents(feeExVatZar) * (100 + DELIVERY_VAT_RATE_PERCENT)) / 100,
  );
  return {
    province,
    oneWayKm,
    feeExVatZar,
    feeInclVatCents,
    feeInclVatZar: feeInclVatCents / 100,
  };
}

/**
 * Collection instead of delivery (Tiaan, 2026-11-10). Only the town is shown:
 * the exact address and time are sent when the order is ready.
 */
export const COLLECTION_POINTS = {
  pretoria: { label: "Pretoria", fulfilmentMethod: "collection_pretoria" },
  "bettys-bay": { label: "Betty's Bay", fulfilmentMethod: "collection_bettys_bay" },
} as const;

export type CollectionPointId = keyof typeof COLLECTION_POINTS;
export const COLLECTION_POINT_IDS = Object.keys(COLLECTION_POINTS) as CollectionPointId[];

export function parseCollectionPoint(value: unknown): CollectionPointId | null {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  return (COLLECTION_POINT_IDS as string[]).includes(v) ? (v as CollectionPointId) : null;
}

/** "Collection in Pretoria" or "Delivery to Gauteng", from the stored fulfilment method. */
export function fulfilmentLabel(fulfilmentMethod: string | null | undefined, province: string): string {
  const point = COLLECTION_POINT_IDS.find((id) => COLLECTION_POINTS[id].fulfilmentMethod === fulfilmentMethod);
  return point ? `Collection in ${COLLECTION_POINTS[point].label}` : `Delivery to ${province}`;
}

export function isCollectionMethod(fulfilmentMethod: string | null | undefined): boolean {
  return Boolean(fulfilmentMethod?.startsWith("collection_"));
}
