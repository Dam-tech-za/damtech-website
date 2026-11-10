import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { getCatalogueOrder } from "@/lib/orders/list";
import { ORDER_STATUSES } from "@/lib/orders/types";
import { formatZar } from "@/lib/estimating/money";
import { DELIVERY_FULFILMENT } from "@/lib/orders/delivery";
import { fulfilmentLabel, isCollectionMethod } from "@/lib/shop/delivery";
import { updateOrderStatusAction, updateOrderTrackingAction } from "../actions";
import { PURCHASE_STAGE_LABELS, makeByDate, purchaseStage } from "@/lib/orders/purchase-stage";
import { ResendOrderConfirmationButton } from "@/components/admin/ResendOrderConfirmationButton";
import { createClient } from "@/lib/supabase/server";
import {
  communicationStatusLabel,
  orderStatusLabel,
} from "@/lib/admin/labels";
import {
  AdminActionForm,
  AdminBackLink,
  AdminDateInput,
  AdminInput,
  AdminTextarea,
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

  const makeBy = makeByDate(order);

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
      <AdminBackLink listPath="/admin/operations/online-purchases/" label="Back to online purchases" />
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
        description={
          order.payment_method === "payfast"
            ? "Paid online through PayFast. Move the order through manufacture and delivery here."
            : "Invoice order: nothing is charged online. Move the order through invoicing, payment and delivery here."
        }
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
      <AdminPanel
        title="Payment"
        description={`Stage: ${PURCHASE_STAGE_LABELS[purchaseStage(order)]}${makeBy && !order.dispatched_on ? `. Make by ${formatDateTime(makeBy.toISOString())}` : ""}`}
      >
        <dl className="admin-kv">
          <div>
            <dt>Method</dt>
            <dd>{order.payment_method === "payfast" ? "PayFast" : "Invoice"}</dd>
          </div>
          <div>
            <dt>Payment status</dt>
            <dd>{order.payment_method === "payfast" ? (order.payment_status ?? "—") : "On invoice"}</dd>
          </div>
          <div>
            <dt>Goods incl. VAT</dt>
            <dd>{formatZar(Number(order.total_price_snapshot))}</dd>
          </div>
          <div>
            <dt>Delivery incl. VAT</dt>
            <dd>{order.delivery_fee_snapshot == null ? "On invoice" : formatZar(Number(order.delivery_fee_snapshot))}</dd>
          </div>
          <div>
            <dt>Amount paid</dt>
            <dd>{order.amount_paid == null ? "—" : formatZar(Number(order.amount_paid))}</dd>
          </div>
          <div>
            <dt>Paid at</dt>
            <dd>{formatDateTime(order.paid_at)}</dd>
          </div>
          <div>
            <dt>PayFast payment ID</dt>
            <dd>{order.payfast_payment_id || "—"}</dd>
          </div>
        </dl>
      </AdminPanel>
      <AdminPanel
        title="Delivery and tracking"
        description="Record the courier booking here. The customer is not emailed automatically."
      >
        {canPerform(admin.profile.role, "manageOrders") ? (
          <AdminActionForm action={updateOrderTrackingAction} className="ops-track-form">
            <input type="hidden" name="id" value={order.id} />
            <label>
              <span>Courier</span>
              <AdminInput name="courier_name" defaultValue={order.courier_name ?? ""} maxLength={80} list="order-couriers" />
              <datalist id="order-couriers">
                <option value="The Courier Guy" />
                <option value="Damtech delivery" />
              </datalist>
            </label>
            <label>
              <span>Tracking number</span>
              <AdminInput name="tracking_number" defaultValue={order.tracking_number ?? ""} maxLength={80} />
            </label>
            <label className="ops-track-form__wide">
              <span>Tracking link</span>
              <AdminInput name="tracking_url" type="url" defaultValue={order.tracking_url ?? ""} maxLength={500} placeholder="https://" />
            </label>
            <label>
              <span>Dispatched on</span>
              <AdminDateInput name="dispatched_on" defaultValue={order.dispatched_on ?? ""} />
            </label>
            <label>
              <span>Expected delivery</span>
              <AdminDateInput name="expected_delivery_on" defaultValue={order.expected_delivery_on ?? ""} />
            </label>
            <label>
              <span>Delivered on</span>
              <AdminDateInput name="delivered_on" defaultValue={order.delivered_on ?? ""} />
            </label>
            <label className="ops-track-form__wide">
              <span>Internal notes</span>
              <AdminTextarea name="fulfilment_notes" defaultValue={order.fulfilment_notes ?? ""} rows={3} maxLength={2000} />
            </label>
            <AdminSubmitButton>Save delivery and tracking</AdminSubmitButton>
          </AdminActionForm>
        ) : (
          <p>
            {order.courier_name || "No courier yet"}
            {order.tracking_number ? ` · ${order.tracking_number}` : ""}
          </p>
        )}
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
      <AdminPanel title={isCollectionMethod(order.fulfilment_method) ? "Customer address (collecting)" : "Delivery address"}>
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
            <dd>
              {isCollectionMethod(order.fulfilment_method)
                ? fulfilmentLabel(order.fulfilment_method, order.billing_province)
                : DELIVERY_FULFILMENT.label}
            </dd>
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
