import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canPerform } from "../auth/permissions.ts";

describe("rfq permission gates", () => {
  it("allows estimators to manage RFQs but not allowlist", () => {
    assert.equal(canPerform("estimator", "manageRfqs"), true);
    assert.equal(canPerform("estimator", "manageAllowlist"), false);
    assert.equal(canPerform("viewer", "manageRfqs"), false);
    assert.equal(canPerform("sales", "exportRfqs"), true);
  });
});
