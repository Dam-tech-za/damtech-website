import type {
  CourierAddress,
  CourierContact,
  CourierOrderInput,
  CourierParcel,
  CourierRate,
  CourierShipment,
  CourierTracking,
} from "./types.ts";

export const COURIER_NAME = "The Courier Guy";

/** Public tracking page for a Courier Guy waybill. */
export function courierTrackingUrl(reference: string): string {
  return `https://portal.thecourierguy.co.za/track?ref=${encodeURIComponent(reference)}`;
}

export type ParcelInput = { lengthCm: number; widthCm: number; heightCm: number; weightKg: number };

/** Reads and validates the parcel size fields of a form. */
export function parseParcel(get: (name: string) => unknown): ParcelInput | null {
  const number = (name: string) => Number(String(get(name) ?? "").replace(",", "."));
  const parcel = {
    lengthCm: number("length_cm"),
    widthCm: number("width_cm"),
    heightCm: number("height_cm"),
    weightKg: number("weight_kg"),
  };
  const sizes = [parcel.lengthCm, parcel.widthCm, parcel.heightCm];
  if (!sizes.every((n) => Number.isFinite(n) && n > 0 && n <= 600)) return null;
  if (!Number.isFinite(parcel.weightKg) || parcel.weightKg <= 0 || parcel.weightKg > 5000) return null;
  return parcel;
}

export function deliveryAddressFor(order: CourierOrderInput): CourierAddress {
  const business = order.customer_type === "business" && order.business_name;
  return {
    type: business ? "business" : "residential",
    ...(business ? { company: String(order.business_name) } : {}),
    street_address: [order.billing_line1, order.billing_line2].filter(Boolean).join(", "),
    local_area: order.billing_suburb,
    city: order.billing_city,
    zone: order.billing_province,
    country: "ZA",
    code: order.billing_postal_code,
  };
}

export function deliveryContactFor(order: CourierOrderInput): CourierContact {
  return { name: order.customer_name, mobile_number: order.phone, email: order.email };
}

function parcelFor(order: CourierOrderInput, parcel: ParcelInput): CourierParcel {
  return {
    submitted_length_cm: parcel.lengthCm,
    submitted_width_cm: parcel.widthCm,
    submitted_height_cm: parcel.heightCm,
    submitted_weight_kg: parcel.weightKg,
    parcel_description: order.product_name_snapshot.slice(0, 120),
  };
}

export function buildRatesPayload(
  sender: { address: CourierAddress },
  order: CourierOrderInput,
  parcel: ParcelInput,
) {
  return {
    collection_address: sender.address,
    delivery_address: deliveryAddressFor(order),
    parcels: [parcelFor(order, parcel)],
    declared_value: Number(order.total_price_snapshot) || 0,
  };
}

export function buildShipmentPayload(
  sender: { address: CourierAddress; contact: CourierContact },
  order: CourierOrderInput,
  parcel: ParcelInput,
  serviceCode: string,
) {
  return {
    ...buildRatesPayload(sender, order, parcel),
    collection_contact: sender.contact,
    delivery_contact: deliveryContactFor(order),
    service_level_code: serviceCode,
    customer_reference: order.order_reference,
    special_instructions_collection: "",
    special_instructions_delivery: (order.notes ?? "").slice(0, 250),
    mute_notifications: false,
  };
}

type Json = Record<string, unknown>;
const obj = (value: unknown): Json => (value && typeof value === "object" ? (value as Json) : {});
const str = (value: unknown): string => (typeof value === "string" ? value : value == null ? "" : String(value));
const day = (value: unknown): string | null => {
  const match = /^\d{4}-\d{2}-\d{2}/.exec(str(value));
  return match ? match[0] : null;
};

export function parseRates(body: unknown): CourierRate[] {
  const list = obj(body).rates;
  if (!Array.isArray(list)) return [];
  return list
    .map((entry): CourierRate | null => {
      const level = obj(obj(entry).service_level);
      const rate = Number(obj(entry).rate);
      const serviceCode = str(level.code);
      if (!serviceCode || !Number.isFinite(rate)) return null;
      return {
        serviceCode,
        serviceName: str(level.name) || serviceCode,
        rate,
        deliveryFrom: day(level.delivery_date_from),
        deliveryTo: day(level.delivery_date_to),
      };
    })
    .filter((rate): rate is CourierRate => rate !== null)
    .sort((a, b) => a.rate - b.rate);
}

export function parseShipment(body: unknown): CourierShipment | null {
  const data = obj(body);
  const trackingReference = str(data.short_tracking_reference) || str(data.custom_tracking_reference);
  if (!trackingReference) return null;
  const rate = Number(data.rate);
  return {
    id: str(data.id),
    trackingReference,
    status: str(data.status),
    serviceCode: str(data.service_level_code),
    rate: Number.isFinite(rate) ? rate : null,
  };
}

export function parseTracking(body: unknown): CourierTracking | null {
  const list = obj(body).shipments;
  const shipment = obj(Array.isArray(list) ? list[0] : null);
  const trackingReference = str(shipment.short_tracking_reference) || str(shipment.custom_tracking_reference);
  if (!trackingReference) return null;
  const events = Array.isArray(shipment.tracking_events) ? shipment.tracking_events : [];
  return {
    trackingReference,
    status: str(shipment.status),
    events: events
      .map((event) => {
        const e = obj(event);
        return { date: str(e.date), status: str(e.status), message: str(e.message), location: str(e.location) };
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
  };
}

/** Dates the order record can take from the courier's tracking history. */
export function trackingDates(tracking: CourierTracking): { dispatchedOn: string | null; deliveredOn: string | null } {
  const first = (statuses: string[]) => {
    const hits = tracking.events.filter((event) => statuses.includes(event.status)).map((event) => day(event.date));
    return hits.filter(Boolean).sort()[0] ?? null;
  };
  return {
    dispatchedOn: first(["collected", "at-hub", "in-transit", "out-for-delivery", "delivered"]),
    deliveredOn: first(["delivered"]),
  };
}

export function courierStatusLabel(status: string): string {
  const text = status.replace(/[-_]/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Unknown";
}
