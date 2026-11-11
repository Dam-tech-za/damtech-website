"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { assertAdmin } from "@/lib/auth/require-admin";
import { describeActionError } from "@/lib/admin/action-state";
import { writeAuditLog } from "@/lib/auth/audit";
import { getCatalogueOrder } from "@/lib/orders/list";
import { adminOrdersDb } from "@/lib/orders/admin-db";
import { isCollectionMethod } from "@/lib/shop/delivery";
import {
  COURIER_NAME,
  courierStatusFields,
  courierStatusLabel,
  courierTrackingUrl,
  createCourierShipment,
  getCourierConfig,
  getCourierRates,
  getCourierTracking,
  isCourierDepotId,
  withCourierDepot,
  parseParcel,
  type CourierRate,
  type CourierTrackingEvent,
} from "@/lib/courier";

export type CourierActionResult = {
  ok: boolean;
  message: string;
  rates?: CourierRate[];
  events?: CourierTrackingEvent[];
};

const fail = (message: string): CourierActionResult => ({ ok: false, message });

const PARCEL_ERROR = "Enter the packed length, width and height in cm and the weight in kg.";

function revalidateOrder(id: string) {
  revalidatePath(`/admin/orders/${id}/`);
  revalidatePath("/admin/orders/");
  revalidatePath("/admin/operations/online-purchases/");
}

async function loadForCourier(id: string, depot?: unknown) {
  const admin = await assertAdmin({ permission: "manageOrders" });
  const order = id ? await getCatalogueOrder(id) : null;
  if (!order) return { error: fail("This order no longer exists.") };
  const config = getCourierConfig();
  if (!config.ok) return { error: fail(config.reason) };
  if (depot && (!isCourierDepotId(depot) || !config.config.depots[depot])) {
    return { error: fail("Choose where the courier collects from.") };
  }
  const chosen = isCourierDepotId(depot) ? withCourierDepot(config.config, depot) : config.config;
  return { error: null, admin, order, config: chosen };
}

/** Ask The Courier Guy what this parcel costs to deliver. Books nothing. */
export async function courierRatesAction(formData: FormData): Promise<CourierActionResult> {
  try {
    const loaded = await loadForCourier(String(formData.get("id") ?? ""), formData.get("depot"));
    if (loaded.error) return loaded.error;
    const parcel = parseParcel((name) => formData.get(name));
    if (!parcel) return fail(PARCEL_ERROR);
    const result = await getCourierRates(loaded.config, loaded.order, parcel);
    if (!result.ok) return fail(result.error);
    const dropped = result.declaredValueDropped
      ? ` Courier Guy refused the declared value of R${result.declaredValueDropped.toFixed(2)}, so these rates are without one.`
      : "";
    return { ok: true, message: `Rates from The Courier Guy. Nothing is booked yet.${dropped}`, rates: result.data };
  } catch (error) {
    unstable_rethrow(error);
    return fail(describeActionError(error));
  }
}

/** Book the collection with The Courier Guy and save the waybill on the order. */
export async function bookCourierAction(formData: FormData): Promise<CourierActionResult> {
  try {
    const id = String(formData.get("id") ?? "");
    const loaded = await loadForCourier(id, formData.get("depot"));
    if (loaded.error) return loaded.error;
    const { admin, order, config } = loaded;
    const depotField = formData.get("depot");
    const depotId = isCourierDepotId(depotField) ? depotField : "pretoria";

    if (isCollectionMethod(order.fulfilment_method)) {
      return fail("The customer is collecting this order, so no courier is needed.");
    }
    if (order.status === "cancelled") return fail("This order is cancelled.");
    if (order.payment_method === "payfast" && order.payment_status !== "paid") {
      return fail("This order has not been paid yet.");
    }
    if (order.tracking_number) {
      return fail("This order already has a tracking number. Clear it first if you need to book again.");
    }
    const parcel = parseParcel((name) => formData.get(name));
    if (!parcel) return fail(PARCEL_ERROR);
    const serviceCode = String(formData.get("service_code") ?? "").trim();
    if (!/^[A-Z0-9_-]{2,12}$/.test(serviceCode)) return fail("Choose a service first.");
    const expected = String(formData.get("expected_delivery_on") ?? "");

    const booked = await createCourierShipment(config, order, parcel, serviceCode);
    if (!booked.ok) return fail(booked.error);
    const shipment = booked.data;

    const tracking = {
      courier_name: COURIER_NAME,
      tracking_number: shipment.trackingReference,
      tracking_url: courierTrackingUrl(shipment.trackingReference),
      ...(/^\d{4}-\d{2}-\d{2}$/.test(expected) ? { expected_delivery_on: expected } : {}),
    };
    await writeAuditLog({
      actorUserId: admin.user.id,
      actorEmail: admin.profile.email,
      action: "order.courier_booked",
      entityType: "catalogue_order",
      entityId: id,
      afterData: {
        ...tracking,
        order_reference: order.order_reference,
        service_code: serviceCode,
        collected_from: config.sender.address.city,
        courier_rate: shipment.rate,
        parcel,
      },
    });

    const supabase = await adminOrdersDb({ manage: true });
    const { error } = await supabase
      .from("catalogue_orders")
      .update({ ...tracking, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("[courier] booking saved with the courier but not on the order:", error.message);
      return fail(
        `The collection IS booked with The Courier Guy (waybill ${shipment.trackingReference}), but it could not be saved on this order. Do not book again. Type the waybill into the tracking number field once the tracking database update is applied.`,
      );
    }
    // Extra detail for the admin; needs the courier status database update.
    const extra = await supabase
      .from("catalogue_orders")
      .update({
        courier_status: shipment.status || "submitted",
        courier_status_at: new Date().toISOString(),
        courier_cost: shipment.rate,
        courier_depot: depotId,
      })
      .eq("id", id);
    if (extra.error) console.error("[courier] booking detail not saved:", extra.error.message);
    revalidateOrder(id);
    const dropped = booked.declaredValueDropped
      ? ` Courier Guy refused the declared value of R${booked.declaredValueDropped.toFixed(2)}, so it was booked without one (standard cover only).`
      : "";
    return { ok: true, message: `Booked with The Courier Guy. Waybill ${shipment.trackingReference}.${dropped}` };
  } catch (error) {
    unstable_rethrow(error);
    return fail(describeActionError(error));
  }
}

/** Fetch the latest tracking events and update the dispatch and delivery dates. */
export async function refreshCourierTrackingAction(formData: FormData): Promise<CourierActionResult> {
  try {
    const id = String(formData.get("id") ?? "");
    const loaded = await loadForCourier(id);
    if (loaded.error) return loaded.error;
    const { order, config } = loaded;
    if (!order.tracking_number) return fail("This order has no tracking number yet.");

    const result = await getCourierTracking(config, order.tracking_number);
    if (!result.ok) return fail(result.error);
    const fields = courierStatusFields(order, result.data, new Date().toISOString());
    const supabase = await adminOrdersDb({ manage: true });
    const saved = await supabase
      .from("catalogue_orders")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (saved.error) {
      // Older database without the courier status columns: save the dates only.
      console.error("[courier] status not saved:", saved.error.message);
      const dates = {
        ...(fields.dispatched_on ? { dispatched_on: fields.dispatched_on } : {}),
        ...(fields.delivered_on ? { delivered_on: fields.delivered_on } : {}),
      };
      if (Object.keys(dates).length > 0) {
        await supabase.from("catalogue_orders").update(dates).eq("id", id);
      }
    }
    revalidateOrder(id);
    return {
      ok: true,
      message: `Courier status: ${courierStatusLabel(result.data.status)}.`,
      events: result.data.events.slice(0, 12),
    };
  } catch (error) {
    unstable_rethrow(error);
    return fail(describeActionError(error));
  }
}
