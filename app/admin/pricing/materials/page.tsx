import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { MaterialsPageShell } from "@/components/admin/pricing/MaterialsPageShell";
import {
  resolvePriceHistoryStatus,
  type PriceHistoryRow,
} from "@/components/admin/pricing/PriceHistory";

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string; active?: string }>;
};

export default async function AdminMaterialsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canManage = canPerform(admin.profile.role, "managePricing");
  const canSeeCost = canPerform(admin.profile.role, "viewCostPrices");
  const { q, category, active } = await searchParams;
  const supabase = await createClient();

  const materialColumns = canSeeCost
    ? "id, item_code, category, name, description, unit, default_cost, default_sell_price, waste_percent, is_active, metadata, pricing_item_id, updated_at"
    : "id, item_code, category, name, description, unit, default_sell_price, waste_percent, is_active, metadata, pricing_item_id, updated_at";

  let query = supabase
    .from("material_items")
    .select(materialColumns as "*")
    .order("category")
    .order("name")
    .limit(200);
  if (q?.trim()) query = query.or(`name.ilike.%${q.trim()}%,item_code.ilike.%${q.trim()}%`);
  if (category) query = query.eq("category", category);
  if (active === "0") query = query.eq("is_active", false);
  else if (active !== "all") query = query.eq("is_active", true);

  const { data, error } = await query;

  let priceHistory: PriceHistoryRow[] = [];
  if (canSeeCost) {
    // Kept resilient: a failure loading recent price history must never take
    // down the materials listing (e.g. right after a large CSV import).
    try {
      const { data: prices } = await supabase
        .from("pricing_item_prices")
        .select(
          "id, cost_price, sell_price, source_type, source_reference, valid_from, valid_to, is_preferred, created_at, supplier_id",
        )
        .order("valid_from", { ascending: false })
        .limit(25);

      const supplierIds = Array.from(
        new Set(
          (prices ?? [])
            .map((row) => row.supplier_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      const supplierNames = new Map<string, string>();
      if (supplierIds.length) {
        const { data: suppliers } = await supabase
          .from("suppliers")
          .select("id, name")
          .in("id", supplierIds);
        for (const s of suppliers ?? []) supplierNames.set(String(s.id), String(s.name));
      }

      priceHistory = (prices ?? []).map((row) => ({
        id: String(row.id),
        costPrice: row.cost_price == null ? null : Number(row.cost_price),
        sellPrice: row.sell_price == null ? null : Number(row.sell_price),
        supplierName: row.supplier_id ? (supplierNames.get(String(row.supplier_id)) ?? null) : null,
        sourceType: String(row.source_type),
        sourceReference: (row.source_reference as string | null) ?? null,
        validFrom: String(row.valid_from),
        validTo: (row.valid_to as string | null) ?? null,
        isPreferred: Boolean(row.is_preferred),
        createdAt: String(row.created_at),
        status: resolvePriceHistoryStatus({
          validFrom: String(row.valid_from),
          validTo: (row.valid_to as string | null) ?? null,
          isPreferred: Boolean(row.is_preferred),
          sourceType: String(row.source_type),
        }),
      }));
    } catch {
      priceHistory = [];
    }
  }

  return (
    <MaterialsPageShell
      canManage={canManage}
      canSeeCost={canSeeCost}
      initialQuery={q ?? ""}
      initialCategory={category ?? ""}
      initialActive={active ?? "1"}
      rows={(data ?? []) as unknown as Array<Record<string, unknown>>}
      errorMessage={error?.message}
      priceHistory={priceHistory}
    />
  );
}
