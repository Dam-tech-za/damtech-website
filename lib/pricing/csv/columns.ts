/** Canonical inventory CSV columns and header aliases for Damtech import. */

export const CANONICAL_HEADERS = [
  "item_code",
  "item_type",
  "category",
  "product_name",
  "quote_description",
  "purchase_unit",
  "quote_unit",
  "conversion_factor",
  "default_cost_ex_vat_zar",
  "recommended_sell_ex_vat_zar",
  "pricing_method",
  "default_markup_percent",
  "target_margin_percent",
  "tax_category",
  "waste_percent",
  "overlap_percent",
  "coverage_rate",
  "coverage_unit",
  "roll_width_m",
  "roll_length_m",
  "pack_size",
  "thickness_mm",
  "gsm",
  "supplier_name",
  "source_reference",
  "source_url",
  "price_date",
  "confidence",
  "requires_manual_confirmation",
  "is_active",
  "notes",
] as const;

export type CanonicalHeader = (typeof CANONICAL_HEADERS)[number];

/** Map common alternate headers → canonical. */
export const HEADER_ALIASES: Record<string, CanonicalHeader> = {
  item_code: "item_code",
  code: "item_code",
  sku: "item_code",
  itemcode: "item_code",
  item_type: "item_type",
  type: "item_type",
  category: "category",
  product_name: "product_name",
  name: "product_name",
  product: "product_name",
  quote_description: "quote_description",
  description: "quote_description",
  desc: "quote_description",
  purchase_unit: "purchase_unit",
  buy_unit: "purchase_unit",
  quote_unit: "quote_unit",
  unit: "quote_unit",
  sell_unit: "quote_unit",
  conversion_factor: "conversion_factor",
  conversion: "conversion_factor",
  usable_roll_area_m2: "conversion_factor",
  default_cost_ex_vat_zar: "default_cost_ex_vat_zar",
  cost: "default_cost_ex_vat_zar",
  default_cost: "default_cost_ex_vat_zar",
  unit_cost: "default_cost_ex_vat_zar",
  cost_ex_vat: "default_cost_ex_vat_zar",
  recommended_sell_ex_vat_zar: "recommended_sell_ex_vat_zar",
  sell_price: "recommended_sell_ex_vat_zar",
  sell: "recommended_sell_ex_vat_zar",
  default_sell_price: "recommended_sell_ex_vat_zar",
  sell_ex_vat: "recommended_sell_ex_vat_zar",
  pricing_method: "pricing_method",
  default_markup_percent: "default_markup_percent",
  markup: "default_markup_percent",
  markup_percent: "default_markup_percent",
  target_margin_percent: "target_margin_percent",
  margin: "target_margin_percent",
  margin_percent: "target_margin_percent",
  tax_category: "tax_category",
  vat_category: "tax_category",
  vat: "tax_category",
  waste_percent: "waste_percent",
  waste: "waste_percent",
  overlap_percent: "overlap_percent",
  overlap: "overlap_percent",
  coverage_rate: "coverage_rate",
  coverage: "coverage_rate",
  coverage_unit: "coverage_unit",
  roll_width_m: "roll_width_m",
  roll_width: "roll_width_m",
  roll_length_m: "roll_length_m",
  roll_length: "roll_length_m",
  pack_size: "pack_size",
  thickness_mm: "thickness_mm",
  thickness: "thickness_mm",
  gsm: "gsm",
  supplier_name: "supplier_name",
  supplier: "supplier_name",
  source_reference: "source_reference",
  reference: "source_reference",
  source_url: "source_url",
  url: "source_url",
  price_date: "price_date",
  valid_from: "price_date",
  confidence: "confidence",
  requires_manual_confirmation: "requires_manual_confirmation",
  manual_confirmation: "requires_manual_confirmation",
  is_active: "is_active",
  active: "is_active",
  notes: "notes",
  note: "notes",
};

export function normaliseHeaderKey(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function resolveHeaderAlias(raw: string): CanonicalHeader | null {
  const key = normaliseHeaderKey(raw);
  return HEADER_ALIASES[key] ?? null;
}

/** Auto-map CSV headers → canonical; unknown headers left unmapped. */
export function autoMapHeaders(csvHeaders: string[]): Record<string, CanonicalHeader | ""> {
  const mapping: Record<string, CanonicalHeader | ""> = {};
  const used = new Set<string>();
  for (const header of csvHeaders) {
    const resolved = resolveHeaderAlias(header);
    if (resolved && !used.has(resolved)) {
      mapping[header] = resolved;
      used.add(resolved);
    } else {
      mapping[header] = "";
    }
  }
  return mapping;
}

export const ITEM_TYPE_ALIASES: Record<string, string> = {
  material: "material",
  installation_service: "installation_service",
  service: "installation_service",
  services: "installation_service",
  install: "installation_service",
  labour: "labour",
  labor: "labour",
  travel: "travel",
  transport: "travel",
  delivery: "delivery",
  equipment: "equipment",
  site_establishment: "site_establishment",
  site: "site_establishment",
  tank_model: "tank_model",
  tank: "tank_model",
  subcontractor: "subcontractor",
  allowance: "allowance",
  fixed_price: "fixed_price",
  other: "other",
};

export function inferItemTypeFromCategory(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("install") || c.includes("labour") || c.includes("labor")) {
    return c.includes("install") ? "installation_service" : "labour";
  }
  if (c.includes("travel") || c.includes("transport") || c.includes("vehicle")) return "travel";
  if (c.includes("delivery")) return "delivery";
  if (c.includes("tank")) return "tank_model";
  if (c.includes("equipment") || c.includes("plant")) return "equipment";
  if (c.includes("site")) return "site_establishment";
  return "material";
}
