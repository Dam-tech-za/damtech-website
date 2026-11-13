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
  seamHoleOffsetsMm,
  sheetDrillPatterns,
  trussMembers,
  type BoqSettings,
  type RoofDesign,
  type WallDesign,
} from "./boq.ts";

// Rows exported by the DamTech calculator (parameter file r14): 9 m x 3 rings roofed wall, 12 m x 4 rings open wall, 9 m and 4 m roofs.
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
    // design counts plus 2% spare, rounded up: 700 vertical, 2 x 189 row seams, 72 roof bolts
    assert.equal(line(boq, "Seam bolts M10, vertical seams").qty, 714);
    assert.equal(line(boq, "Seam bolts M10, row seams (Optional)").qty, 386);
    assert.equal(line(boq, "PVC liner 550 gsm").qty, 143.6);
    assert.equal(line(boq, "Roof screws").qty, 388);
    assert.equal(line(boq, "Roof bolts M12").qty, 74);
    assert.equal(line(boq, "Hot-dip galvanising").qty, 251);
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
    // r14: ribs and diagonals are angle L 25x25x2.5 (no round bar), with L 25x25x2 as the stand-in
    assert.ok(!stock.some((s) => s.section.startsWith("RB")));
    const web = stock.find((s) => s.section === "L 25x25x2.5");
    assert.ok(web && Math.abs(web.neededM - fixture.roof.web_m["L 25x25x2.5"]) < 0.5, String(web?.neededM));
    assert.equal(web.alternative, "L 25x25x2");
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

  it("lists the ribs and diagonals of one truss with their cut lengths", () => {
    const centre = fixture.roof.truss_detail.find((t) => t.y_m === 0);
    assert.ok(centre);
    const { ribs, diagonals } = trussMembers(centre);
    assert.equal(ribs.reduce((n, m) => n + m.count, 0), 23);
    assert.equal(diagonals.reduce((n, m) => n + m.count, 0), 22);
    assert.equal(ribs[0].lengthM, 0.65);
    assert.equal(ribs[0].count, 1);
    assert.ok(diagonals.every((m) => m.section === "L 25x25x2.5" && m.count % 2 === 0));
  });

  it("handles a single ridge truss on a small tank", () => {
    assert.equal(fixture.roof4.trusses, 1);
    const stock = roofStock(fixture.roof4, 4, 6);
    assert.ok(stock.every((s) => s.bars >= 1));
  });
});

describe("wall sheet drilling", () => {
  it("places the seam hole lines from the sheet end", () => {
    assert.deepEqual(seamHoleOffsetsMm(2), [35, 65]);
    assert.deepEqual(seamHoleOffsetsMm(3), [35, 75, 115]);
  });

  it("gives one drilling pattern per distinct ring layout, a hole in every valley", () => {
    const patterns = sheetDrillPatterns(fixture.settings, fixture.wall, 9);
    // 9 m x 3 rings: the bottom ring has 3 bolt lines and a 150 mm lap; rings 2 and 3 share 2 lines and a 100 mm lap.
    assert.equal(patterns.length, 2);
    const [bottom, upper] = patterns;
    assert.deepEqual(bottom.rings, [1]);
    assert.deepEqual(bottom.lineOffsetsMm, [35, 75, 115]);
    assert.equal(bottom.endLapMm, 150);
    assert.deepEqual(upper.rings, [2, 3]);
    assert.deepEqual(upper.lineOffsetsMm, [35, 65]);
    assert.equal(upper.holesPerLine, 10);
    assert.equal(upper.pitchMm, 76.2);
    assert.equal(upper.firstHoleMm, 38.1);
    assert.equal(upper.sheetHeightMm, 762);
    // Same cut length as the BOQ line: π × 9 / 10 sheets + 100 mm lap, rounded up to the mm.
    assert.equal(upper.cutLengthMm, 2928);
    const boq = buildReservoirBoq(fixture.settings, fixture.wall, fixture.roof, { diameterM: 9, rings: 3, roof: true, linerGsm: 550 });
    assert.equal(line(boq, "Wall sheet, ring 2").lengthEachM, upper.cutLengthMm / 1000);
    assert.equal(upper.sheets, 20);
  });
});
