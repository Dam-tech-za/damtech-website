import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem } from "@/lib/auth/permissions";
import { notFound } from "next/navigation";
import { listCatalogueOrders } from "@/lib/orders/list";
import { ORDER_STATUSES } from "@/lib/orders/types";
import { formatZar } from "@/lib/estimating/money";
import {
  AdminEmptyState,
  AdminFilterToolbar,
  AdminPageHeader,
  AdminPanel,
  AdminSearchField,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/ui";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "orders")) notFound();
  const filters = await searchParams;
  const result = await listCatalogueOrders(filters);

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Orders"
        description="Fixed-price catalogue orders awaiting invoice, payment or collection."
      />
      <AdminFilterToolbar>
        <form className="admin-filter-toolbar__form" method="get">
          <AdminSearchField
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Reference, customer, SKU"
            label="Search orders"
          />
          <label className="admin-filter-field">
            <span className="sr-only">Status</span>
            <AdminSelect name="status" defaultValue={filters.status ?? ""} aria-label="Status">
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </AdminSelect>
          </label>
          <button type="submit" className="admin-btn admin-btn--secondary">
            Filter
          </button>
        </form>
      </AdminFilterToolbar>
      <AdminPanel>
        {result.rows.length === 0 ? (
          <AdminEmptyState title="No orders" />
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.order_reference}</td>
                  <td>
                    <div>{row.customer_name}</div>
                    <div className="admin-empty__hint">{row.email}</div>
                  </td>
                  <td>
                    {row.product_name_snapshot}
                    <div className="admin-empty__hint">{row.sku}</div>
                  </td>
                  <td>{row.quantity}</td>
                  <td>{formatZar(Number(row.total_price_snapshot))}</td>
                  <td>
                    <AdminStatusBadge status={row.status} />
                  </td>
                  <td>{new Date(row.created_at).toLocaleString("en-ZA")}</td>
                  <td>
                    <Link href={`/admin/orders/${row.id}/`}>View order</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminPanel>
    </div>
  );
}
