/**
 * Hand-checked reference cases for the public calculator hub (/calculators/).
 * Every expected number below was worked out independently on paper; the
 * derivations are recorded in docs/qa/03-calculator-reference-cases.md.
 * These tests lock the formulas so a refactor cannot silently change results.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateCalculator,
  type CalculatorOutput,
  type CalculatorResult,
} from "./calculators-logic.ts";

function ok(out: CalculatorOutput): CalculatorResult {
  assert.ok(!("error" in out), `expected a result, got ${JSON.stringify(out)}`);
  return out as CalculatorResult;
}

/** "1 431,8 m²" (en-ZA, non-breaking space grouping, comma decimal) → 1431.8 */
function num(text: string | number | undefined): number {
  const match = String(text).replace(/[\s  ]/g, "").match(/-?\d+(?:,\d+)?/);
  assert.ok(match, `no number in ${text}`);
  return Number(match[0].replace(",", "."));
}

function fieldErrors(out: CalculatorOutput): string[] {
  assert.ok("error" in out, "expected a validation error");
  return Object.keys(out.fieldErrors ?? {});
}

describe("dam lining area", () => {
  const base = {
    topLength: 42, topWidth: 32, bottomLength: 30, bottomWidth: 20, depth: 3,
    sideSlope: 2, freeboard: 0, overlap: 0, anchorTrench: 0, wastage: 0,
  };

  it("matches trapezoidal-face geometry for a consistent 1:2 basin", () => {
    const r = ok(calculateCalculator("dam-lining-area", base)).values;
    assert.equal(num(r["Base area"]), 600);
    assert.equal(num(r["Side slope area"]), 831.8); // 2·(36+26)·√45
    assert.equal(num(r["Total liner area"]), 1431.8);
  });

  it("adds overlap, anchor trench and wastage on the top perimeter", () => {
    const r = ok(calculateCalculator("dam-lining-area", { ...base, overlap: 0.5, anchorTrench: 1, wastage: 10 })).values;
    assert.equal(num(r["Estimated material area (incl. overlap & wastage)"]), 1819.2);
  });

  it("handles vertical walls (slope 0)", () => {
    const r = ok(calculateCalculator("dam-lining-area", { ...base, topLength: 10, topWidth: 10, bottomLength: 10, bottomWidth: 10, depth: 2, sideSlope: 0 })).values;
    assert.equal(num(r["Total liner area"]), 180);
  });

  it("rejects negatives, zero depth, wastage above 40 % and bottom wider than top", () => {
    assert.deepEqual(fieldErrors(calculateCalculator("dam-lining-area", { ...base, depth: 0 })), ["depth"]);
    assert.deepEqual(fieldErrors(calculateCalculator("dam-lining-area", { ...base, overlap: -1 })), ["overlap"]);
    assert.deepEqual(fieldErrors(calculateCalculator("dam-lining-area", { ...base, wastage: 41 })), ["wastage"]);
    assert.deepEqual(fieldErrors(calculateCalculator("dam-lining-area", { ...base, bottomWidth: 40 })), ["bottomWidth"]);
    assert.ok(fieldErrors(calculateCalculator("dam-lining-area", { ...base, topLength: "abc" })).includes("topLength"));
  });
});

describe("HDPE / PVC material", () => {
  const base = { topLength: 50, topWidth: 40, depth: 4, materialType: "hdpe", thickness: "", overlap: 0, anchorTrench: 0.5 };

  it("uses the conservative flat-sheet envelope and 7 m HDPE rolls", () => {
    const r = ok(calculateCalculator("hdpe-pvc-material", base)).values;
    assert.equal(num(r["Total area (m²)"]), 2891); // (50+8+1)·(40+8+1)
    assert.match(String(r["Estimated roll coverage"]), /approximately 7 roll widths of 7 m/);
  });

  it("uses 4 m PVC rolls", () => {
    const r = ok(calculateCalculator("hdpe-pvc-material", { ...base, materialType: "pvc" })).values;
    assert.match(String(r["Estimated roll coverage"]), /approximately 13 roll widths of 4 m/);
  });

  it("rejects thickness above 3 mm and unknown materials", () => {
    assert.deepEqual(fieldErrors(calculateCalculator("hdpe-pvc-material", { ...base, thickness: 4 })), ["thickness"]);
    assert.deepEqual(fieldErrors(calculateCalculator("hdpe-pvc-material", { ...base, materialType: "epdm" })), ["materialType"]);
  });
});

describe("steel tank size", () => {
  it("multiplies daily demand × backup days × safety factor and rounds up to a band", () => {
    const r = ok(calculateCalculator("steel-tank-size", { dailyRequirement: 5000, backupDays: 14, safetyFactor: 1.2, tankType: "corrugated" })).values;
    assert.equal(num(r["Recommended storage volume (litres)"]), 84000);
    assert.equal(num(r["Recommended storage volume (m³)"]), 84);
    assert.match(String(r["Suggested tank size band"]), /at least 100 kL/);
  });

  it("switches to high-volume guidance above 1 000 kL", () => {
    const r = ok(calculateCalculator("steel-tank-size", { dailyRequirement: 50000, backupDays: 30, safetyFactor: 1, tankType: "unsure" })).values;
    assert.match(String(r["Suggested tank size band"]), /High-volume storage above 1,000 kL/);
  });

  it("rejects 0 backup days and a safety factor below 1", () => {
    assert.deepEqual(fieldErrors(calculateCalculator("steel-tank-size", { dailyRequirement: 1000, backupDays: 0, safetyFactor: 1.2, tankType: "corrugated" })), ["backupDays"]);
    assert.deepEqual(fieldErrors(calculateCalculator("steel-tank-size", { dailyRequirement: 1000, backupDays: 7, safetyFactor: 0.9, tankType: "corrugated" })), ["safetyFactor"]);
  });
});

describe("water demand calculators", () => {
  it("annual requirement = daily litres × days", () => {
    const r = ok(calculateCalculator("annual-water-requirement", { dailyDemand: 2000, daysPerYear: 365, usageType: "farm" })).values;
    assert.equal(num(r["Annual requirement (litres)"]), 730000);
    assert.equal(num(r["Annual requirement (m³)"]), 730);
  });

  it("land size: ha × default intensity × seasonal factor", () => {
    const r = ok(calculateCalculator("water-by-land-size", { landSize: 2, useCase: "irrigation", seasonalFactor: 1 })).values;
    assert.equal(num(r["Annual estimate"]), 13000);
    assert.equal(num(r["Monthly estimate"]), 1083.3);
    assert.equal(num(r["Daily estimate"]), 35.6);
  });

  it("irrigation: 1 mm over 1 ha = 10 m³, gross = net ÷ efficiency", () => {
    const r = ok(calculateCalculator("irrigation-water", { cropType: "general", area: 10, effectiveRainfall: 150, irrigationEfficiency: 80, irrigationPeriod: 180 })).values;
    assert.equal(num(r["Net irrigation requirement"]), 50000);
    assert.equal(num(r["Gross irrigation requirement"]), 62500);
    assert.equal(num(r["m³ per hectare"]), 6250);
  });

  it("irrigation never goes negative when rainfall exceeds ETc", () => {
    const r = ok(calculateCalculator("irrigation-water", { cropType: "general", area: 1, effectiveRainfall: 900, irrigationEfficiency: 80, irrigationPeriod: 100 })).values;
    assert.equal(num(r["Net irrigation requirement"]), 0);
  });

  it("rainwater: m² × mm = litres, × runoff coefficient", () => {
    const r = ok(calculateCalculator("rainwater-harvesting", { catchmentArea: 200, annualRainfall: 600, runoffCoefficient: 0.85, storageDays: 30 })).values;
    assert.equal(num(r["Annual harvestable water"]), 102000);
    assert.equal(num(r["Estimated storage requirement"]), 8384); // 102 000 ÷ 365 × 30
  });

  it("rejects a runoff coefficient above 1", () => {
    assert.deepEqual(fieldErrors(calculateCalculator("rainwater-harvesting", { catchmentArea: 200, annualRainfall: 600, runoffCoefficient: 1.2, storageDays: 30 })), ["runoffCoefficient"]);
  });
});

describe("waterproofing area", () => {
  it("adds perimeter upstands, then layers × overlap × wastage", () => {
    const r = ok(calculateCalculator("waterproofing-area", { length: 10, width: 8, layers: 1, upstandHeight: 0.3, overlap: 10, wastage: 5 })).values;
    assert.equal(num(r["Waterproofing area"]), 90.8);
    assert.equal(num(r["Estimated material area"]), 104.9);
  });

  it("rejects 0 layers and upstands above 3 m", () => {
    assert.deepEqual(fieldErrors(calculateCalculator("waterproofing-area", { length: 10, width: 8, layers: 0, upstandHeight: 0.3, overlap: 10, wastage: 5 })), ["layers"]);
    assert.deepEqual(fieldErrors(calculateCalculator("waterproofing-area", { length: 10, width: 8, layers: 1, upstandHeight: 4, overlap: 10, wastage: 5 })), ["upstandHeight"]);
  });
});

describe("decision helpers", () => {
  it("leaking dam: high loss + wet patches is always High urgency", () => {
    const r = ok(calculateCalculator("leaking-dam-repair", { waterLossRate: "high", wetPatches: "yes" })).values;
    assert.equal(r["Urgency level"], "High");
  });

  it("leaking dam: low loss, no damage, lined, emptyable, good access is Low", () => {
    const r = ok(calculateCalculator("leaking-dam-repair", { waterLossRate: "low", visibleDamage: "no", wetPatches: "no", existingLiner: "hdpe", canEmpty: "yes", accessCondition: "good" })).values;
    assert.equal(r["Urgency level"], "Low");
  });

  it("project budget readiness reaches 'Ready' only with location, size and photos", () => {
    const ready = ok(calculateCalculator("project-budget", { siteLocation: "Bela-Bela", damSize: "40 x 30 x 3 m", serviceRequired: "dam-lining", existingLiner: "no", accessCondition: "good", photosAvailable: "yes" })).values;
    assert.equal(ready["Quote readiness"], "Ready to request a quote");
    const thin = ok(calculateCalculator("project-budget", { serviceRequired: "dam-lining", accessCondition: "difficult" })).values;
    assert.equal(thin["Quote readiness"], "More information needed");
  });

  it("unknown calculator id returns an error, not a crash", () => {
    assert.ok("error" in calculateCalculator("nope", {}));
  });
});
