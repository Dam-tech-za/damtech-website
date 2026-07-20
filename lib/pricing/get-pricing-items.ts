import { createClient } from "@/lib/supabase/server";
import type { PricingItemRecord, PriceStatus, PricingItemType } from "./types";
import { normaliseUnitCode } from "./units";

function mapPriceStatus(validTo: string | null, hasPrice: boolean): PriceStatus {
  if (!hasPrice) return "missing";
  if (!validTo) return "current";
  const expiry = new Date(`${validTo}T23:59:59`).getTime();
  if (expiry < Date.now()) return "expired";
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (expiry - Date.now() <= thirtyDays) return "expiring";
  return "current";
}

function mapRow(row: Record<string, unknown>): PricingItemRecord {
  const defaultCost = row.default_cost != null ? Number(row.default_cost) : null;
  const defaultSell =
    row.default_sell_price != null ? Number(row.default_sell_price) : null;
  const validTo = (row.price_valid_to as string | null) ?? null;

  return {
    id: String(row.id),
    itemCode: String(row.item_code),
    itemType: row.item_type as PricingItemType,
    category: String(row.category),
    name: String(row.name),
    shortDescription: (row.short_description as string | null) ?? null,
    quoteDescription: (row.quote_description as string | null) ?? null,
    purchaseUnit: row.purchase_unit ? normaliseUnitCode(String(row.purchase_unit)) : null,
    quoteUnit: normaliseUnitCode(String(row.quote_unit)),
    conversionFactor: Number(row.conversion_factor ?? 1),
    defaultCost,
    defaultSellPrice: defaultSell,
    pricingMethod: (row.pricing_method as PricingItemRecord["pricingMethod"]) ?? "unit_rate",
    defaultMarkupPercent:
      row.default_markup_percent != null ? Number(row.default_markup_percent) : null,
    targetMarginPercent:
      row.target_margin_percent != null ? Number(row.target_margin_percent) : null,
    minimumSellPrice:
      row.minimum_sell_price != null ? Number(row.minimum_sell_price) : null,
    taxCategory: (row.tax_category as PricingItemRecord["taxCategory"]) ?? "standard",
    wastePercent: Number(row.waste_percent ?? 0),
    overlapPercent: Number(row.overlap_percent ?? 0),
    coverageRate: row.coverage_rate != null ? Number(row.coverage_rate) : null,
    coverageUnit: (row.coverage_unit as string | null) ?? null,
    productivityRate:
      row.productivity_rate != null ? Number(row.productivity_rate) : null,
    productivityUnit: (row.productivity_unit as string | null) ?? null,
    priceValidFrom: (row.price_valid_from as string | null) ?? null,
    priceValidTo: validTo,
    isActive: Boolean(row.is_active),
    requiresManualQuantityConfirmation: Boolean(row.requires_manual_quantity_confirmation),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    legacyMaterialItemId: (row.legacy_material_item_id as string | null) ?? null,
    legacyLabourItemId: (row.legacy_labour_item_id as string | null) ?? null,
    legacyTankModelId: (row.legacy_tank_model_id as string | null) ?? null,
    supplierName: null,
    priceStatus: mapPriceStatus(validTo, Boolean(defaultSell || defaultCost)),
  };
}

export type PricingSearchFilters = {
  q?: string;
  itemType?: PricingItemType | PricingItemType[];
  category?: string;
  active?: boolean;
  limit?: number;
};

export async function searchPricingItems(
  filters: PricingSearchFilters = {},
): Promise<{ ok: true; items: PricingItemRecord[] } | { ok: false; error: string }> {
  const supabase = await createClient();
  const limit = filters.limit ?? 40;

  let query = supabase
    .from("pricing_items")
    .select("*")
    .order("category")
    .order("name")
    .limit(limit);

  if (filters.active !== false) query = query.eq("is_active", true);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.itemType) {
    const types = Array.isArray(filters.itemType) ? filters.itemType : [filters.itemType];
    query = query.in("item_type", types);
  }
  if (filters.q?.trim()) {
    const term = filters.q.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `name.ilike.%${term}%,item_code.ilike.%${term}%,category.ilike.%${term}%,quote_description.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    items: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
  };
}

export async function getPricingItemById(
  id: string,
): Promise<{ ok: true; item: PricingItemRecord } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pricing_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Pricing item not found." };
  }

  return { ok: true, item: mapRow(data as Record<string, unknown>) };
}

export type PricingHubMetrics = {
  materialsActive: number;
  materialsMissingCost: number;
  servicesActive: number;
  labourActive: number;
  expiredPrices: number;
  expiringPrices: number;
};

export async function getPricingHubMetrics(): Promise<PricingHubMetrics> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: items } = await supabase
    .from("pricing_items")
    .select("item_type, default_cost, default_sell_price, price_valid_to, is_active");

  const rows = items ?? [];
  const active = rows.filter((r) => r.is_active !== false);

  return {
    materialsActive: active.filter((r) => r.item_type === "material").length,
    materialsMissingCost: active.filter(
      (r) =>
        r.item_type === "material" &&
        (r.default_cost == null || Number(r.default_cost) <= 0) &&
        (r.default_sell_price == null || Number(r.default_sell_price) <= 0),
    ).length,
    servicesActive: active.filter((r) => r.item_type === "installation_service").length,
    labourActive: active.filter((r) => r.item_type === "labour").length,
    expiredPrices: active.filter(
      (r) => r.price_valid_to && String(r.price_valid_to) < today,
    ).length,
    expiringPrices: active.filter(
      (r) =>
        r.price_valid_to &&
        String(r.price_valid_to) >= today &&
        String(r.price_valid_to) <= in30,
    ).length,
  };
}
