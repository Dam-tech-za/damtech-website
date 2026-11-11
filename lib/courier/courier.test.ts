import { test } from "node:test";
import assert from "node:assert/strict";
import { getCourierConfig } from "./config.ts";
import { createCourierShipment, getCourierRates, getCourierTracking } from "./client.ts";
import {
  buildShipmentPayload,
  courierTrackingUrl,
  parseParcel,
  parseRates,
  parseTracking,
  trackingDates,
} from "./payloads.ts";

const env = {
  COURIER_GUY_API_KEY: "test-key",
  COURIER_SENDER_NAME: "Stores",
  COURIER_SENDER_PHONE: "0100000000",
  COURIER_SENDER_EMAIL: "stores@example.com",
  COURIER_SENDER_STREET: "1 Test Road",
  COURIER_SENDER_SUBURB: "Testville",
  COURIER_SENDER_CITY: "Pretoria",
  COURIER_SENDER_PROVINCE: "Gauteng",
  COURIER_SENDER_POSTAL_CODE: "0001",
};

const order = {
  order_reference: "DMT-1001",
  customer_name: "A Customer",
  customer_type: "individual",
  email: "customer@example.com",
  phone: "0820000000",
  billing_line1: "5 Farm Road",
  billing_line2: null,
  billing_suburb: "Kleinmond",
  billing_city: "Kleinmond",
  billing_province: "Western Cape",
  billing_postal_code: "7195",
  product_name_snapshot: "PVC tank liner",
  total_price_snapshot: 2500,
  notes: "Gate code at the office",
};

const parcel = { lengthCm: 80, widthCm: 60, heightCm: 40, weightKg: 35 };

function config() {
  const result = getCourierConfig(env);
  assert.ok(result.ok);
  return result.config;
}

test("courier config reports what is missing and never needs a public variable", () => {
  const none = getCourierConfig({});
  assert.equal(none.ok, false);
  assert.ok(!none.ok && none.missing.includes("COURIER_GUY_API_KEY"));
  const noAddress = getCourierConfig({ COURIER_GUY_API_KEY: "k" });
  assert.ok(!noAddress.ok && noAddress.missing.includes("COURIER_SENDER_STREET"));
  assert.equal(config().baseUrl, "https://api.shiplogic.com");
  assert.equal(getCourierConfig({ ...env, COURIER_GUY_API_URL: "http://insecure.example" }).ok, false);
});

test("parcel sizes must be positive numbers", () => {
  const form = (values: Record<string, string>) => (name: string) => values[name];
  assert.deepEqual(parseParcel(form({ length_cm: "80", width_cm: "60", height_cm: "40", weight_kg: "35,5" })), {
    lengthCm: 80,
    widthCm: 60,
    heightCm: 40,
    weightKg: 35.5,
  });
  assert.equal(parseParcel(form({ length_cm: "80", width_cm: "0", height_cm: "40", weight_kg: "35" })), null);
  assert.equal(parseParcel(form({ length_cm: "80", width_cm: "60", height_cm: "40" })), null);
});

test("shipment payload carries both addresses, the order reference and the service", () => {
  const payload = buildShipmentPayload(config().sender, order, parcel, "ECO");
  assert.equal(payload.collection_address.city, "Pretoria");
  assert.equal(payload.delivery_address.type, "residential");
  assert.equal(payload.delivery_address.zone, "Western Cape");
  assert.equal(payload.delivery_contact.mobile_number, "0820000000");
  assert.equal(payload.customer_reference, "DMT-1001");
  assert.equal(payload.service_level_code, "ECO");
  assert.equal(payload.parcels[0].submitted_weight_kg, 35);
  assert.equal(payload.declared_value, 2500);
});

test("rates are parsed and sorted cheapest first", () => {
  const rates = parseRates({
    rates: [
      { rate: 900, service_level: { code: "OVN", name: "Overnight", delivery_date_to: "2026-11-12T17:00:00Z" } },
      { rate: 450.5, service_level: { code: "ECO", name: "Economy", delivery_date_to: "2026-11-14T17:00:00Z" } },
      { rate: "x", service_level: { code: "BAD" } },
    ],
  });
  assert.deepEqual(rates.map((rate) => rate.serviceCode), ["ECO", "OVN"]);
  assert.equal(rates[0].deliveryTo, "2026-11-14");
  assert.deepEqual(parseRates({}), []);
});

test("tracking events give dispatch and delivery dates", () => {
  const tracking = parseTracking({
    shipments: [
      {
        short_tracking_reference: "ABC123",
        status: "delivered",
        tracking_events: [
          { date: "2026-11-11T08:00:00Z", status: "collected", message: "Collected" },
          { date: "2026-11-13T10:00:00Z", status: "delivered", message: "Delivered" },
        ],
      },
    ],
  });
  assert.ok(tracking);
  assert.equal(tracking.events[0].status, "delivered");
  assert.deepEqual(trackingDates(tracking), { dispatchedOn: "2026-11-11", deliveredOn: "2026-11-13" });
  assert.equal(parseTracking({ shipments: [] }), null);
  assert.equal(courierTrackingUrl("ABC 123"), "https://portal.thecourierguy.co.za/track?ref=ABC%20123");
});

test("client sends the key as a bearer token and handles failures", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (url.endsWith("/rates")) {
      return Response.json({ rates: [{ rate: 300, service_level: { code: "ECO", name: "Economy" } }] });
    }
    if (url.endsWith("/shipments")) return Response.json({ id: 7, short_tracking_reference: "XYZ9", status: "submitted" });
    return Response.json({ message: "nope" }, { status: 401 });
  }) as unknown as typeof fetch;

  const rates = await getCourierRates(config(), order, parcel, fetcher);
  assert.ok(rates.ok && rates.data[0].rate === 300);
  assert.equal(calls[0].url, "https://api.shiplogic.com/rates");
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer test-key");

  const shipment = await createCourierShipment(config(), order, parcel, "ECO", fetcher);
  assert.ok(shipment.ok && shipment.data.trackingReference === "XYZ9");

  const tracking = await getCourierTracking(config(), "XYZ9", fetcher);
  assert.ok(!tracking.ok && /API key/.test(tracking.error) && !tracking.error.includes("test-key"));
});

test("several parcels are sent as separate parcels", () => {
  const payload = buildShipmentPayload(config().sender, order, [parcel, parcel], "ECO");
  assert.equal(payload.parcels.length, 2);
});

test("Western Cape orders collect from Betty's Bay when that address is set", async () => {
  const { courierDepotForProvince, withCourierDepot } = await import("./config.ts");
  const single = config();
  assert.equal(courierDepotForProvince(single, "Western Cape"), "pretoria");
  const both = getCourierConfig({
    ...env,
    COURIER_SENDER_BETTYS_BAY_NAME: "Workshop",
    COURIER_SENDER_BETTYS_BAY_PHONE: "0210000000",
    COURIER_SENDER_BETTYS_BAY_EMAIL: "bb@example.com",
    COURIER_SENDER_BETTYS_BAY_STREET: "2 Test Street",
    COURIER_SENDER_BETTYS_BAY_SUBURB: "Betty's Bay",
    COURIER_SENDER_BETTYS_BAY_CITY: "Betty's Bay",
    COURIER_SENDER_BETTYS_BAY_PROVINCE: "Western Cape",
    COURIER_SENDER_BETTYS_BAY_POSTAL_CODE: "7141",
  });
  assert.ok(both.ok);
  assert.equal(courierDepotForProvince(both.config, "Western Cape"), "bettys-bay");
  assert.equal(courierDepotForProvince(both.config, "Gauteng"), "pretoria");
  assert.equal(withCourierDepot(both.config, "bettys-bay").sender.address.city, "Betty's Bay");
  assert.equal(withCourierDepot(single, "bettys-bay").sender.address.city, "Pretoria");
});

test("a tracking check produces the fields saved on the order", async () => {
  const { courierStatusFields, courierStatusSummary, isCourierStatusFinal } = await import("./sync.ts");
  const tracking = parseTracking({
    shipments: [
      {
        short_tracking_reference: "ABC123",
        status: "in-transit",
        tracking_events: [
          { date: "2026-11-11T08:00:00Z", status: "collected", message: "Collected from sender", location: "Pretoria" },
          { date: "2026-11-12T06:00:00Z", status: "in-transit", message: "Departed hub", location: "Johannesburg" },
        ],
      },
    ],
  });
  assert.ok(tracking);
  const fields = courierStatusFields({ dispatched_on: null, delivered_on: null }, tracking, "2026-11-12T07:00:00.000Z");
  assert.equal(fields.courier_status, "in-transit");
  assert.equal(fields.courier_last_message, "Departed hub");
  assert.equal(fields.courier_status_at, "2026-11-12T06:00:00.000Z");
  assert.equal(fields.dispatched_on, "2026-11-11");
  assert.equal("delivered_on" in fields, false);
  assert.equal(fields.courier_events.length, 2);
  const kept = courierStatusFields({ dispatched_on: "2026-11-10" }, tracking, "2026-11-12T07:00:00.000Z");
  assert.equal("dispatched_on" in kept, false);
  assert.equal(courierStatusSummary("in-transit", "Departed hub"), "In transit: Departed hub");
  assert.equal(isCourierStatusFinal("delivered"), true);
  assert.equal(isCourierStatusFinal("in-transit"), false);
});

test("the courier's own error wording is passed on without the key", async () => {
  const { courierErrorDetail } = await import("./client.ts");
  assert.equal(courierErrorDetail({ message: "Invalid postal code" }), "Invalid postal code");
  assert.equal(
    courierErrorDetail({ errors: [{ field: "delivery_address.code", message: "does not match suburb" }] }),
    "delivery_address.code: does not match suburb",
  );
  assert.equal(courierErrorDetail({ errors: { parcels: ["too heavy"] } }), "parcels: too heavy");
  assert.equal(courierErrorDetail(null), "");
  const fetcher = (async () => Response.json({ message: "Unauthorized" }, { status: 401 })) as unknown as typeof fetch;
  const result = await getCourierRates(config(), order, parcel, fetcher);
  assert.ok(!result.ok && /error 401/.test(result.error) && /Unauthorized/.test(result.error) && !result.error.includes("test-key"));
});

test("a key refused by api.shiplogic.com is retried on the Courier Guy portal host", async () => {
  const seen: string[] = [];
  const fetcher = (async (url: string) => {
    seen.push(new URL(url).host);
    return url.startsWith("https://api.shiplogic.com")
      ? Response.json({ message: "Unauthorized" }, { status: 401 })
      : Response.json({ rates: [{ rate: 350, service_level: { code: "ECO", name: "Economy" } }] });
  }) as unknown as typeof fetch;
  const cfg = getCourierConfig({ ...env, COURIER_GUY_API_KEY: ' "Bearer abc123" ' });
  assert.ok(cfg.ok && cfg.config.apiKey === "abc123");
  const rates = await getCourierRates(cfg.config, order, parcel, fetcher);
  assert.ok(rates.ok && rates.data[0].rate === 350);
  assert.deepEqual(seen, ["api.shiplogic.com", "api.portal.thecourierguy.co.za"]);

  const both = (async () => Response.json({ message: "Unauthorized" }, { status: 401 })) as unknown as typeof fetch;
  const refused = await getCourierRates(getCourierConfig({ ...env, COURIER_GUY_API_KEY: "zzz" }).ok ? (getCourierConfig({ ...env, COURIER_GUY_API_KEY: "zzz" }) as { ok: true; config: Parameters<typeof getCourierRates>[0] }).config : config(), order, parcel, both);
  assert.ok(!refused.ok && /both refused the key/.test(refused.error));

  const pinned = getCourierConfig({ ...env, COURIER_GUY_API_URL: "https://example.test" });
  assert.ok(pinned.ok && !pinned.config.fallbackBaseUrls);
});

test("a 400 with a declared value is retried without one and flagged", async () => {
  const { getCourierRates } = await import("./client.ts");
  const seen: number[] = [];
  const fetcher = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    seen.push(body.declared_value);
    if (body.declared_value > 0) return new Response("Declared value too high", { status: 400 });
    return Response.json({ rates: [{ rate: 940.22, service_level: { code: "ECO", name: "Economy" } }] });
  }) as unknown as typeof fetch;
  const result = await getCourierRates(config(), { ...order, total_price_snapshot: 45793 }, parcel, fetcher);
  assert.deepEqual(seen, [45793, 0]);
  assert.ok(result.ok && result.declaredValueDropped === 45793 && result.data[0].rate === 940.22);
});
