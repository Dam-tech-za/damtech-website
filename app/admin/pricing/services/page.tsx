import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminEmptyState, AdminPageHeader, AdminPanel } from "@/components/admin/ui";
import { searchPricingItems } from "@/lib/pricing/get-pricing-items";

export default async function AdminPricingServicesPage() {
  await requireAdmin({ permission: "viewPricing" });
  const result = await searchPricingItems({
    itemType: "installation_service",
    active: true,
    limit: 100,
  });

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Services & Installation"
        description="Installation and application services quoted to customers by area, item or fixed price."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing & Inventory" }}
      />
      <AdminPanel title="Active services">
        {!result.ok || result.items.length === 0 ? (
          <AdminEmptyState
            title="No installation services in the catalogue yet."
            description="Add service items through the unified pricing catalogue or migrate existing labour/installation records."
          />
        ) : (
          <ul className="admin-list">
            {result.items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> · {item.itemCode} · {item.quoteUnit}
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
