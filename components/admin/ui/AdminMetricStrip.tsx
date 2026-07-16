import type { ReactNode } from "react";

type AdminMetricStripProps = {
  children: ReactNode;
  label?: string;
};

export function AdminMetricStrip({
  children,
  label = "Summary metrics",
}: AdminMetricStripProps) {
  return (
    <div className="admin-metric-strip" aria-label={label}>
      {children}
    </div>
  );
}
