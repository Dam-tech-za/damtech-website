import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminEmptyState, AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { searchPricingItems } from "@/lib/pricing/get-pricing-items";

export default async function AdminPricingEquipmentPage() {
  await requireAdmin({ permission: "viewPricing" });
  const result = await searchPricingItems({
    itemType: ["equipment", "site_establishment"],
    active: true,
    limit: 100,
  });

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Equipment & Site Costs"
        description="Plant, access equipment, site establishment and related quotable site costs."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing & Inventory" }}
      />
      <AdminPanel title="Catalogue items">
        {!result.ok || result.items.length === 0 ? (
          <AdminEmptyState
            title="No equipment or site-cost items yet."
            description="Create equipment and site-establishment items in the pricing catalogue to quote them directly."
          />
        ) : (
          <ul className="admin-list">
            {result.items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> · {item.itemCode}
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
