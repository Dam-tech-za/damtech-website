import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normaliseTotpCode, safeAdminNext } from "./mfa.ts";

describe("two-step verification helpers", () => {
  it("accepts six digits, with or without a space", () => {
    assert.equal(normaliseTotpCode("123456"), "123456");
    assert.equal(normaliseTotpCode(" 123 456 "), "123456");
  });

  it("rejects anything that is not six digits", () => {
    assert.equal(normaliseTotpCode("12345"), null);
    assert.equal(normaliseTotpCode("1234567"), null);
    assert.equal(normaliseTotpCode("12a456"), null);
    assert.equal(normaliseTotpCode(""), null);
  });

  it("only forwards to admin pages after verification", () => {
    assert.equal(safeAdminNext("/admin/rfqs/"), "/admin/rfqs/");
    assert.equal(safeAdminNext("https://evil.example/admin"), "/admin/");
    assert.equal(safeAdminNext("//evil.example"), "/admin/");
    assert.equal(safeAdminNext(undefined), "/admin/");
  });

  it("never loops back to the verification page", () => {
    assert.equal(safeAdminNext("/admin/mfa/"), "/admin/");
  });
});
