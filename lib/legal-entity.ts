/**
 * Public supplier identity for ECT Act s43 and POPIA.
 *
 * Street addresses stay out of LocalBusiness schema (service-area business).
 * The registered physical address is published on legal and order pages only.
 *
 * Phone, email and the Betty's Bay address must stay aligned with
 * `siteConfig` and `HEAD_OFFICE` in `lib/site.ts`.
 *
 * `registrationNumber` is omitted until the owner supplies the CIPC number.
 * Do not invent one.
 */

import { SITE_URL } from "./site-url.ts";

export const LEGAL_ENTITY = {
  legalName: "Damtech Structural Solutions (Pty) Ltd",
  tradingName: "Damtech",
  registrationNumber: null as string | null,
  placeOfRegistration: "South Africa",
  phone: "+27 82 853 1026",
  phoneTel: "+27828531026",
  email: "info@dam-tech.co.za",
  website: SITE_URL,
  registeredAddress: {
    streetAddress: "2484 Anglers Rd",
    suburb: "Betty's Bay",
    city: "Betty's Bay",
    province: "Western Cape",
    postalCode: "7141",
    country: "South Africa",
  },
  walkInNote:
    "This is the physical address for legal notices. It is not a walk-in shop or collection point.",
} as const;

export function formatRegisteredAddressLines(): string[] {
  const address = LEGAL_ENTITY.registeredAddress;
  const locality =
    address.suburb && address.suburb !== address.city
      ? `${address.suburb}, ${address.city}`
      : address.city;
  return [
    address.streetAddress,
    `${locality} ${address.postalCode}`,
    `${address.province}, ${address.country}`,
  ];
}

export function formatRegisteredAddressOneLine(): string {
  return formatRegisteredAddressLines().join(", ");
}

export function hasPublishedRegistrationNumber(): boolean {
  return Boolean(LEGAL_ENTITY.registrationNumber?.trim());
}
