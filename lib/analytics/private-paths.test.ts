import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPrivateTokenPath, isTrackablePath } from "./private-paths.ts";

describe("analytics path rules", () => {
  it("treats tokenised customer pages as private", () => {
    assert.equal(isPrivateTokenPath("/q/abc123/"), true);
    assert.equal(isPrivateTokenPath("/q/abc123/accepted/"), true);
    assert.equal(isPrivateTokenPath("/quote/info/tok/"), true);
    assert.equal(isPrivateTokenPath("/quote/RFQ-2026-0001/upload/"), true);
  });

  it("keeps public quote pages trackable", () => {
    assert.equal(isTrackablePath("/quote/"), true);
    assert.equal(isTrackablePath("/quote/success/"), true);
    assert.equal(isTrackablePath("/quote/fallback/"), true);
    assert.equal(isTrackablePath("/waterproofing/"), true);
  });

  it("excludes admin and auth routes", () => {
    assert.equal(isTrackablePath("/admin/"), false);
    assert.equal(isTrackablePath("/admin/rfqs/1/"), false);
    assert.equal(isTrackablePath("/auth/callback/"), false);
  });
});
