import type { SupabaseClient } from "@supabase/supabase-js";
import { recordPriceVersion } from "./record-price-version";
import { normaliseUnitCode } from "./units";

export type LabourRow = {
  id: string;
  item_code: string;
  category: string;
  name: string;
  unit: string;
  hourly_cost: number | null;
  unit_cost: number | null;
  daily_cost?: number | null;
  sell_rate?: number | null;
  burden_percent?: number | null;
  productivity_rate: number | null;
  productivity_unit: string | null;
  notes: string | null;
  is_active: boolean;
  pricing_item_id?: string | null;
};

function resolveItemType(category: string): "labour" | "installation_service" {
  return category.toLowerCase().includes("install")
    ? "installation_service"
    : "labour";
}

function resolveCost(labour: LabourRow): number | null {
  if (labour.unit_cost != null && labour.unit_cost > 0) return Number(labour.unit_cost);
  if (labour.hourly_cost != null && labour.hourly_cost > 0) return Number(labour.hourly_cost);
  if (labour.daily_cost != null && labour.daily_cost > 0) return Number(labour.daily_cost);
  return null;
}

/** Create or update the linked pricing_items row for a labour record. */
export async function syncPricingItemFromLabour(
  supabase: SupabaseClient,
  labour: LabourRow,
  extras: { actorUserId?: string | null; recordPrice?: boolean } = {},
): Promise<string | null> {
  const quoteUnit = normaliseUnitCode(labour.unit || "hour");
  const itemType = resolveItemType(labour.category);
  const cost = resolveCost(labour);
  const sell =
    labour.sell_rate != null && labour.sell_rate > 0 ? Number(labour.sell_rate) : null;

  const payload = {
    item_code: labour.item_code,
    item_type: itemType,
    category: labour.category,
    name: labour.name,
    short_description: labour.notes,
    quote_description: labour.name,
    internal_description: labour.notes,
    purchase_unit: quoteUnit,
    quote_unit: quoteUnit,
    conversion_factor: 1,
    default_cost: cost,
    default_sell_price: sell,
    pricing_method:
      labour.productivity_rate != null ? ("labour_productivity" as const) : ("unit_rate" as const),
    productivity_rate: labour.productivity_rate,
    productivity_unit: labour.productivity_unit,
    tax_category: "standard",
    is_active: labour.is_active,
    legacy_labour_item_id: labour.id,
    metadata: {
      hourly_cost: labour.hourly_cost,
      unit_cost: labour.unit_cost,
      daily_cost: labour.daily_cost ?? null,
      burden_percent: labour.burden_percent ?? 0,
      notes: labour.notes,
    },
  };

  let pricingItemId = labour.pricing_item_id ?? null;

  if (!pricingItemId) {
    const { data: byLegacy } = await supabase
      .from("pricing_items")
      .select("id")
      .eq("legacy_labour_item_id", labour.id)
      .maybeSingle();
    pricingItemId = byLegacy?.id ?? null;
  }

  if (pricingItemId) {
    const { error } = await supabase
      .from("pricing_items")
      .update(payload)
      .eq("id", pricingItemId);
    if (error) {
      console.error("[pricing] labour catalogue update failed:", error.message);
      return null;
    }
  } else {
    const { data: created, error } = await supabase
      .from("pricing_items")
      .insert(payload)
      .select("id")
      .single();
    if (error || !created) {
      console.error("[pricing] labour catalogue create failed:", error?.message);
      return null;
    }
    pricingItemId = created.id;
  }

  await supabase
    .from("labour_items")
    .update({ pricing_item_id: pricingItemId })
    .eq("id", labour.id);

  if (pricingItemId && extras.recordPrice !== false && (cost != null || sell != null)) {
    await recordPriceVersion(supabase, {
      pricingItemId,
      costPrice: cost,
      sellPrice: sell,
      sourceType: "labour_sync",
      sourceReference: labour.item_code,
      createdBy: extras.actorUserId ?? null,
    });
  }

  return pricingItemId;
}

export type LabourSyncResult = {
  checked: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
};

/** Reconcile all labour rows with the unified catalogue. */
export async function reconcileLabourCatalogue(
  supabase: SupabaseClient,
): Promise<LabourSyncResult> {
  const result: LabourSyncResult = {
    checked: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const { data: labourRows, error } = await supabase
    .from("labour_items")
    .select("*")
    .order("item_code");

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  for (const row of labourRows ?? []) {
    result.checked += 1;
    const labour = row as LabourRow;
    const hadLink = Boolean(labour.pricing_item_id);
    try {
      const id = await syncPricingItemFromLabour(supabase, labour, {
        recordPrice: false,
      });
      if (!id) {
        result.failed += 1;
        result.errors.push(`${labour.item_code}: sync returned null`);
        continue;
      }
      if (hadLink) result.updated += 1;
      else result.created += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push(
        `${labour.item_code}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  return result;
}
