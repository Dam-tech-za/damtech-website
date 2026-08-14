import { randomUUID } from "node:crypto";
import { createServiceRoleClient } from "../supabase/admin.ts";
import { isSupabaseServiceConfigured } from "../supabase/env.ts";
import { DELIVERY_FULFILMENT } from "./delivery.ts";
import { generateOrderReference } from "./reference.ts";
import type { OrderPriceSnapshot } from "./pricing.ts";
import type { PublicOrderFormInput } from "./schema.ts";
import type { OrderEmailStatus } from "./types.ts";

export type CreatedOrder = {
  id: string;
  orderReference: string;
  confirmationViewToken: string;
  status: "pending_invoice";
  createdAt: string;
  idempotentReplay: boolean;
  email: string;
  productName: string;
  quantity: number;
  totalInclVatZar: number;
};

export type CreateOrderResult =
  | { ok: true; order: CreatedOrder }
  | {
      ok: false;
      code: "CONFIGURATION_ERROR" | "DATABASE_UNAVAILABLE" | "DATABASE_CONSTRAINT";
      error: string;
    };

type OrderRow = {
  id: string;
  order_reference: string;
  confirmation_view_token: string;
  status: string;
  created_at: string;
  email: string;
  product_name_snapshot: string;
  quantity: number;
  total_price_snapshot: number;
};

function mapRow(row: OrderRow, idempotentReplay: boolean): CreatedOrder {
  return {
    id: row.id,
    orderReference: row.order_reference,
    confirmationViewToken: row.confirmation_view_token,
    status: "pending_invoice",
    createdAt: row.created_at,
    idempotentReplay,
    email: row.email,
    productName: row.product_name_snapshot,
    quantity: row.quantity,
    totalInclVatZar: Number(row.total_price_snapshot),
  };
}

async function findByIdempotencyToken(
  token: string,
): Promise<CreatedOrder | null> {
  const client = createServiceRoleClient();
  const { data } = await client
    .from("catalogue_orders")
    .select(
      "id, order_reference, confirmation_view_token, status, created_at, email, product_name_snapshot, quantity, total_price_snapshot",
    )
    .eq("idempotency_token", token)
    .maybeSingle();
  if (!data?.id) return null;
  return mapRow(data as OrderRow, true);
}

export async function createCatalogueOrder(input: {
  data: PublicOrderFormInput;
  snapshot: OrderPriceSnapshot;
  acceptedAtIso: string;
}): Promise<CreateOrderResult> {
  if (!isSupabaseServiceConfigured()) {
    return {
      ok: false,
      code: "CONFIGURATION_ERROR",
      error: "Order storage is not configured.",
    };
  }

  const existing = await findByIdempotencyToken(input.data.submissionId);
  if (existing) {
    return { ok: true, order: existing };
  }

  const client = createServiceRoleClient();
  const { data, snapshot, acceptedAtIso } = input;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderReference = generateOrderReference();
    const { data: inserted, error } = await client
      .from("catalogue_orders")
      .insert({
        order_reference: orderReference,
        confirmation_view_token: randomUUID(),
        idempotency_token: data.submissionId,
        status: "pending_invoice",
        sku: snapshot.sku,
        product_name_snapshot: snapshot.productName,
        quantity: snapshot.quantity,
        unit_price_snapshot: snapshot.unitPriceInclVatZar,
        vat_rate_snapshot: snapshot.vatRatePercent,
        vat_amount_snapshot: snapshot.vatAmountZar,
        total_price_snapshot: snapshot.totalInclVatZar,
        currency: snapshot.currency,
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
      .select(
        "id, order_reference, confirmation_view_token, status, created_at, email, product_name_snapshot, quantity, total_price_snapshot",
      )
      .single();

    if (!error && inserted) {
      return { ok: true, order: mapRow(inserted as OrderRow, false) };
    }

    if (error?.code === "23505") {
      const replay = await findByIdempotencyToken(data.submissionId);
      if (replay) return { ok: true, order: replay };
      continue;
    }

    console.error("[orders] insert failed:", error?.message ?? "unknown");
    return {
      ok: false,
      code: error?.code === "23505" ? "DATABASE_CONSTRAINT" : "DATABASE_UNAVAILABLE",
      error: "We could not save your order. Please try again shortly.",
    };
  }

  return {
    ok: false,
    code: "DATABASE_CONSTRAINT",
    error: "We could not allocate an order reference. Please try again.",
  };
}

export async function updateOrderEmailStatus(input: {
  orderId: string;
  confirmation?: OrderEmailStatus;
  internal?: OrderEmailStatus;
}): Promise<void> {
  if (!isSupabaseServiceConfigured()) return;
  try {
    const patch: Record<string, string> = { updated_at: new Date().toISOString() };
    if (input.confirmation) {
      patch.confirmation_email_status = input.confirmation;
    }
    if (input.internal) {
      patch.internal_email_status = input.internal;
    }
    const client = createServiceRoleClient();
    await client.from("catalogue_orders").update(patch).eq("id", input.orderId);
  } catch (error) {
    console.error(
      "[orders] email status update failed",
      error instanceof Error ? error.message : "unknown",
    );
  }
}

export async function getOrderByPublicConfirmation(input: {
  orderReference: string;
  viewToken: string;
}): Promise<CreatedOrder | null> {
  if (!isSupabaseServiceConfigured()) return null;
  const client = createServiceRoleClient();
  const { data } = await client
    .from("catalogue_orders")
    .select(
      "id, order_reference, confirmation_view_token, status, created_at, email, product_name_snapshot, quantity, total_price_snapshot",
    )
    .eq("order_reference", input.orderReference)
    .eq("confirmation_view_token", input.viewToken)
    .maybeSingle();
  if (!data?.id) return null;
  return mapRow(data as OrderRow, false);
}
