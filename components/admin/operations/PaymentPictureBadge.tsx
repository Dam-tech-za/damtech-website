import {
  PAYMENT_CELL_TONE,
  PAYMENT_LABEL_TEXT,
  type PaymentPicture,
} from "@/lib/operations/board";

function Chevron() {
  return (
    <svg className="ops-pay__chevron" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
      <path
        d="M1 1.2 5 4.8 9 1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Soft monday-style payment pill. Overdue is a red corner dot only. */
export function PaymentPictureBadge({
  payment,
  showChevron = false,
}: {
  payment: PaymentPicture;
  showChevron?: boolean;
}) {
  const label = payment?.label ? PAYMENT_LABEL_TEXT[payment.label] : "Set status";
  const tone = payment?.label ? PAYMENT_CELL_TONE[payment.label] : "ops-pay--empty";
  return (
    <span
      className={`ops-pay ops-pay--cell ${tone}${payment?.overdue ? " is-overdue" : ""}${showChevron ? " has-chevron" : ""}`}
      title={payment?.overdue ? `${label} · Overdue` : label}
    >
      <span className="ops-pay__text">{label}</span>
      {showChevron ? <Chevron /> : null}
      {payment?.overdue ? <span className="ops-pay__overdue" aria-label="Overdue" /> : null}
    </span>
  );
}
