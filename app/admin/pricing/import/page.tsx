import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { AdminButton, AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { InventoryImportWizard } from "@/components/admin/pricing/InventoryImportWizard";

export default async function AdminPricingImportPage() {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canImport = canPerform(admin.profile.role, "managePricing");
  const canExportCosts = canPerform(admin.profile.role, "viewCostPrices");

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Import inventory CSV"
        description="Upload Damtech inventory into the unified pricing catalogue used by Add from Inventory in the quote builder."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing & Inventory" }}
        secondaryActions={
          <>
            <AdminButton
              href="/admin/pricing/import/templates/damtech-inventory-import-template.csv"
              variant="secondary"
              size="sm"
            >
              Download template
            </AdminButton>
            <AdminButton
              href="/admin/pricing/import/templates/damtech_inventory_import_starter.csv"
              variant="outline"
              size="sm"
            >
              Starter CSV
            </AdminButton>
            <AdminButton href="/admin/pricing/import/history/" variant="outline" size="sm">
              History
            </AdminButton>
          </>
        }
      />

      <AdminPanel title="Instructions">
        <ol className="admin-list">
          <li>Download the template or use your Damtech starter CSV format.</li>
          <li>Upload the file, confirm column mapping, then preview validation.</li>
          <li>Choose how duplicates and invalid rows are handled.</li>
          <li>Confirm import — items appear in Pricing and Add from Inventory.</li>
        </ol>
        <p className="admin-help-text" style={{ marginTop: "0.75rem" }}>
          Guide:{" "}
          <a href="/admin/pricing/import/templates/damtech-inventory-import-guide.md">
            damtech-inventory-import-guide.md
          </a>
          . Costs and sell prices are ex VAT. Price changes create history versions.
        </p>
      </AdminPanel>

      <InventoryImportWizard canImport={canImport} canExportCosts={canExportCosts} />
    </div>
  );
}
