import { randomBytes } from "node:crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function southAfricanCalendarDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}${month}${day}`;
}

export function generateShortUniqueCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const byte = bytes[i];
    if (byte === undefined) break;
    code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return code;
}

export function generateOrderReference(now = new Date()): string {
  return `DT-${southAfricanCalendarDate(now)}-${generateShortUniqueCode()}`;
}

export function isOrderReferenceFormat(value: string): boolean {
  return /^DT-\d{8}-[A-Z2-9]{8}$/.test(value);
}
