import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildReservoirBoq,
  designDiameter,
  designKeys,
  isStandardSize,
  packBars,
  roofSheetCuts,
  roofStock,
  type BoqSettings,
  type RoofDesign,
  type WallDesign,
} from "./boq.ts";

// Rows exported by the DamTech calculator (parameter file r13): 9 m x 3 rings roofed wall, 12 m x 4 rings open wall, 9 m and 4 m roofs.
const fixture = JSON.parse(readFileSync(new URL("./fixture.json", import.meta.url), "utf8")) as {
  settings: BoqSettings;
  wall: WallDesign;
  wallOpen12x4: WallDesign;
  roof: RoofDesign;
  roof4: RoofDesign;
};

const line = (boq: ReturnType<typeof buildReservoirBoq>, item: string) => {
  const found = boq.lines.find((l) => l.item === item);
  assert.ok(found, `line "${item}" missing`);
  return found;
};

describe("reservoir BOQ", () => {
  it("looks up the design at the next 0.5 m size", () => {
    assert.equal(designDiameter(9), 9);
    assert.equal(designDiameter(7.2), 7.5);
    assert.deepEqual(designKeys({ diameterM: 9, rings: 3, roof: true, linerGsm: 550 }), { wall: "wall:9:3:1", roof: "roof:9" });
    assert.deepEqual(designKeys({ diameterM: 7.2, rings: 2, roof: false, linerGsm: 550 }), { wall: "wall:7.5:2:0", roof: null });
  });

  it("knows the standard sizes", () => {
    assert.equal(isStandardSize(fixture.settings, 9, 3), true);
    assert.equal(isStandardSize(fixture.settings, 9.5, 3), false);
    assert.equal(isStandardSize(fixture.settings, 16, 2), false);
    assert.equal(isStandardSize(fixture.settings, 9, 5), false);
  });

  it("matches the calculator on a 9 m x 3 ring tank with a roof", () => {
    const boq = buildReservoirBoq(fixture.settings, fixture.wall, fixture.roof, { diameterM: 9, rings: 3, roof: true, linerGsm: 550 });
    assert.equal(boq.heightM, 2.286);
    assert.equal(boq.capacityKl, 145.4);
    const ring1 = line(boq, "Wall sheet, ring 1 (bottom)");
    assert.equal(ring1.qty, 10);
    assert.equal(ring1.lengthEachM, 2.978);
    assert.match(ring1.note ?? "", /3 bolt lines/);
    assert.equal(line(boq, "Wall sheet, ring 2").lengthEachM, 2.928);
    assert.equal(line(boq, "Seam bolts M10").qty, 700 + 2 * 189);
    assert.equal(line(boq, "PVC liner 550 gsm").qty, 143.6);
    assert.equal(line(boq, "Roof screws").qty, 388);
    assert.equal(line(boq, "Roof bolts M12").qty, 72);
    assert.equal(line(boq, "Hot-dip galvanising").qty, 248);
    assert.equal(line(boq, "End plates 4 mm").qty, 10);
    assert.ok(!boq.lines.some((l) => l.item === "Top stiffener ring"));
    assert.ok(!boq.lines.some((l) => l.item === "Intermediate wind ring"));
  });

  it("lists roof steel as whole 6 m lengths that cover every piece", () => {
    const stock = roofStock(fixture.roof, 9, 6);
    const angle = stock.find((s) => s.section === "L 40x40x2");
    assert.ok(angle);
    // chords 39.5 + 39.4 m and the 28.3 m rim angle
    assert.ok(Math.abs(angle.neededM - (39.5 + 39.4 + 28.3)) < 0.3, String(angle.neededM));
    assert.ok(angle.bars * 6 >= angle.neededM);
    assert.ok(angle.bars <= Math.ceil(angle.neededM / 6) + 3);
    const rb12 = stock.find((s) => s.section === "RB 12");
    assert.ok(rb12 && Math.abs(rb12.neededM - fixture.roof.web_m["RB 12"]) < 0.5, String(rb12?.neededM));
    const tie = stock.find((s) => s.section === "FB 25x3");
    assert.ok(tie && Math.abs(tie.neededM - fixture.roof.bottom_tie_m) < 0.2);
    for (const s of stock) assert.ok(s.bars * s.barM + 1e-9 >= s.neededM, s.section);
  });

  it("packs pieces into bars and splits pieces longer than a bar", () => {
    assert.equal(packBars([3, 3, 3, 3], 6), 2);
    assert.equal(packBars([4, 4, 2, 2], 6), 2);
    assert.equal(packBars([9], 6), 2);
    assert.equal(packBars([], 6), 0);
  });

  it("gives a roof sheet cutting guide no longer than the roof", () => {
    const cuts = roofSheetCuts(9, 0.762, 6.3);
    assert.equal(cuts.reduce((n, c) => n + c.count, 0), 24);
    assert.ok(cuts[0].lengthM <= 4.5 / Math.cos((6.3 * Math.PI) / 180) + 0.15);
    const total = cuts.reduce((m, c) => m + c.lengthM * c.count, 0);
    const boq = buildReservoirBoq(fixture.settings, fixture.wall, fixture.roof, { diameterM: 9, rings: 3, roof: true, linerGsm: 550 });
    assert.ok(total <= line(boq, "Roof sheet 0.47 mm").qty * 1.05, `${total}`);
  });

  it("adds the top ring and wind ring on a large open tank and leaves the roof out", () => {
    const boq = buildReservoirBoq(fixture.settings, fixture.wallOpen12x4, null, { diameterM: 12, rings: 4, roof: false, linerGsm: 800 });
    assert.equal(line(boq, "Top stiffener ring").qty, 37.7);
    assert.equal(line(boq, "Intermediate wind ring").qty, 37.7);
    assert.equal(line(boq, "Wall sheet, ring 1 (bottom)").qty, fixture.wallOpen12x4.rings[0].sheets * 2);
    assert.ok(line(boq, "PVC liner 800 gsm").qty > 0);
    assert.ok(!boq.lines.some((l) => l.section.startsWith("Roof")));
    assert.deepEqual(boq.stock, []);
  });

  it("handles a single ridge truss on a small tank", () => {
    assert.equal(fixture.roof4.trusses, 1);
    const stock = roofStock(fixture.roof4, 4, 6);
    assert.ok(stock.every((s) => s.bars >= 1));
  });
});
