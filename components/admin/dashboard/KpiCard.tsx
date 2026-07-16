import Link from "next/link";
import type { ReactNode } from "react";

type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: ReactNode;
  empty?: boolean;
};

export function KpiCard({
  label,
  value,
  hint,
  href,
  icon,
  empty,
}: KpiCardProps) {
  return (
    <Link
      href={href}
      className={`dash-kpi${empty ? " dash-kpi--empty" : ""}`}
      aria-label={`${label}: ${value}. ${hint}`}
    >
      <div className="dash-kpi__top">
        <span className="dash-kpi__icon" aria-hidden>
          {icon}
        </span>
        <span className="dash-kpi__label">{label}</span>
      </div>
      <p className="dash-kpi__value">{value}</p>
      <p className="dash-kpi__hint">{hint}</p>
    </Link>
  );
}
