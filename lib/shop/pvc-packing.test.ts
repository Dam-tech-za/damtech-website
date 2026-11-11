import { test } from "node:test";
import assert from "node:assert/strict";
import { PVC_LINERS } from "./pvc-liners.ts";
import { pvcLinerPackedParcel, pvcLinerWeightKg } from "./pvc-packing.ts";
import { clearPvcQuoteCache, courierCheckoutRatesEnabled, quotePvcCourierDelivery as quoteUncached } from "./pvc-courier-delivery.ts";

// Each call starts without cached quotes so every case asks the fake courier.
const quotePvcCourierDelivery: typeof quoteUncached = (...args) => {
  clearPvcQuoteCache();
  return quoteUncached(...args);
};

test("liner weight is area x gsm and every liner has a packed size", () => {
  assert.equal(pvcLinerWeightKg({ linerAreaM2: 25, gsm: 550 }), 13.8);
  assert.equal(pvcLinerWeightKg({ linerAreaM2: 25, gsm: 800 }), 20);
  assert.deepEqual(pvcLinerPackedParcel({ linerAreaM2: 25, gsm: 800 }), {
    lengthCm: 100,
    widthCm: 40,
    heightCm: 40,
    weightKg: 20,
  });
  for (const liner of PVC_LINERS) {
    const parcel = pvcLinerPackedParcel(liner);
    assert.ok(parcel.weightKg > 0 && parcel.widthCm >= 40 && parcel.lengthCm === 100, liner.sku);
  }
  const heavy = pvcLinerPackedParcel({ linerAreaM2: 377.7, gsm: 800 });
  assert.ok(heavy.weightKg > 300 && heavy.widthCm > 40);
});

const env = {
  COURIER_CHECKOUT_RATES: "true",
  COURIER_GUY_API_KEY: "k",
  COURIER_SENDER_NAME: "Stores",
  COURIER_SENDER_PHONE: "0100000000",
  COURIER_SENDER_EMAIL: "stores@example.com",
  COURIER_SENDER_STREET: "1 Test Road",
  COURIER_SENDER_SUBURB: "Testville",
  COURIER_SENDER_CITY: "Pretoria",
  COURIER_SENDER_PROVINCE: "Gauteng",
  COURIER_SENDER_POSTAL_CODE: "0001",
};
const address = {
  customerName: "A Customer",
  email: "c@example.com",
  phone: "0820000000",
  billingLine1: "5 Farm Road",
  suburb: "Kleinmond",
  city: "Kleinmond",
  province: "Western Cape",
  postalCode: "7195",
};

test("checkout uses the cheapest live rate only when switched on and sane", async () => {
  const liner = PVC_LINERS[0];
  const answer = (rates: unknown) => (async () => Response.json({ rates })) as unknown as typeof fetch;
  const two = [
    { rate: 900, service_level: { code: "OVN", name: "Overnight" } },
    { rate: 412.35, service_level: { code: "ECO", name: "Economy" } },
  ];
  assert.equal(courierCheckoutRatesEnabled({}), false);
  assert.equal(courierCheckoutRatesEnabled({ ...env, COURIER_GUY_API_KEY: "" }), false);
  assert.equal(await quotePvcCourierDelivery(liner, 1, address, answer(two), { ...env, COURIER_CHECKOUT_RATES: "false" }), null);
  assert.deepEqual(await quotePvcCourierDelivery(liner, 1, address, answer(two), env), {
    feeInclVatCents: 41235,
    serviceCode: "ECO",
    serviceName: "Economy",
    depot: "pretoria",
  });
  assert.equal(await quotePvcCourierDelivery(liner, 1, address, answer([{ rate: 0, service_level: { code: "ECO" } }]), env), null);
  assert.equal(await quotePvcCourierDelivery(liner, 1, address, answer([]), env), null);
});

test("checkout quotes every depot and collects from the cheaper one", async () => {
  const liner = PVC_LINERS[0];
  const bettysBay = {
    COURIER_SENDER_BETTYS_BAY_NAME: "Stores",
    COURIER_SENDER_BETTYS_BAY_PHONE: "0100000000",
    COURIER_SENDER_BETTYS_BAY_EMAIL: "stores@example.com",
    COURIER_SENDER_BETTYS_BAY_STREET: "2 Sea Road",
    COURIER_SENDER_BETTYS_BAY_SUBURB: "Betty's Bay",
    COURIER_SENDER_BETTYS_BAY_CITY: "Betty's Bay",
    COURIER_SENDER_BETTYS_BAY_PROVINCE: "Western Cape",
    COURIER_SENDER_BETTYS_BAY_POSTAL_CODE: "7141",
  };
  // Pretoria is dearer to Kleinmond than Betty's Bay is.
  const byOrigin = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    const fromBettysBay = body.collection_address.city === "Betty's Bay";
    return Response.json({
      rates: [{ rate: fromBettysBay ? 310 : 820.93, service_level: { code: "ECO", name: "Economy" } }],
    });
  }) as unknown as typeof fetch;
  const quote = await quotePvcCourierDelivery(liner, 1, address, byOrigin, { ...env, ...bettysBay });
  assert.deepEqual(quote, { feeInclVatCents: 31000, serviceCode: "ECO", serviceName: "Economy", depot: "bettys-bay" });
  // One depot failing still gives a rate from the other.
  const pretoriaOnly = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    if (body.collection_address.city === "Betty's Bay") return new Response("bad", { status: 500 });
    return Response.json({ rates: [{ rate: 820.93, service_level: { code: "ECO", name: "Economy" } }] });
  }) as unknown as typeof fetch;
  const fallback = await quotePvcCourierDelivery(liner, 1, address, pretoriaOnly, { ...env, ...bettysBay });
  assert.equal(fallback?.depot, "pretoria");
});

test("tracking email carries the waybill and link and escapes names", async () => {
  const { buildPvcTrackingEmail } = await import("./pvc-emails.ts");
  const email = buildPvcTrackingEmail({
    orderReference: "DMT-1001",
    customerName: "A <b>Customer</b>",
    email: "c@example.com",
    productName: "PVC tank liner",
    quantity: 1,
    courierName: "The Courier Guy",
    trackingNumber: "XYZ9",
    trackingUrl: "https://portal.thecourierguy.co.za/track?ref=XYZ9",
    expectedDeliveryOn: "2026-11-20",
  });
  assert.match(email.subject, /DMT-1001/);
  assert.match(email.text, /Tracking number: XYZ9/);
  assert.match(email.text, /Friday, 20 November 2026/);
  assert.ok(email.html.includes("track?ref=XYZ9") && !email.html.includes("<b>Customer"));
});

test("a live quote is reused for the same address instead of asking again", async () => {
  clearPvcQuoteCache();
  let calls = 0;
  const counting = (async () => {
    calls += 1;
    return Response.json({ rates: [{ rate: 500, service_level: { code: "ECO", name: "Economy" } }] });
  }) as unknown as typeof fetch;
  const first = await quoteUncached(PVC_LINERS[0], 1, address, counting, env);
  const again = await quoteUncached(PVC_LINERS[0], 1, { ...address, city: " kleinmond " }, counting, env);
  assert.equal(calls, 1);
  assert.deepEqual(first, again);
  await quoteUncached(PVC_LINERS[0], 2, address, counting, env);
  assert.equal(calls, 2);
  clearPvcQuoteCache();
});
