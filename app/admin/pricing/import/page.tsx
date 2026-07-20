import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import {
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/ui";
import { CsvImportClient } from "@/components/admin/pricing/CsvImportClient";

export default async function AdminPricingImportPage() {
  const admin = await requireAdmin({ permission: "viewPricing" });
  const canImport = canPerform(admin.profile.role, "managePricing");
  const canExportCosts = canPerform(admin.profile.role, "viewCostPrices");

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="CSV Import & Export"
        description="Import materials, labour, supplier prices and travel rates. Cost columns are only included for authorised roles."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing & Inventory" }}
      />

      <AdminPanel title="Templates">
        <div className="admin-panel__actions">
          <AdminButton href="/admin/pricing/import/templates/materials.csv" variant="secondary" size="sm">
            Materials template
          </AdminButton>
          <AdminButton href="/admin/pricing/import/templates/labour.csv" variant="secondary" size="sm">
            Labour template
          </AdminButton>
          <AdminButton href="/admin/pricing/import/templates/supplier-prices.csv" variant="secondary" size="sm">
            Supplier prices template
          </AdminButton>
          <AdminButton href="/admin/pricing/import/templates/travel-vehicles.csv" variant="secondary" size="sm">
            Travel vehicles template
          </AdminButton>
        </div>
        <p className="admin-help-text" style={{ marginTop: "0.75rem" }}>
          Download a template, complete rows offline, then upload for validation and preview before
          import. Imports are transactional — invalid files are rejected without partial writes.
        </p>
      </AdminPanel>

      {canImport ? (
        <CsvImportClient canExportCosts={canExportCosts} canImport />
      ) : (
        <>
          <CsvImportClient canExportCosts={canExportCosts} canImport={false} />
          <AdminEmptyState
            title="Import requires pricing management permission."
            description="You can still export sell-price catalogues. Cost columns remain masked."
          />
        </>
      )}
    </div>
  );
}
