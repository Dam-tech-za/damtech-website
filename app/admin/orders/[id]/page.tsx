import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { getCatalogueOrder } from "@/lib/orders/list";
import { ORDER_STATUSES } from "@/lib/orders/types";
import { formatZar } from "@/lib/estimating/money";
import { DELIVERY_FULFILMENT } from "@/lib/orders/delivery";
import {
  updateOrderStatusAction,
} from "../actions";
import { ResendOrderConfirmationButton } from "@/components/admin/ResendOrderConfirmationButton";
import { createClient } from "@/lib/supabase/server";
import {
  communicationStatusLabel,
  orderStatusLabel,
} from "@/lib/admin/labels";
import {
  AdminActionForm,
  AdminBackLink,
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminSubmitButton,
} from "@/components/admin/ui";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  });
}

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "orders")) notFound();
  const { id } = await params;
  const order = await getCatalogueOrder(id);
  if (!order) notFound();

  const supabase = await createClient();
  const { data: history } = await supabase
    .from("audit_log")
    .select("id, action, actor_email, before_data, after_data, created_at")
    .eq("entity_type", "catalogue_order")
    .eq("entity_id", order.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="admin-stack--page">
      <AdminBackLink listPath="/admin/orders/" label="Back to orders" />
      <AdminPageHeader
        title={order.order_reference}
        description={`${order.product_name_snapshot} · ${order.sku} · placed ${formatDateTime(order.created_at)}`}
        toolbar={
          <AdminStatusBadge
            status={order.status}
            label={orderStatusLabel(order.status)}
          />
        }
      />
      <AdminPanel
        title="Status"
        description="Orders are invoice-only: nothing is charged online. Move the order through invoicing, payment and delivery here."
      >
        {canPerform(admin.profile.role, "manageOrders") ? (
          <>
            <AdminActionForm action={updateOrderStatusAction} className="admin-inline-form">
              <input type="hidden" name="id" value={order.id} />
              <AdminSelect
                name="status"
                defaultValue={order.status}
                aria-label="Order status"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {orderStatusLabel(status)}
                  </option>
                ))}
              </AdminSelect>
              <AdminSubmitButton>Update status</AdminSubmitButton>
            </AdminActionForm>
            {order.status !== "cancelled" ? (
              <AdminActionForm
                action={updateOrderStatusAction}
                confirmMessage={`Cancel order ${order.order_reference}? The customer is not emailed automatically.`}
              >
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="status" value="cancelled" />
                <AdminSubmitButton variant="danger" pendingLabel="Cancelling…">
                  Cancel order
                </AdminSubmitButton>
              </AdminActionForm>
            ) : null}
            <ResendOrderConfirmationButton orderId={order.id} />
          </>
        ) : (
          <p>{orderStatusLabel(order.status)}</p>
        )}
        <p className="admin-empty__hint">
          Customer confirmation email:{" "}
          {communicationStatusLabel(order.confirmation_email_status)}. Email to
          Damtech: {communicationStatusLabel(order.internal_email_status)}.
        </p>
      </AdminPanel>
      <AdminPanel title="Customer">
        <dl className="admin-kv">
          <div>
            <dt>Type</dt>
            <dd>{order.customer_type}</dd>
          </div>
          <div>
            <dt>Name</dt>
            <dd>{order.customer_name}</dd>
          </div>
          <div>
            <dt>Business</dt>
            <dd>{order.business_name || "—"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{order.email}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{order.phone}</dd>
          </div>
          <div>
            <dt>VAT number</dt>
            <dd>{order.vat_number || "—"}</dd>
          </div>
          <div>
            <dt>Customer PO</dt>
            <dd>{order.customer_po_number || "—"}</dd>
          </div>
        </dl>
      </AdminPanel>
      <AdminPanel title="Delivery address">
        <p>
          {order.billing_line1}
          {order.billing_line2 ? `, ${order.billing_line2}` : ""}
          <br />
          {order.billing_suburb}, {order.billing_city}
          <br />
          {order.billing_province} {order.billing_postal_code}
        </p>
      </AdminPanel>
      <AdminPanel title="Order">
        <dl className="admin-kv">
          <div>
            <dt>Quantity</dt>
            <dd>{order.quantity}</dd>
          </div>
          <div>
            <dt>Unit incl. VAT</dt>
            <dd>{formatZar(Number(order.unit_price_snapshot))}</dd>
          </div>
          <div>
            <dt>VAT</dt>
            <dd>{formatZar(Number(order.vat_amount_snapshot))}</dd>
          </div>
          <div>
            <dt>Total incl. VAT</dt>
            <dd>{formatZar(Number(order.total_price_snapshot))}</dd>
          </div>
          <div>
            <dt>Fulfilment</dt>
            <dd>{DELIVERY_FULFILMENT.label}</dd>
          </div>
          <div>
            <dt>Delivery instructions</dt>
            <dd>{order.notes || "—"}</dd>
          </div>
          <div>
            <dt>Supply-only confirmed</dt>
            <dd>{formatDateTime(order.terms_accepted_at)}</dd>
          </div>
          <div>
            <dt>Exclusions confirmed</dt>
            <dd>{formatDateTime(order.exclusions_accepted_at)}</dd>
          </div>
          <div>
            <dt>Policies accepted</dt>
            <dd>{formatDateTime(order.privacy_accepted_at)}</dd>
          </div>
        </dl>
      </AdminPanel>
      <AdminPanel title="History">
        {(history ?? []).length === 0 ? (
          <AdminEmptyState title="No changes recorded yet." compact />
        ) : (
          <ol className="admin-timeline">
            {(history ?? []).map((entry) => {
              const before = (entry.before_data ?? {}) as { status?: string };
              const after = (entry.after_data ?? {}) as { status?: string };
              return (
                <li key={entry.id}>
                  <strong>
                    {entry.action === "order.status_changed"
                      ? `Status: ${orderStatusLabel(before.status)} → ${orderStatusLabel(after.status)}`
                      : entry.action.replace(/[._]/g, " ")}
                  </strong>
                  <span className="admin-muted">
                    {" "}
                    · {formatDateTime(entry.created_at)}
                    {entry.actor_email ? ` · ${entry.actor_email}` : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </AdminPanel>
    </div>
  );
}
