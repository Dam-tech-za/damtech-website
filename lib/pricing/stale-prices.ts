import type {
  EffectivePrice,
  PricingItemRecord,
  QuoteLinePriceSnapshot,
} from "./types";
import { selectEffectivePrice } from "./select-effective-price";

export type StalePriceStatus =
  | "current"
  | "newer_available"
  | "original_expired"
  | "item_archived"
  | "supplier_unavailable"
  | "manual";

export type StaleLineAssessment = {
  lineId: string | null;
  sortOrder: number;
  description: string;
  status: StalePriceStatus;
  currentSellPrice: number;
  newSellPrice: number | null;
  difference: number | null;
  marginImpact: number | null;
  priceValidTo: string | null;
};

function snapshotFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): QuoteLinePriceSnapshot | null {
  if (!metadata || typeof metadata !== "object") return null;
  const source = metadata.pricingSource;
  if (!source || typeof source !== "object") return null;
  return source as QuoteLinePriceSnapshot;
}

export function assessQuoteLinePriceFreshness(input: {
  lineId?: string | null;
  sortOrder: number;
  description: string;
  sellUnitPrice: number;
  metadata?: Record<string, unknown> | null;
  catalogueItem?: PricingItemRecord | null;
  effectivePrice?: EffectivePrice | null;
}): StaleLineAssessment {
  const snapshot = snapshotFromMetadata(input.metadata);
  const currentSell = input.sellUnitPrice;

  if (snapshot?.manualOverride) {
    return {
      lineId: input.lineId ?? null,
      sortOrder: input.sortOrder,
      description: input.description,
      status: "manual",
      currentSellPrice: currentSell,
      newSellPrice: null,
      difference: null,
      marginImpact: null,
      priceValidTo: snapshot.supplierValidTo,
    };
  }

  if (!input.catalogueItem) {
    if (snapshot?.pricingItemId) {
      return {
        lineId: input.lineId ?? null,
        sortOrder: input.sortOrder,
        description: input.description,
        status: "item_archived",
        currentSellPrice: currentSell,
        newSellPrice: null,
        difference: null,
        marginImpact: null,
        priceValidTo: snapshot.supplierValidTo,
      };
    }
    return {
      lineId: input.lineId ?? null,
      sortOrder: input.sortOrder,
      description: input.description,
      status: "current",
      currentSellPrice: currentSell,
      newSellPrice: null,
      difference: null,
      marginImpact: null,
      priceValidTo: null,
    };
  }

  if (!input.catalogueItem.isActive) {
    return {
      lineId: input.lineId ?? null,
      sortOrder: input.sortOrder,
      description: input.description,
      status: "item_archived",
      currentSellPrice: currentSell,
      newSellPrice: null,
      difference: null,
      marginImpact: null,
      priceValidTo: input.catalogueItem.priceValidTo,
    };
  }

  const effective =
    input.effectivePrice ?? selectEffectivePrice(input.catalogueItem);
  const newSell = effective.sellPrice;

  if (effective.priceStatus === "expired") {
    return {
      lineId: input.lineId ?? null,
      sortOrder: input.sortOrder,
      description: input.description,
      status: "original_expired",
      currentSellPrice: currentSell,
      newSellPrice: newSell,
      difference: newSell != null ? Math.round((newSell - currentSell) * 100) / 100 : null,
      marginImpact: null,
      priceValidTo: effective.validTo,
    };
  }

  if (newSell != null && Math.abs(newSell - currentSell) >= 0.01) {
    return {
      lineId: input.lineId ?? null,
      sortOrder: input.sortOrder,
      description: input.description,
      status: "newer_available",
      currentSellPrice: currentSell,
      newSellPrice: newSell,
      difference: Math.round((newSell - currentSell) * 100) / 100,
      marginImpact: null,
      priceValidTo: effective.validTo,
    };
  }

  return {
    lineId: input.lineId ?? null,
    sortOrder: input.sortOrder,
    description: input.description,
    status: "current",
    currentSellPrice: currentSell,
    newSellPrice: newSell,
    difference: 0,
    marginImpact: null,
    priceValidTo: effective.validTo,
  };
}

export function countStaleLines(assessments: StaleLineAssessment[]): number {
  return assessments.filter((row) =>
    ["newer_available", "original_expired", "item_archived", "supplier_unavailable"].includes(
      row.status,
    ),
  ).length;
}
