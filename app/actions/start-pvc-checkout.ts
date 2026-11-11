"use server";

import { headers } from "next/headers";
import { limitPublicOrderSubmit } from "@/lib/rate-limit/public-order";
import { customerMessageForCode } from "@/lib/rfq/submission-result";
import { parsePublicOrderFormData } from "@/lib/orders/schema";
import {
  buildPayfastForm,
  getPayfastConfig,
  splitCustomerName,
  type PayfastForm,
} from "@/lib/payfast";
import { deliveryQuoteForProvince, fulfilmentLabel, parseCollectionPoint } from "@/lib/shop/delivery";
import { shopOrigin } from "@/lib/shop/origin";
import {
  getPvcLinerBySku,
  parsePvcLinerColour,
  PVC_LINER_CHECKOUT_PATH,
  PVC_LINER_MAX_QUANTITY,
} from "@/lib/shop/pvc-liners";
import { createPvcLinerOrder, pricePvcOrder } from "@/lib/shop/pvc-orders";
import {
  cachedPvcCourierQuote,
  courierCheckoutRatesEnabled,
  quotePvcCourierDelivery,
  quotePvcCourierDeliveryWithReason,
} from "@/lib/shop/pvc-courier-delivery";

/** Shown when live courier rates are on but no rate came back. No fixed fee is charged instead. */
const DELIVERY_UNAVAILABLE =
  "We could not work out the delivery cost for this address right now. Check the address and try again in a minute, or contact us to order.";

export type PvcDeliveryQuoteResult =
  | { feeInclVatCents: number; serviceName: string; debugReason?: string; debugOptions?: string }
  | { unavailable: string; debugReason?: string };
import { enforceRateLimit } from "@/lib/rate-limit/client";
import { publicClientRateKey, type RateLimitPolicy } from "@/lib/rate-limit/types";

const DELIVERY_QUOTE_POLICY: RateLimitPolicy = {
  name: "public-delivery-quote",
  limit: 60,
  windowMs: 10 * 60 * 1000,
  onProviderError: "fail_open_public",
};

export type StartPvcCheckoutResult =
  | { success: true; orderReference: string; payfast: PayfastForm }
  | { success: false; error: string; field?: string }
  /** Live courier fee the customer must see before paying. Nothing is created yet. */
  | { success: false; confirmDelivery: { feeInclVatCents: number; serviceName: string } };

function isOrderableLiner(sku: string, quantity: number): boolean {
  return (
    Boolean(getPvcLinerBySku(sku)) &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= PVC_LINER_MAX_QUANTITY
  );
}

const clean = (formData: FormData, name: string, max: number) =>
  String(formData.get(name) ?? "").trim().slice(0, max);

/**
 * Delivery fee for the address typed so far, shown as soon as it is complete.
 * Creates nothing. The fee is checked again when the order is placed.
 */
export async function quotePvcDelivery(
  formData: FormData,
): Promise<PvcDeliveryQuoteResult | null> {
  const liner = getPvcLinerBySku(clean(formData, "sku", 40));
  const quantity = Math.trunc(Number(formData.get("quantity") ?? "1"));
  const province = clean(formData, "province", 40);
  const fixed = deliveryQuoteForProvince(province);
  const address = {
    customerName: clean(formData, "customerName", 120) || "Customer",
    businessName: clean(formData, "businessName", 160),
    customerType: clean(formData, "customerType", 20),
    email: clean(formData, "email", 200),
    phone: clean(formData, "phone", 30),
    billingLine1: clean(formData, "billingLine1", 200),
    billingLine2: clean(formData, "billingLine2", 200),
    suburb: clean(formData, "suburb", 120),
    city: clean(formData, "city", 120),
    province,
    postalCode: clean(formData, "postalCode", 12),
  };
  if (!liner || !fixed || !isOrderableLiner(liner.sku, quantity)) return null;
  if (!address.billingLine1 || !address.suburb || !address.city || !address.postalCode) return null;

  // A quote already worked out for this address costs nothing and is not rate limited.
  const cached = cachedPvcCourierQuote(liner, quantity, address);
  const limit = cached
    ? { success: true }
    : await enforceRateLimit(publicClientRateKey(await headers(), "public-delivery-quote"), DELIVERY_QUOTE_POLICY);
  const result = cached
    ? cached
    : limit.success
      ? await quotePvcCourierDeliveryWithReason(liner, quantity, address)
      : { quote: null, reason: "Too many delivery quotes from this connection; wait a few minutes." };
  const preview = process.env.VERCEL_ENV !== "production";
  if (result.quote) {
    // The services Courier Guy offered, shown on preview deployments only, never to live customers.
    const debugOptions = preview && "options" in result && result.options?.length ? result.options.join(", ") : undefined;
    return {
      feeInclVatCents: result.quote.feeInclVatCents,
      serviceName: result.quote.serviceName,
      ...(debugOptions ? { debugOptions } : {}),
    };
  }
  // Why no live rate came back, shown on preview deployments only, never to live customers.
  const debugReason = preview && result.reason ? result.reason : undefined;
  // With live rates on, never fall back to the fixed province fee: it can be far
  // off the real courier cost. The customer tries again or contacts us.
  if (courierCheckoutRatesEnabled()) return { unavailable: DELIVERY_UNAVAILABLE, ...(debugReason ? { debugReason } : {}) };
  return { feeInclVatCents: fixed.feeInclVatCents, serviceName: "Standard delivery", ...(debugReason ? { debugReason } : {}) };
}

export async function startPvcCheckout(formData: FormData): Promise<StartPvcCheckoutResult> {
  const parsed = parsePublicOrderFormData(formData, {
    isOrderable: isOrderableLiner,
    confirmSupplyOnlyMessage: "Confirm that the liner is made to order for your tank size.",
    confirmExclusionsMessage: "Confirm that installation is not included.",
  });
  if (!parsed.ok) return { success: false, error: parsed.error, field: parsed.field };
  if (parsed.isSpam) return { success: false, error: "Please reload the page and try again." };
  if (Date.now() - parsed.data.formStartedAt < 4000) {
    return { success: false, error: "Please take a moment to review your details." };
  }

  const liner = getPvcLinerBySku(parsed.data.sku);
  const delivery = deliveryQuoteForProvince(parsed.data.province);
  const colour = parsePvcLinerColour(formData.get("colour"));
  const collectionRaw = String(formData.get("collection") ?? "").trim();
  const collection = parseCollectionPoint(collectionRaw);
  if (collectionRaw && !collection) {
    return { success: false, error: "Choose delivery or a collection point.", field: "collection" };
  }
  if (!colour) return { success: false, error: "Choose a liner colour.", field: "colour" };
  if (!liner) return { success: false, error: "This liner is not available online.", field: "sku" };
  if (!delivery) {
    return {
      success: false,
      error: "Online delivery is only available inside South Africa. Contact us for other destinations.",
      field: "province",
    };
  }

  const payfastConfig = getPayfastConfig();
  if (!payfastConfig.ok) {
    console.error("[pvc-checkout] payfast not configured:", payfastConfig.reason);
    return { success: false, error: "Online payment is temporarily unavailable. Please contact us to order." };
  }

  // Live courier rate for this address, when switched on. The customer has to
  // have seen this exact fee before we create the order and send them to pay.
  let courier = null;
  if (!collection) {
    courier = cachedPvcCourierQuote(liner, parsed.data.quantity, parsed.data)?.quote ?? null;
    if (!courier && courierCheckoutRatesEnabled()) {
      const quoteLimit = await enforceRateLimit(
        publicClientRateKey(await headers(), "public-delivery-quote"),
        DELIVERY_QUOTE_POLICY,
      );
      if (quoteLimit.success) courier = await quotePvcCourierDelivery(liner, parsed.data.quantity, parsed.data);
    }
    if (!courier && courierCheckoutRatesEnabled()) {
      return { success: false, error: DELIVERY_UNAVAILABLE, field: "postalCode" };
    }
    const shownCents = Number(formData.get("deliveryFeeShownCents") ?? "");
    if (courier && shownCents !== courier.feeInclVatCents) {
      return {
        success: false,
        confirmDelivery: { feeInclVatCents: courier.feeInclVatCents, serviceName: courier.serviceName },
      };
    }
    if (!courier && Number.isFinite(shownCents) && shownCents > 0 && shownCents !== delivery.feeInclVatCents) {
      return {
        success: false,
        confirmDelivery: { feeInclVatCents: delivery.feeInclVatCents, serviceName: "Standard delivery" },
      };
    }
  }

  const limited = await limitPublicOrderSubmit(await headers());
  if (!limited.success && limited.reason === "rate_limited") {
    const retryAfterSeconds = Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 1000));
    return { success: false, error: customerMessageForCode("RATE_LIMITED", { retryAfterSeconds }) };
  }

  const pricing = pricePvcOrder(liner, colour, parsed.data.quantity, delivery, collection, courier);
  const created = await createPvcLinerOrder({
    data: parsed.data,
    pricing,
    acceptedAtIso: new Date().toISOString(),
  });
  if (!created.ok) return { success: false, error: created.error };

  const order = created.order;
  if (order.paymentStatus === "paid") {
    return { success: false, error: `Order ${order.orderReference} is already paid. Check your email for the receipt.` };
  }

  const origin = shopOrigin();
  const back = `?ref=${encodeURIComponent(order.orderReference)}&t=${encodeURIComponent(order.viewToken)}`;
  const name = splitCustomerName(parsed.data.customerName);
  const payfast = buildPayfastForm(payfastConfig.config, {
    orderReference: order.orderReference,
    amountCents: Math.round(order.amountDueZar * 100),
    itemName: `Damtech ${order.orderReference}`,
    itemDescription: `${order.quantity} x ${order.productName}, ${fulfilmentLabel(order.fulfilmentMethod, order.province).toLowerCase()}`,
    firstName: name.first,
    lastName: name.last,
    email: parsed.data.email,
    cellNumber: parsed.data.phone,
    viewToken: order.viewToken,
    returnUrl: `${origin}${PVC_LINER_CHECKOUT_PATH}return/${back}`,
    cancelUrl: `${origin}${PVC_LINER_CHECKOUT_PATH}cancelled/${back}`,
    notifyUrl: `${origin}/api/payfast/notify/`,
  });

  return { success: true, orderReference: order.orderReference, payfast };
}
