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

export type StartPvcCheckoutResult =
  | { success: true; orderReference: string; payfast: PayfastForm }
  | { success: false; error: string; field?: string };

function isOrderableLiner(sku: string, quantity: number): boolean {
  return (
    Boolean(getPvcLinerBySku(sku)) &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= PVC_LINER_MAX_QUANTITY
  );
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

  const limited = await limitPublicOrderSubmit(await headers());
  if (!limited.success && limited.reason === "rate_limited") {
    const retryAfterSeconds = Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 1000));
    return { success: false, error: customerMessageForCode("RATE_LIMITED", { retryAfterSeconds }) };
  }

  const pricing = pricePvcOrder(liner, colour, parsed.data.quantity, delivery, collection);
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
