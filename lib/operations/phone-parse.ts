/**
 * Normalise Xero (and typed) phone numbers to E.164. Xero often stores the
 * full national or E.164 number in PhoneNumber with Country/Area empty.
 */

import { parsePhoneNumberFromString } from "libphonenumber-js";

export function parseToE164(raw: string | null | undefined, defaultRegion: "ZA" = "ZA"): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;

  // Prefer libphonenumber when the string looks like a phone.
  const parsed = parsePhoneNumberFromString(trimmed, defaultRegion);
  if (parsed?.isValid()) return parsed.format("E.164");

  // Digits-only national ZA (0749217449 / 749217449).
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("27") && digits.length >= 11) {
    const again = parsePhoneNumberFromString(`+${digits}`);
    if (again?.isValid()) return again.format("E.164");
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    const again = parsePhoneNumberFromString(digits, defaultRegion);
    if (again?.isValid()) return again.format("E.164");
  }
  if (digits.length === 9 && /^[1-8]/.test(digits)) {
    const again = parsePhoneNumberFromString(`0${digits}`, defaultRegion);
    if (again?.isValid()) return again.format("E.164");
  }

  // Last resort: keep a plausible +number.
  if (trimmed.startsWith("+") && digits.length >= 8) return `+${digits}`;
  return null;
}

export function combineXeroPhoneParts(parts: {
  country?: string | null;
  area?: string | null;
  number?: string | null;
}): string | null {
  const country = (parts.country ?? "").replace(/\D/g, "");
  const area = (parts.area ?? "").replace(/\D/g, "");
  const number = (parts.number ?? "").trim();
  if (!number && !area) return null;

  // Full number already in PhoneNumber (with or without + / leading 0).
  if (!country && !area) return parseToE164(number);

  const combined = [country ? `+${country}` : "", area, number.replace(/\D/g, "").replace(/^0+/, "")].join("");
  return parseToE164(combined.startsWith("+") ? combined : country ? `+${country}${area}${number.replace(/\D/g, "")}` : number);
}
