import { canPerform } from "@/lib/auth/permissions";
import type { AdminRole } from "@/lib/auth/types";
import type { PricingItemRecord } from "./types";

/** True when role may see supplier costs, direct cost, markup and margin. */
export function canViewInternalCosts(role: AdminRole): boolean {
  return canPerform(role, "viewCostPrices");
}

export function canManagePricing(role: AdminRole): boolean {
  return canPerform(role, "managePricing");
}

export function canOverridePrice(role: AdminRole): boolean {
  return canPerform(role, "viewCostPrices");
}

/** Strip cost/margin fields for sales/viewer responses. */
export function maskPricingItemForRole(
  item: PricingItemRecord,
  role: AdminRole,
): PricingItemRecord {
  if (canViewInternalCosts(role)) return item;
  return {
    ...item,
    defaultCost: null,
    defaultMarkupPercent: null,
    targetMarginPercent: null,
    minimumSellPrice: null,
    supplierName: null,
  };
}

export function maskPricingItemsForRole(
  items: PricingItemRecord[],
  role: AdminRole,
): PricingItemRecord[] {
  return items.map((item) => maskPricingItemForRole(item, role));
}

/** Column list for sell-only catalogue queries (no cost fields). */
export const PRICING_SELL_COLUMNS =
  "id, item_code, item_type, category, name, short_description, quote_description, purchase_unit, quote_unit, conversion_factor, default_sell_price, pricing_method, tax_category, waste_percent, overlap_percent, coverage_rate, coverage_unit, productivity_rate, productivity_unit, price_valid_from, price_valid_to, is_active, requires_manual_quantity_confirmation, metadata, legacy_material_item_id, legacy_labour_item_id, legacy_tank_model_id, created_at, updated_at";

/** Full column list including costs — only use when role is authorised. */
export const PRICING_COST_COLUMNS =
  "id, item_code, item_type, category, name, short_description, quote_description, purchase_unit, quote_unit, conversion_factor, default_sell_price, pricing_method, tax_category, waste_percent, overlap_percent, coverage_rate, coverage_unit, productivity_rate, productivity_unit, price_valid_from, price_valid_to, is_active, requires_manual_quantity_confirmation, metadata, legacy_material_item_id, legacy_labour_item_id, legacy_tank_model_id, created_at, updated_at, default_cost, default_markup_percent, target_margin_percent, minimum_sell_price, supplier_id, preferred_supplier_price_id";
