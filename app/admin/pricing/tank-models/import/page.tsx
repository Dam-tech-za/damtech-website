import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { AdminPageHeader } from "@/components/admin/ui";
import { TankImportWizard } from "@/components/admin/pricing/TankImportWizard";

export default async function AdminTankModelsImportPage() {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canImport = canPerform(admin.profile.role, "managePricing");
  const canExportCosts = canPerform(admin.profile.role, "viewCostPrices");

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Import tank models CSV"
        description="Upload, validate and import corrugated steel reservoir and tank models with separate steel, liner and option pricing."
        primaryAction={{
          href: "/admin/pricing/tank-models/import/templates/damtech-tank-models-template.csv/",
          label: "Download template",
        }}
        secondaryAction={{
          href: "/admin/pricing/tank-models/import/history/",
          label: "Import history",
        }}
      />

      <TankImportWizard canImport={canImport} canExportCosts={canExportCosts} />
    </div>
  );
}
