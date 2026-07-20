import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { MaterialsPageShell } from "@/components/admin/pricing/MaterialsPageShell";

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string; active?: string }>;
};

export default async function AdminMaterialsPage({ searchParams }: PageProps) {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canManage = canPerform(admin.profile.role, "managePricing");
  const canSeeCost = canPerform(admin.profile.role, "viewCostPrices");
  const { q, category, active } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("material_items")
    .select("*")
    .order("category")
    .order("name")
    .limit(200);
  if (q?.trim()) query = query.or(`name.ilike.%${q.trim()}%,item_code.ilike.%${q.trim()}%`);
  if (category) query = query.eq("category", category);
  if (active === "0") query = query.eq("is_active", false);
  else if (active !== "all") query = query.eq("is_active", true);

  const { data, error } = await query;

  return (
    <MaterialsPageShell
      canManage={canManage}
      canSeeCost={canSeeCost}
      initialQuery={q ?? ""}
      initialCategory={category ?? ""}
      initialActive={active ?? "1"}
      rows={(data ?? []) as Array<Record<string, unknown>>}
      errorMessage={error?.message}
    />
  );
}
