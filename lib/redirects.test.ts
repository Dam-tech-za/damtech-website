import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { redirects } from "./redirects.ts";

const pathRules = redirects.filter((r) => !r.has);
const literalSources = new Set(
  pathRules.filter((r) => !/[:({]/.test(r.source)).map((r) => r.source.replace(/\/$/, "")),
);

describe("legacy redirects", () => {
  it("never point at another literal redirect source (no chains)", () => {
    for (const rule of pathRules) {
      const dest = rule.destination.replace(/\/$/, "");
      if (/^https?:/.test(dest) || dest.includes(":")) continue;
      assert.ok(!literalSources.has(dest), `${rule.source} → ${rule.destination} is itself redirected`);
    }
  });

  it("are all permanent", () => {
    for (const rule of pathRules) {
      const permanent = "permanent" in rule ? rule.permanent : rule.statusCode === 301 || rule.statusCode === 308;
      assert.ok(permanent, `${rule.source} is not permanent`);
    }
  });

  it("cover the 404 URLs Search Console reported in the 2026-10-18 audit", () => {
    const sources = pathRules.map((r) => r.source);
    for (const expected of [
      "/10000-litre-fish-pond{/}?",
      "/HDPE-Dam-Lining-Geomembrane-Installation-South-Africa-Damtech{/}?",
      "/how-to-manage-dam-water-levels-during-prolonged-droughts-in-south-africa{/}?",
    ]) {
      assert.ok(sources.includes(expected), `missing redirect for ${expected}`);
    }
    assert.ok(sources.some((s) => s.includes("steel-water-storage-tangks")));
    assert.ok(sources.some((s) => s.includes("dam-tech-co-za")));
  });
});
