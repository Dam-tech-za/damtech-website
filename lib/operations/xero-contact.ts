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
  city: string | null;
  region: string | null;
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (v: unknown): UnknownRecord | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as UnknownRecord) : null;

const str = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
};

function pickPhone(raw: UnknownRecord): string | null {
  const direct = str(raw.phone) ?? str(raw.Phone) ?? str(raw.phone_number);
  if (direct) return direct;
  const list = raw.phones ?? raw.Phones;
  if (!Array.isArray(list)) return null;
  const ranked = [...list]
    .map((item) => asRecord(item))
    .filter((item): item is UnknownRecord => item !== null)
    .sort((a, b) => {
      const type = (v: UnknownRecord) => String(v.type ?? v.PhoneType ?? "").toUpperCase();
      const score = (t: string) => (t.includes("MOBILE") ? 0 : t.includes("DEFAULT") ? 1 : 2);
      return score(type(a)) - score(type(b));
    });
  for (const p of ranked) {
    const country = str(p.country_code ?? p.PhoneCountryCode) ?? "";
    const area = str(p.area_code ?? p.PhoneAreaCode) ?? "";
    const number = str(p.number ?? p.PhoneNumber ?? p.phone) ?? "";
    const combined = `${country}${area}${number}`.replace(/\s+/g, "");
    if (combined) return country ? `+${combined.replace(/^\+/, "")}` : combined;
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
    return { id: null, name: null, email: null, person: null, phone: null, city: null, region: null };
  }
  const first = str(row.first_name ?? row.FirstName);
  const last = str(row.last_name ?? row.LastName);
  const person = [first, last].filter(Boolean).join(" ") || str(row.contact_person) || null;
  const address = pickAddress(row);
  return {
    id: str(row.id ?? row.ContactID),
    name: str(row.name ?? row.Name),
    email: str(row.email ?? row.EmailAddress ?? row.email_address),
    person,
    phone: pickPhone(row),
    city: address.city,
    region: address.region,
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
  if (!current.contact_person?.trim() && extras.person) patch.contact_person = extras.person.slice(0, 200);
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
    const rows = await bridge.call<unknown[]>("get_contacts", { search: needle || search.id, page: 1 });
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const mapped = rows.map(mapXeroContact);
    const byId = search.id ? mapped.find((c) => c.id === search.id) : null;
    return byId ?? mapped[0] ?? null;
  } catch {
    return null;
  }
}
