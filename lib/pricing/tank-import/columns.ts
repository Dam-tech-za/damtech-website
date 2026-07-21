/** Canonical tank-model CSV columns and header aliases for Damtech import. */

import { normaliseHeaderKey } from "./csv-lite.ts";

export const TANK_CANONICAL_HEADERS = [
  "tank_code",
  "model_name",
  "diameter_m",
  "height_m",
  "ring_count",
  "nominal_capacity_kl",
  "usable_capacity_kl",
  "steel_tank_cost_ex_vat_zar",
  "steel_tank_sell_ex_vat_zar",
  "pvc_liner_cost_ex_vat_zar",
  "pvc_liner_sell_ex_vat_zar",
  "total_sell_ex_vat_zar",
  "roof_included",
  "roof_sell_ex_vat_zar",
  "foundation_included",
  "foundation_sell_ex_vat_zar",
  "installation_included",
  "installation_sell_ex_vat_zar",
  "default_inlet_mm",
  "default_outlet_mm",
  "default_overflow_mm",
  "default_drain_mm",
  "supplier_name",
  "supplier_model_code",
  "lead_time_days",
  "price_date",
  "valid_from",
  "valid_to",
  "confidence",
  "requires_manual_confirmation",
  "is_active",
  "notes",
] as const;

export type TankCanonicalHeader = (typeof TANK_CANONICAL_HEADERS)[number];

/** Fields that must be present (auto-mapped) before validation may proceed. */
export const TANK_REQUIRED_FIELDS: TankCanonicalHeader[] = [
  "tank_code",
  "model_name",
  "diameter_m",
  "height_m",
  "ring_count",
  "nominal_capacity_kl",
  "steel_tank_sell_ex_vat_zar",
];

/** Map common alternate headers (non-canonical supplier CSVs) → canonical. */
export const TANK_HEADER_ALIASES: Record<string, TankCanonicalHeader> = {
  tank_code: "tank_code",
  code: "tank_code",
  model_code: "tank_code",
  sku: "tank_code",
  model_name: "model_name",
  model: "model_name",
  name: "model_name",
  description: "model_name",
  diameter_m: "diameter_m",
  diameter: "diameter_m",
  dia: "diameter_m",
  internal_diameter_m: "diameter_m",
  height_m: "height_m",
  height: "height_m",
  shell_height_m: "height_m",
  ring_count: "ring_count",
  rings: "ring_count",
  ring: "ring_count",
  nominal_capacity_kl: "nominal_capacity_kl",
  capacity: "nominal_capacity_kl",
  nominal_capacity: "nominal_capacity_kl",
  capacity_kl: "nominal_capacity_kl",
  volume_kl: "nominal_capacity_kl",
  usable_capacity_kl: "usable_capacity_kl",
  usable_capacity: "usable_capacity_kl",
  usable: "usable_capacity_kl",
  advertised_capacity_kl: "usable_capacity_kl",
  steel_tank_cost_ex_vat_zar: "steel_tank_cost_ex_vat_zar",
  tank_cost: "steel_tank_cost_ex_vat_zar",
  steel_cost: "steel_tank_cost_ex_vat_zar",
  structure_cost: "steel_tank_cost_ex_vat_zar",
  steel_tank_sell_ex_vat_zar: "steel_tank_sell_ex_vat_zar",
  tank_price: "steel_tank_sell_ex_vat_zar",
  steel_price: "steel_tank_sell_ex_vat_zar",
  tank_sell: "steel_tank_sell_ex_vat_zar",
  structure_price: "steel_tank_sell_ex_vat_zar",
  pvc_liner_cost_ex_vat_zar: "pvc_liner_cost_ex_vat_zar",
  liner_cost: "pvc_liner_cost_ex_vat_zar",
  pvc_liner_sell_ex_vat_zar: "pvc_liner_sell_ex_vat_zar",
  liner_price: "pvc_liner_sell_ex_vat_zar",
  liner_sell: "pvc_liner_sell_ex_vat_zar",
  total_sell_ex_vat_zar: "total_sell_ex_vat_zar",
  total_price: "total_sell_ex_vat_zar",
  total: "total_sell_ex_vat_zar",
  total_sell: "total_sell_ex_vat_zar",
  roof_included: "roof_included",
  roof: "roof_included",
  roof_sell_ex_vat_zar: "roof_sell_ex_vat_zar",
  roof_price: "roof_sell_ex_vat_zar",
  foundation_included: "foundation_included",
  foundation: "foundation_included",
  foundation_sell_ex_vat_zar: "foundation_sell_ex_vat_zar",
  foundation_price: "foundation_sell_ex_vat_zar",
  installation_included: "installation_included",
  installation: "installation_included",
  install_included: "installation_included",
  installation_sell_ex_vat_zar: "installation_sell_ex_vat_zar",
  installation_price: "installation_sell_ex_vat_zar",
  install_price: "installation_sell_ex_vat_zar",
  default_inlet_mm: "default_inlet_mm",
  inlet_mm: "default_inlet_mm",
  inlet: "default_inlet_mm",
  default_outlet_mm: "default_outlet_mm",
  outlet_mm: "default_outlet_mm",
  outlet: "default_outlet_mm",
  default_overflow_mm: "default_overflow_mm",
  overflow_mm: "default_overflow_mm",
  overflow: "default_overflow_mm",
  default_drain_mm: "default_drain_mm",
  drain_mm: "default_drain_mm",
  drain: "default_drain_mm",
  supplier_name: "supplier_name",
  supplier: "supplier_name",
  manufacturer: "supplier_name",
  supplier_model_code: "supplier_model_code",
  supplier_code: "supplier_model_code",
  supplier_sku: "supplier_model_code",
  lead_time_days: "lead_time_days",
  lead_time: "lead_time_days",
  leadtime: "lead_time_days",
  price_date: "price_date",
  priced_on: "price_date",
  valid_from: "valid_from",
  valid_to: "valid_to",
  valid_until: "valid_to",
  expires: "valid_to",
  confidence: "confidence",
  requires_manual_confirmation: "requires_manual_confirmation",
  manual_confirmation: "requires_manual_confirmation",
  confirm_price: "requires_manual_confirmation",
  is_active: "is_active",
  active: "is_active",
  enabled: "is_active",
  notes: "notes",
  note: "notes",
  comments: "notes",
};

export function resolveTankHeaderAlias(raw: string): TankCanonicalHeader | null {
  return TANK_HEADER_ALIASES[normaliseHeaderKey(raw)] ?? null;
}

export type TankAutoMapResult = {
  mapping: Record<string, TankCanonicalHeader | "">;
  matchedCount: number;
  autoAcceptedCount: number;
  totalColumns: number;
  unmatchedHeaders: string[];
  missingRequired: TankCanonicalHeader[];
  requiresAttention: boolean;
};

/** Auto-map CSV headers → canonical tank fields; unknown headers left unmapped. */
export function autoMapTankHeaders(csvHeaders: string[]): TankAutoMapResult {
  const mapping: Record<string, TankCanonicalHeader | ""> = {};
  const used = new Set<TankCanonicalHeader>();
  const unmatchedHeaders: string[] = [];

  for (const header of csvHeaders) {
    const resolved = resolveTankHeaderAlias(header);
    if (resolved && !used.has(resolved)) {
      mapping[header] = resolved;
      used.add(resolved);
    } else {
      mapping[header] = "";
      if (header.trim()) unmatchedHeaders.push(header);
    }
  }

  const missingRequired = TANK_REQUIRED_FIELDS.filter((field) => !used.has(field));

  return {
    mapping,
    matchedCount: used.size,
    autoAcceptedCount: used.size,
    totalColumns: csvHeaders.length,
    unmatchedHeaders,
    missingRequired,
    requiresAttention: missingRequired.length > 0,
  };
}

/** Recompute derived auto-map counters after a manual mapping override. */
export function summariseTankMapping(
  mapping: Record<string, TankCanonicalHeader | "">,
  csvHeaders: string[],
): TankAutoMapResult {
  const used = new Set<TankCanonicalHeader>();
  const unmatchedHeaders: string[] = [];
  for (const header of csvHeaders) {
    const target = mapping[header];
    if (target) used.add(target);
    else if (header.trim()) unmatchedHeaders.push(header);
  }
  const missingRequired = TANK_REQUIRED_FIELDS.filter((field) => !used.has(field));
  return {
    mapping,
    matchedCount: used.size,
    autoAcceptedCount: used.size,
    totalColumns: csvHeaders.length,
    unmatchedHeaders,
    missingRequired,
    requiresAttention: missingRequired.length > 0,
  };
}
