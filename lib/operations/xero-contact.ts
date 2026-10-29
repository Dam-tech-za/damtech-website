/**
 * Best-effort mapping of a Xero contact payload from the bridge.
 * Contact lookup is by ContactID only — never by name (name search caused the
 * K&S49 / Sharon De Lange overwrite of every Planning row).
 */

import type { XeroBridgeClient } from "./xero-bridge.ts";
import { combineXeroPhoneParts, parseToE164 } from "./phone-parse.ts";
import { findTownByName, isSaProvince } from "./sa-places.ts";
import { locationPatch, type LocationPatch } from "./distance.ts";

export type XeroContactExtras = {
  id: string | null;
  name: string | null;
  email: string | null;
  person: string | null;
  phone: string | null;
  phoneCountry: string | null;
  city: string | null;
  region: string | null;
  addressLine: string | null;
  phonesPresentButEmpty: boolean;
};

type UnknownRecord = Record<string, unknown>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Known bad contacts that previously overwrote every Planning row via Contacts[0]. */
export const BLOCKED_XERO_CONTACT_IDS = new Set([
  "f3dd1d70-c89c-4648-91ae-0c10dc123078", // K&S49 Trading (PTY) LTD / Sharon
  "05c50aa7-ddeb-4b53-959b-15efb85494bb", // *K And S49 Trading
]);

export class XeroContactLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XeroContactLookupError";
  }
}

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

function pickPhone(raw: UnknownRecord): {
  phone: string | null;
  phoneCountry: string | null;
  phonesPresentButEmpty: boolean;
} {
  const direct = str(raw.phone) ?? str(raw.Phone) ?? str(raw.phone_number);
  if (direct) {
    const e164 = parseToE164(direct);
    return { phone: e164, phoneCountry: e164?.startsWith("+27") ? "ZA" : null, phonesPresentButEmpty: false };
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
    const e164 = combineXeroPhoneParts({
      country: str(p.country_code ?? p.PhoneCountryCode),
      area: str(p.area_code ?? p.PhoneAreaCode),
      number: str(p.number ?? p.PhoneNumber ?? p.phone),
    });
    if (e164) return { phone: e164, phoneCountry: e164.startsWith("+27") ? "ZA" : null, phonesPresentButEmpty: false };
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

function pickAddress(raw: UnknownRecord): { city: string | null; region: string | null; line: string | null } {
  const list = raw.addresses ?? raw.Addresses;
  if (!Array.isArray(list) || !list.length) {
    return { city: str(raw.city), region: str(raw.region), line: null };
  }
  const ranked = [...list]
    .map((a) => asRecord(a))
    .filter((a): a is UnknownRecord => a !== null)
    .sort((a, b) => {
      const type = (v: UnknownRecord) => String(v.type ?? v.AddressType ?? "").toUpperCase();
      const score = (t: string) => (t.includes("DELIVERY") || t.includes("SHIPPING") ? 0 : t.includes("STREET") || t.includes("POBOX") ? 1 : 2);
      return score(type(a)) - score(type(b));
    });
  const first = ranked[0];
  if (!first) return { city: null, region: null, line: null };
  const line = [str(first.address_line1 ?? first.AddressLine1), str(first.address_line2 ?? first.AddressLine2)]
    .filter(Boolean)
    .join(", ");
  return {
    city: str(first.city ?? first.City),
    region: str(first.region ?? first.Region ?? first.region_name),
    line: line || null,
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
      addressLine: null,
      phonesPresentButEmpty: false,
    };
  }
  const first = str(row.first_name ?? row.FirstName);
  const last = str(row.last_name ?? row.LastName);
  let person = [first, last].filter(Boolean).join(" ") || null;
  if (!person) {
    const people = row.contact_persons ?? row.ContactPersons;
    if (Array.isArray(people) && people[0]) {
      const p0 = asRecord(people[0]);
      if (p0) {
        person = [str(p0.first_name ?? p0.FirstName), str(p0.last_name ?? p0.LastName)].filter(Boolean).join(" ") || null;
      }
    }
  }
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
    addressLine: address.line,
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

export type ContactLookupContext = {
  projectId?: string | null;
  documentNumber?: string | null;
  /** ContactID taken from the quote/invoice. Required for the hard guard. */
  documentContactId: string;
};

/**
 * Fetch a Xero contact by ContactID only. Never falls back to Contacts[0],
 * name search, or an unfiltered list. Throws on any failure.
 */
export async function fetchXeroContactByIdStrict(
  bridge: XeroBridgeClient,
  ctx: ContactLookupContext,
): Promise<XeroContactExtras> {
  const documentContactId = (ctx.documentContactId ?? "").trim();
  if (!documentContactId || !UUID.test(documentContactId)) {
    throw new XeroContactLookupError("This Xero document has no ContactID.");
  }

  let rows: unknown[];
  try {
    const result = await bridge.call<unknown[]>("get_contacts", { contact_id: documentContactId, page: 1 });
    if (!Array.isArray(result)) {
      throw new XeroContactLookupError("Xero didn't answer, nothing was changed.");
    }
    rows = result;
  } catch (error) {
    if (error instanceof XeroContactLookupError) throw error;
    throw new XeroContactLookupError("Xero didn't answer, nothing was changed.");
  }

  if (!rows.length) {
    console.error("[xero-contact] empty contacts response", {
      projectId: ctx.projectId,
      documentNumber: ctx.documentNumber,
      documentContactId,
    });
    throw new XeroContactLookupError("Xero contact not found for this document.");
  }

  const mapped = rows.map(mapXeroContact);
  // NEVER take mapped[0] — that is how K&S49 (first by name) overwrote every project.
  const match = mapped.find((c) => c.id === documentContactId);
  const resolvedContactId = match?.id ?? null;
  const matched = resolvedContactId === documentContactId;

  console.info("[xero-contact] sync lookup", {
    projectId: ctx.projectId ?? null,
    documentNumber: ctx.documentNumber ?? null,
    documentContactId,
    resolvedContactId,
    matched,
  });

  if (!match || !resolvedContactId) {
    console.error("[xero-contact] ContactID mismatch — refusing Contacts[0] fallback", {
      projectId: ctx.projectId,
      documentNumber: ctx.documentNumber,
      documentContactId,
      returnedIds: mapped.map((c) => c.id),
    });
    throw new XeroContactLookupError("Xero returned a different contact. Nothing was changed.");
  }

  if (BLOCKED_XERO_CONTACT_IDS.has(resolvedContactId) && !BLOCKED_XERO_CONTACT_IDS.has(documentContactId)) {
    console.error("[xero-contact] blocked contact rejected", {
      projectId: ctx.projectId,
      documentNumber: ctx.documentNumber,
      documentContactId,
      resolvedContactId,
    });
    throw new XeroContactLookupError("Blocked a known wrong Xero contact. Nothing was changed.");
  }

  return match;
}

/**
 * Fetch a Xero contact by ContactID only. Returns null on failure (legacy callers).
 * Never returns a contact whose id does not equal the requested ContactID.
 */
export async function fetchXeroContactById(
  bridge: XeroBridgeClient,
  contactId: string | null | undefined,
): Promise<XeroContactExtras | null> {
  const id = (contactId ?? "").trim();
  if (!id || !UUID.test(id)) return null;
  try {
    return await fetchXeroContactByIdStrict(bridge, { documentContactId: id });
  } catch (error) {
    if (error instanceof XeroContactLookupError) {
      console.error("[xero-contact]", error.message);
      return null;
    }
    throw error;
  }
}

/** @deprecated Use fetchXeroContactById — name lookup is forbidden. */
export async function fetchXeroContactExtras(
  bridge: XeroBridgeClient,
  search: { id?: string | null; name?: string | null },
): Promise<XeroContactExtras | null> {
  void search.name;
  return fetchXeroContactById(bridge, search.id);
}
