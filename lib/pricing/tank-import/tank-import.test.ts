import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TANK_CANONICAL_HEADERS,
  autoMapTankHeaders,
  summariseTankMapping,
} from "./columns.ts";
import {
  buildTankCode,
  computeGeometry,
  computeNominalCapacityKl,
  expectedRingCount,
  pricePerUsableKl,
} from "./geometry.ts";
import { validateTankRow } from "./validate.ts";
import { suggestTankModels } from "./matching.ts";
import { buildTankImportPreview } from "./preview.ts";
import {
  buildStarterTankRows,
  buildTankStarterCsv,
  buildTankTemplateCsv,
} from "./starter.ts";

function rowFrom(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    tank_code: "TNK-08M-23H-3R",
    model_name: "8 m diameter tank",
    diameter_m: "8",
    height_m: "2.3",
    ring_count: "3",
    nominal_capacity_kl: "115.6",
    usable_capacity_kl: "104",
    steel_tank_sell_ex_vat_zar: "19550",
    pvc_liner_sell_ex_vat_zar: "18500",
    is_active: "true",
    ...overrides,
  };
}

describe("autoMapTankHeaders", () => {
  it("maps every canonical header (32 of 32)", () => {
    const result = autoMapTankHeaders([...TANK_CANONICAL_HEADERS]);
    assert.equal(result.totalColumns, 32);
    assert.equal(result.matchedCount, 32);
    assert.equal(result.autoAcceptedCount, 32);
    assert.equal(result.requiresAttention, false);
    assert.deepEqual(result.missingRequired, []);
  });

  it("resolves supplier aliases", () => {
    const result = autoMapTankHeaders([
      "code",
      "model",
      "diameter",
      "height",
      "rings",
      "capacity",
      "tank_price",
    ]);
    assert.equal(result.mapping.code, "tank_code");
    assert.equal(result.mapping.model, "model_name");
    assert.equal(result.mapping.diameter, "diameter_m");
    assert.equal(result.mapping.rings, "ring_count");
    assert.equal(result.mapping.capacity, "nominal_capacity_kl");
    assert.equal(result.mapping.tank_price, "steel_tank_sell_ex_vat_zar");
  });

  it("flags missing required fields", () => {
    const result = autoMapTankHeaders(["model_name", "diameter_m"]);
    assert.equal(result.requiresAttention, true);
    assert.ok(result.missingRequired.includes("tank_code"));
  });

  it("summariseTankMapping recomputes counters after override", () => {
    const mapping = { foo: "tank_code" as const, bar: "" as const };
    const summary = summariseTankMapping(mapping, ["foo", "bar"]);
    assert.equal(summary.matchedCount, 1);
    assert.deepEqual(summary.unmatchedHeaders, ["bar"]);
  });
});

describe("geometry", () => {
  it("computes cylindrical capacity", () => {
    assert.equal(computeNominalCapacityKl(3, 2.3), 16.3);
  });
  it("maps ring counts for the starter catalogue", () => {
    assert.equal(expectedRingCount(1.5), 2);
    assert.equal(expectedRingCount(2.3), 3);
    assert.equal(expectedRingCount(3.0), 4);
    assert.equal(expectedRingCount(4), null);
  });
  it("computes tank codes", () => {
    assert.equal(buildTankCode(3, 1.5, 2), "TNK-03M-15H-2R");
    assert.equal(buildTankCode(13, 2.3, 3), "TNK-13M-23H-3R");
    assert.equal(buildTankCode(15, 3.0, 4), "TNK-15M-30H-4R");
  });
  it("computes liner area and R/kL", () => {
    const g = computeGeometry(8, 2.3);
    assert.ok(g.linerAreaM2 > 0);
    assert.equal(pricePerUsableKl(20000, 100), 200);
    assert.equal(pricePerUsableKl(20000, 0), null);
  });
});

describe("validateTankRow", () => {
  it("accepts a complete row", () => {
    const result = validateTankRow(rowFrom(), 2, new Set());
    assert.notEqual(result.status, "invalid");
    assert.equal(result.data?.tank_code, "TNK-08M-23H-3R");
    assert.ok((result.data?.combined_price_per_usable_kl ?? 0) > 0);
  });

  it("errors when usable exceeds nominal", () => {
    const result = validateTankRow(
      rowFrom({ usable_capacity_kl: "200" }),
      2,
      new Set(),
    );
    assert.equal(result.status, "invalid");
    assert.ok(result.errors.some((e) => e.includes("cannot exceed nominal")));
  });

  it("warns on ring/height mismatch", () => {
    const result = validateTankRow(rowFrom({ ring_count: "5" }), 2, new Set());
    assert.ok(result.warnings.some((w) => w.includes("ring_count")));
  });

  it("warns when nominal capacity is outside tolerance", () => {
    const result = validateTankRow(
      rowFrom({ nominal_capacity_kl: "300" }),
      2,
      new Set(),
    );
    assert.ok(result.warnings.some((w) => w.includes("differs from calculated")));
  });

  it("flags missing PVC liner price as manual confirmation", () => {
    const result = validateTankRow(
      rowFrom({ pvc_liner_sell_ex_vat_zar: "0" }),
      2,
      new Set(),
    );
    assert.equal(result.status, "manual_confirmation");
    assert.ok(result.warnings.some((w) => w.includes("PVC liner price required")));
    assert.equal(result.data?.requires_manual_confirmation, true);
  });

  it("requires steel sell price", () => {
    const result = validateTankRow(
      rowFrom({ steel_tank_sell_ex_vat_zar: "" }),
      2,
      new Set(),
    );
    assert.equal(result.status, "invalid");
  });

  it("rejects invalid dates and reversed validity", () => {
    assert.ok(
      validateTankRow(rowFrom({ price_date: "21/07/2026" }), 2, new Set()).errors.some((e) =>
        e.includes("ISO"),
      ),
    );
    const reversed = validateTankRow(
      rowFrom({ valid_from: "2026-12-31", valid_to: "2026-01-01" }),
      2,
      new Set(),
    );
    assert.ok(reversed.errors.some((e) => e.includes("valid_to")));
  });

  it("detects in-file duplicate codes", () => {
    const seen = new Set<string>();
    validateTankRow(rowFrom(), 2, seen);
    const dup = validateTankRow(rowFrom(), 3, seen);
    assert.equal(dup.status, "invalid");
    assert.ok(dup.errors.some((e) => e.includes("Duplicate tank_code")));
  });
});

describe("starter catalogue", () => {
  const rows = buildStarterTankRows();

  it("produces 39 models (13 diameters × 3 heights)", () => {
    assert.equal(rows.length, 39);
    const codes = new Set(rows.map((r) => r.tank_code));
    assert.equal(codes.size, 39);
  });

  it("every starter row validates without errors", () => {
    const seen = new Set<string>();
    for (const row of rows) {
      const raw = Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, String(v)]),
      );
      const result = validateTankRow(raw, 2, seen);
      assert.notEqual(result.status, "invalid", `${row.tank_code}: ${result.errors.join(", ")}`);
    }
  });

  it("keeps steel prices near reviewed 2.3 m anchors", () => {
    const find = (code: string) => rows.find((r) => r.tank_code === code)!;
    const d3 = Number(find("TNK-03M-23H-3R").steel_tank_sell_ex_vat_zar);
    const d8 = Number(find("TNK-08M-23H-3R").steel_tank_sell_ex_vat_zar);
    const d13 = Number(find("TNK-13M-23H-3R").steel_tank_sell_ex_vat_zar);
    assert.ok(Math.abs(d3 - 8500) / 8500 < 0.1, `d3=${d3}`);
    assert.ok(Math.abs(d8 - 18400) / 18400 < 0.1, `d8=${d8}`);
    assert.ok(Math.abs(d13 - 47000) / 47000 < 0.1, `d13=${d13}`);
  });

  it("stores steel and liner prices separately and totals them", () => {
    for (const row of rows) {
      const steel = Number(row.steel_tank_sell_ex_vat_zar);
      const liner = Number(row.pvc_liner_sell_ex_vat_zar);
      assert.equal(Number(row.total_sell_ex_vat_zar), steel + liner);
    }
  });

  it("flags every starter row for manual confirmation", () => {
    assert.ok(rows.every((r) => r.requires_manual_confirmation === true));
  });
});

describe("suggestTankModels (RFQ capacity matching)", () => {
  const models = [
    { id: "a", usableCapacityKl: 15, isActive: true },
    { id: "b", usableCapacityKl: 60, isActive: true },
    { id: "c", usableCapacityKl: 104, isActive: true },
    { id: "d", usableCapacityKl: 150, isActive: true },
    { id: "x", usableCapacityKl: 200, isActive: false },
  ];

  it("suggests smallest adequate plus one below and one above", () => {
    const result = suggestTankModels(models, 100);
    assert.deepEqual(
      result.map((r) => `${r.model.id}:${r.role}`),
      ["b:below", "c:match", "d:above"],
    );
  });

  it("computes delta percent vs required", () => {
    const result = suggestTankModels(models, 100);
    const match = result.find((r) => r.role === "match")!;
    assert.equal(match.deltaPercent, 4);
  });

  it("ignores inactive models", () => {
    const result = suggestTankModels(models, 160);
    assert.equal(result[0]?.model.id, "d");
    assert.equal(result[0]?.role, "below");
  });
});

describe("buildTankImportPreview", () => {
  it("auto-maps the starter CSV and finds 39 valid rows", () => {
    const preview = buildTankImportPreview(buildTankStarterCsv());
    assert.equal(preview.summary.rowsFound, 39);
    assert.equal(preview.summary.fieldsMatched, 32);
    assert.equal(preview.summary.invalidRows, 0);
    assert.equal(preview.autoMap.requiresAttention, false);
  });

  it("marks existing tank codes as duplicates (idempotent re-import)", () => {
    const existing = new Set(buildStarterTankRows().map((r) => String(r.tank_code)));
    const preview = buildTankImportPreview(buildTankStarterCsv(), { existingCodes: existing });
    assert.equal(preview.summary.duplicates, 39);
    assert.equal(preview.summary.invalidRows, 0);
  });

  it("template CSV parses to a single example row", () => {
    const preview = buildTankImportPreview(buildTankTemplateCsv());
    assert.equal(preview.summary.rowsFound, 1);
    assert.equal(preview.rows[0]?.data?.tank_code, "TNK-03M-23H-3R");
  });
});
