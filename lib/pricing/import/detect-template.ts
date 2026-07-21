/**
 * Stage: template detection.
 *
 * Recognises known Damtech import formats from the (normalised) header set so
 * the UI can skip manual mapping for canonical templates.
 */

import { CANONICAL_HEADERS } from "../csv/columns";
import { normalizeHeaders } from "./normalize-header";
import type { TemplateDetection, TemplateType } from "./import-types";

const CANONICAL_SET = new Set<string>(CANONICAL_HEADERS);

const LABEL: Record<TemplateType, string> = {
  unified: "Damtech unified inventory",
  legacy_materials: "Damtech legacy materials",
  labour: "Labour rates",
  supplier_prices: "Supplier price list",
  travel_vehicles: "Travel vehicles",
  generic_supplier: "Generic supplier CSV",
  unknown: "Unknown custom CSV",
};

function has(set: Set<string>, ...keys: string[]): boolean {
  return keys.every((k) => set.has(k));
}

function hasAny(set: Set<string>, ...keys: string[]): boolean {
  return keys.some((k) => set.has(k));
}

export function detectTemplate(csvHeaders: string[]): TemplateDetection {
  const normalised = normalizeHeaders(csvHeaders);
  const set = new Set(normalised);
  const canonicalHits = normalised.filter((h) => CANONICAL_SET.has(h)).length;
  const totalFields = CANONICAL_HEADERS.length;

  const build = (
    template: TemplateType,
    confidence: number,
    recognisedFields: number,
    skipMapping: boolean,
  ): TemplateDetection => ({
    template,
    label: LABEL[template],
    confidence,
    recognisedFields,
    totalFields,
    skipMapping,
  });

  // Unified Damtech inventory: the canonical 31-column set (allow a few missing
  // optional columns but require all required fields present exactly).
  const requiredExact = has(set, "item_code", "item_type", "category", "product_name", "quote_unit");
  if (requiredExact && canonicalHits >= totalFields - 3) {
    const confidence = Math.round((canonicalHits / totalFields) * 100);
    return build("unified", Math.max(confidence, 95), canonicalHits, true);
  }
  if (requiredExact && canonicalHits >= 12) {
    return build("unified", Math.round((canonicalHits / totalFields) * 100), canonicalHits, false);
  }

  // Legacy Damtech materials: item_code + name/unit + cost/sell, no item_type.
  if (
    hasAny(set, "item_code", "code", "sku") &&
    hasAny(set, "name", "product_name") &&
    hasAny(set, "unit", "quote_unit") &&
    hasAny(set, "default_cost", "cost", "default_sell_price", "sell_price")
  ) {
    return build("legacy_materials", 90, canonicalHits, false);
  }

  // Labour rates.
  if (hasAny(set, "hourly_cost", "hourly_rate", "productivity_rate", "crew_rate")) {
    return build("labour", 85, canonicalHits, false);
  }

  // Supplier price list.
  if (hasAny(set, "supplier_sku", "supplier_name", "supplier") && hasAny(set, "unit_cost", "cost", "buy_price")) {
    return build("supplier_prices", 80, canonicalHits, false);
  }

  // Travel vehicles.
  if (hasAny(set, "vehicle", "rate_per_km", "cost_per_km", "registration")) {
    return build("travel_vehicles", 80, canonicalHits, false);
  }

  // Generic supplier CSV: some recognisable pricing columns.
  if (canonicalHits >= 4 || hasAny(set, "name", "product_name", "cost", "sell_price", "unit")) {
    return build("generic_supplier", Math.min(70, Math.round((canonicalHits / totalFields) * 100) + 20), canonicalHits, false);
  }

  return build("unknown", 0, canonicalHits, false);
}
