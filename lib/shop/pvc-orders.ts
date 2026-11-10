import { randomUUID } from "node:crypto";
import { createServiceRoleClient } from "../supabase/admin.ts";
import { isSupabaseServiceConfigured } from "../supabase/env.ts";
import { vatFromInclusiveCents } from "../orders/money.ts";
import { generateOrderReference } from "../orders/reference.ts";
import { DELIVERY_FULFILMENT } from "../orders/delivery.ts";
import type { PublicOrderFormInput } from "../orders/schema.ts";
import type { DeliveryQuote } from "./delivery.ts";
import {
  PVC_LINER_PRICE_VERSION,
  pvcLinerOrderName,
  type PvcLiner,
  type PvcLinerColour,
} from "./pvc-liners.ts";

/** Server-side price for a liner order. Never trust client totals. */
export type PvcOrderPricing = {
  liner: PvcLiner;
  colour: PvcLinerColour;
  quantity: number;
  goodsInclVatCents: number;
  goodsVatCents: number;
  delivery: DeliveryQuote;
  amountDueCents: number;
};

export function pricePvcOrder(
  liner: PvcLiner,
  colour: PvcLinerColour,
  quantity: number,
  delivery: DeliveryQuote,
): PvcOrderPricing {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a positive whole number.");
  }
  const goodsInclVatCents = liner.priceInclVatCents * quantity;
  return {
    liner,
    colour,
    quantity,
    goodsInclVatCents,
    goodsVatCents: vatFromInclusiveCents(goodsInclVatCents),
    delivery,
    amountDueCents: goodsInclVatCents + delivery.feeInclVatCents,
  };
}

export type PvcOrderRecord = {
  id: string;
  orderReference: string;
  viewToken: string;
  status: string;
  paymentStatus: string;
  email: string;
  customerName: string;
  phone: string;
  productName: string;
  sku: string;
  quantity: number;
  goodsTotalZar: number;
  deliveryFeeZar: number;
  amountDueZar: number;
  amountPaidZar: number | null;
  province: string;
  createdAt: string;
  paidAt: string | null;
};

const SELECT =
  "id, order_reference, confirmation_view_token, status, payment_status, email, customer_name, phone, product_name_snapshot, sku, quantity, total_price_snapshot, delivery_fee_snapshot, amount_due_snapshot, amount_paid, billing_province, created_at, paid_at";

type Row = {
  id: string;
  order_reference: string;
  confirmation_view_token: string;
  status: string;
  payment_status: string;
  email: string;
  customer_name: string;
  phone: string;
  product_name_snapshot: string;
  sku: string;
  quantity: number;
  total_price_snapshot: number | string;
  delivery_fee_snapshot: number | string;
  amount_due_snapshot: number | string | null;
  amount_paid: number | string | null;
  billing_province: string;
  created_at: string;
  paid_at: string | null;
};

function mapRow(row: Row): PvcOrderRecord {
  const goods = Number(row.total_price_snapshot);
  const delivery = Number(row.delivery_fee_snapshot);
  return {
    id: row.id,
    orderReference: row.order_reference,
    viewToken: row.confirmation_view_token,
    status: row.status,
    paymentStatus: row.payment_status,
    email: row.email,
    customerName: row.customer_name,
    phone: row.phone,
    productName: row.product_name_snapshot,
    sku: row.sku,
    quantity: row.quantity,
    goodsTotalZar: goods,
    deliveryFeeZar: delivery,
    amountDueZar: row.amount_due_snapshot == null ? goods + delivery : Number(row.amount_due_snapshot),
    amountPaidZar: row.amount_paid == null ? null : Number(row.amount_paid),
    province: row.billing_province,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

export type CreatePvcOrderResult =
  | { ok: true; order: PvcOrderRecord; replay: boolean }
  | { ok: false; code: "CONFIGURATION_ERROR" | "DATABASE_UNAVAILABLE"; error: string };

/** Insert an awaiting-payment order. Idempotent on the form's submissionId. */
export async function createPvcLinerOrder(input: {
  data: PublicOrderFormInput;
  pricing: PvcOrderPricing;
  acceptedAtIso: string;
}): Promise<CreatePvcOrderResult> {
  if (!isSupabaseServiceConfigured()) {
    return { ok: false, code: "CONFIGURATION_ERROR", error: "Order storage is not configured." };
  }
  const client = createServiceRoleClient();
  const { data, pricing, acceptedAtIso } = input;

  const existing = await client
    .from("catalogue_orders")
    .select(SELECT)
    .eq("idempotency_token", data.submissionId)
    .maybeSingle();
  if (existing.data) return { ok: true, order: mapRow(existing.data as Row), replay: true };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: inserted, error } = await client
      .from("catalogue_orders")
      .insert({
        order_reference: generateOrderReference(),
        confirmation_view_token: randomUUID(),
        idempotency_token: data.submissionId,
        status: "awaiting_payment",
        payment_method: "payfast",
        payment_status: "pending",
        sku: pricing.liner.sku,
        product_name_snapshot: pvcLinerOrderName(pricing.liner, pricing.colour),
        quantity: pricing.quantity,
        unit_price_snapshot: pricing.liner.priceInclVatZar,
        vat_rate_snapshot: 15,
        vat_amount_snapshot: pricing.goodsVatCents / 100,
        total_price_snapshot: pricing.goodsInclVatCents / 100,
        delivery_fee_snapshot: pricing.delivery.feeInclVatZar,
        delivery_one_way_km_snapshot: pricing.delivery.oneWayKm,
        amount_due_snapshot: pricing.amountDueCents / 100,
        price_version: PVC_LINER_PRICE_VERSION,
        currency: "ZAR",
        customer_type: data.customerType,
        customer_name: data.customerName,
        business_name: data.businessName || null,
        email: data.email,
        phone: data.phone,
        vat_number: data.vatNumber || null,
        customer_po_number: data.customerPoNumber || null,
        billing_line1: data.billingLine1,
        billing_line2: data.billingLine2 || null,
        billing_suburb: data.suburb,
        billing_city: data.city,
        billing_province: data.province,
        billing_postal_code: data.postalCode,
        fulfilment_method: DELIVERY_FULFILMENT.method,
        notes: data.notes || null,
        terms_accepted_at: acceptedAtIso,
        privacy_accepted_at: acceptedAtIso,
        exclusions_accepted_at: acceptedAtIso,
        confirmation_email_status: "pending",
        internal_email_status: "pending",
      })
      .select(SELECT)
      .single();

    if (!error && inserted) return { ok: true, order: mapRow(inserted as Row), replay: false };
    if (error?.code === "23505") {
      const replay = await client
        .from("catalogue_orders")
        .select(SELECT)
        .eq("idempotency_token", data.submissionId)
        .maybeSingle();
      if (replay.data) return { ok: true, order: mapRow(replay.data as Row), replay: true };
      continue;
    }
    console.error("[pvc-orders] insert failed:", error?.message ?? "unknown");
    return { ok: false, code: "DATABASE_UNAVAILABLE", error: "We could not save your order. Please try again shortly." };
  }
  return { ok: false, code: "DATABASE_UNAVAILABLE", error: "We could not allocate an order reference. Please try again." };
}

export async function getPvcOrderByReference(orderReference: string): Promise<PvcOrderRecord | null> {
  if (!isSupabaseServiceConfigured()) return null;
  const { data } = await createServiceRoleClient()
    .from("catalogue_orders")
    .select(SELECT)
    .eq("order_reference", orderReference)
    .eq("payment_method", "payfast")
    .maybeSingle();
  return data ? mapRow(data as Row) : null;
}

export async function getPvcOrderForCustomer(
  orderReference: string,
  viewToken: string,
): Promise<PvcOrderRecord | null> {
  const order = await getPvcOrderByReference(orderReference);
  if (!order || order.viewToken !== viewToken) return null;
  return order;
}

/**
 * Mark an order paid. Only moves awaiting_payment -> paid, so a repeated ITN
 * is a no-op. Returns true when this call made the change.
 */
export async function markPvcOrderPaid(input: {
  orderId: string;
  payfastPaymentId: string;
  amountPaidZar: number;
}): Promise<boolean> {
  const now = new Date().toISOString();
  const { data, error } = await createServiceRoleClient()
    .from("catalogue_orders")
    .update({
      status: "paid",
      payment_status: "paid",
      payfast_payment_id: input.payfastPaymentId,
      amount_paid: input.amountPaidZar,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", input.orderId)
    .eq("payment_method", "payfast")
    .neq("payment_status", "paid")
    .select("id");
  if (error) throw new Error(`mark paid failed: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

/** Record a failed/cancelled payment without overwriting a paid order. */
export async function markPvcOrderPaymentFailed(
  orderId: string,
  paymentStatus: "failed" | "cancelled",
): Promise<void> {
  await createServiceRoleClient()
    .from("catalogue_orders")
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("payment_method", "payfast")
    .neq("payment_status", "paid");
}

export async function logPaymentEvent(event: {
  orderId: string | null;
  mPaymentId: string;
  providerPaymentId: string;
  providerStatus: string;
  amountGross: string;
  signatureValid: boolean;
  sourceIp: string;
  sourceIpRecognised: boolean;
  serverConfirmed: boolean;
  amountMatches: boolean;
  outcome: string;
  payload: Record<string, string>;
}): Promise<void> {
  try {
    const { signature: _signature, ...payload } = event.payload;
    void _signature;
    const amount = Number(event.amountGross);
    await createServiceRoleClient().from("catalogue_order_payment_events").insert({
      order_id: event.orderId,
      provider: "payfast",
      m_payment_id: event.mPaymentId || null,
      provider_payment_id: event.providerPaymentId || null,
      provider_status: event.providerStatus || null,
      amount_gross: Number.isFinite(amount) ? amount : null,
      signature_valid: event.signatureValid,
      source_ip: event.sourceIp || null,
      source_ip_recognised: event.sourceIpRecognised,
      server_confirmed: event.serverConfirmed,
      amount_matches: event.amountMatches,
      outcome: event.outcome,
      payload,
    });
  } catch (error) {
    console.error("[payfast] event log failed", error instanceof Error ? error.message : "unknown");
  }
}

export async function setPvcOrderEmailStatus(
  orderId: string,
  confirmation: string,
  internal: string,
): Promise<void> {
  await createServiceRoleClient()
    .from("catalogue_orders")
    .update({
      confirmation_email_status: confirmation,
      internal_email_status: internal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}
