/**
 * Best-effort mapping of a Xero contact payload from the bridge. The typed
 * website client only guaranteed id/name/email; extra keys are read when
 * present and skipped when not.
 */

import type { XeroBridgeClient } from "./xero-bridge.ts";
import { findTownByName, isSaProvince } from "./sa-places.ts";
import { locationPatch, type LocationPatch } from "./distance.ts";

export type XeroContactExtras = {
  id: string | null;
  name: string | null;
  email: string | null;
  person: string | null;
  phone: string | null;
  /** ISO-ish country hint for the phone, e.g. ZA. */
  phoneCountry: string | null;
  city: string | null;
  region: string | null;
  /** True when Phones[] was present but every entry lacked a usable number. */
  phonesPresentButEmpty: boolean;
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (v: unknown): UnknownRecord | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as UnknownRecord) : null;

const str = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
};

function phoneTypeScore(type: string): number {
  const t = type.toUpperCase();
  if (t.includes("MOBILE") || t.includes("MOBILENUMBER")) return 0;
  if (t.includes("DEFAULT")) return 1;
  if (t.includes("DDI")) return 2;
  if (t.includes("FAX")) return 9;
  return 5;
}

/** Build E.164; default country 27 (ZA) when the country code is missing. */
export function buildE164Phone(parts: {
  country?: string | null;
  area?: string | null;
  number?: string | null;
}): { e164: string; country: string } | null {
  const countryRaw = (parts.country ?? "").replace(/\D/g, "");
  let area = (parts.area ?? "").replace(/\D/g, "");
  let number = (parts.number ?? "").replace(/\D/g, "");
  if (!number && !area) return null;

  // Sometimes the full national number is in PhoneNumber alone (083…).
  if (!area && number.startsWith("0")) {
    number = number.slice(1);
  }
  if (area.startsWith("0")) area = area.slice(1);

  const national = `${area}${number}`.replace(/^0+/, "");
  if (!national) return null;

  const country = countryRaw || "27";
  return { e164: `+${country}${national}`, country: country === "27" ? "ZA" : country };
}

function pickPhone(raw: UnknownRecord): {
  phone: string | null;
  phoneCountry: string | null;
  phonesPresentButEmpty: boolean;
} {
  const direct = str(raw.phone) ?? str(raw.Phone) ?? str(raw.phone_number);
  if (direct) {
    const built = buildE164Phone({ number: direct });
    return {
      phone: built?.e164 ?? direct,
      phoneCountry: built?.country ?? null,
      phonesPresentButEmpty: false,
    };
  }

  const list = raw.phones ?? raw.Phones;
  if (!Array.isArray(list) || list.length === 0) {
    return { phone: null, phoneCountry: null, phonesPresentButEmpty: false };
  }

  const ranked = [...list]
    .map((item) => asRecord(item))
    .filter((item): item is UnknownRecord => item !== null)
    .sort((a, b) => {
      const type = (v: UnknownRecord) => String(v.type ?? v.PhoneType ?? "");
      return phoneTypeScore(type(a)) - phoneTypeScore(type(b));
    });

  let sawEntry = false;
  for (const p of ranked) {
    sawEntry = true;
    const built = buildE164Phone({
      country: str(p.country_code ?? p.PhoneCountryCode),
      area: str(p.area_code ?? p.PhoneAreaCode),
      number: str(p.number ?? p.PhoneNumber ?? p.phone),
    });
    if (built) return { phone: built.e164, phoneCountry: built.country, phonesPresentButEmpty: false };
  }
  return { phone: null, phoneCountry: null, phonesPresentButEmpty: sawEntry };
}

function pickEmail(raw: UnknownRecord): string | null {
  const direct = str(raw.email ?? raw.EmailAddress ?? raw.email_address);
  if (direct) return direct;
  const people = raw.contact_persons ?? raw.ContactPersons;
  if (!Array.isArray(people)) return null;
  for (const person of people) {
    const row = asRecord(person);
    if (!row) continue;
    const email = str(row.email ?? row.EmailAddress ?? row.email_address);
    if (email) return email;
  }
  return null;
}

function pickAddress(raw: UnknownRecord): { city: string | null; region: string | null } {
  const list = raw.addresses ?? raw.Addresses;
  const first = Array.isArray(list) ? asRecord(list[0]) : asRecord(raw.address ?? raw.Address);
  if (!first) return { city: str(raw.city), region: str(raw.region) };
  return {
    city: str(first.city ?? first.City),
    region: str(first.region ?? first.Region ?? first.region_name),
  };
}

export function mapXeroContact(raw: unknown): XeroContactExtras {
  const row = asRecord(raw);
  if (!row) {
    return {
      id: null,
      name: null,
      email: null,
      person: null,
      phone: null,
      phoneCountry: null,
      city: null,
      region: null,
      phonesPresentButEmpty: false,
    };
  }
  const first = str(row.first_name ?? row.FirstName);
  const last = str(row.last_name ?? row.LastName);
  const person = [first, last].filter(Boolean).join(" ") || str(row.contact_person) || null;
  const address = pickAddress(row);
  const phone = pickPhone(row);
  return {
    id: str(row.id ?? row.ContactID),
    name: str(row.name ?? row.Name),
    email: pickEmail(row),
    person,
    phone: phone.phone,
    phoneCountry: phone.phoneCountry,
    city: address.city,
    region: address.region,
    phonesPresentButEmpty: phone.phonesPresentButEmpty,
  };
}

/** Fill empty project fields from a Xero contact; never overwrite staff-typed values. */
export function fillFromXeroContact<T extends Record<string, unknown>>(
  current: {
    customer_name?: string | null;
    contact_person?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    xero_contact_id?: string | null;
  },
  extras: XeroContactExtras,
): Partial<T> {
  const patch: Record<string, unknown> = {};
  if (!current.customer_name?.trim() && extras.name) patch.customer_name = extras.name.slice(0, 200);
  // Prefer a person name; fall back to the Xero contact/company so Client is not blank.
  if (!current.contact_person?.trim() && (extras.person || extras.name)) {
    patch.contact_person = (extras.person || extras.name || "").slice(0, 200);
  }
  if (!current.contact_phone?.trim() && extras.phone) patch.contact_phone = extras.phone.slice(0, 40);
  if (!current.contact_email?.trim() && extras.email) patch.contact_email = extras.email.slice(0, 200);
  if (!current.xero_contact_id && extras.id) patch.xero_contact_id = extras.id;
  return patch as Partial<T>;
}

export function locationFromXeroCity(city: string | null, region: string | null): LocationPatch | null {
  const town = findTownByName(city);
  if (town) return locationPatch(town.province, town.name);
  if (region && isSaProvince(region) && city) return locationPatch(region, city);
  return null;
}

export async function fetchXeroContactExtras(
  bridge: XeroBridgeClient,
  search: { id?: string | null; name?: string | null },
): Promise<XeroContactExtras | null> {
  const needle = (search.name ?? "").trim().slice(0, 80);
  if (!needle && !search.id) return null;
  try {
    // Prefer an id lookup when the bridge supports it; fall back to name search.
    const byIdArgs = search.id ? { contact_id: search.id, page: 1 } : null;
    const searchArgs = { search: needle || search.id, page: 1 };
    let rows: unknown[] = [];
    if (byIdArgs) {
      try {
        const idRows = await bridge.call<unknown[]>("get_contacts", byIdArgs);
        if (Array.isArray(idRows) && idRows.length) rows = idRows;
      } catch {
        rows = [];
      }
    }
    if (!rows.length) {
      rows = await bridge.call<unknown[]>("get_contacts", searchArgs);
    }
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const mapped = rows.map(mapXeroContact);
    const byId = search.id ? mapped.find((c) => c.id === search.id) : null;
    return byId ?? mapped[0] ?? null;
  } catch {
    return null;
  }
}
