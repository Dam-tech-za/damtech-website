import { test } from "node:test";
import assert from "node:assert/strict";
import { PVC_LINERS } from "./pvc-liners.ts";
import { pvcLinerPackedParcel, pvcLinerWeightKg } from "./pvc-packing.ts";
import { courierCheckoutRatesEnabled, quotePvcCourierDelivery } from "./pvc-courier-delivery.ts";

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
  });
  assert.equal(await quotePvcCourierDelivery(liner, 1, address, answer([{ rate: 0, service_level: { code: "ECO" } }]), env), null);
  assert.equal(await quotePvcCourierDelivery(liner, 1, address, answer([]), env), null);
});
