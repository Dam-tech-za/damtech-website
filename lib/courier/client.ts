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

/** The courier's own explanation, from the usual places an error body keeps it. */
export function courierErrorDetail(body: unknown): string {
  if (typeof body === "string") return body.slice(0, 300);
  if (!body || typeof body !== "object") return "";
  const data = body as { message?: unknown; error?: unknown; errors?: unknown };
  const parts: string[] = [];
  for (const value of [data.message, data.error]) if (typeof value === "string") parts.push(value);
  if (Array.isArray(data.errors)) {
    for (const entry of data.errors) {
      if (typeof entry === "string") parts.push(entry);
      else if (entry && typeof entry === "object") {
        const e = entry as { message?: unknown; field?: unknown };
        if (typeof e.message === "string") parts.push(typeof e.field === "string" ? `${e.field}: ${e.message}` : e.message);
      }
    }
  } else if (data.errors && typeof data.errors === "object") {
    for (const [field, value] of Object.entries(data.errors as Record<string, unknown>)) {
      parts.push(`${field}: ${Array.isArray(value) ? value.join(", ") : String(value)}`);
    }
  }
  return parts.join("; ").slice(0, 400);
}

function failureMessage(status: number, body: unknown): string {
  const detail = courierErrorDetail(body);
  if (status === 401 || status === 403) {
    return `The Courier Guy rejected the API key (error ${status}). Check COURIER_GUY_API_KEY${detail ? `. They said: ${detail}` : ""}`;
  }
  return detail
    ? `The Courier Guy said (error ${status}): ${detail}`
    : `The Courier Guy could not do this (error ${status}).`;
}

/** Hosts that accepted the key, so later calls go straight there. */
const workingHost = new Map<string, string>();

async function request(
  config: CourierConfig,
  method: "GET" | "POST",
  path: string,
  body: unknown,
  fetcher: Fetcher,
): Promise<CourierResult<unknown>> {
  const hosts = [config.baseUrl, ...(config.fallbackBaseUrls ?? [])];
  const known = workingHost.get(config.apiKey);
  const ordered = known && hosts.includes(known) ? [known, ...hosts.filter((h) => h !== known)] : hosts;
  let last: CourierResult<unknown> = { ok: false, error: "The Courier Guy could not be reached." };
  const refused: string[] = [];
  for (const host of ordered) {
    const result = await requestHost(config, host, method, path, body, fetcher);
    if (result.ok) {
      workingHost.set(config.apiKey, host);
      return result;
    }
    if (!result.authRefused) {
      // A later host that cannot be reached must not hide why the first one refused.
      if (refused.length === 0) last = result;
      else last = { ok: false, error: `${last.ok ? "" : last.error} (Also tried ${host.replace(/^https:\/\//, "")}: ${result.error})` };
      break;
    }
    last = result;
    refused.push(host.replace(/^https:\/\//, ""));
  }
  if (refused.length > 1) {
    return { ok: false, error: `${last.ok ? "" : last.error} Tried ${refused.join(" and ")}; both refused the key.` };
  }
  return last.ok ? last : { ok: false, error: last.error };
}

async function requestHost(
  config: CourierConfig,
  host: string,
  method: "GET" | "POST",
  path: string,
  body: unknown,
  fetcher: Fetcher,
): Promise<CourierResult<unknown> & { authRefused?: boolean }> {
  try {
    const response = await fetcher(`${host}/${path}`, {
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
      console.error("[courier] request failed:", host, method, path, response.status, courierErrorDetail(parsed));
      return {
        ok: false,
        error: failureMessage(response.status, parsed),
        authRefused: response.status === 401 || response.status === 403,
      };
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
  parcel: ParcelInput | ParcelInput[],
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
  parcel: ParcelInput | ParcelInput[],
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
