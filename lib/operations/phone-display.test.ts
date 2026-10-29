import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { displayPhone, splitPhone } from "./phone-display.ts";

describe("phone display", () => {
  it("knows the country from the calling code", () => {
    assert.equal(displayPhone("+27749217000")?.country, "ZA");
    assert.equal(displayPhone("0749217000")?.country, "ZA");
    assert.equal(displayPhone("+264811234567")?.country, "NA");
    assert.equal(displayPhone("+447700900123")?.country, "GB");
    assert.equal(displayPhone("12345")?.country ?? null, null);
  });

  it("splits a number into country code and the rest", () => {
    assert.deepEqual(splitPhone("+27749217000"), { code: "+27", national: "74 921 7000" });
    assert.deepEqual(splitPhone("074 921 7000"), { code: "+27", national: "74 921 7000" });
    assert.deepEqual(splitPhone(""), { code: "+27", national: "" });
    assert.equal(splitPhone("+264811234567").code, "+264");
  });
});
