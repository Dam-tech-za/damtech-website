/** Aggregate provisional quantities by unit family — never mix units. */

export type AssetQuantitySummary = {
  liningMaterialM2: number;
  liningInstallM2: number;
  torchOnM2: number;
  steelCapacityKL: number;
  assetCount: number;
  assetTypes: string[];
  measurementStatuses: string[];
  needsSiteMeasurement: boolean;
  allConfirmed: boolean;
};

export function summariseAssetQuantities(
  assets: Array<{
    asset_type: string;
    quantity?: number;
    measurement_status?: string | null;
    measurement_method?: string | null;
    calculated_outputs?: Record<string, unknown> | null;
    confirmed_material_area_m2?: number | null;
    confirmed_installation_area_m2?: number | null;
    confirmed_capacity_kl?: number | null;
    estimator_confirmed?: boolean | null;
  }>,
): AssetQuantitySummary {
  const summary: AssetQuantitySummary = {
    liningMaterialM2: 0,
    liningInstallM2: 0,
    torchOnM2: 0,
    steelCapacityKL: 0,
    assetCount: assets.length,
    assetTypes: [],
    measurementStatuses: [],
    needsSiteMeasurement: false,
    allConfirmed: assets.length > 0,
  };

  const typeSet = new Set<string>();

  for (const asset of assets) {
    typeSet.add(asset.asset_type);
    const status = asset.measurement_status || "customer_estimate";
    summary.measurementStatuses.push(status);
    if (
      status === "site_measurement_required" ||
      asset.measurement_method === "site_measurement_required"
    ) {
      summary.needsSiteMeasurement = true;
    }
    if (!asset.estimator_confirmed && status !== "confirmed_for_quote") {
      summary.allConfirmed = false;
    }

    const out = (asset.calculated_outputs ?? {}) as Record<string, unknown>;
    const qty = Math.max(1, Number(asset.quantity ?? 1));
    const material =
      num(asset.confirmed_material_area_m2) ??
      num(out.materialAreaM2) ??
      num(out.provisionalMaterialAreaM2) ??
      num(out.totalLinerAreaM2);
    const install =
      num(asset.confirmed_installation_area_m2) ??
      num(out.installationAreaM2) ??
      num(out.totalTreatmentAreaM2);
    const capacity =
      num(asset.confirmed_capacity_kl) ??
      num(out.totalGrossCapacityKL) ??
      num(out.grossCapacityKL) ??
      num(out.requiredCapacityKL);

    if (asset.asset_type === "corrugated_steel_tank") {
      if (capacity != null) summary.steelCapacityKL += capacity;
      continue;
    }

    if (asset.asset_type === "torch_on") {
      if (install != null) summary.torchOnM2 += install * (material ? 1 : 1);
      else if (material != null) summary.torchOnM2 += material;
      continue;
    }

    // Earth dams, reservoirs, concrete linings → lining m² families
    if (material != null) summary.liningMaterialM2 += material;
    if (install != null) summary.liningInstallM2 += install;
    // If only diameter mode without material, skip rather than invent
    void qty;
  }

  summary.assetTypes = [...typeSet];
  if (assets.length === 0) summary.allConfirmed = false;
  return summary;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

export function formatQuantitySummaries(summary: AssetQuantitySummary): string[] {
  const lines: string[] = [];
  if (summary.liningMaterialM2 > 0) {
    lines.push(
      `HDPE/PVC material: ${formatNumber(summary.liningMaterialM2)} m²`,
    );
  }
  if (summary.liningInstallM2 > 0) {
    lines.push(
      `Installation area: ${formatNumber(summary.liningInstallM2)} m²`,
    );
  }
  if (summary.steelCapacityKL > 0) {
    lines.push(`Steel storage: ${formatNumber(summary.steelCapacityKL)} kL`);
  }
  if (summary.torchOnM2 > 0) {
    lines.push(`Torch-on area: ${formatNumber(summary.torchOnM2)} m²`);
  }
  return lines;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 1 }).format(n);
}
