import { PAYMENT_LABEL_TEXT, type PaymentPicture } from "@/lib/operations/board";

const PAYMENT_TONE: Record<NonNullable<PaymentPicture["label"]>, string> = {
  deposit_invoiced: "ops-pay--invoiced",
  portion_of_deposit_paid: "ops-pay--portion",
  deposit_paid: "ops-pay--deposit",
  balance_due: "ops-pay--balance",
  paid_in_full: "ops-pay--paid",
};

/** One payment pill. Overdue is a red mark on the same pill — never a second badge. */
export function PaymentPictureBadge({ payment }: { payment: PaymentPicture }) {
  if (!payment?.label && !payment?.overdue) return <span className="ops-table__meta">—</span>;
  const label = payment.label ? PAYMENT_LABEL_TEXT[payment.label] : "Overdue";
  const tone = payment.label ? PAYMENT_TONE[payment.label] : "ops-pay--overdue";
  return (
    <span className={`ops-pay ${tone}${payment.overdue ? " is-overdue" : ""}`} title={payment.overdue ? `${label} · Overdue` : label}>
      <span className="ops-pay__text">{label}</span>
      {payment.overdue ? <span className="ops-pay__overdue" aria-label="Overdue" /> : null}
    </span>
  );
}
