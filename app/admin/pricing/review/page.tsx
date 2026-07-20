import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/ui";
import { getPricingHubMetrics, searchPricingItems } from "@/lib/pricing/get-pricing-items";
import { PriceStatusBadge } from "@/components/admin/pricing/PriceStatusBadge";
import { formatZar } from "@/lib/estimating/money";

export default async function AdminPricingReviewPage() {
  await requireAdmin({ permission: "viewPricing" });
  const metrics = await getPricingHubMetrics().catch(() => null);
  const expired = await searchPricingItems({ active: true, limit: 200 });
  const attention =
    expired.ok
      ? expired.items.filter((item) =>
          ["expired", "expiring", "missing"].includes(item.priceStatus),
        )
      : [];

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Price Review"
        description="Review expired, expiring and missing prices before quoting."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing & Inventory" }}
      />

      {metrics ? (
        <AdminPanel title="Summary" compact>
          <dl className="admin-dl admin-metric-strip--inline">
            <div>
              <dt>Expired</dt>
              <dd>{metrics.expiredPrices}</dd>
            </div>
            <div>
              <dt>Expiring in 30 days</dt>
              <dd>{metrics.expiringPrices}</dd>
            </div>
            <div>
              <dt>Missing material costs</dt>
              <dd>{metrics.materialsMissingCost}</dd>
            </div>
          </dl>
        </AdminPanel>
      ) : null}

      <AdminPanel title="Items requiring attention">
        {attention.length === 0 ? (
          <AdminEmptyState title="No price review items flagged." compact />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Sell</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attention.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.name}
                      <div className="admin-help-text">{item.itemCode}</div>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      {item.defaultSellPrice != null
                        ? formatZar(item.defaultSellPrice)
                        : "—"}
                    </td>
                    <td>
                      <PriceStatusBadge status={item.priceStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
