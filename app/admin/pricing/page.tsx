import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminButton, AdminPageHeader } from "@/components/admin/ui";
import { getPricingHubMetrics } from "@/lib/pricing/get-pricing-items";
import { PricingSummaryCard } from "@/components/admin/pricing/PricingSummaryCard";

export default async function AdminPricingHubPage() {
  await requireAdmin({ permission: "viewPricing" });
  const metrics = await getPricingHubMetrics().catch(() => ({
    materialsActive: 0,
    materialsMissingCost: 0,
    servicesActive: 0,
    labourActive: 0,
    expiredPrices: 0,
    expiringPrices: 0,
  }));

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Pricing & Inventory"
        description="Inventory, rates and estimating — materials, services, labour, travel and commercial rules used directly in quotations."
        secondaryActions={
          <AdminButton href="/admin/suppliers/" variant="secondary" size="sm">
            Open Suppliers
          </AdminButton>
        }
      />

      <p className="admin-help-text">
        Supplier prices are managed from supplier records.{" "}
        <Link href="/admin/suppliers/">Open Suppliers</Link>
      </p>

      <div className="admin-pricing-hub-grid">
        <PricingSummaryCard
          title="Materials"
          description="Membranes, liners, coatings, geotextile and accessories."
          href="/admin/pricing/materials/"
          actionLabel="Open materials"
          metrics={[
            { label: "Active items", value: metrics.materialsActive },
            { label: "Missing costs", value: metrics.materialsMissingCost },
            { label: "Expired prices", value: metrics.expiredPrices },
          ]}
        />
        <PricingSummaryCard
          title="Services & Installation"
          description="Customer-facing installation and application services."
          href="/admin/pricing/services/"
          metrics={[
            { label: "Active services", value: metrics.servicesActive },
            { label: "Price review", value: metrics.expiringPrices },
          ]}
        />
        <PricingSummaryCard
          title="Labour"
          description="Roles, crew templates, productivity and burdened rates."
          href="/admin/pricing/labour/"
          metrics={[
            { label: "Labour items", value: metrics.labourActive },
          ]}
        />
        <PricingSummaryCard
          title="Travel & Delivery"
          description="Vehicle rates, delivery rules and travel assumptions."
          href="/admin/pricing/travel/"
          metrics={[{ label: "Configure rates", value: "Settings-linked" }]}
        />
        <PricingSummaryCard
          title="Equipment & Site Costs"
          description="Plant, access equipment and site-establishment items."
          href="/admin/pricing/equipment/"
          metrics={[{ label: "Catalogue", value: "Manage items" }]}
        />
        <PricingSummaryCard
          title="Tank Models"
          description="Steel tank catalogue for RFQ matching and quoting."
          href="/admin/pricing/tank-models/"
          metrics={[{ label: "Catalogue", value: "View models" }]}
        />
        <PricingSummaryCard
          title="Estimating Rules"
          description="VAT, markup, allowances and global estimating defaults."
          href="/admin/settings/estimating/"
          metrics={[{ label: "Defaults", value: "Configure" }]}
        />
        <PricingSummaryCard
          title="Price Review"
          description="Expired, expiring and missing prices requiring attention."
          href="/admin/pricing/review/"
          metrics={[
            { label: "Expired", value: metrics.expiredPrices },
            { label: "Expiring (30d)", value: metrics.expiringPrices },
          ]}
        />
        <PricingSummaryCard
          title="CSV Import"
          description="Import materials, labour and supplier prices from templates."
          href="/admin/pricing/import/"
          metrics={[{ label: "Templates", value: "Ready" }]}
        />
      </div>
    </div>
  );
}
