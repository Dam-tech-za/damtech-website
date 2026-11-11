"use server";

import { unstable_rethrow } from "next/navigation";
import { assertAdmin } from "@/lib/auth/require-admin";
import { describeActionError } from "@/lib/admin/action-state";
import {
  COURIER_DEPOTS,
  getCourierConfig,
  getCourierRates,
  withCourierDepot,
  type CourierDepotId,
  type CourierOrderInput,
} from "@/lib/courier";
import { PVC_LINERS } from "@/lib/shop/pvc-liners";
import { pvcLinerPackedParcel } from "@/lib/shop/pvc-packing";

export type CourierTestLine = { label: string; ok: boolean; message: string };
export type CourierTestResult = { ok: boolean; message: string; lines: CourierTestLine[] };

/** Sample customers in three provinces. Nothing is booked, only rates are asked for. */
const SAMPLE_DESTINATIONS = [
  { label: "Cape Town", province: "Western Cape", suburb: "Bellville", city: "Cape Town", code: "7530", street: "1 Voortrekker Road" },
  { label: "Johannesburg", province: "Gauteng", suburb: "Sandown", city: "Sandton", code: "2196", street: "1 Rivonia Road" },
  { label: "Durban", province: "KwaZulu-Natal", suburb: "Umhlanga Ridge", city: "Durban", code: "4319", street: "1 Lighthouse Road" },
] as const;

function sampleOrder(destination: (typeof SAMPLE_DESTINATIONS)[number], name: string): CourierOrderInput {
  return {
    order_reference: "TEST",
    customer_name: "Connection Test",
    customer_type: "individual",
    email: "test@example.com",
    phone: "0820000000",
    billing_line1: destination.street,
    billing_suburb: destination.suburb,
    billing_city: destination.city,
    billing_province: destination.province,
    billing_postal_code: destination.code,
    product_name_snapshot: name,
    total_price_snapshot: 5000,
  };
}

/**
 * Asks The Courier Guy for rates only (nothing is booked) so the real answer
 * or error is visible: the smallest liner and the heaviest liner, from each
 * collection address that is set up, to a sample address in another province.
 */
export async function testCourierConnectionAction(): Promise<CourierTestResult> {
  try {
    await assertAdmin({ permission: "manageOrders" });
    const config = getCourierConfig();
    if (!config.ok) {
      return {
        ok: false,
        message: `${config.reason}${config.missing.length ? ` Missing in Vercel: ${config.missing.join(", ")}.` : ""}`,
        lines: [],
      };
    }
    const byWeight = [...PVC_LINERS].sort((a, b) => pvcLinerPackedParcel(a).weightKg - pvcLinerPackedParcel(b).weightKg);
    const samples = [
      { label: "smallest liner", liner: byWeight[0] },
      { label: "heaviest liner", liner: byWeight[byWeight.length - 1] },
    ];
    const lines: CourierTestLine[] = [];
    for (const depotId of Object.keys(config.config.depots) as CourierDepotId[]) {
      const from = withCourierDepot(config.config, depotId);
      const destination = depotId === "bettys-bay" ? SAMPLE_DESTINATIONS[1] : SAMPLE_DESTINATIONS[0];
      for (const sample of samples) {
        const parcel = pvcLinerPackedParcel(sample.liner);
        const label = `${COURIER_DEPOTS[depotId]} to ${destination.label}, ${sample.label} (${parcel.weightKg} kg, ${parcel.lengthCm}x${parcel.widthCm}x${parcel.heightCm} cm)`;
        const result = await getCourierRates(from, sampleOrder(destination, sample.liner.name), parcel);
        lines.push(
          result.ok
            ? {
                label,
                ok: true,
                message: result.data
                  .slice(0, 3)
                  .map((rate) => `${rate.serviceName} R${rate.rate.toFixed(2)}`)
                  .join(", "),
              }
            : { label, ok: false, message: result.error },
        );
      }
    }
    const allOk = lines.every((line) => line.ok);
    return {
      ok: allOk,
      message: allOk
        ? "The Courier Guy answered every request. Nothing was booked."
        : "The Courier Guy did not accept every request. The reasons are below.",
      lines,
    };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: describeActionError(error), lines: [] };
  }
}
