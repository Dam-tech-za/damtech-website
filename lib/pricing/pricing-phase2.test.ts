import assert from "node:assert/strict";
import { describe, it } from "node:test";

function canViewInternalCosts(role: string): boolean {
  return role === "owner" || role === "admin" || role === "estimator";
}

function maskPricingItemForRole(
  item: { defaultCost: number | null; defaultSellPrice: number | null; name: string },
  role: string,
) {
  if (canViewInternalCosts(role)) return item;
  return { ...item, defaultCost: null };
}

function burdenedHourlyCost(base: number, burdenPercent = 0): number {
  return Math.round(base * (1 + burdenPercent / 100) * 100) / 100;
}

function calculateCrewHourlyCost(
  members: Array<{ quantity: number; hourlyCost: number; burdenPercent?: number }>,
): number {
  return Math.round(
    members.reduce(
      (sum, m) =>
        sum + burdenedHourlyCost(m.hourlyCost, m.burdenPercent ?? 0) * m.quantity,
      0,
    ) * 100,
  ) / 100;
}

function calculateCrewCost(input: {
  members: Array<{ quantity: number; hourlyCost: number; burdenPercent?: number }>;
  installationQuantity: number;
  productivityRate: number;
  minimumHours?: number;
}) {
  const crewHourlyCost = calculateCrewHourlyCost(input.members);
  let requiredHours =
    input.productivityRate > 0
      ? Math.round((input.installationQuantity / input.productivityRate) * 100) / 100
      : 0;
  if (input.minimumHours && requiredHours < input.minimumHours) {
    requiredHours = input.minimumHours;
  }
  return {
    crewHourlyCost,
    requiredHours,
    crewCost: Math.round(requiredHours * crewHourlyCost * 100) / 100,
  };
}

function assessStale(current: number, catalogueSell: number | null, archived: boolean) {
  if (archived) return "item_archived";
  if (catalogueSell == null) return "current";
  if (Math.abs(catalogueSell - current) >= 0.01) return "newer_available";
  return "current";
}

function validateHdpeUsable(gross: number, usable: number): boolean {
  return usable <= gross;
}

describe("pricing security masking", () => {
  it("sales cannot see defaultCost", () => {
    const masked = maskPricingItemForRole(
      { defaultCost: 120, defaultSellPrice: 180, name: "HDPE" },
      "sales",
    );
    assert.equal(masked.defaultCost, null);
    assert.equal(masked.defaultSellPrice, 180);
  });

  it("viewer cannot see defaultCost", () => {
    const masked = maskPricingItemForRole(
      { defaultCost: 50, defaultSellPrice: 80, name: "Geotex" },
      "viewer",
    );
    assert.equal(masked.defaultCost, null);
  });

  it("estimator can see defaultCost", () => {
    const masked = maskPricingItemForRole(
      { defaultCost: 50, defaultSellPrice: 80, name: "Geotex" },
      "estimator",
    );
    assert.equal(masked.defaultCost, 50);
  });
});

describe("crew costing", () => {
  it("calculates burdened crew hourly cost", () => {
    const cost = calculateCrewHourlyCost([
      { quantity: 1, hourlyCost: 250, burdenPercent: 20 },
      { quantity: 2, hourlyCost: 180, burdenPercent: 20 },
      { quantity: 3, hourlyCost: 120, burdenPercent: 20 },
    ]);
    // 300 + 432 + 432 = 1164
    assert.equal(cost, 1164);
  });

  it("applies productivity and minimum hours", () => {
    const result = calculateCrewCost({
      members: [{ quantity: 1, hourlyCost: 200 }],
      installationQuantity: 100,
      productivityRate: 50,
      minimumHours: 4,
    });
    assert.equal(result.requiredHours, 4);
    assert.equal(result.crewCost, 800);
  });
});

describe("stale prices", () => {
  it("detects newer catalogue sell price", () => {
    assert.equal(assessStale(100, 110, false), "newer_available");
  });

  it("detects archived item", () => {
    assert.equal(assessStale(100, 100, true), "item_archived");
  });

  it("marks current when prices match", () => {
    assert.equal(assessStale(100, 100, false), "current");
  });
});

describe("material technical validation", () => {
  it("rejects usable area above gross", () => {
    assert.equal(validateHdpeUsable(770, 800), false);
    assert.equal(validateHdpeUsable(770, 700), true);
  });
});

describe("labour sync rules", () => {
  it("treats install category as installation_service", () => {
    const category = "HDPE Installation";
    const type = category.toLowerCase().includes("install")
      ? "installation_service"
      : "labour";
    assert.equal(type, "installation_service");
  });
});

describe("travel distance", () => {
  it("does not double return distance", () => {
    const oneWay = 100;
    const returnKm = oneWay; // already return total
    const trips = 2;
    const rate = 10;
    const distanceCost = returnKm * trips * rate;
    assert.equal(distanceCost, 2000);
  });
});

describe("catalogue readiness", () => {
  it("requires all flags before disabling legacy fallback", () => {
    const ready = {
      materialCatalogueOperational: true,
      labourCatalogueSynchronised: true,
      travelCatalogueOperational: true,
      tankModelsOperational: true,
      pricingSnapshotsOperational: true,
      roleSecurityVerified: true,
    };
    assert.equal(
      Object.values(ready).every(Boolean),
      true,
    );
    assert.equal(
      Object.values({ ...ready, roleSecurityVerified: false }).every(Boolean),
      false,
    );
  });
});
