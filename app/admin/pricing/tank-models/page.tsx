import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminEmptyState, AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import { canPerform } from "@/lib/auth/permissions";
import { TankModelsHeaderActions } from "@/components/admin/pricing/TankModelsHeaderActions";
import {
  TankModelsTable,
  type TankModelListRow,
} from "@/components/admin/pricing/TankModelsTable";

export default async function AdminTankModelsPage() {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const supabase = await createClient();
  const canImport = canPerform(admin.profile.role, "managePricing");
  const canExportCosts = canPerform(admin.profile.role, "viewCostPrices");

  const { data: models } = await supabase
    .from("tank_models")
    .select(
      "id, model_code, model_name, internal_diameter_m, shell_height_m, ring_count, nominal_capacity_kl, usable_capacity_kl, is_active, requires_manual_confirmation, suppliers(name), tank_model_prices(steel_tank_sell_ex_vat_zar, pvc_liner_sell_ex_vat_zar, total_sell_ex_vat_zar, is_current)",
    )
    .order("nominal_capacity_kl");

  type PriceRow = {
    steel_tank_sell_ex_vat_zar: number | null;
    pvc_liner_sell_ex_vat_zar: number | null;
    total_sell_ex_vat_zar: number | null;
    is_current: boolean;
  };
  type ModelRow = {
    id: string;
    model_code: string;
    model_name: string | null;
    internal_diameter_m: number | null;
    shell_height_m: number | null;
    ring_count: number | null;
    nominal_capacity_kl: number | null;
    usable_capacity_kl: number | null;
    is_active: boolean;
    requires_manual_confirmation: boolean | null;
    suppliers: { name: string | null } | null;
    tank_model_prices: PriceRow[];
  };

  const rows: TankModelListRow[] = ((models ?? []) as unknown as ModelRow[]).map((m) => {
    const price = m.tank_model_prices?.find((p) => p.is_current) ?? m.tank_model_prices?.[0] ?? null;
    const total = price?.total_sell_ex_vat_zar ?? null;
    const usable = m.usable_capacity_kl ?? null;
    const perKl = total != null && usable && usable > 0 ? Math.round((total / usable) * 100) / 100 : null;
    return {
      id: m.id,
      modelCode: m.model_code,
      modelName: m.model_name ?? m.model_code,
      diameterM: m.internal_diameter_m,
      heightM: m.shell_height_m,
      ringCount: m.ring_count,
      nominalKl: m.nominal_capacity_kl,
      usableKl: usable,
      steelSell: price?.steel_tank_sell_ex_vat_zar ?? null,
      linerSell: price?.pvc_liner_sell_ex_vat_zar ?? null,
      totalSell: total,
      perKl,
      supplierName: m.suppliers?.name ?? null,
      isActive: m.is_active,
      requiresManualConfirmation: Boolean(m.requires_manual_confirmation),
      hasCurrentPrice: Boolean(price),
    };
  });

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Tank Models"
        description="Steel tank catalogue for RFQ matching and quoting. Steel structure and PVC liner pricing are stored separately."
        secondaryActions={
          <TankModelsHeaderActions canImport={canImport} canExportCosts={canExportCosts} />
        }
      />

      <AdminPanel title="Catalogue">
        {rows.length === 0 ? (
          <AdminEmptyState
            title="No tank models loaded."
            description={
              canImport
                ? "Import the Damtech tank-model CSV to populate the catalogue for RFQ matching and quoting."
                : "Tank models will appear here once an estimator imports the catalogue."
            }
          />
        ) : (
          <TankModelsTable rows={rows} />
        )}
      </AdminPanel>
    </div>
  );
}
