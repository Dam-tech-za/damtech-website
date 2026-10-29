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
  it("resolves Pexmart by ContactID even when K&S49 is first in the list", async () => {
    const bridge = mockBridge(async (tool, args) => {
      assert.equal(tool, "get_contacts");
      assert.equal(args?.contact_id, PEXMART_ID);
      // Simulate a buggy bridge that returns the full directory sorted by name.
      return [
        { ContactID: KS49_ID, Name: "K&S49 Trading (PTY) LTD", EmailAddress: "sharon@silvertonmidas.co.za" },
        { ContactID: PEXMART_ID, Name: "Pexmart", EmailAddress: null },
      ];
    });
    const contact = await fetchXeroContactByIdStrict(bridge, {
      projectId: "p1",
      documentNumber: "QU0301",
      documentContactId: PEXMART_ID,
    });
    assert.equal(contact.id, PEXMART_ID);
    assert.equal(contact.name, "Pexmart");
  });

  it("errors when the contact call fails — never returns K&S49", async () => {
    const bridge = mockBridge(async () => {
      throw new Error("HTTP 400");
    });
    await assert.rejects(
      () =>
        fetchXeroContactByIdStrict(bridge, {
          documentContactId: PEXMART_ID,
          documentNumber: "QU0301",
        }),
      (err: unknown) => err instanceof XeroContactLookupError && /didn't answer/i.test(err.message),
    );
  });

  it("errors when ContactID is missing", async () => {
    const bridge = mockBridge(async () => [{ ContactID: KS49_ID, Name: "K&S49" }]);
    await assert.rejects(
      () => fetchXeroContactByIdStrict(bridge, { documentContactId: "" }),
      (err: unknown) => err instanceof XeroContactLookupError && /no ContactID/i.test(err.message),
    );
  });

  it("errors when returned contact id does not match — never takes Contacts[0]", async () => {
    const bridge = mockBridge(async () => [
      { ContactID: KS49_ID, Name: "K&S49 Trading (PTY) LTD" },
      { ContactID: "22222222-2222-2222-2222-222222222222", Name: "Other" },
    ]);
    await assert.rejects(
      () =>
        fetchXeroContactByIdStrict(bridge, {
          documentContactId: PEXMART_ID,
          documentNumber: "QU0301",
        }),
      (err: unknown) => err instanceof XeroContactLookupError && /different contact/i.test(err.message),
    );
  });

  it("knows the blocked K&S49 contact ids", () => {
    assert.equal(BLOCKED_XERO_CONTACT_IDS.has(KS49_ID), true);
    assert.equal(BLOCKED_XERO_CONTACT_IDS.has("05c50aa7-ddeb-4b53-959b-15efb85494bb"), true);
  });
});
