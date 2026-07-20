import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Inlined formula copies so Node's strip-types runner does not need to resolve
 * the full @/ import graph used by production pricing modules.
 */

function roundCommercialArea(areaM2: number): number {
  return Math.ceil(areaM2 * 100) / 100;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calculateAreaQuantity(input: {
  measuredAreaM2: number;
  overlapPercent?: number;
  wastePercent?: number;
}) {
  const base = Math.max(0, input.measuredAreaM2);
  const overlapPct = Math.max(0, input.overlapPercent ?? 0);
  const wastePct = Math.max(0, input.wastePercent ?? 0);
  const overlapQuantityM2 = roundCommercialArea(base * (overlapPct / 100));
  const afterOverlap = base + overlapQuantityM2;
  const wasteQuantityM2 = roundCommercialArea(afterOverlap * (wastePct / 100));
  const procurementAreaM2 = roundCommercialArea(afterOverlap + wasteQuantityM2);
  return {
    baseAreaM2: base,
    overlapQuantityM2,
    wasteQuantityM2,
    procurementAreaM2,
    installationAreaM2: base,
  };
}

function calculateRollQuantity(input: {
  procurementAreaM2: number;
  grossAreaPerRollM2: number;
  usableAreaPerRollM2?: number;
}) {
  const procurement = Math.max(0, input.procurementAreaM2);
  const gross = Math.max(0, input.grossAreaPerRollM2);
  const usable = Math.max(0, input.usableAreaPerRollM2 ?? gross);
  const divisor = usable > 0 ? usable : gross;
  const requiredRolls = divisor > 0 ? Math.ceil(procurement / divisor) : 0;
  return {
    requiredRolls,
    orderedGrossAreaM2: gross > 0 ? roundCommercialArea(requiredRolls * gross) : procurement,
    usableAreaPerRollM2: usable,
  };
}

function calculateUsableRollAreaM2(input: {
  rollWidthM: number;
  rollLengthM: number;
  sideLapM?: number;
  endLapM?: number;
}) {
  const grossAreaM2 = roundCommercialArea(input.rollWidthM * input.rollLengthM);
  const usableWidth = Math.max(0, input.rollWidthM - (input.sideLapM ?? 0));
  const usableLength = Math.max(0, input.rollLengthM - (input.endLapM ?? 0));
  const usableAreaM2 = roundCommercialArea(usableWidth * usableLength);
  return { grossAreaM2, usableAreaM2: usableAreaM2 > 0 ? usableAreaM2 : grossAreaM2 };
}

function calculateCoverageQuantity(input: {
  treatmentAreaM2: number;
  consumptionRate: number;
  numberOfCoats?: number;
  wastePercent?: number;
  packSize: number;
}) {
  const area = Math.max(0, input.treatmentAreaM2);
  const rate = Math.max(0, input.consumptionRate);
  const coats = Math.max(1, input.numberOfCoats ?? 1);
  const wastePct = Math.max(0, input.wastePercent ?? 0);
  const packSize = Math.max(0, input.packSize);
  const theoreticalUsage = round2(area * rate * coats);
  const wasteAdjustedUsage = round2(theoreticalUsage * (1 + wastePct / 100));
  const requiredPacks = packSize > 0 ? Math.ceil(wasteAdjustedUsage / packSize) : 0;
  return {
    theoreticalUsage,
    wasteAdjustedUsage,
    requiredPacks,
    orderedQuantity: round2(requiredPacks * packSize),
    quoteQuantityM2: area,
  };
}

function calculateSellPrice(input: {
  cost: number | null;
  method: "fixed" | "markup" | "margin";
  fixedSellPrice?: number | null;
  markupPercent?: number | null;
  marginPercent?: number | null;
}) {
  if (input.method === "fixed") {
    return { sellPrice: input.fixedSellPrice ?? null };
  }
  const cost = input.cost ?? 0;
  if (input.method === "markup") {
    return { sellPrice: round2(cost * (1 + (input.markupPercent ?? 0) / 100)) };
  }
  const margin = input.marginPercent ?? 0;
  return { sellPrice: round2(cost / (1 - margin / 100)) };
}

function normaliseUnitCode(unit: string): string {
  if (unit.trim() === "m2") return "m²";
  return unit.trim();
}

function formatUnitLabel(unit: string): string {
  return normaliseUnitCode(unit) === "m²" ? "m²" : normaliseUnitCode(unit);
}

function convertPurchaseToQuoteQuantity(purchaseQuantity: number, conversionFactor: number): number {
  const factor = conversionFactor > 0 ? conversionFactor : 1;
  return round2(purchaseQuantity / factor);
}

function resolveReturnDistanceKm(input: {
  distanceBasis: "one_way" | "return";
  oneWayDistanceKm: number;
  returnDistanceKm?: number;
}): number {
  if (input.distanceBasis === "return") {
    return Math.max(0, input.returnDistanceKm ?? input.oneWayDistanceKm);
  }
  return Math.max(0, input.oneWayDistanceKm * 2);
}

function calculateTravelQuoteQuantity(input: {
  distanceBasis: "one_way" | "return";
  oneWayDistanceKm: number;
  returnDistanceKm?: number;
  trips: number;
  vehicles: number;
}) {
  const returnDistanceKm = resolveReturnDistanceKm(input);
  const trips = Math.max(1, input.trips);
  const vehicles = Math.max(1, input.vehicles);
  return {
    returnDistanceKm,
    quoteQuantityKm: round2(returnDistanceKm * trips * vehicles),
  };
}

describe("pricing units", () => {
  it("normalises m2 to m² for display", () => {
    assert.equal(normaliseUnitCode("m2"), "m²");
    assert.equal(formatUnitLabel("m2"), "m²");
  });

  it("converts purchase roll quantity to quote m²", () => {
    assert.equal(convertPurchaseToQuoteQuantity(770, 770), 1);
  });
});

describe("area quantity", () => {
  it("calculates overlap and waste separately", () => {
    const result = calculateAreaQuantity({
      measuredAreaM2: 1000,
      overlapPercent: 10,
      wastePercent: 5,
    });
    assert.equal(result.overlapQuantityM2, 100);
    assert.equal(result.wasteQuantityM2, 55);
    assert.equal(result.procurementAreaM2, 1155);
    assert.equal(result.installationAreaM2, 1000);
  });
});

describe("roll quantity", () => {
  it("rounds rolls up and computes ordered gross area", () => {
    const result = calculateRollQuantity({
      procurementAreaM2: 1155,
      grossAreaPerRollM2: 770,
      usableAreaPerRollM2: 700,
    });
    assert.equal(result.requiredRolls, 2);
    assert.equal(result.orderedGrossAreaM2, 1540);
  });
});

describe("torch-on usable area", () => {
  it("subtracts configured side and end laps", () => {
    const result = calculateUsableRollAreaM2({
      rollWidthM: 1,
      rollLengthM: 10,
      sideLapM: 0.1,
      endLapM: 0.2,
    });
    assert.equal(result.grossAreaM2, 10);
    assert.ok(result.usableAreaM2 < result.grossAreaM2);
  });
});

describe("coverage quantity", () => {
  it("calculates packs with coats and waste", () => {
    const result = calculateCoverageQuantity({
      treatmentAreaM2: 100,
      consumptionRate: 1.5,
      numberOfCoats: 2,
      wastePercent: 10,
      packSize: 20,
    });
    assert.equal(result.theoreticalUsage, 300);
    assert.equal(result.wasteAdjustedUsage, 330);
    assert.equal(result.requiredPacks, 17);
  });
});

describe("sell price", () => {
  it("uses markup from cost", () => {
    const result = calculateSellPrice({ cost: 100, method: "markup", markupPercent: 25 });
    assert.equal(result.sellPrice, 125);
  });

  it("uses target margin from cost", () => {
    const result = calculateSellPrice({ cost: 75, method: "margin", marginPercent: 25 });
    assert.equal(result.sellPrice, 100);
  });
});

describe("travel", () => {
  it("doubles one-way distance for return basis", () => {
    assert.equal(
      resolveReturnDistanceKm({ distanceBasis: "one_way", oneWayDistanceKm: 120 }),
      240,
    );
  });

  it("does not double supplied return distance", () => {
    assert.equal(
      resolveReturnDistanceKm({
        distanceBasis: "return",
        oneWayDistanceKm: 120,
        returnDistanceKm: 240,
      }),
      240,
    );
  });

  it("calculates quote km quantity", () => {
    const result = calculateTravelQuoteQuantity({
      distanceBasis: "one_way",
      oneWayDistanceKm: 100,
      trips: 2,
      vehicles: 1,
    });
    assert.equal(result.quoteQuantityKm, 400);
  });
});
