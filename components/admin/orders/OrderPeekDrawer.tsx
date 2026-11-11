"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AdminDrawer } from "@/components/admin/ui/AdminDrawer";
import {
  AdminActionForm,
  AdminDateInput,
  AdminInput,
  AdminSelect,
  AdminSubmitButton,
  AdminTextarea,
} from "@/components/admin/ui";
import { CourierBookingPanel } from "@/components/admin/CourierBookingPanel";
import { EmailTrackingButton } from "@/components/admin/EmailTrackingButton";
import { ResendOrderConfirmationButton } from "@/components/admin/ResendOrderConfirmationButton";
import { updateOrderStatusAction, updateOrderTrackingAction } from "@/app/admin/orders/actions";
import { orderHistoryAction, type OrderHistoryEntry } from "@/app/admin/operations/online-purchases/actions";
import { communicationStatusLabel, orderStatusLabel } from "@/lib/admin/labels";
import { formatZar } from "@/lib/estimating/money";
import { isDeliveryChargedSeparately } from "@/lib/shop/pvc-liners";
import type { OnlinePurchaseRow } from "@/lib/orders/list";
import {
  purchaseAmountDue,
  purchaseDateTime,
  purchaseFulfilment,
  purchasePaymentPill,
  PURCHASE_STAGE_TONES,
  type PurchaseCourierSetup,
  type PurchaseRowExtras,
} from "@/lib/orders/purchase-board";
import { makeByDate, PURCHASE_STAGE_LABELS, purchaseStage } from "@/lib/orders/purchase-stage";
import { ORDER_STATUSES } from "@/lib/orders/types";
import { fulfilmentLabel, isCollectionMethod } from "@/lib/shop/delivery";
import { DELIVERY_FULFILMENT } from "@/lib/orders/delivery";

type Tab = "overview" | "status" | "delivery" | "courier" | "history";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ops-peek-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const money = (value: number | string | null | undefined, empty = "—") => (value == null ? empty : formatZar(Number(value)));

function History({ orderId }: { orderId: string }) {
  const [result, setResult] = useState<{ id: string; entries: OrderHistoryEntry[] | null; error: string | null } | null>(null);

  useEffect(() => {
    let live = true;
    orderHistoryAction(orderId).then((r) => {
      if (!live) return;
      setResult("error" in r ? { id: orderId, entries: null, error: r.error } : { id: orderId, entries: r.entries, error: null });
    });
    return () => {
      live = false;
    };
  }, [orderId]);

  if (!result || result.id !== orderId) return <p className="ops-peek-muted">Loading…</p>;
  if (result.error) return <p className="ops-peek-warn">{result.error}</p>;
  if (!result.entries?.length) return <p className="ops-peek-muted">No changes recorded yet.</p>;
  return (
    <ol className="admin-timeline">
      {result.entries.map((entry) => {
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
              · {purchaseDateTime(entry.created_at)}
              {entry.actor_email ? ` · ${entry.actor_email}` : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderPeek({
  order,
  extras,
  courier,
  canManage,
}: {
  order: OnlinePurchaseRow;
  extras: PurchaseRowExtras | undefined;
  courier: PurchaseCourierSetup;
  canManage: boolean;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const stage = purchaseStage(order);
  const pay = purchasePaymentPill(order);
  const place = purchaseFulfilment(order);
  const collecting = isCollectionMethod(order.fulfilment_method);
  // Orders above the courier cover limit pay for the liner only; delivery is invoiced later.
  const deliverySeparate =
    order.payment_method === "payfast" && isDeliveryChargedSeparately(order.fulfilment_method, order.delivery_fee_snapshot);
  const awaitingPayfast = order.payment_method === "payfast" && order.payment_status !== "paid";
  const makeBy = makeByDate(order);
  // Forms remount after each save so their fields show the saved values.
  const formKey = `${order.id}-${order.updated_at}`;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "status", label: "Status" },
    { id: "delivery", label: "Delivery" },
    ...(canManage ? [{ id: "courier" as const, label: "Courier Guy" }] : []),
    { id: "history", label: "History" },
  ];

  const courierBlocked = collecting
    ? "The customer is collecting this order, so no courier is needed."
    : order.status === "cancelled"
      ? "This order is cancelled."
      : order.tracking_number && order.courier_name !== "The Courier Guy"
        ? "This order already has tracking from another courier."
        : null;

  return (
    <div className="ops-peek">
      <header className="ops-peek__head">
        <p className="ops-peek__sub">
          {order.product_name_snapshot} · {order.sku} · placed {purchaseDateTime(order.created_at)}
        </p>
        <div className="ops-peek__chips">
          <span className={`ops-peek-chip ops-tone-${PURCHASE_STAGE_TONES[stage]}`}>{PURCHASE_STAGE_LABELS[stage]}</span>
          <span className={`ops-peek-chip ops-tone-${pay.tone}`}>{pay.label}</span>
          <span className="ops-peek-chip">{collecting ? place.label : `Deliver to ${place.label}`}</span>
          {makeBy && !order.dispatched_on && stage !== "cancelled" ? (
            <span className="ops-peek-chip">Make by {purchaseDateTime(makeBy)}</span>
          ) : null}
        </div>
      </header>

      <section className="ops-peek-value" aria-label="Order total">
        <div>
          <p className="ops-peek-value__label">Order total incl. VAT</p>
          <p className="ops-peek-value__amount">{formatZar(purchaseAmountDue(order))}</p>
          <p className="ops-peek-value__note">
            {order.quantity} × {formatZar(Number(order.unit_price_snapshot))} goods
            {order.delivery_fee_snapshot == null || deliverySeparate ? " · delivery on invoice" : ` + ${formatZar(Number(order.delivery_fee_snapshot))} delivery`}
          </p>
          <p className="ops-peek-value__pay">
            {order.payment_method === "payfast"
              ? order.payment_status === "paid"
                ? `Paid ${money(order.amount_paid)} on ${purchaseDateTime(order.paid_at)}`
                : "Waiting for the customer to pay on PayFast"
              : `Invoice order · ${orderStatusLabel(order.status)}`}
          </p>
        </div>
      </section>

      <div className="ops-peek-tabs" role="tablist" aria-label="Order details">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`order-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`order-panel-${t.id}`}
            className={tab === t.id ? "is-active" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`order-panel-${tab}`} aria-labelledby={`order-tab-${tab}`} className="ops-peek-panel">
        {tab === "overview" ? (
          <>
            <dl className="ops-peek-list">
              <Row label="Customer">
                {order.customer_name}
                {order.customer_type ? <span className="ops-peek-muted"> · {order.customer_type}</span> : null}
              </Row>
              {order.business_name ? <Row label="Business">{order.business_name}</Row> : null}
              <Row label="Email">
                <a href={`mailto:${order.email}`} className="ops-peek-link">{order.email}</a>
              </Row>
              <Row label="Phone">
                <a href={`tel:${order.phone.replace(/[^\d+]/g, "")}`} className="ops-peek-link">{order.phone}</a>
              </Row>
              {order.vat_number ? <Row label="VAT number">{order.vat_number}</Row> : null}
              {order.customer_po_number ? <Row label="Customer PO">{order.customer_po_number}</Row> : null}
              <Row label={collecting ? "Address (collecting)" : "Delivery address"}>
                {order.billing_line1}
                {order.billing_line2 ? `, ${order.billing_line2}` : ""}
                <br />
                {order.billing_suburb}, {order.billing_city}
                <br />
                {order.billing_province} {order.billing_postal_code}
              </Row>
            </dl>
            <p className="ops-peek-next__label">Order</p>
            <dl className="ops-peek-list">
              <Row label="Product">
                {order.quantity} × {order.product_name_snapshot}
                <span className="ops-peek-muted"> · {order.sku}</span>
              </Row>
              <Row label="Unit incl. VAT">{formatZar(Number(order.unit_price_snapshot))}</Row>
              <Row label="Goods incl. VAT">{formatZar(Number(order.total_price_snapshot))}</Row>
              <Row label="VAT on goods">{formatZar(Number(order.vat_amount_snapshot))}</Row>
              <Row label="Delivery incl. VAT">
                {deliverySeparate
                  ? "Charged separately (not paid online): quote the courier and invoice the customer"
                  : money(order.delivery_fee_snapshot, "On invoice")}
              </Row>
              <Row label="Order total incl. VAT">
                <strong>{formatZar(purchaseAmountDue(order))}</strong>
              </Row>
              <Row label="Fulfilment">{collecting ? fulfilmentLabel(order.fulfilment_method, order.billing_province) : DELIVERY_FULFILMENT.label}</Row>
              <Row label="Delivery instructions">{order.notes || "—"}</Row>
              <Row label="Supply-only confirmed">{purchaseDateTime(order.terms_accepted_at)}</Row>
              <Row label="Exclusions confirmed">{purchaseDateTime(order.exclusions_accepted_at)}</Row>
              <Row label="Policies accepted">{purchaseDateTime(order.privacy_accepted_at)}</Row>
            </dl>
          </>
        ) : null}

        {tab === "status" ? (
          <>
            <p className="ops-peek-muted">
              {order.payment_method === "payfast"
                ? awaitingPayfast
                  ? "PayFast order, waiting for the customer to pay. Nothing is made or emailed until PayFast confirms the payment."
                  : "Paid online through PayFast. Move the order through manufacture and delivery here."
                : "Invoice order: nothing is charged online. Move the order through invoicing, payment and delivery here."}
            </p>
            {canManage ? (
              <div className="ops-order-actions" key={formKey}>
                <AdminActionForm action={updateOrderStatusAction} className="admin-inline-form">
                  <input type="hidden" name="id" value={order.id} />
                  <AdminSelect name="status" defaultValue={order.status} aria-label="Order status">
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {orderStatusLabel(status)}
                      </option>
                    ))}
                  </AdminSelect>
                  <AdminSubmitButton>Update status</AdminSubmitButton>
                </AdminActionForm>
                <div className="ops-peek__actions">
                  <ResendOrderConfirmationButton orderId={order.id} />
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
                </div>
              </div>
            ) : (
              <p>{orderStatusLabel(order.status)}</p>
            )}
            <dl className="ops-peek-list">
              <Row label="Stage">{PURCHASE_STAGE_LABELS[stage]}</Row>
              <Row label="Payment method">{order.payment_method === "payfast" ? "PayFast" : "Invoice"}</Row>
              <Row label="Payment status">{order.payment_method === "payfast" ? (order.payment_status ?? "—") : "On invoice"}</Row>
              <Row label="Amount paid">{money(order.amount_paid)}</Row>
              <Row label="Paid at">{purchaseDateTime(order.paid_at)}</Row>
              <Row label="PayFast payment ID">{order.payfast_payment_id || "—"}</Row>
              <Row label="Order emails">
                {awaitingPayfast
                  ? "Not sent yet. They go out once the payment is confirmed."
                  : `Customer: ${communicationStatusLabel(order.confirmation_email_status)} · Damtech: ${communicationStatusLabel(order.internal_email_status)}`}
              </Row>
            </dl>
          </>
        ) : null}

        {tab === "delivery" ? (
          <>
            <p className="ops-peek-muted">Record the courier booking here. The customer is only emailed when you press the email button.</p>
            {canManage ? (
              <AdminActionForm key={formKey} action={updateOrderTrackingAction} className="ops-track-form">
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
              <dl className="ops-peek-list">
                <Row label="Courier">{order.courier_name || "No courier yet"}</Row>
                <Row label="Tracking">{order.tracking_number || "—"}</Row>
                <Row label="Dispatched">{purchaseDateTime(order.dispatched_on)}</Row>
                <Row label="Delivered">{purchaseDateTime(order.delivered_on)}</Row>
              </dl>
            )}
            {order.tracking_url ? (
              <p>
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="ops-peek-link">
                  Open tracking page
                </a>
              </p>
            ) : null}
            {canManage && order.tracking_number && !collecting ? <EmailTrackingButton orderId={order.id} email={order.email} /> : null}
          </>
        ) : null}

        {tab === "courier" && canManage ? (
          <>
            <p className="ops-peek-muted">
              Get a live rate for the packed parcel, book the collection and pull tracking updates. Booking is a real order on the Courier Guy account.
            </p>
            {order.courier_status ? (
              <dl className="ops-peek-list">
                <Row label="Courier status">{extras?.courierSummary ?? order.courier_status}</Row>
                <Row label="Status time">{purchaseDateTime(order.courier_status_at)}</Row>
                <Row label="Last checked">{purchaseDateTime(order.courier_checked_at)}</Row>
                <Row label="Collected from">{extras?.depotLabel ?? "—"}</Row>
                <Row label="Courier cost">{money(order.courier_cost)}</Row>
                <Row label="Delivery charged">{money(order.delivery_fee_snapshot)}</Row>
              </dl>
            ) : null}
            {(order.courier_events ?? []).length > 0 ? (
              <ol className="admin-timeline">
                {(order.courier_events ?? []).map((event, index) => (
                  <li key={`${event.date}-${index}`}>
                    <strong>{event.message || event.status}</strong>
                    <span className="admin-muted">
                      {" "}
                      · {purchaseDateTime(event.date)}
                      {event.location ? ` · ${event.location}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
            {courier.ok ? (
              <CourierBookingPanel
                key={order.id}
                orderId={order.id}
                orderReference={order.order_reference}
                defaultParcel={extras?.defaultParcel ?? null}
                depots={courier.depots}
                defaultDepot={extras?.defaultDepot ?? courier.depots[0]?.id ?? ""}
                trackingNumber={order.courier_name === "The Courier Guy" ? (order.tracking_number ?? null) : null}
                blockedReason={courierBlocked}
                bookingBlockedReason={awaitingPayfast ? "Booking opens once the order is paid. You can check rates now." : null}
              />
            ) : (
              <p className="ops-peek-warn">Not connected yet. {courier.message}</p>
            )}
          </>
        ) : null}

        {tab === "history" ? <History orderId={order.id} /> : null}
      </div>
    </div>
  );
}

export function OrderPeekDrawer({
  order,
  extras,
  courier,
  canManage,
  onClose,
}: {
  order: OnlinePurchaseRow | null;
  extras: PurchaseRowExtras | undefined;
  courier: PurchaseCourierSetup;
  canManage: boolean;
  onClose: () => void;
}) {
  return (
    <AdminDrawer open={Boolean(order)} title={order ? `${order.order_reference} · ${order.customer_name}` : "Order"} onClose={onClose}>
      {order ? <OrderPeek key={order.id} order={order} extras={extras} courier={courier} canManage={canManage} /> : null}
    </AdminDrawer>
  );
}
