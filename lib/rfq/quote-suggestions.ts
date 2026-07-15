import type { QuoteLineInput } from "@/lib/quotes/types";
import { summariseAssetQuantities } from "./quantity-summary";

export type QuoteSuggestion = QuoteLineInput & {
  priceRequired: boolean;
  sourceAssetIds: string[];
  suggestionGroup: "hdpe" | "steel_tank" | "torch_on" | "general";
};

type AssetRow = {
  id: string;
  asset_name: string;
  asset_type: string;
  quantity: number;
  material_preference: string | null;
  measurement_status: string;
  estimator_confirmed: boolean;
  calculated_outputs: Record<string, unknown> | null;
  confirmed_material_area_m2: number | null;
  confirmed_installation_area_m2: number | null;
  confirmed_geotextile_area_m2: number | null;
  confirmed_surface_prep_area_m2: number | null;
  confirmed_capacity_kl: number | null;
};

/**
 * Editable draft line suggestions from confirmed RFQ assets.
 * Never auto-sends a quote. Flags PRICE REQUIRED when sell is unknown.
 */
export function suggestQuoteLinesFromAssets(
  assets: AssetRow[],
  options: {
    travelKm?: number | null;
    trips?: number | null;
    includeSiteEstablishment?: boolean;
  } = {},
): QuoteSuggestion[] {
  const confirmed = assets.filter(
    (a) =>
      a.estimator_confirmed ||
      a.measurement_status === "confirmed_for_quote",
  );
  const working = confirmed.length ? confirmed : assets;
  const summary = summariseAssetQuantities(working);
  const lines: QuoteSuggestion[] = [];
  let sort = 0;

  const push = (
    line: Omit<
      QuoteSuggestion,
      "sortOrder" | "discountPercent" | "taxCategory"
    > & {
      sortOrder?: number;
      discountPercent?: number;
      taxCategory?: QuoteSuggestion["taxCategory"];
    },
  ) => {
    lines.push({
      ...line,
      sortOrder: line.sortOrder ?? sort++,
      discountPercent: line.discountPercent ?? 0,
      taxCategory: line.taxCategory ?? "standard",
    });
  };

  if (summary.liningMaterialM2 > 0) {
    const hdpeAssets = working.filter((a) =>
      ["earth_dam", "circular_open_reservoir", "concrete_rectangular_reservoir", "concrete_circular_reservoir"].includes(
        a.asset_type,
      ),
    );
    push({
      lineType: "material",
      itemCode: "HDPE-MAT",
      description: materialDescription(hdpeAssets) || "HDPE geomembrane (provisional grade)",
      quantity: round2(summary.liningMaterialM2),
      unit: "m²",
      sellUnitPrice: 0,
      costUnitPrice: null,
      priceRequired: true,
      sourceAssetIds: hdpeAssets.map((a) => a.id),
      suggestionGroup: "hdpe",
      metadata: { role: "material_procurement" },
    });
  }

  if (summary.liningInstallM2 > 0) {
    const hdpeAssets = working.filter((a) =>
      ["earth_dam", "circular_open_reservoir", "concrete_rectangular_reservoir", "concrete_circular_reservoir"].includes(
        a.asset_type,
      ),
    );
    push({
      lineType: "labour",
      itemCode: "HDPE-INSTALL",
      description: "HDPE installation",
      quantity: round2(summary.liningInstallM2),
      unit: "m²",
      sellUnitPrice: 0,
      costUnitPrice: null,
      priceRequired: true,
      sourceAssetIds: hdpeAssets.map((a) => a.id),
      suggestionGroup: "hdpe",
      metadata: { role: "installation" },
    });
  }

  const geotextile = working.reduce(
    (sum, a) => sum + (Number(a.confirmed_geotextile_area_m2) || 0),
    0,
  );
  if (geotextile > 0) {
    push({
      lineType: "material",
      itemCode: "GEOTEX",
      description: "Geotextile protection layer",
      quantity: round2(geotextile),
      unit: "m²",
      sellUnitPrice: 0,
      costUnitPrice: null,
      priceRequired: true,
      sourceAssetIds: working.map((a) => a.id),
      suggestionGroup: "hdpe",
    });
  }

  const tanks = working.filter((a) => a.asset_type === "corrugated_steel_tank");
  if (tanks.length) {
    const tankQty = tanks.reduce((s, a) => s + Math.max(1, a.quantity), 0);
    push({
      lineType: "custom",
      itemCode: "STEEL-TANK",
      description: "Corrugated steel water tank — model/reference TBC",
      quantity: tankQty,
      unit: "each",
      sellUnitPrice: 0,
      costUnitPrice: null,
      priceRequired: true,
      sourceAssetIds: tanks.map((a) => a.id),
      suggestionGroup: "steel_tank",
      metadata: {
        capacityKL: summary.steelCapacityKL,
        note: "Catalogue match unavailable until tank_models loaded",
      },
    });
    push({
      lineType: "material",
      itemCode: "TANK-LINER",
      description: "Internal reinforced PVC liner",
      quantity: tankQty,
      unit: "each",
      sellUnitPrice: 0,
      costUnitPrice: null,
      priceRequired: true,
      sourceAssetIds: tanks.map((a) => a.id),
      suggestionGroup: "steel_tank",
    });
    push({
      lineType: "labour",
      itemCode: "TANK-INSTALL",
      description: "Steel tank installation",
      quantity: tankQty,
      unit: "each",
      sellUnitPrice: 0,
      costUnitPrice: null,
      priceRequired: true,
      sourceAssetIds: tanks.map((a) => a.id),
      suggestionGroup: "steel_tank",
    });
  }

  if (summary.torchOnM2 > 0) {
    const torch = working.filter((a) => a.asset_type === "torch_on");
    push({
      lineType: "material",
      itemCode: "TORCH-3MM",
      description: "3 mm torch-on membrane",
      quantity: round2(summary.torchOnM2),
      unit: "m²",
      sellUnitPrice: 0,
      costUnitPrice: null,
      priceRequired: true,
      sourceAssetIds: torch.map((a) => a.id),
      suggestionGroup: "torch_on",
    });
    push({
      lineType: "labour",
      itemCode: "TORCH-INSTALL",
      description: "Torch-on installation",
      quantity: round2(summary.torchOnM2),
      unit: "m²",
      sellUnitPrice: 0,
      costUnitPrice: null,
      priceRequired: true,
      sourceAssetIds: torch.map((a) => a.id),
      suggestionGroup: "torch_on",
    });
    const prep = torch.reduce(
      (s, a) => s + (Number(a.confirmed_surface_prep_area_m2) || 0),
      0,
    );
    if (prep > 0) {
      push({
        lineType: "labour",
        itemCode: "TORCH-PREP",
        description: "Surface preparation",
        quantity: round2(prep),
        unit: "m²",
        sellUnitPrice: 0,
        costUnitPrice: null,
        priceRequired: true,
        sourceAssetIds: torch.map((a) => a.id),
        suggestionGroup: "torch_on",
      });
    }
  }

  if (options.includeSiteEstablishment !== false && lines.length) {
    push({
      lineType: "custom",
      itemCode: "SITE-EST",
      description: "Site establishment",
      quantity: 1,
      unit: "item",
      sellUnitPrice: 0,
      costUnitPrice: null,
      priceRequired: true,
      sourceAssetIds: working.map((a) => a.id),
      suggestionGroup: "general",
    });
  }

  const travelKm = Number(options.travelKm ?? 0);
  const trips = Math.max(1, Number(options.trips ?? 1));
  if (travelKm > 0) {
    push({
      lineType: "travel",
      itemCode: "TRAVEL",
      description: "Transport / travel",
      quantity: round2(travelKm * trips),
      unit: "km",
      sellUnitPrice: 0,
      costUnitPrice: null,
      priceRequired: true,
      sourceAssetIds: working.map((a) => a.id),
      suggestionGroup: "general",
    });
  }

  return lines;
}

function materialDescription(assets: AssetRow[]): string {
  const prefs = assets
    .map((a) => a.material_preference?.trim())
    .filter(Boolean);
  if (prefs[0]) return prefs[0];
  return "";
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function suggestionsHavePriceGaps(lines: QuoteSuggestion[]): boolean {
  return lines.some((line) => line.priceRequired && line.sellUnitPrice <= 0);
}
