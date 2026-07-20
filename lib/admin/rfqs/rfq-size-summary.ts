import type { RFQListItem } from "@/lib/rfq/list";
import { softParseProjectSize } from "@/lib/rfq/soft-size-parse";
import type { RfqApproximateSize } from "./rfq-inbox-types";

export { compareRfqSize, sortRowsBySize } from "./rfq-size-sort";

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 1 }).format(n);
}

function areaSize(value: number, source: RfqApproximateSize["source"]): RfqApproximateSize {
  return {
    displayValue: `${formatNumber(value)} m²`,
    numericValue: value,
    unit: "m²",
    source,
    sortType: "area",
  };
}

function capacitySize(value: number, source: RfqApproximateSize["source"]): RfqApproximateSize {
  return {
    displayValue: `${formatNumber(value)} kL`,
    numericValue: value,
    unit: "kL",
    source,
    sortType: "capacity",
  };
}

function dimensionSize(value: number, source: RfqApproximateSize["source"]): RfqApproximateSize {
  return {
    displayValue: `${formatNumber(value)} m diameter`,
    numericValue: value,
    unit: "m",
    source,
    sortType: "dimension",
  };
}

function textSize(text: string, source: RfqApproximateSize["source"]): RfqApproximateSize {
  const parsed = softParseProjectSize(text);
  if (parsed.estimated_area_m2 != null) {
    return {
      displayValue: text.trim(),
      numericValue: parsed.estimated_area_m2,
      unit: "m²",
      source,
      sortType: "area",
    };
  }
  if (parsed.estimated_capacity_kl != null) {
    return {
      displayValue: text.trim(),
      numericValue: parsed.estimated_capacity_kl,
      unit: "kL",
      source,
      sortType: "capacity",
    };
  }
  if (parsed.estimated_diameter_m != null) {
    return {
      displayValue: text.trim(),
      numericValue: parsed.estimated_diameter_m,
      unit: "m",
      source,
      sortType: "dimension",
    };
  }
  return {
    displayValue: text.trim(),
    numericValue: null,
    unit: "other",
    source,
    sortType: "none",
  };
}

const MISSING_SIZE: RfqApproximateSize = {
  displayValue: null,
  numericValue: null,
  unit: null,
  source: "missing",
  sortType: "none",
};

export function resolveRfqApproximateSize(row: RFQListItem): RfqApproximateSize {
  const summary = row.quantity_summary;
  const hasConfirmed =
    summary?.allConfirmed &&
    (summary.liningMaterialM2 > 0 || summary.steelCapacityKL > 0);

  if (hasConfirmed) {
    if (summary!.liningMaterialM2 > 0) {
      return areaSize(summary!.liningMaterialM2, "confirmed");
    }
    if (summary!.steelCapacityKL > 0) {
      return capacitySize(summary!.steelCapacityKL, "confirmed");
    }
  }

  if (summary && summary.assetCount > 0) {
    if (summary.liningMaterialM2 > 0) {
      return areaSize(summary.liningMaterialM2, "calculated");
    }
    if (summary.steelCapacityKL > 0) {
      return capacitySize(summary.steelCapacityKL, "calculated");
    }
    if (summary.liningInstallM2 > 0) {
      return areaSize(summary.liningInstallM2, "calculated");
    }
  }

  const sizeText =
    row.approximate_project_size_text?.trim() ||
    row.approximate_project_size?.trim() ||
    "";
  if (sizeText) {
    const parsed = softParseProjectSize(sizeText);
    if (parsed.estimated_area_m2 != null) {
      return {
        displayValue: `${formatNumber(parsed.estimated_area_m2)} m²`,
        numericValue: parsed.estimated_area_m2,
        unit: "m²",
        source: "customer_estimate",
        sortType: "area",
      };
    }
    if (parsed.estimated_capacity_kl != null) {
      return {
        displayValue: `${formatNumber(parsed.estimated_capacity_kl)} kL`,
        numericValue: parsed.estimated_capacity_kl,
        unit: "kL",
        source: "customer_estimate",
        sortType: "capacity",
      };
    }
    if (parsed.estimated_diameter_m != null) {
      return dimensionSize(parsed.estimated_diameter_m, "customer_estimate");
    }
    return textSize(sizeText, "customer_text");
  }

  return MISSING_SIZE;
}

export function approximateSizeSourceLabel(
  source: RfqApproximateSize["source"],
): string | null {
  switch (source) {
    case "confirmed":
      return "Confirmed";
    case "calculated":
      return "Calculated";
    case "customer_estimate":
      return "Customer estimate";
    case "customer_text":
      return "Customer description";
    default:
      return null;
  }
}
