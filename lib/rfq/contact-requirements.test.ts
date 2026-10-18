import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkRequiredRfqContact } from "./contact-requirements.ts";

describe("checkRequiredRfqContact", () => {
  it("accepts a valid email and a listed province", () => {
    assert.equal(checkRequiredRfqContact({ email: "a@b.co.za", province: "Gauteng" }), null);
  });

  it("requires an email even when a phone number would be supplied", () => {
    assert.deepEqual(checkRequiredRfqContact({ email: "", province: "Gauteng" }), {
      field: "email",
      message: "Please enter your email address.",
    });
  });

  it("rejects a malformed email", () => {
    assert.equal(checkRequiredRfqContact({ email: "not-an-email", province: "Gauteng" })?.field, "email");
  });

  it("requires a province from the list", () => {
    assert.equal(checkRequiredRfqContact({ email: "a@b.co.za", province: "" })?.field, "province");
    assert.equal(checkRequiredRfqContact({ email: "a@b.co.za", province: "Atlantis" })?.field, "province");
  });
});
