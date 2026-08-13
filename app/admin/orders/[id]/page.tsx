import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { getCatalogueOrder } from "@/lib/orders/list";
import { ORDER_STATUSES } from "@/lib/orders/types";
import { formatZar } from "@/lib/estimating/money";
import { COLLECTION_FULFILMENT } from "@/lib/orders/collection";
import {
  updateOrderStatusAction,
} from "../actions";
import { ResendOrderConfirmationButton } from "@/components/admin/ResendOrderConfirmationButton";
import {
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
} from "@/components/admin/ui";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "orders")) notFound();
  const { id } = await params;
  const order = await getCatalogueOrder(id);
  if (!order) notFound();

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title={order.order_reference}
        description={`${order.product_name_snapshot} · ${order.sku}`}
      />
      <AdminPanel title="Status">
        {canPerform(admin.profile.role, "manageOrders") ? (
          <>
            <form action={updateOrderStatusAction} className="admin-stack">
              <input type="hidden" name="id" value={order.id} />
              <AdminSelect name="status" defaultValue={order.status}>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </AdminSelect>
              <button type="submit" className="admin-btn admin-btn--primary">
                Update status
              </button>
            </form>
            <ResendOrderConfirmationButton orderId={order.id} />
          </>
        ) : (
          <p>{order.status.replaceAll("_", " ")}</p>
        )}
        <p className="admin-empty__hint">
          Confirmation email: {order.confirmation_email_status}. Internal email:{" "}
          {order.internal_email_status}.
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
      <AdminPanel title="Billing">
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
            <dd>{COLLECTION_FULFILMENT.label}</dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{order.notes || "—"}</dd>
          </div>
          <div>
            <dt>Supply-only confirmed</dt>
            <dd>{order.terms_accepted_at}</dd>
          </div>
          <div>
            <dt>Exclusions confirmed</dt>
            <dd>{order.exclusions_accepted_at}</dd>
          </div>
          <div>
            <dt>Policies accepted</dt>
            <dd>{order.privacy_accepted_at}</dd>
          </div>
        </dl>
      </AdminPanel>
    </div>
  );
}
