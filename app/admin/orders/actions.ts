"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { assertAdmin, requireAdmin } from "@/lib/auth/require-admin";
import { orderStatusLabel } from "@/lib/admin/labels";
import {
  actionFailure,
  actionSuccess,
  describeActionError,
  type AdminActionState,
} from "@/lib/admin/action-state";
import { canPerform } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/auth/audit";
import { getCatalogueOrder } from "@/lib/orders/list";
import { adminOrdersDb } from "@/lib/orders/admin-db";
import { isOrderStatus } from "@/lib/orders/types";
import {
  sendCustomerOrderConfirmation,
} from "@/lib/orders/email/send";
import { updateOrderEmailStatus } from "@/lib/orders/create";
import { resolveOrderableProduct } from "@/lib/orders/pricing";
import type { PublicOrderFormInput } from "@/lib/orders/schema";
import { ORDER_FULFILMENT_METHOD } from "@/lib/orders/types";
import { sendPvcTrackingEmail } from "@/lib/shop/pvc-emails";

export async function updateOrderStatusAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isOrderStatus(status)) return actionFailure("Choose a valid status.");

  try {
    const admin = await assertAdmin({ permission: "manageOrders" });
    const existing = await getCatalogueOrder(id);
    if (!existing) return actionFailure("This order no longer exists.");
    if (existing.status === status) {
      return actionSuccess(`Status is already ${orderStatusLabel(status)}.`);
    }

    const supabase = await adminOrdersDb({ manage: true });
    const { error } = await supabase
      .from("catalogue_orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("[orders] status update failed:", error.message);
      return actionFailure(describeActionError(error));
    }

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: "order.status_changed",
      entityType: "catalogue_order",
      entityId: id,
      beforeData: { status: existing.status },
      afterData: { status, order_reference: existing.order_reference },
    });
    revalidatePath("/admin/");
    revalidatePath(`/admin/orders/${id}/`);
    revalidatePath("/admin/orders/");
    revalidatePath("/admin/operations/online-purchases/");
    return actionSuccess(`Status changed to ${orderStatusLabel(status)}.`);
  } catch (error) {
    unstable_rethrow(error);
    return actionFailure(describeActionError(error));
  }
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

/** Email the customer their courier and tracking details. Sent only when an admin presses the button. */
export async function emailOrderTrackingAction(orderId: string): Promise<{ ok: boolean; message: string }> {
  try {
    const admin = await assertAdmin({ permission: "manageOrders" });
    const order = await getCatalogueOrder(orderId);
    if (!order) return { ok: false, message: "This order no longer exists." };
    if (!order.tracking_number) return { ok: false, message: "Save a tracking number first." };

    const status = await sendPvcTrackingEmail({
      orderReference: order.order_reference,
      customerName: order.customer_name,
      email: order.email,
      productName: order.product_name_snapshot,
      quantity: order.quantity,
      courierName: order.courier_name ?? null,
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url ?? null,
      expectedDeliveryOn: order.expected_delivery_on ?? null,
    });
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: "order.tracking_emailed",
      entityType: "catalogue_order",
      entityId: orderId,
      metadata: { status, tracking_number: order.tracking_number },
    });
    revalidatePath(`/admin/orders/${orderId}/`);
    if (status === "sent") return { ok: true, message: `Tracking details emailed to ${order.email}.` };
    return {
      ok: false,
      message:
        status === "pending_configuration"
          ? "Email is not set up on this site, so nothing was sent."
          : "The email could not be sent. Please try again.",
    };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: describeActionError(error) };
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function text(formData: FormData, name: string, max: number): string | null {
  const value = String(formData.get(name) ?? "").trim().slice(0, max);
  return value || null;
}

/** Save courier and tracking details for a shop order. */
export async function updateOrderTrackingAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return actionFailure("This order no longer exists.");

  const dates: Record<string, string | null> = {};
  for (const name of ["dispatched_on", "expected_delivery_on", "delivered_on"]) {
    const value = text(formData, name, 10);
    if (value && !DATE_RE.test(value)) return actionFailure("Enter dates as YYYY-MM-DD.");
    dates[name] = value;
  }
  const trackingUrl = text(formData, "tracking_url", 500);
  if (trackingUrl && !/^https:\/\/\S+$/.test(trackingUrl)) {
    return actionFailure("The tracking link must start with https://");
  }
  const tracking = {
    courier_name: text(formData, "courier_name", 80),
    tracking_number: text(formData, "tracking_number", 80),
    tracking_url: trackingUrl,
    ...dates,
    fulfilment_notes: text(formData, "fulfilment_notes", 2000),
  };

  try {
    const admin = await assertAdmin({ permission: "manageOrders" });
    const existing = await getCatalogueOrder(id);
    if (!existing) return actionFailure("This order no longer exists.");

    const supabase = await adminOrdersDb({ manage: true });
    const { error } = await supabase
      .from("catalogue_orders")
      .update({ ...tracking, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("[orders] tracking update failed:", error.message);
      if (error.code === "42703" || error.code === "PGRST204") {
        return actionFailure("Tracking cannot be saved yet: the tracking database update has not been applied.");
      }
      return actionFailure(describeActionError(error));
    }

    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: "order.tracking_updated",
      entityType: "catalogue_order",
      entityId: id,
      afterData: { ...tracking, order_reference: existing.order_reference },
    });
    revalidatePath(`/admin/orders/${id}/`);
    revalidatePath("/admin/orders/");
    revalidatePath("/admin/operations/online-purchases/");
    return actionSuccess("Delivery and tracking saved.");
  } catch (error) {
    unstable_rethrow(error);
    return actionFailure(describeActionError(error));
  }
}
