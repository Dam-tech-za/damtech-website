"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { getCatalogueOrder } from "@/lib/orders/list";
import { isOrderStatus } from "@/lib/orders/types";
import {
  sendCustomerOrderConfirmation,
} from "@/lib/orders/email/send";
import { updateOrderEmailStatus } from "@/lib/orders/create";
import { resolveOrderableProduct } from "@/lib/orders/pricing";
import type { PublicOrderFormInput } from "@/lib/orders/schema";
import { ORDER_FULFILMENT_METHOD } from "@/lib/orders/types";

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin({ permission: "manageOrders" });
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isOrderStatus(status)) return;
  const existing = await getCatalogueOrder(id);
  if (!existing) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogue_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return;

  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.profile.email,
    action: "order.status_changed",
    entityType: "catalogue_order",
    entityId: id,
    beforeData: { status: existing.status },
    afterData: { status },
  });
  revalidatePath(`/admin/orders/${id}/`);
  revalidatePath("/admin/orders/");
}

export async function resendOrderConfirmationAction(orderId: string) {
  const admin = await requireAdmin({ permission: "manageOrders" });
  if (!canPerform(admin.profile.role, "manageOrders")) {
    return { ok: false as const, error: "Not allowed." };
  }
  const order = await getCatalogueOrder(orderId);
  if (!order) return { ok: false as const, error: "Order not found." };

  const snapshot = resolveOrderableProduct(order.sku, order.quantity);
  if (!snapshot) {
    return { ok: false as const, error: "Catalogue SKU is no longer orderable." };
  }

  const data: PublicOrderFormInput = {
    customerType: order.customer_type === "business" ? "business" : "individual",
    customerName: order.customer_name,
    businessName: order.business_name ?? "",
    email: order.email,
    phone: order.phone,
    vatNumber: order.vat_number ?? "",
    customerPoNumber: order.customer_po_number ?? "",
    billingLine1: order.billing_line1,
    billingLine2: order.billing_line2 ?? "",
    suburb: order.billing_suburb,
    city: order.billing_city,
    province: order.billing_province as PublicOrderFormInput["province"],
    postalCode: order.billing_postal_code,
    sku: order.sku,
    quantity: order.quantity,
    notes: order.notes ?? "",
    confirmSupplyOnly: true,
    confirmExclusions: true,
    confirmPolicies: true,
    fulfilmentMethod: ORDER_FULFILMENT_METHOD,
    website: "",
    submissionId: "00000000-0000-4000-8000-000000000000",
    formStartedAt: Date.now(),
  };

  const result = await sendCustomerOrderConfirmation({
    orderReference: order.order_reference,
    placedAtIso: order.created_at,
    data,
    snapshot,
  });

  await updateOrderEmailStatus({
    orderId,
    confirmation: result.ok ? "sent" : result.status,
  });
  await writeAuditLog({
    actorUserId: admin.user.id,
    actorEmail: admin.profile.email,
    action: "order.confirmation_resent",
    entityType: "catalogue_order",
    entityId: orderId,
    metadata: { ok: result.ok },
  });
  revalidatePath(`/admin/orders/${orderId}/`);
  if (!result.ok) {
    return { ok: false as const, error: "Confirmation could not be sent." };
  }
  return { ok: true as const };
}
