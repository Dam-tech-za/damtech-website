import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { AdminPageHeader } from "@/components/admin/ui";
import { InventoryImportWizard } from "@/components/admin/pricing/InventoryImportWizard";

export default async function AdminPricingImportPage() {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canImport = canPerform(admin.profile.role, "managePricing");
  const canExportCosts = canPerform(admin.profile.role, "viewCostPrices");

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Import inventory CSV"
        description="Upload, validate and import catalogue items into Damtech Pricing and Add from Inventory."
        primaryAction={{
          href: "/admin/pricing/import/templates/damtech-inventory-import-template.csv",
          label: "Download template",
        }}
        secondaryAction={{ href: "/admin/pricing/import/history/", label: "Import history" }}
      />

      <InventoryImportWizard canImport={canImport} canExportCosts={canExportCosts} />
    </div>
  );
}
