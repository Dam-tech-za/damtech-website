import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDashboardRange } from "./types.ts";

describe("dashboard range parsing", () => {
  it("defaults to 30d", () => {
    assert.equal(parseDashboardRange(undefined), "30d");
    assert.equal(parseDashboardRange("nope"), "30d");
  });

  it("accepts known range ids", () => {
    assert.equal(parseDashboardRange("7d"), "7d");
    assert.equal(parseDashboardRange("month"), "month");
    assert.equal(parseDashboardRange(["ytd"]), "ytd");
  });
});
