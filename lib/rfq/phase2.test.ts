import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Phase 2 quantity / suggestion logic inlined for Node strip-types tests.
 */

type Asset = {
  asset_type: string;
  quantity?: number;
  measurement_status?: string | null;
  measurement_method?: string | null;
  calculated_outputs?: Record<string, unknown> | null;
  confirmed_material_area_m2?: number | null;
  confirmed_installation_area_m2?: number | null;
  confirmed_capacity_kl?: number | null;
  estimator_confirmed?: boolean | null;
};

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function summarise(assets: Asset[]) {
  const summary = {
    liningMaterialM2: 0,
    liningInstallM2: 0,
    torchOnM2: 0,
    steelCapacityKL: 0,
  };
  for (const asset of assets) {
    const out = (asset.calculated_outputs ?? {}) as Record<string, unknown>;
    const material =
      num(asset.confirmed_material_area_m2) ??
      num(out.materialAreaM2) ??
      num(out.provisionalMaterialAreaM2);
    const install =
      num(asset.confirmed_installation_area_m2) ??
      num(out.installationAreaM2);
    const capacity =
      num(asset.confirmed_capacity_kl) ??
      num(out.totalGrossCapacityKL) ??
      num(out.grossCapacityKL);

    if (asset.asset_type === "corrugated_steel_tank") {
      if (capacity != null) summary.steelCapacityKL += capacity;
      continue;
    }
    if (asset.asset_type === "torch_on") {
      if (install != null) summary.torchOnM2 += install;
      else if (material != null) summary.torchOnM2 += material;
      continue;
    }
    if (material != null) summary.liningMaterialM2 += material;
    if (install != null) summary.liningInstallM2 += install;
  }
  return summary;
}

function suggest(assets: Asset[], travelKm = 0, trips = 1) {
  const summary = summarise(assets);
  const lines: Array<{ code: string; qty: number; unit: string; priceRequired: boolean }> =
    [];
  if (summary.liningMaterialM2 > 0) {
    lines.push({
      code: "HDPE-MAT",
      qty: summary.liningMaterialM2,
      unit: "m²",
      priceRequired: true,
    });
  }
  if (summary.liningInstallM2 > 0) {
    lines.push({
      code: "HDPE-INSTALL",
      qty: summary.liningInstallM2,
      unit: "m²",
      priceRequired: true,
    });
  }
  const tanks = assets.filter((a) => a.asset_type === "corrugated_steel_tank");
  if (tanks.length) {
    const qty = tanks.reduce((s, a) => s + Math.max(1, a.quantity ?? 1), 0);
    lines.push({
      code: "STEEL-TANK",
      qty,
      unit: "each",
      priceRequired: true,
    });
  }
  if (summary.torchOnM2 > 0) {
    lines.push({
      code: "TORCH-3MM",
      qty: summary.torchOnM2,
      unit: "m²",
      priceRequired: true,
    });
  }
  if (travelKm > 0) {
    lines.push({
      code: "TRAVEL",
      qty: travelKm * trips,
      unit: "km",
      priceRequired: true,
    });
  }
  return lines;
}

describe("admin rfq phase 2 quantities", () => {
  it("keeps heterogeneous provisional quantities separate", () => {
    const summary = summarise([
      {
        asset_type: "earth_dam",
        calculated_outputs: {
          materialAreaM2: 1540,
          installationAreaM2: 1400,
        },
      },
      {
        asset_type: "torch_on",
        calculated_outputs: { installationAreaM2: 270 },
      },
      {
        asset_type: "corrugated_steel_tank",
        calculated_outputs: { totalGrossCapacityKL: 119 },
      },
    ]);
    assert.equal(summary.liningMaterialM2, 1540);
    assert.equal(summary.steelCapacityKL, 119);
    assert.equal(summary.torchOnM2, 270);
  });

  it("does not equate material and installation areas", () => {
    const summary = summarise([
      {
        asset_type: "earth_dam",
        confirmed_material_area_m2: 1100,
        confirmed_installation_area_m2: 1000,
      },
    ]);
    assert.notEqual(summary.liningMaterialM2, summary.liningInstallM2);
  });

  it("flags price gaps on suggested lines", () => {
    const lines = suggest(
      [
        {
          asset_type: "earth_dam",
          calculated_outputs: {
            materialAreaM2: 500,
            installationAreaM2: 480,
          },
        },
      ],
      40,
      2,
    );
    assert.ok(lines.some((l) => l.code === "HDPE-MAT" && l.qty === 500));
    assert.ok(lines.some((l) => l.code === "TRAVEL" && l.qty === 80));
    assert.ok(lines.every((l) => l.priceRequired));
  });

  it("suggests steel tanks without mixing HDPE material lines", () => {
    const lines = suggest([
      {
        asset_type: "corrugated_steel_tank",
        quantity: 2,
        calculated_outputs: { totalGrossCapacityKL: 100 },
      },
    ]);
    assert.ok(lines.some((l) => l.code === "STEEL-TANK" && l.qty === 2));
    assert.ok(!lines.some((l) => l.code === "HDPE-MAT"));
  });
});
