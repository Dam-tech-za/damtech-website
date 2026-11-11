export type CourierAddress = {
  type: "residential" | "business";
  company?: string;
  street_address: string;
  local_area: string;
  city: string;
  zone: string;
  country: "ZA";
  code: string;
};

export type CourierContact = { name: string; mobile_number: string; email: string };

export type CourierParcel = {
  submitted_length_cm: number;
  submitted_width_cm: number;
  submitted_height_cm: number;
  submitted_weight_kg: number;
  parcel_description?: string;
};

export type CourierRate = {
  serviceCode: string;
  serviceName: string;
  /** Rand, as quoted by the courier (their account pricing, incl. VAT where they include it). */
  rate: number;
  deliveryFrom: string | null;
  deliveryTo: string | null;
};

export type CourierShipment = {
  id: string;
  trackingReference: string;
  status: string;
  serviceCode: string;
  rate: number | null;
};

export type CourierTrackingEvent = { date: string; status: string; message: string; location: string };

export type CourierTracking = {
  trackingReference: string;
  status: string;
  events: CourierTrackingEvent[];
};

/** The order fields the courier needs. */
export type CourierOrderInput = {
  order_reference: string;
  customer_name: string;
  business_name?: string | null;
  customer_type?: string | null;
  email: string;
  phone: string;
  billing_line1: string;
  billing_line2?: string | null;
  billing_suburb: string;
  billing_city: string;
  billing_province: string;
  billing_postal_code: string;
  product_name_snapshot: string;
  total_price_snapshot: number | string;
  notes?: string | null;
};
