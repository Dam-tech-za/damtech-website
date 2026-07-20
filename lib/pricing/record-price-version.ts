import type { SupabaseClient } from "@supabase/supabase-js";

type PriceVersionInput = {
  pricingItemId: string;
  costPrice: number | null;
  sellPrice: number | null;
  supplierId?: string | null;
  sourceType?: string;
  sourceReference?: string | null;
  validFrom?: string;
  createdBy?: string | null;
};

/**
 * Creates a new preferred price version without mutating historical rows.
 * Previous preferred rows for the item are marked non-preferred and closed.
 */
export async function recordPriceVersion(
  supabase: SupabaseClient,
  input: PriceVersionInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const validFrom = input.validFrom ?? today;

  const { data: current } = await supabase
    .from("pricing_item_prices")
    .select("id")
    .eq("pricing_item_id", input.pricingItemId)
    .eq("is_preferred", true)
    .maybeSingle();

  if (current?.id) {
    await supabase
      .from("pricing_item_prices")
      .update({
        is_preferred: false,
        valid_to: validFrom,
      })
      .eq("id", current.id);
  }

  const { data, error } = await supabase
    .from("pricing_item_prices")
    .insert({
      pricing_item_id: input.pricingItemId,
      cost_price: input.costPrice,
      sell_price: input.sellPrice,
      supplier_id: input.supplierId ?? null,
      source_type: input.sourceType ?? "manual",
      source_reference: input.sourceReference ?? null,
      valid_from: validFrom,
      is_preferred: true,
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to record price version." };
  }

  return { ok: true, id: data.id };
}
