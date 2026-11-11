import { courierStatusSummary } from "@/lib/courier";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem } from "@/lib/auth/permissions";
import { orderStatusLabel } from "@/lib/admin/labels";
import { formatZar } from "@/lib/estimating/money";
import { fulfilmentLabel, isCollectionMethod } from "@/lib/shop/delivery";
import { listOnlinePurchases, type OnlinePurchaseRow } from "@/lib/orders/list";
import {
  isPurchaseStage,
  makeByDate,
  PURCHASE_STAGE_LABELS,
  PURCHASE_STAGES,
  purchaseStage,
  type PurchaseStage,
} from "@/lib/orders/purchase-stage";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminListMemory,
  AdminPageHeader,
  AdminPanel,
  AdminSearchField,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/ui";

export const metadata: Metadata = { title: "Online Purchases" };

const LIST_PATH = "/admin/operations/online-purchases/";
const OPEN_STAGES: PurchaseStage[] = ["to_make", "ready", "dispatched"];

type PageProps = { searchParams: Promise<{ q?: string; stage?: string }> };

function shortDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value.length === 10 ? `${value}T12:00:00+02:00` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "Africa/Johannesburg" });
}

function amountDue(row: OnlinePurchaseRow): number {
  return row.amount_due_snapshot == null
    ? Number(row.total_price_snapshot) + Number(row.delivery_fee_snapshot ?? 0)
    : Number(row.amount_due_snapshot);
}

function paymentLabel(row: OnlinePurchaseRow): { status: string; label: string } {
  if (row.payment_method === "payfast") {
    if (row.payment_status === "paid") return { status: "paid", label: "Paid on PayFast" };
    if (row.payment_status === "failed") return { status: "failed", label: "Payment failed" };
    if (row.payment_status === "cancelled") return { status: "cancelled", label: "Payment cancelled" };
    return { status: "pending", label: "PayFast pending" };
  }
  return { status: row.status, label: `Invoice · ${orderStatusLabel(row.status)}` };
}

function stageHref(stage: string, q: string): string {
  const params = new URLSearchParams();
  if (stage) params.set("stage", stage);
  if (q) params.set("q", q);
  const query = params.toString();
  return `${LIST_PATH}${query ? `?${query}` : ""}`;
}

export default async function OnlinePurchasesPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "online-purchases")) notFound();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const stageFilter = sp.stage === "all" || (sp.stage && isPurchaseStage(sp.stage)) ? sp.stage : "";
  const { rows, error } = await listOnlinePurchases();

  const staged = rows.map((row) => ({ row, stage: purchaseStage(row) }));
  const counts = new Map<string, number>();
  for (const { stage } of staged) counts.set(stage, (counts.get(stage) ?? 0) + 1);
  const openCount = OPEN_STAGES.reduce((sum, stage) => sum + (counts.get(stage) ?? 0), 0);

  const needle = q.toLowerCase();
  const visible = staged.filter(({ row, stage }) => {
    if (stageFilter === "" ? !OPEN_STAGES.includes(stage) : stageFilter !== "all" && stage !== stageFilter) return false;
    if (!needle) return true;
    return [row.order_reference, row.customer_name, row.email, row.sku, row.product_name_snapshot, row.tracking_number ?? ""]
      .some((value) => value.toLowerCase().includes(needle));
  });

  const filters = [
    { id: "", label: `To do (${openCount})` },
    ...PURCHASE_STAGES.map((stage) => ({ id: stage, label: `${PURCHASE_STAGE_LABELS[stage]} (${counts.get(stage) ?? 0})` })),
    { id: "all", label: `All (${rows.length})` },
  ];

  return (
    <div className="admin-stack--page ops ops-projects-page">
      <AdminPageHeader title="Online Purchases" description="Every shop order, by stage." />
      <Suspense fallback={null}>
        <AdminListMemory listPath={LIST_PATH} />
      </Suspense>

      {error ? (
        <AdminErrorState title="Online purchases could not be loaded." message="Refresh in a moment." />
      ) : (
        <AdminPanel className="admin-panel--board">
          <div className="ops-purchases__toolbar">
            <nav className="ops-filter" aria-label="Order stage">
              {filters.map((filter) => (
                <Link
                  key={filter.id || "todo"}
                  href={stageHref(filter.id, q)}
                  className={`ops-filter__link${filter.id === stageFilter ? " ops-filter__link--active" : ""}`}
                  aria-current={filter.id === stageFilter ? "page" : undefined}
                >
                  {filter.label}
                </Link>
              ))}
            </nav>
            <form method="get" className="ops-purchases__search">
              {stageFilter ? <input type="hidden" name="stage" value={stageFilter} /> : null}
              <AdminSearchField name="q" defaultValue={q} placeholder="Reference, customer, SKU, tracking" label="Search online purchases" />
            </form>
          </div>

          {visible.length === 0 ? (
            <AdminEmptyState
              title={rows.length === 0 ? "No online purchases yet." : "No orders in this view."}
              compact
            />
          ) : (
            <AdminTable caption="Online purchases" className="ops-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Product</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Payment</th>
                  <th scope="col">Delivery or collection</th>
                  <th scope="col">Courier and tracking</th>
                  <th scope="col">Dates</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ row, stage }) => {
                  const payment = paymentLabel(row);
                  const makeBy = stage === "to_make" ? makeByDate(row) : null;
                  return (
                    <tr key={row.id}>
                      <td data-label="Order">
                        <Link href={`/admin/orders/${row.id}/`} className="ops-table__title">
                          {row.order_reference}
                        </Link>
                        <span className="ops-table__meta">
                          {row.customer_name} · {row.phone}
                        </span>
                      </td>
                      <td data-label="Product">
                        {row.quantity} × {row.product_name_snapshot}
                        <span className="ops-table__meta">{row.sku}</span>
                      </td>
                      <td data-label="Stage">
                        <AdminStatusBadge status={stage} label={PURCHASE_STAGE_LABELS[stage]} />
                      </td>
                      <td data-label="Payment">
                        <AdminStatusBadge status={payment.status} label={payment.label} />
                        <span className="ops-table__meta">{formatZar(amountDue(row))}</span>
                      </td>
                      <td data-label="Delivery or collection">
                        {isCollectionMethod(row.fulfilment_method)
                          ? fulfilmentLabel(row.fulfilment_method, row.billing_province)
                          : row.billing_city}
                        <span className="ops-table__meta">
                          {isCollectionMethod(row.fulfilment_method) ? "Customer collects" : row.billing_province}
                        </span>
                      </td>
                      <td data-label="Courier and tracking">
                        {row.courier_name || row.tracking_number ? (
                          <>
                            {row.courier_name || "Courier not set"}
                            <span className="ops-table__meta">
                              {row.tracking_url ? (
                                <a href={row.tracking_url} target="_blank" rel="noopener noreferrer">
                                  {row.tracking_number || "Track parcel"}
                                </a>
                              ) : (
                                row.tracking_number || "No tracking number"
                              )}
                            </span>
                            {row.courier_status ? (
                              <span className="ops-table__meta">
                                {courierStatusSummary(row.courier_status, row.courier_last_message)}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td data-label="Dates">
                        Ordered {shortDate(row.created_at)}
                        <span className="ops-table__meta">
                          {row.delivered_on
                            ? `Delivered ${shortDate(row.delivered_on)}`
                            : row.dispatched_on
                              ? `Dispatched ${shortDate(row.dispatched_on)}${row.expected_delivery_on ? `, due ${shortDate(row.expected_delivery_on)}` : ""}`
                              : makeBy
                                ? `Make by ${shortDate(makeBy)}`
                                : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </AdminTable>
          )}
        </AdminPanel>
      )}
    </div>
  );
}
