import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BLOCKED_XERO_CONTACT_IDS,
  fetchXeroContactByIdStrict,
  XeroContactLookupError,
} from "./xero-contact.ts";
import type { XeroBridgeClient } from "./xero-bridge.ts";

const PEXMART_ID = "11111111-1111-1111-1111-111111111111";
const KS49_ID = "f3dd1d70-c89c-4648-91ae-0c10dc123078";

function mockBridge(handler: XeroBridgeClient["call"]): XeroBridgeClient {
  return {
    status: async () => ({ connected: true }),
    call: handler,
  };
}

describe("fetchXeroContactByIdStrict", () => {
  it("reads one contact by id with get_contact, never get_contacts", async () => {
    const tools: string[] = [];
    const bridge = mockBridge(async (tool, args) => {
      tools.push(tool);
      assert.equal(args?.contact_id, PEXMART_ID);
      return { id: PEXMART_ID, name: "Pexmart" } as never;
    });
    const contact = await fetchXeroContactByIdStrict(bridge, { documentNumber: "QU0283", documentContactId: PEXMART_ID });
    assert.deepEqual(tools, ["get_contact"]);
    assert.equal(contact.name, "Pexmart");
  });

  it("errors when the contact call fails, never returning another contact", async () => {
    const bridge = mockBridge(async () => {
      throw new Error("HTTP 400");
    });
    await assert.rejects(
      () => fetchXeroContactByIdStrict(bridge, { documentContactId: PEXMART_ID, documentNumber: "QU0283" }),
      (err: unknown) => err instanceof XeroContactLookupError && /didn't answer/i.test(err.message),
    );
  });

  it("errors when ContactID is missing", async () => {
    const bridge = mockBridge(async () => ({ id: KS49_ID }) as never);
    await assert.rejects(
      () => fetchXeroContactByIdStrict(bridge, { documentContactId: "" }),
      (err: unknown) => err instanceof XeroContactLookupError && /no ContactID/i.test(err.message),
    );
  });

  it("refuses a contact whose id differs from the document's (the old K&S49 bug)", async () => {
    const bridge = mockBridge(async () => ({ id: KS49_ID, name: "K&S49 Trading (PTY) LTD" }) as never);
    await assert.rejects(
      () => fetchXeroContactByIdStrict(bridge, { documentContactId: PEXMART_ID, documentNumber: "QU0283" }),
      (err: unknown) => err instanceof XeroContactLookupError && /different contact/i.test(err.message),
    );
  });

  it("knows the blocked K&S49 contact ids", () => {
    assert.equal(BLOCKED_XERO_CONTACT_IDS.has(KS49_ID), true);
    assert.equal(BLOCKED_XERO_CONTACT_IDS.has("05c50aa7-ddeb-4b53-959b-15efb85494bb"), true);
  });
});

describe("mapXeroContact with bridge v7 contact details", () => {
  it("reads line1, city and the e164 phone list", async () => {
    const { mapXeroContact } = await import("./xero-contact.ts");
    const c = mapXeroContact({
      id: PEXMART_ID,
      name: "Customer B",
      email: null,
      phone: null,
      phones: [{ type: "MOBILE", e164: "+27740000002" }],
      contact_persons: [{ first_name: "Pat", last_name: "Doe", email: "pat@example.com" }],
      addresses: [{ type: "STREET", line1: "1 Main Rd", line2: null, city: "Boksburg", region: "Gauteng" }],
    });
    assert.equal(c.phone, "+27740000002");
    assert.equal(c.email, "pat@example.com");
    assert.equal(c.addressLine, "1 Main Rd");
    assert.equal(c.city, "Boksburg");
  });
});
