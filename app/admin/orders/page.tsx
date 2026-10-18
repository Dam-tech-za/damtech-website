import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem } from "@/lib/auth/permissions";
import { notFound } from "next/navigation";
import { listCatalogueOrders } from "@/lib/orders/list";
import { ORDER_STATUSES } from "@/lib/orders/types";
import { formatZar } from "@/lib/estimating/money";
import { orderStatusLabel } from "@/lib/admin/labels";
import { Suspense } from "react";
import {
  AdminButton,
  AdminEmptyState,
  AdminErrorState,
  AdminListMemory,
  AdminPagination,
  AdminFilterToolbar,
  AdminPageHeader,
  AdminPanel,
  AdminSearchField,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/ui";

function pageHref(
  filters: { q?: string; status?: string },
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/orders/${query ? `?${query}` : ""}`;
}

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
        description="Fixed-price tank kit orders placed on the website. Orders are invoice-only; open an order to update its status or cancel it."
      />
      <Suspense fallback={null}>
        <AdminListMemory listPath="/admin/orders/" />
      </Suspense>
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
                  {orderStatusLabel(status)}
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
        {result.error ? (
          <AdminErrorState
            title="Orders could not be loaded."
            message="Refresh the page in a moment. If it keeps failing, check System health under Settings."
          />
        ) : result.rows.length === 0 ? (
          <AdminEmptyState
            title={
              filters.q || filters.status
                ? "No orders match these filters."
                : "No orders yet."
            }
          />
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
                    <AdminStatusBadge
                      status={row.status}
                      label={orderStatusLabel(row.status)}
                    />
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
        {!result.error && result.total > result.pageSize ? (
          <AdminPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
          >
            {result.page > 1 ? (
              <AdminButton
                variant="secondary"
                size="sm"
                href={pageHref(filters, result.page - 1)}
              >
                Previous
              </AdminButton>
            ) : null}
            {result.page * result.pageSize < result.total ? (
              <AdminButton
                variant="secondary"
                size="sm"
                href={pageHref(filters, result.page + 1)}
              >
                Next
              </AdminButton>
            ) : null}
          </AdminPagination>
        ) : null}
      </AdminPanel>
    </div>
  );
}
