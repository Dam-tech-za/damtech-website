/**
 * The Courier Guy runs on the Ship Logic API. Everything here is server-only:
 *
 *   COURIER_GUY_API_KEY           API key from the Courier Guy / Ship Logic portal
 *   COURIER_GUY_API_URL           optional, defaults to https://api.shiplogic.com
 *
 * The collection (sender) details are read from the environment as well so no
 * address is hard-coded in the site:
 *
 *   COURIER_SENDER_NAME, COURIER_SENDER_PHONE, COURIER_SENDER_EMAIL
 *   COURIER_SENDER_COMPANY (optional)
 *   COURIER_SENDER_STREET, COURIER_SENDER_SUBURB, COURIER_SENDER_CITY
 *   COURIER_SENDER_PROVINCE, COURIER_SENDER_POSTAL_CODE
 *
 * A second collection address for Betty's Bay is optional and uses the same
 * names with COURIER_SENDER_BETTYS_BAY_ in front (…_NAME, …_STREET and so on).
 * Western Cape orders are quoted from there when it is set.
 *
 * Never prefix these with NEXT_PUBLIC_. A sandbox key and a live key use the
 * same address; the key decides which account is used.
 */

import type { CourierAddress, CourierContact } from "./types.ts";

export type CourierSender = { address: CourierAddress; contact: CourierContact };

export const COURIER_DEPOTS = { pretoria: "Pretoria", "bettys-bay": "Betty's Bay" } as const;
export type CourierDepotId = keyof typeof COURIER_DEPOTS;

export type CourierConfig = {
  apiKey: string;
  baseUrl: string;
  /** Other hosts to try when the key is refused (only when no URL is set). */
  fallbackBaseUrls?: string[];
  /** The collection address in use for this request. */
  sender: CourierSender;
  depots: Partial<Record<CourierDepotId, CourierSender>>;
};

export function isCourierDepotId(value: unknown): value is CourierDepotId {
  return typeof value === "string" && value in COURIER_DEPOTS;
}

/** The depot nearest the customer: Betty's Bay for the Western Cape when it is set up. */
export function courierDepotForProvince(config: CourierConfig, province: string): CourierDepotId {
  return province === "Western Cape" && config.depots["bettys-bay"] ? "bettys-bay" : "pretoria";
}

/** The same config, collecting from the chosen depot (falls back to the main one). */
export function withCourierDepot(config: CourierConfig, depot: CourierDepotId): CourierConfig {
  return { ...config, sender: config.depots[depot] ?? config.sender };
}

const SENDER_FIELDS = ["NAME", "PHONE", "EMAIL", "STREET", "SUBURB", "CITY", "PROVINCE", "POSTAL_CODE"] as const;

function readSender(prefix: string, value: (name: string) => string): CourierSender | null {
  if (SENDER_FIELDS.some((field) => !value(`${prefix}${field}`))) return null;
  const company = value(`${prefix}COMPANY`);
  return {
    address: {
      type: "business",
      ...(company ? { company } : {}),
      street_address: value(`${prefix}STREET`),
      local_area: value(`${prefix}SUBURB`),
      city: value(`${prefix}CITY`),
      zone: value(`${prefix}PROVINCE`),
      country: "ZA",
      code: value(`${prefix}POSTAL_CODE`),
    },
    contact: {
      name: value(`${prefix}NAME`),
      mobile_number: value(`${prefix}PHONE`),
      email: value(`${prefix}EMAIL`),
    },
  };
}

export type CourierConfigResult =
  | { ok: true; config: CourierConfig }
  | { ok: false; reason: string; missing: string[] };

const DEFAULT_BASE_URL = "https://api.shiplogic.com";
/** The Courier Guy's own Ship Logic host, for keys made in portal.thecourierguy.co.za. */
export const TCG_PORTAL_API_URL = "https://api.portal.thecourierguy.co.za";

const REQUIRED = [
  "COURIER_GUY_API_KEY",
  "COURIER_SENDER_NAME",
  "COURIER_SENDER_PHONE",
  "COURIER_SENDER_EMAIL",
  "COURIER_SENDER_STREET",
  "COURIER_SENDER_SUBURB",
  "COURIER_SENDER_CITY",
  "COURIER_SENDER_PROVINCE",
  "COURIER_SENDER_POSTAL_CODE",
] as const;

export function getCourierConfig(
  env: Record<string, string | undefined> = process.env,
): CourierConfigResult {
  const value = (name: string) => env[name]?.trim() ?? "";
  const missing = REQUIRED.filter((name) => !value(name));
  if (missing.length > 0) {
    return {
      ok: false,
      missing: [...missing],
      reason: missing.includes("COURIER_GUY_API_KEY")
        ? "The Courier Guy API key is not set."
        : "The collection address for The Courier Guy is not set.",
    };
  }
  const rawUrl = value("COURIER_GUY_API_URL") || DEFAULT_BASE_URL;
  if (!/^https:\/\/[^\s/]+(\/\S*)?$/.test(rawUrl)) {
    return { ok: false, missing: [], reason: "COURIER_GUY_API_URL must be an https address." };
  }
  const main = readSender("COURIER_SENDER_", value);
  if (!main) return { ok: false, missing: [], reason: "The collection address for The Courier Guy is not set." };
  const bettysBay = readSender("COURIER_SENDER_BETTYS_BAY_", value);
  return {
    ok: true,
    config: {
      // Keys pasted with quotes, a "Bearer " prefix or spaces are cleaned up.
      apiKey: value("COURIER_GUY_API_KEY")
        .replace(/^["']|["']$/g, "")
        .replace(/^Bearer\s+/i, "")
        .trim(),
      baseUrl: rawUrl.replace(/\/+$/, ""),
      ...(value("COURIER_GUY_API_URL") ? {} : { fallbackBaseUrls: [TCG_PORTAL_API_URL] }),
      sender: main,
      depots: { pretoria: main, ...(bettysBay ? { "bettys-bay": bettysBay } : {}) },
    },
  };
}
