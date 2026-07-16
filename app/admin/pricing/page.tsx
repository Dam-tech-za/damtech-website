import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AdminPageHeader,
  SettingsNavCard,
} from "@/components/admin/ui";

export default async function AdminPricingHubPage() {
  await requireAdmin({ permission: "viewPricing" });

  const categories = [
    {
      href: "/admin/pricing/materials/",
      title: "Materials",
      description:
        "Geomembrane, geotextile, fittings and consumables with cost and sell prices.",
      meta: "Material library",
    },
    {
      href: "/admin/pricing/labour/",
      title: "Labour",
      description:
        "Crew rates, productivity and installation labour items for estimating.",
      meta: "Labour rates",
    },
    {
      href: "/admin/pricing/travel/",
      title: "Travel & delivery",
      description:
        "Kilometre rates, delivery defaults and travel labour assumptions.",
      meta: "Travel inputs",
    },
    {
      href: "/admin/pricing/tank-models/",
      title: "Tank models",
      description:
        "Corrugated steel tank catalogue used for RFQ matching and quoting.",
      meta: "Catalogue",
    },
    {
      href: "/admin/pricing/suppliers/",
      title: "Suppliers",
      description:
        "Supplier contacts, preferred vendors and price-list validity.",
      meta: "Vendor pricing",
    },
    {
      href: "/admin/settings/estimating/",
      title: "Estimating settings",
      description:
        "VAT, markup, allowances and default estimating preferences.",
      meta: "Defaults",
    },
  ];

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Pricing"
        description="Manage materials, labour, travel and estimating inputs."
      />

      <div className="admin-settings-grid">
        {categories.map((item) => (
          <SettingsNavCard
            key={item.href}
            href={item.href}
            title={item.title}
            description={item.description}
            meta={item.meta}
          />
        ))}
      </div>
    </div>
  );
}
