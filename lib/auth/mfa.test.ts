import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  effectiveAssurance,
  MFA_REMEMBER_DAYS,
  normaliseTotpCode,
  safeAdminNext,
} from "./mfa.ts";

const DAY = 24 * 60 * 60;
const NOW = 1_800_000_000; // seconds

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

  it("trusts an authenticator code for 30 days, then asks again", () => {
    assert.equal(MFA_REMEMBER_DAYS, 30);
    const totp = (daysAgo: number) => [
      { method: "password", timestamp: NOW - daysAgo * DAY - 60 },
      { method: "totp", timestamp: NOW - daysAgo * DAY },
    ];
    assert.equal(effectiveAssurance("aal2", totp(0), NOW * 1000), "aal2");
    assert.equal(effectiveAssurance("aal2", totp(29), NOW * 1000), "aal2");
    assert.equal(effectiveAssurance("aal2", totp(30), NOW * 1000), "aal1");
    assert.equal(effectiveAssurance("aal2", totp(45), NOW * 1000), "aal1");
  });

  it("uses the newest code check when there are several", () => {
    const methods = [
      { method: "totp", timestamp: NOW - 40 * DAY },
      { method: "totp", timestamp: NOW - 2 * DAY },
    ];
    assert.equal(effectiveAssurance("aal2", methods, NOW * 1000), "aal2");
  });

  it("never treats a password-only or Google-only session as verified", () => {
    assert.equal(effectiveAssurance("aal1", [{ method: "password", timestamp: NOW }], NOW * 1000), "aal1");
    assert.equal(effectiveAssurance("aal2", [{ method: "password", timestamp: NOW }], NOW * 1000), "aal1");
    assert.equal(effectiveAssurance("aal2", ["totp"], NOW * 1000), "aal1");
    assert.equal(effectiveAssurance(null, null, NOW * 1000), "aal1");
  });
});
