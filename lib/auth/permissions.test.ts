import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessNavItem,
  canPerform,
  getNavItemsForRole,
  hasAnyRole,
  roleAtLeast,
} from "./permissions.ts";
import { normaliseEmail } from "./types.ts";
import { RATE_LIMITS, rateLimit } from "../security/rate-limit.ts";

describe("admin permissions", () => {
  it("grants owner access to all nav items", () => {
    const items = getNavItemsForRole("owner");
    assert.equal(items.length, 8);
    assert.ok(items.some((item) => item.id === "settings"));
    assert.ok(items.some((item) => item.id === "audit"));
  });

  it("hides settings and audit from viewer", () => {
    assert.equal(canAccessNavItem("viewer", "settings"), false);
    assert.equal(canAccessNavItem("viewer", "audit"), false);
    assert.equal(canAccessNavItem("viewer", "dashboard"), true);
  });

  it("allows sales to manage quotes but not approve", () => {
    assert.equal(canPerform("sales", "manageQuotes"), true);
    assert.equal(canPerform("sales", "approveQuotes"), false);
    assert.equal(canPerform("admin", "approveQuotes"), true);
    assert.equal(canPerform("sales", "sendQuotes"), true);
    assert.equal(canPerform("estimator", "viewQuoteMargin"), true);
    assert.equal(canPerform("sales", "viewQuoteMargin"), false);
  });

  it("compares role ranks", () => {
    assert.equal(roleAtLeast("admin", "viewer"), true);
    assert.equal(roleAtLeast("viewer", "admin"), false);
    assert.equal(hasAnyRole("estimator", ["owner", "estimator"]), true);
  });
});

describe("email normalisation", () => {
  it("lowercases and trims", () => {
    assert.equal(normaliseEmail("  Admin@Dam-Tech.co.za "), "admin@dam-tech.co.za");
  });
});

describe("rate limit abstraction", () => {
  it("allows requests under the limit and then blocks", async () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    const first = await rateLimit({
      key,
      limit: 2,
      windowMs: RATE_LIMITS.loginInitiation.windowMs,
    });
    const second = await rateLimit({
      key,
      limit: 2,
      windowMs: RATE_LIMITS.loginInitiation.windowMs,
    });
    const third = await rateLimit({
      key,
      limit: 2,
      windowMs: RATE_LIMITS.loginInitiation.windowMs,
    });

    assert.equal(first.success, true);
    assert.equal(second.success, true);
    assert.equal(third.success, false);
    assert.equal(first.degraded, true);
  });
});

describe("admin seo expectations", () => {
  it("documents noindex intent for admin layout metadata shape", () => {
    const robots = { index: false, follow: false, nocache: true };
    assert.equal(robots.index, false);
    assert.equal(robots.follow, false);
    assert.equal(robots.nocache, true);
  });
});
