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
 * Never prefix these with NEXT_PUBLIC_. A sandbox key and a live key use the
 * same address; the key decides which account is used.
 */

import type { CourierAddress, CourierContact } from "./types.ts";

export type CourierConfig = {
  apiKey: string;
  baseUrl: string;
  sender: { address: CourierAddress; contact: CourierContact };
};

export type CourierConfigResult =
  | { ok: true; config: CourierConfig }
  | { ok: false; reason: string; missing: string[] };

const DEFAULT_BASE_URL = "https://api.shiplogic.com";

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
  const company = value("COURIER_SENDER_COMPANY");
  return {
    ok: true,
    config: {
      apiKey: value("COURIER_GUY_API_KEY"),
      baseUrl: rawUrl.replace(/\/+$/, ""),
      sender: {
        address: {
          type: "business",
          ...(company ? { company } : {}),
          street_address: value("COURIER_SENDER_STREET"),
          local_area: value("COURIER_SENDER_SUBURB"),
          city: value("COURIER_SENDER_CITY"),
          zone: value("COURIER_SENDER_PROVINCE"),
          country: "ZA",
          code: value("COURIER_SENDER_POSTAL_CODE"),
        },
        contact: {
          name: value("COURIER_SENDER_NAME"),
          mobile_number: value("COURIER_SENDER_PHONE"),
          email: value("COURIER_SENDER_EMAIL"),
        },
      },
    },
  };
}
