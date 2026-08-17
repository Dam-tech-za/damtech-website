import type {
  CatalogueFulfilmentLeadTime,
  CatalogueMerchantAvailability,
  MerchantAvailabilityCode,
} from "./types.ts";

/**
 * Confirmed DamTech fulfilment windows for made-to-order catalogue kits.
 * Times start after cleared payment and confirmation of the delivery address.
 */
export const CATALOGUE_FULFILMENT_LEAD_TIME = {
  status: "resolved",
  manufacturingMinBusinessDays: 5,
  manufacturingMaxBusinessDays: 10,
  deliveryMinBusinessDays: 3,
  deliveryMaxBusinessDays: 5,
  totalMinBusinessDays: 8,
  totalMaxBusinessDays: 15,
} as const satisfies CatalogueFulfilmentLeadTime;

export const CATALOGUE_MERCHANT_AVAILABILITY = {
  status: "resolved",
  value: "in_stock",
} as const satisfies CatalogueMerchantAvailability;

/** @deprecated Prefer CATALOGUE_FULFILMENT_LEAD_TIME */
export const CATALOGUE_COLLECTION_LEAD_TIME = CATALOGUE_FULFILMENT_LEAD_TIME;

const SCHEMA_AVAILABILITY: Record<MerchantAvailabilityCode, string> = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
  backorder: "https://schema.org/BackOrder",
};

export function isResolvedMerchantAvailability(
  value: CatalogueMerchantAvailability,
): value is Extract<CatalogueMerchantAvailability, { status: "resolved" }> {
  return value.status === "resolved";
}

export function isResolvedFulfilmentLeadTime(
  value: CatalogueFulfilmentLeadTime,
): value is Extract<CatalogueFulfilmentLeadTime, { status: "resolved" }> {
  return value.status === "resolved";
}

/** @deprecated Prefer isResolvedFulfilmentLeadTime */
export const isResolvedCollectionLeadTime = isResolvedFulfilmentLeadTime;

export function merchantAvailabilityToFeedValue(
  availability: CatalogueMerchantAvailability,
): MerchantAvailabilityCode | undefined {
  if (!isResolvedMerchantAvailability(availability)) return undefined;
  return availability.value;
}

export function merchantAvailabilityToSchemaUrl(
  availability: CatalogueMerchantAvailability,
): string | undefined {
  const value = merchantAvailabilityToFeedValue(availability);
  return value ? SCHEMA_AVAILABILITY[value] : undefined;
}

export function merchantAvailabilityDate(
  availability: CatalogueMerchantAvailability,
): string | undefined {
  if (!isResolvedMerchantAvailability(availability)) return undefined;
  return availability.availabilityDate;
}

export const CATALOGUE_AVAILABILITY_COPY =
  "Made to order and available to order. Manufacturing takes 5–10 business days after cleared payment.";

export const CATALOGUE_FULFILMENT_COPY = {
  fulfilment: "Delivery only",
  madeToOrder: "Made to order and available to order.",
  manufacturing:
    "Manufacturing time: 5–10 business days after cleared payment.",
  delivery:
    "Estimated delivery time: 3–5 business days after manufacturing is complete.",
  total:
    "Estimated total fulfilment time: 8–15 business days after cleared payment.",
  priceExclusions:
    "Product price includes VAT. Delivery and installation are excluded.",
  deliveryCharge:
    "Delivery is calculated from the kit shipping weight in kilograms. DamTech confirms the delivery charge on the formal invoice.",
} as const;

/** Visible product/order availability. */
export function cataloguePublicAvailabilityCopy(): string {
  return CATALOGUE_AVAILABILITY_COPY;
}

export function catalogueManufacturingLeadTimeLabel(): string {
  return "5–10 business days";
}

export function catalogueDeliveryLeadTimeLabel(): string {
  return "3–5 business days after manufacturing";
}

export function catalogueTotalFulfilmentLeadTimeLabel(): string {
  return "8–15 business days after cleared payment";
}
