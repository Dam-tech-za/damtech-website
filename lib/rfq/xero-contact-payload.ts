import { parseToE164 } from "../operations/phone-parse.ts";

/**
 * What the website sends the bridge's `create_contact_from_website` tool for
 * one enquiry. The bridge matches an existing Xero contact (email, then exact
 * name) or creates a new one; it never edits an existing contact.
 */
export type EnquiryContactInput = {
  rfq_number: string;
  contact_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  town: string | null;
  province: string | null;
  address_line: string | null;
  postal_code: string | null;
};

export type CreateContactPayload = {
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: { line1: string | null; city: string | null; region: string | null; postal_code: string | null; country: "South Africa" } | null;
  source: { kind: "website_enquiry"; reference: string };
};

export type CreateContactResult = {
  contact_id: string;
  name: string;
  created: boolean;
  matched_by?: "email" | "name" | "reference" | null;
};

const clean = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t || null;
};

export function buildCreateContactPayload(rfq: EnquiryContactInput): CreateContactPayload | { error: string } {
  const person = clean(rfq.contact_name);
  const company = clean(rfq.company_name);
  // Xero's contact name is the business when there is one, else the person.
  const name = company ?? person;
  if (!name) return { error: "This enquiry has no customer or company name to use in Xero." };
  const [first, ...rest] = (person ?? "").split(/\s+/).filter(Boolean);
  const hasAddress = Boolean(clean(rfq.address_line) || clean(rfq.town) || clean(rfq.province));
  return {
    name: name.slice(0, 255),
    first_name: first ? first.slice(0, 255) : null,
    last_name: rest.length ? rest.join(" ").slice(0, 255) : null,
    email: clean(rfq.email)?.toLowerCase() ?? null,
    phone: rfq.phone ? (parseToE164(rfq.phone) ?? clean(rfq.phone)) : null,
    address: hasAddress
      ? {
          line1: clean(rfq.address_line),
          city: clean(rfq.town),
          region: clean(rfq.province),
          postal_code: clean(rfq.postal_code),
          country: "South Africa",
        }
      : null,
    source: { kind: "website_enquiry", reference: rfq.rfq_number },
  };
}
