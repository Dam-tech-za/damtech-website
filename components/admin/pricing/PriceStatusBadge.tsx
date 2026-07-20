import type { PriceStatus } from "@/lib/pricing/types";

const LABELS: Record<PriceStatus, string> = {
  current: "Current",
  expiring: "Expiring",
  expired: "Expired",
  missing: "Missing",
  manual: "Manual",
};

type PriceStatusBadgeProps = {
  status: PriceStatus;
};

export function PriceStatusBadge({ status }: PriceStatusBadgeProps) {
  return (
    <span className={`admin-price-status admin-price-status--${status}`}>
      {LABELS[status]}
    </span>
  );
}
