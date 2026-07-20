import type { SupabaseClient } from "@supabase/supabase-js";

type MaterialRow = {
  id: string;
  item_code: string;
  category: string;
  name: string;
  description: string | null;
  unit: string;
  default_cost: number | null;
  default_sell_price: number | null;
  waste_percent: number | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
};

export async function syncPricingItemFromMaterial(
  supabase: SupabaseClient,
  material: MaterialRow,
  extras: {
    purchaseUnit?: string;
    quoteUnit?: string;
    conversionFactor?: number;
    overlapPercent?: number;
  } = {},
) {
  const quoteUnit = extras.quoteUnit ?? (material.unit === "m2" ? "m²" : material.unit);
  const payload = {
    item_code: material.item_code,
    item_type: "material" as const,
    category: material.category,
    name: material.name,
    short_description: material.description,
    quote_description: material.description ?? material.name,
    purchase_unit: extras.purchaseUnit ?? material.metadata?.purchase_unit ?? material.unit,
    quote_unit: quoteUnit,
    conversion_factor: extras.conversionFactor ?? Number(material.metadata?.conversion_factor ?? 1),
    default_cost: material.default_cost,
    default_sell_price: material.default_sell_price,
    waste_percent: material.waste_percent ?? 0,
    overlap_percent: extras.overlapPercent ?? Number(material.metadata?.overlap_percent ?? 0),
    is_active: material.is_active,
    legacy_material_item_id: material.id,
    metadata: material.metadata ?? {},
  };

  const { data: existing } = await supabase
    .from("pricing_items")
    .select("id")
    .eq("legacy_material_item_id", material.id)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("pricing_items").update(payload).eq("id", existing.id);
    return existing.id;
  }

  const { data: created } = await supabase
    .from("pricing_items")
    .insert(payload)
    .select("id")
    .single();

  return created?.id ?? null;
}
