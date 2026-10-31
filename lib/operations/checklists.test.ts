import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { READINESS_PREFIX, checklistFamily, checklistTasks, isReadinessTask } from "./checklists.ts";

describe("service checklists", () => {
  it("picks a family per service and none for supply", () => {
    assert.equal(checklistFamily("hdpe_dam_lining"), "geomembrane");
    assert.equal(checklistFamily("steel_reservoir"), "steel");
    assert.equal(checklistFamily("roof_waterproofing"), "waterproofing");
    assert.equal(checklistFamily("material_supply"), null);
  });
  it("adds readiness items as tasks with a prefix and skips ones already there", () => {
    const first = checklistTasks("readiness", "steel", []);
    assert.ok(first.length > 3);
    assert.ok(first.every((t) => t.kind === "task" && isReadinessTask(t.title)));
    const again = checklistTasks("readiness", "steel", first.map((t) => t.title.toUpperCase()));
    assert.equal(again.length, 0);
  });
  it("uses quality and handover task kinds", () => {
    assert.ok(checklistTasks("quality", "geomembrane", []).every((t) => t.kind === "quality"));
    assert.ok(checklistTasks("handover", "liner", []).every((t) => t.kind === "handover" && !t.title.startsWith(READINESS_PREFIX)));
  });
  it("does not prescribe test values", () => {
    const all = (["geomembrane", "liner", "steel", "waterproofing"] as const).flatMap((f) => checklistTasks("quality", f, []).map((t) => t.title));
    assert.ok(all.every((t) => !/\d+\s*(kpa|bar|psi|°c|mm\/|kn)/i.test(t)));
  });
});
