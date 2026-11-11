import type { CourierConfig } from "./config.ts";
import {
  buildRatesPayload,
  buildShipmentPayload,
  parseRates,
  parseShipment,
  parseTracking,
  type ParcelInput,
} from "./payloads.ts";
import type { CourierOrderInput, CourierRate, CourierShipment, CourierTracking } from "./types.ts";

export type CourierResult<T> = { ok: true; data: T } | { ok: false; error: string };

type Fetcher = typeof fetch;

function failureMessage(status: number, body: unknown): string {
  if (status === 401 || status === 403) {
    return "The Courier Guy rejected the API key. Check COURIER_GUY_API_KEY.";
  }
  const detail =
    body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
      ? (body as { message: string }).message.slice(0, 200)
      : "";
  return detail
    ? `The Courier Guy could not do this: ${detail}`
    : `The Courier Guy could not do this (error ${status}).`;
}

async function request(
  config: CourierConfig,
  method: "GET" | "POST",
  path: string,
  body: unknown,
  fetcher: Fetcher,
): Promise<CourierResult<unknown>> {
  try {
    const response = await fetcher(`${config.baseUrl}/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const parsed: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("[courier] request failed:", method, path, response.status);
      return { ok: false, error: failureMessage(response.status, parsed) };
    }
    return { ok: true, data: parsed };
  } catch (error) {
    console.error("[courier] request error:", method, path, error instanceof Error ? error.name : "unknown");
    return { ok: false, error: "The Courier Guy could not be reached. Try again in a minute." };
  }
}

export async function getCourierRates(
  config: CourierConfig,
  order: CourierOrderInput,
  parcel: ParcelInput,
  fetcher: Fetcher = fetch,
): Promise<CourierResult<CourierRate[]>> {
  const result = await request(config, "POST", "rates", buildRatesPayload(config.sender, order, parcel), fetcher);
  if (!result.ok) return result;
  const rates = parseRates(result.data);
  if (rates.length === 0) {
    return { ok: false, error: "The Courier Guy returned no rates for this address and parcel size." };
  }
  return { ok: true, data: rates };
}

export async function createCourierShipment(
  config: CourierConfig,
  order: CourierOrderInput,
  parcel: ParcelInput,
  serviceCode: string,
  fetcher: Fetcher = fetch,
): Promise<CourierResult<CourierShipment>> {
  const payload = buildShipmentPayload(config.sender, order, parcel, serviceCode);
  const result = await request(config, "POST", "shipments", payload, fetcher);
  if (!result.ok) return result;
  const shipment = parseShipment(result.data);
  if (!shipment) {
    return {
      ok: false,
      error: "The Courier Guy answered without a waybill number. Check the Courier Guy portal before booking again.",
    };
  }
  return { ok: true, data: shipment };
}

export async function getCourierTracking(
  config: CourierConfig,
  trackingReference: string,
  fetcher: Fetcher = fetch,
): Promise<CourierResult<CourierTracking>> {
  const path = `tracking/shipments?tracking_reference=${encodeURIComponent(trackingReference)}`;
  const result = await request(config, "GET", path, undefined, fetcher);
  if (!result.ok) return result;
  const tracking = parseTracking(result.data);
  if (!tracking) return { ok: false, error: "The Courier Guy has no shipment with this tracking number." };
  return { ok: true, data: tracking };
}
