import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normaliseResetEmail,
  resetLinkOrigin,
  validateNewPassword,
} from "./password-policy.ts";

const CANONICAL = "https://www.dam-tech.co.za";

describe("new admin password rules", () => {
  it("accepts a long password with letters and numbers that matches", () => {
    assert.equal(validateNewPassword("Dams4Days2026", "Dams4Days2026"), null);
  });

  it("rejects empty, short, letter-only, number-only and repeated passwords", () => {
    assert.match(validateNewPassword("", "") ?? "", /Enter a new password/);
    assert.match(validateNewPassword("abc123", "abc123") ?? "", /at least 10/);
    assert.match(validateNewPassword("onlyletters", "onlyletters") ?? "", /letter and one number/);
    assert.match(validateNewPassword("1234567890", "1234567890") ?? "", /letter and one number/);
    assert.match(validateNewPassword("a".repeat(80), "a".repeat(80)) ?? "", /no more than 72/);
  });

  it("requires the confirmation to match", () => {
    assert.match(validateNewPassword("Dams4Days2026", "Dams4Days2027") ?? "", /do not match/);
  });
});

describe("password reset email and link origin", () => {
  it("normalises and validates the email", () => {
    assert.equal(normaliseResetEmail("  Info@Dam-Tech.co.za "), "info@dam-tech.co.za");
    assert.equal(normaliseResetEmail("not-an-email"), null);
    assert.equal(normaliseResetEmail(""), null);
  });

  it("only builds reset links on Damtech hosts or local development", () => {
    assert.equal(resetLinkOrigin("https://www.dam-tech.co.za", CANONICAL), CANONICAL);
    assert.equal(
      resetLinkOrigin("https://damtech-website-abc123-damtech.vercel.app", CANONICAL),
      "https://damtech-website-abc123-damtech.vercel.app",
    );
    assert.equal(resetLinkOrigin("http://localhost:3000", CANONICAL), "http://localhost:3000");
    assert.equal(resetLinkOrigin("https://evil.example", CANONICAL), CANONICAL);
    assert.equal(resetLinkOrigin("https://www.dam-tech.co.za.evil.example", CANONICAL), CANONICAL);
    assert.equal(resetLinkOrigin("http://www.dam-tech.co.za", CANONICAL), CANONICAL);
    assert.equal(resetLinkOrigin(null, CANONICAL), CANONICAL);
    assert.equal(resetLinkOrigin("garbage", CANONICAL), CANONICAL);
  });
});
