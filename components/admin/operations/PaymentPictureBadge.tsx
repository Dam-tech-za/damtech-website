import {
  PAYMENT_CELL_TONE,
  PAYMENT_LABEL_TEXT,
  type PaymentPicture,
} from "@/lib/operations/board";

/** Full-cell Monday-style payment fill. Overdue is a red corner dot only. */
export function PaymentPictureBadge({ payment }: { payment: PaymentPicture }) {
  const label = payment?.label ? PAYMENT_LABEL_TEXT[payment.label] : "";
  const tone = payment?.label ? PAYMENT_CELL_TONE[payment.label] : "ops-pay--empty";
  return (
    <span
      className={`ops-pay ops-pay--cell ${tone}${payment?.overdue ? " is-overdue" : ""}`}
      title={payment?.overdue ? `${label || "Unset"} · Overdue` : label || "Unset"}
    >
      {label ? <span className="ops-pay__text">{label}</span> : null}
      {payment?.overdue ? <span className="ops-pay__overdue" aria-label="Overdue" /> : null}
    </span>
  );
}
