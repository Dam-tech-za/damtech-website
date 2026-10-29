import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCreateContactPayload } from "./xero-contact-payload.ts";

const base = { rfq_number: "RFQ-2026-00100", contact_name: "Pat Doe", company_name: null, email: "PAT@Example.com ", phone: "074 921 7000", town: "Hermanus", province: "Western Cape", address_line: null, postal_code: null };

describe("send an enquiry to Xero as a contact", () => {
  it("uses the person's name, a clean email, an E.164 phone and the enquiry as the reference", () => {
    const p = buildCreateContactPayload(base);
    assert.ok(!("error" in p));
    assert.equal(p.name, "Pat Doe");
    assert.equal(p.first_name, "Pat");
    assert.equal(p.last_name, "Doe");
    assert.equal(p.email, "pat@example.com");
    assert.equal(p.phone, "+27749217000");
    assert.equal(p.address?.city, "Hermanus");
    assert.deepEqual(p.source, { kind: "website_enquiry", reference: "RFQ-2026-00100" });
  });

  it("names the contact after the company when there is one", () => {
    const p = buildCreateContactPayload({ ...base, company_name: "Sample Farms (Pty) Ltd" });
    assert.ok(!("error" in p) && p.name === "Sample Farms (Pty) Ltd" && p.first_name === "Pat");
  });

  it("refuses an enquiry with no name at all", () => {
    assert.ok("error" in buildCreateContactPayload({ ...base, contact_name: " ", company_name: null }));
  });
});
