import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeFieldCompletion,
  isEmptyDraft,
  mapCategoryToService,
  mergeField,
  pickByPriority,
} from "./project-autofill.ts";

describe("project autofill", () => {
  it("picks the first non-empty candidate by priority", () => {
    assert.equal(pickByPriority("", "  ", "RFQ title", "Template"), "RFQ title");
    assert.equal(pickByPriority(null, undefined, ""), "");
    assert.equal(pickByPriority("Manual", "RFQ"), "Manual");
  });

  it("maps category to a fallback service", () => {
    assert.equal(mapCategoryToService("Dam lining"), "HDPE dam lining");
    assert.equal(mapCategoryToService("Steel tanks"), "Corrugated steel reservoir");
    assert.equal(mapCategoryToService("Unknown"), "");
    assert.equal(mapCategoryToService(null), "");
  });

  it("detects an empty draft", () => {
    assert.equal(
      isEmptyDraft({
        title: "",
        projectDescription: "",
        scopeSummary: "",
        lines: [
          { lineType: "heading", description: "Materials", sellUnitPrice: 0 },
          { lineType: "custom", description: "", sellUnitPrice: 0, itemCode: "" },
        ],
      }),
      true,
    );
  });

  it("treats a quote with a title as non-empty", () => {
    assert.equal(
      isEmptyDraft({
        title: "Existing",
        projectDescription: "",
        scopeSummary: "",
        lines: [],
      }),
      false,
    );
  });

  it("treats a quote with a priced line as non-empty", () => {
    assert.equal(
      isEmptyDraft({
        title: "",
        projectDescription: "",
        scopeSummary: "",
        lines: [{ lineType: "material", description: "Liner", sellUnitPrice: 92 }],
      }),
      false,
    );
  });

  it("merges fields per strategy", () => {
    assert.equal(mergeField("Old", "New", "replace"), "New");
    assert.equal(mergeField("Old", "New", "fill_blank"), "Old");
    assert.equal(mergeField("", "New", "fill_blank"), "New");
    assert.equal(mergeField("Old", "New", "append"), "Old\nNew");
    assert.equal(mergeField("", "New", "append"), "New");
  });

  it("computes field completion and missing required", () => {
    const fields = [
      { fieldKey: "a", isRecommended: true, isRequired: false },
      { fieldKey: "b", isRecommended: false, isRequired: true },
      { fieldKey: "c", isRecommended: true, isRequired: false },
    ];
    const result = computeFieldCompletion(fields, { a: "yes", b: "" });
    assert.equal(result.total, 3);
    assert.equal(result.completed, 1);
    assert.deepEqual(result.missingRequired, ["b"]);
  });
});
