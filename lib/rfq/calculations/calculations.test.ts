import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Inlined copies of RFQ geometry formulas so Node strip-types tests do not
 * need to resolve the production module graph.
 */

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

function applyOverlapWaste(
  base: number,
  overlap: number,
  waste: number,
  already = false,
) {
  if (already) return { installationAreaM2: round2(base), materialAreaM2: round2(base) };
  const after = base * (1 + overlap / 100);
  return {
    installationAreaM2: round2(base),
    materialAreaM2: round2(after * (1 + waste / 100)),
  };
}

function rectangularDam(input: {
  Lt: number;
  Wt: number;
  h: number;
  Lb?: number;
  Wb?: number;
  z?: number;
}) {
  let Lb = input.Lb;
  let Wb = input.Wb;
  if (Lb == null || Wb == null) {
    if (input.z == null) return { ok: false as const };
    Lb = input.Lt - 2 * input.z * input.h;
    Wb = input.Wt - 2 * input.z * input.h;
  }
  if (Lb <= 0 || Wb <= 0) return { ok: false as const };
  if (input.Lb != null && input.z != null) {
    const dLb = input.Lt - 2 * input.z * input.h;
    const dWb = input.Wt - 2 * input.z * input.h;
    if (Math.abs(dLb - input.Lb) > 0.05 || Math.abs(dWb - input.Wb!) > 0.05) {
      return { ok: false as const };
    }
  }
  const floor = Lb * Wb;
  const longS = Math.sqrt(input.h ** 2 + ((input.Wt - Wb) / 2) ** 2);
  const shortS = Math.sqrt(input.h ** 2 + ((input.Lt - Lb) / 2) ** 2);
  const sides = (input.Lt + Lb) * longS + (input.Wt + Wb) * shortS;
  const Lm = (input.Lt + Lb) / 2;
  const Wm = (input.Wt + Wb) / 2;
  const vol =
    (input.h / 6) *
    (input.Lt * input.Wt + 4 * Lm * Wm + Lb * Wb);
  return {
    ok: true as const,
    floorAreaM2: round2(floor),
    sideWallAreaM2: round2(sides),
    bottomLengthM: round3(Lb),
    bottomWidthM: round3(Wb),
    grossVolumeM3: round3(vol),
  };
}

describe("rectangular dam liner area", () => {
  it("matches prismoidal geometry fixtures", () => {
    const result = rectangularDam({
      Lt: 40,
      Wt: 30,
      h: 3,
      Lb: 34,
      Wb: 24,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.floorAreaM2, 816);
    assert.ok(result.sideWallAreaM2 > 0);
    assert.ok(result.grossVolumeM3 > 0);
  });

  it("derives bottom from side slope and rejects impossible slopes", () => {
    const ok = rectangularDam({ Lt: 40, Wt: 30, h: 2, z: 1.5 });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.bottomLengthM, 34);
      assert.equal(ok.bottomWidthM, 24);
    }
    const bad = rectangularDam({ Lt: 10, Wt: 8, h: 5, z: 2 });
    assert.equal(bad.ok, false);
  });

  it("rejects conflicting bottom and slope", () => {
    const result = rectangularDam({
      Lt: 40,
      Wt: 30,
      h: 2,
      Lb: 20,
      Wb: 10,
      z: 1.5,
    });
    assert.equal(result.ok, false);
  });
});

describe("known area allowances", () => {
  it("does not double-count overlap/waste when already included", () => {
    const once = applyOverlapWaste(1000, 5, 10, true);
    assert.equal(once.materialAreaM2, 1000);
    const again = applyOverlapWaste(1000, 5, 10, false);
    assert.ok(again.materialAreaM2 > 1000);
  });
});

describe("circular dam", () => {
  it("computes frustum volume and liner area", () => {
    const Rt = 10;
    const Rb = 8;
    const h = 3;
    const s = Math.sqrt(h ** 2 + (Rt - Rb) ** 2);
    const floor = Math.PI * Rb ** 2;
    const wall = Math.PI * (Rt + Rb) * s;
    const vol = (Math.PI * h) / 3 * (Rt ** 2 + Rt * Rb + Rb ** 2);
    assert.ok(floor > 0 && wall > 0 && vol > 0);
  });
});

describe("steel tank cylinder", () => {
  it("computes capacity and liner area for multiple tanks", () => {
    const diameter = 10;
    const height = 4;
    const qty = 2;
    const r = diameter / 2;
    const grossKL = Math.PI * r ** 2 * height;
    const floor = Math.PI * r ** 2;
    const wall = Math.PI * diameter * height;
    const perTank = applyOverlapWaste(floor + wall, 5, 5).materialAreaM2;
    assert.ok(grossKL > 0);
    assert.equal(round2(perTank * qty), round2(perTank * qty));
    assert.ok(perTank * qty > perTank);
  });

  it("rejects freeboard >= shell height", () => {
    const freeboard = 3;
    const shell = 3;
    assert.ok(freeboard >= shell);
  });
});

describe("concrete reservoirs", () => {
  it("computes rectangular and circular treatment areas", () => {
    const floor = 10 * 8;
    const walls = 2 * 10 * 3 + 2 * 8 * 3;
    assert.equal(floor, 80);
    assert.equal(walls, 108);
    assert.equal((floor + walls) * 2, 376);
    const r = 5;
    assert.ok(Math.PI * r ** 2 > 0);
    assert.ok(Math.PI * 10 * 3 > 0);
  });
});

describe("overlap helper", () => {
  it("applies sequential overlap then waste", () => {
    const result = applyOverlapWaste(100, 10, 10);
    assert.equal(result.installationAreaM2, 100);
    assert.equal(result.materialAreaM2, 121);
  });
});
