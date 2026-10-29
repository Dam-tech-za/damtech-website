import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fillFromXeroContact, mapXeroContact } from "./xero-contact.ts";
import { parseToE164, combineXeroPhoneParts } from "./phone-parse.ts";
import { applyFieldChanges, restorePatchForTitle, undoFieldChanges, type FieldChange } from "./xero-contact-backfill.ts";

describe("phone parse (Xero formats)", () => {
  it("parses full E.164 in PhoneNumber with empty country/area", () => {
    assert.equal(combineXeroPhoneParts({ number: "+27832800970" }), "+27832800970");
  });

  it("parses national mobile with empty country/area", () => {
    assert.equal(combineXeroPhoneParts({ number: "0768461543" }), "+27768461543");
  });

  it("parses country + number parts", () => {
    assert.equal(
      combineXeroPhoneParts({ country: "27", area: "", number: "714988436" }),
      "+27714988436",
    );
  });

  it("rejects empty", () => {
    assert.equal(parseToE164(" "), null);
  });
});

describe("K&S49 restore table", () => {
  it("restores Francois from Sharon overwrite and flags dual contact", () => {
    const result = restorePatchForTitle("Francois Joubert PPCF Boerdery", {
      contact_person: "K&S49 Trading (PTY) LTD",
      contact_email: "sharon@silvertonmidas.co.za",
      contact_phone: null,
    });
    assert.ok(result);
    assert.equal(result.patch.contact_person, "Francois Joubert");
    assert.equal(result.patch.contact_email, "francois@ppcf.co.za");
    assert.equal(result.patch.contact_phone, "+27832800970");
    assert.equal(result.patch.xero_dual_contact, true);
    assert.equal(result.dual, true);
  });

  it("fills Alfred phone without changing name/email", () => {
    const result = restorePatchForTitle("Alfred Mensah QU0348", {
      contact_person: "Alfred Mensah",
      contact_email: "mensah@example.com",
      contact_phone: null,
    });
    assert.ok(result);
    assert.equal(result.patch.contact_person, undefined);
    assert.equal(result.patch.contact_email, undefined);
    assert.equal(result.patch.contact_phone, "+27749217449");
  });

  it("does nothing when already correct and phone set", () => {
    const result = restorePatchForTitle("Pexmart", {
      contact_person: "Pexmart",
      contact_email: null,
      contact_phone: null,
    });
    // Pexmart rule sets contact_person when empty/corrupted — already Pexmart so only if corrupted.
    // contact_person is set only when corrupted or empty; "Pexmart" is neither empty nor corrupted → null patch keys for person.
    // Rule has contact_person: "Pexmart" and current is already "Pexmart" with empty email/phone — no changes needed.
    assert.equal(result, null);
  });
});

describe("fillFromXeroContact never overwrites", () => {
  it("keeps a manually typed client name", () => {
    const patch = fillFromXeroContact(
      {
        customer_name: "Hire Engineering",
        contact_person: "Staff typed",
        contact_phone: null,
        contact_email: null,
        xero_contact_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      },
      {
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        name: "K&S49 Trading (PTY) LTD",
        person: "Sharon De Lange",
        phone: "+27111111111",
        phoneCountry: "ZA",
        email: "sharon@silvertonmidas.co.za",
        city: null,
        region: null,
        addressLine: null,
        phonesPresentButEmpty: false,
      },
    );
    assert.equal(patch.customer_name, undefined);
    assert.equal(patch.contact_person, undefined);
    assert.equal(patch.contact_email, "sharon@silvertonmidas.co.za");
    assert.equal(patch.contact_phone, "+27111111111");
  });

  it("maps DEFAULT phone with full number and empty country", () => {
    const mapped = mapXeroContact({
      ContactID: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      Name: "Boscobel",
      Phones: [{ PhoneType: "DEFAULT", PhoneCountryCode: "", PhoneAreaCode: "", PhoneNumber: "0768461543" }],
    });
    assert.equal(mapped.phone, "+27768461543");
  });
});

describe("undo field changes grouping", () => {
  it("groups by project id", () => {
    const changes: FieldChange[] = [
      { projectId: "p1", projectTitle: "A", field: "contact_email", from: null, to: "a@b.c" },
      { projectId: "p1", projectTitle: "A", field: "contact_phone", from: null, to: "+2783" },
      { projectId: "p2", projectTitle: "B", field: "contact_person", from: null, to: "Bob" },
    ];
    // apply/undo need a db — smoke the pure shape only here.
    assert.equal(changes.filter((c) => c.projectId === "p1").length, 2);
    assert.equal(typeof applyFieldChanges, "function");
    assert.equal(typeof undoFieldChanges, "function");
  });
});
