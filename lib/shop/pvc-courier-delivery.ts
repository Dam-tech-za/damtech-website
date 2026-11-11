import {
  COURIER_DEPOTS,
  getCourierConfig,
  getCourierRates,
  withCourierDepot,
  type CourierDepotId,
  type CourierOrderInput,
  type CourierRate,
} from "../courier/index.ts";
import type { PvcLiner } from "./pvc-liners.ts";
import { pvcLinerPackedParcel } from "./pvc-packing.ts";

/**
 * Live Courier Guy rate for a liner order at checkout. Off unless
 * COURIER_CHECKOUT_RATES=true and the courier settings are complete, so the
 * fixed per-province fee stays in charge until the connection is proven.
 */
export function courierCheckoutRatesEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.COURIER_CHECKOUT_RATES?.trim().toLowerCase() === "true" && getCourierConfig(env).ok;
}

export type CourierDeliveryQuote = {
  feeInclVatCents: number;
  serviceCode: string;
  serviceName: string;
  /** Where the courier collects from: the depot that gave the cheapest rate. */
  depot: CourierDepotId;
};

export type CheckoutAddress = {
  customerName: string;
  businessName?: string;
  customerType?: string;
  email: string;
  phone: string;
  billingLine1: string;
  billingLine2?: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
};

/**
 * Cheapest courier service for this liner and address, or null to fall back to
 * the fixed fee. Every collection depot that is set up (Pretoria, Betty's Bay)
 * is quoted, and the cheapest rate wins, so the nearer depot is used.
 */
export async function quotePvcCourierDelivery(
  liner: PvcLiner,
  quantity: number,
  address: CheckoutAddress,
  fetcher: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<CourierDeliveryQuote | null> {
  return (await quotePvcCourierDeliveryWithReason(liner, quantity, address, fetcher, env)).quote;
}

/** Same as quotePvcCourierDelivery, plus why the fixed fee was used instead. */
export async function quotePvcCourierDeliveryWithReason(
  liner: PvcLiner,
  quantity: number,
  address: CheckoutAddress,
  fetcher: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<{ quote: CourierDeliveryQuote | null; reason: string | null; options?: string[] }> {
  const fail = (reason: string) => ({ quote: null, reason });
  if (!courierCheckoutRatesEnabled(env)) return fail("Live courier rates are switched off.");
  const config = getCourierConfig(env);
  if (!config.ok) return fail(config.reason);
  const order: CourierOrderInput = {
    order_reference: "quote",
    customer_name: address.customerName,
    business_name: address.businessName || null,
    customer_type: address.customerType ?? null,
    email: address.email,
    phone: address.phone,
    billing_line1: address.billingLine1,
    billing_line2: address.billingLine2 || null,
    billing_suburb: address.suburb,
    billing_city: address.city,
    billing_province: address.province,
    billing_postal_code: address.postalCode,
    product_name_snapshot: liner.name,
    total_price_snapshot: (liner.priceInclVatCents * quantity) / 100,
  };
  const parcel = pvcLinerPackedParcel(liner);
  const parcels = Array.from({ length: quantity }, () => parcel);
  const depots = Object.keys(config.config.depots) as CourierDepotId[];
  const results = await Promise.all(
    depots.map(async (depot) => ({
      depot,
      result: await getCourierRates(withCourierDepot(config.config, depot), order, parcels, fetcher),
    })),
  );
  const rates: (CourierRate & { depot: CourierDepotId })[] = [];
  const errors: string[] = [];
  for (const { depot, result } of results) {
    if (result.ok) rates.push(...result.data.map((rate) => ({ ...rate, depot })));
    else errors.push(depots.length > 1 ? `${COURIER_DEPOTS[depot]}: ${result.error}` : result.error);
  }
  if (rates.length === 0) {
    console.error("[checkout] courier rate failed:", errors.join(" | "));
    return fail(errors.join(" ") || "The Courier Guy returned no services for this address.");
  }
  rates.sort((a, b) => a.rate - b.rate);
  // Every service offered, cheapest first, so a test site can show why one was picked.
  const options = rates.map(
    (rate) => `${depots.length > 1 ? `${COURIER_DEPOTS[rate.depot]}: ` : ""}${rate.serviceName} R${rate.rate.toFixed(2)}`,
  );
  const cheapest = rates[0];
  const feeInclVatCents = Math.round(cheapest.rate * 100);
  // A zero or absurd rate means the answer was not understood: use the fixed fee.
  if (!Number.isFinite(feeInclVatCents) || feeInclVatCents < 1000) {
    return fail(`The Courier Guy returned a rate of R${cheapest.rate} for ${cheapest.serviceName}, which looks wrong.`);
  }
  return {
    quote: {
      feeInclVatCents,
      serviceCode: cheapest.serviceCode,
      serviceName: cheapest.serviceName,
      depot: cheapest.depot,
    },
    reason: null,
    options,
  };
}
