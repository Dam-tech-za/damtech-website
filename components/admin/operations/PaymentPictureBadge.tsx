import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { PAYMENT_LABEL_TEXT, type PaymentPicture } from "@/lib/operations/board";

const PAYMENT_TONE: Record<NonNullable<PaymentPicture["label"]>, string> = {
  deposit_invoiced: "ops-warn",
  portion_of_deposit_paid: "ops-warn",
  deposit_paid: "ops-info",
  balance_due: "ops-warn",
  paid_in_full: "ops-good",
};

export function PaymentPictureBadge({ payment }: { payment: PaymentPicture }) {
  if (!payment?.label && !payment?.overdue) return <span className="ops-table__meta">—</span>;
  return (
    <span className="ops-stage">
      {payment.label ? <AdminStatusBadge status={PAYMENT_TONE[payment.label] ?? "ops-neutral"} label={PAYMENT_LABEL_TEXT[payment.label] ?? payment.label} /> : null}
      {payment.overdue ? <AdminStatusBadge status="ops-bad" label="Overdue" /> : null}
    </span>
  );
}
