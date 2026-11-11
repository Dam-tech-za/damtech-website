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

const parcelList = (parcel: ParcelInput | ParcelInput[]) => (Array.isArray(parcel) ? parcel : [parcel]);

function parcelFor(order: CourierOrderInput, parcel: ParcelInput): CourierParcel {
  return {
    submitted_length_cm: parcel.lengthCm,
    submitted_width_cm: parcel.widthCm,
    submitted_height_cm: parcel.heightCm,
    submitted_weight_kg: parcel.weightKg,
    parcel_description: order.product_name_snapshot.slice(0, 120),
  };
}

/** Courier Guy refuses a declared value above R30 000 (error 400). */
export const COURIER_MAX_DECLARED_VALUE = 30_000;

export function buildRatesPayload(
  sender: { address: CourierAddress },
  order: CourierOrderInput,
  parcel: ParcelInput | ParcelInput[],
) {
  return {
    collection_address: sender.address,
    delivery_address: deliveryAddressFor(order),
    parcels: parcelList(parcel).map((item) => parcelFor(order, item)),
    declared_value: Math.min(Number(order.total_price_snapshot) || 0, COURIER_MAX_DECLARED_VALUE),
  };
}

export function buildShipmentPayload(
  sender: { address: CourierAddress; contact: CourierContact },
  order: CourierOrderInput,
  parcel: ParcelInput | ParcelInput[],
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
      const exVat = Number(obj(entry).rate_excluding_vat);
      return {
        serviceCode,
        serviceName: str(level.name) || serviceCode,
        rate,
        ...(obj(entry).rate_excluding_vat != null && Number.isFinite(exVat) ? { rateExVat: exVat } : {}),
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

// ---------------------------------------------------------------------------
// Formal quote in the Courier Guy portal.
//
// Ship Logic has no separate "create quote" endpoint. It does have a shipment
// status "quote" ("a quote has been generated but the shipment has not been
// booked yet"), and POST /shipments validates a `status` field. So a quote is
// sent as a shipment with status "quote". This is not documented as a create
// option: the answer's status is checked, and if Courier Guy booked it
// instead (e.g. "submitted") the admin is told to cancel it.
// ---------------------------------------------------------------------------

export const COURIER_QUOTE_STATUS = "quote";
/** Days ahead for the collection date on a quote, so an accidental booking is not collected before it can be cancelled. */
export const COURIER_QUOTE_LEAD_DAYS = 7;

export function courierQuoteCollectionDate(now: Date, leadDays = COURIER_QUOTE_LEAD_DAYS): string {
  const date = new Date(now.getTime() + leadDays * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

export function buildQuoteShipmentPayload(
  sender: { address: CourierAddress; contact: CourierContact },
  order: CourierOrderInput,
  parcel: ParcelInput | ParcelInput[],
  serviceCode: string,
  now: Date = new Date(),
) {
  return {
    ...buildShipmentPayload(sender, order, parcel, serviceCode),
    status: COURIER_QUOTE_STATUS,
    collection_min_date: courierQuoteCollectionDate(now),
    customer_reference_name: "Damtech quote",
    // A quote must not SMS or email the customer.
    mute_notifications: true,
  };
}

export type CourierQuoteShipment = {
  id: string;
  trackingReference: string | null;
  status: string;
  rate: number | null;
  /** True when Courier Guy kept it as a quote (not booked). */
  isQuote: boolean;
};

/** The answer to a quote request; unlike a booking it may have no waybill number. */
export function parseQuoteShipment(body: unknown): CourierQuoteShipment | null {
  const data = obj(body);
  const id = str(data.id);
  const status = str(data.status);
  if (!id && !status) return null;
  const trackingReference = str(data.short_tracking_reference) || str(data.custom_tracking_reference) || null;
  const rate = Number(data.rate);
  return {
    id,
    trackingReference,
    status,
    rate: Number.isFinite(rate) ? rate : null,
    isQuote: status === COURIER_QUOTE_STATUS,
  };
}
