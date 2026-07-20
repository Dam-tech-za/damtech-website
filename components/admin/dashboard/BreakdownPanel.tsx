import type { DashboardBreakdownRow } from "@/lib/admin/dashboard/types";
import { AdminPanel } from "@/components/admin/ui";
import { DashboardEmptyState } from "./DashboardEmptyState";

type BreakdownPanelProps = {
  title: string;
  rows: DashboardBreakdownRow[];
  emptyTitle: string;
};

export function BreakdownPanel({
  title,
  rows,
  emptyTitle,
}: BreakdownPanelProps) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <AdminPanel title={title}>
      {rows.length === 0 ? (
        <DashboardEmptyState title={emptyTitle} />
      ) : (
        <ul className="dash-breakdown">
          {rows.map((row) => (
            <li key={row.name} className="dash-breakdown__row">
              <div className="dash-breakdown__meta">
                <span className="dash-breakdown__name">{row.name}</span>
                <span className="dash-breakdown__stats">
                  {row.count} · {row.percentage}%
                </span>
              </div>
              <div className="dash-breakdown__track" aria-hidden>
                <span
                  className="dash-breakdown__fill"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}
