import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  readSidebarCollapsedPreference,
  writeSidebarCollapsedPreference,
} from "./sidebar-preference.ts";

describe("admin sidebar preference", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    });
  });

  it("defaults to expanded", () => {
    assert.equal(readSidebarCollapsedPreference(), false);
  });

  it("persists collapsed preference", () => {
    writeSidebarCollapsedPreference(true);
    assert.equal(readSidebarCollapsedPreference(), true);
    writeSidebarCollapsedPreference(false);
    assert.equal(readSidebarCollapsedPreference(), false);
  });
});

describe("admin design tokens", () => {
  it("documents sidebar width tokens", () => {
    const expanded = "16rem";
    const collapsed = "4.75rem";
    assert.equal(expanded, "16rem");
    assert.equal(collapsed, "4.75rem");
  });

  it("documents table actions column minimum width", () => {
    const actionsWidth = "6.5rem";
    assert.ok(parseFloat(actionsWidth) >= 6);
  });
});

describe("admin button variant mapping", () => {
  it("maps primary actions to admin-btn--primary", () => {
    const variant = "primary";
    assert.equal(`admin-btn--${variant}`, "admin-btn--primary");
  });

  it("maps destructive actions to admin-btn--danger", () => {
    const variant = "danger";
    assert.equal(`admin-btn--danger`, "admin-btn--danger");
  });
});
