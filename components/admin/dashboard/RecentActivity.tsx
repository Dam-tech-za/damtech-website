import Link from "next/link";
import type { DashboardActivityItem } from "@/lib/admin/dashboard/types";
import { AdminPanel } from "@/components/admin/ui";
import { DashboardEmptyState } from "./DashboardEmptyState";

type RecentActivityProps = {
  items: DashboardActivityItem[];
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <AdminPanel title="Recent Activity">
      {items.length === 0 ? (
        <DashboardEmptyState
          title="No recent activity yet."
          description="Audit events from RFQs, quotes and pricing will appear here."
        />
      ) : (
        <ul className="dash-activity">
          {items.map((item) => (
            <li key={item.id} className="dash-activity__item">
              <span className="dash-activity__dot" aria-hidden />
              <div className="dash-activity__body">
                <p className="dash-activity__title">
                  {item.action}
                  {" · "}
                  {item.entityHref ? (
                    <Link href={item.entityHref}>{item.entityLabel}</Link>
                  ) : (
                    item.entityLabel
                  )}
                </p>
                <p className="dash-activity__meta">
                  {item.actor} · {relativeTime(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}
