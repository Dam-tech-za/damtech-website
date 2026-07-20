import Link from "next/link";
import type { DashboardRecentRfq } from "@/lib/admin/dashboard/types";
import {
  AdminButton,
  AdminPanel,
  AdminTable,
  AdminTableActions,
} from "@/components/admin/ui";
import { DashboardEmptyState } from "./DashboardEmptyState";

type RecentRfqsProps = {
  rows: DashboardRecentRfq[];
};

function formatSubmitted(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function RecentRfqs({ rows }: RecentRfqsProps) {
  return (
    <AdminPanel
      title="Recent RFQs"
      actions={
        <AdminButton href="/admin/rfqs/" variant="link" size="sm">
          View all RFQs
        </AdminButton>
      }
    >
      {rows.length === 0 ? (
        <DashboardEmptyState
          title="No RFQs have been submitted yet."
          actionHref="/quote/"
          actionLabel="View public quote form"
        />
      ) : (
        <>
          <AdminTable caption="Recent RFQs">
            <thead>
              <tr>
                <th>RFQ</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Location</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="admin-table__actions-col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/admin/rfqs/${row.id}/`}>{row.rfqNumber}</Link>
                  </td>
                  <td>{row.customer}</td>
                  <td>{row.service}</td>
                  <td>{row.location}</td>
                  <td>
                    <span className={`admin-status admin-status--${row.status}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{formatSubmitted(row.submittedAt)}</td>
                  <td className="admin-table__actions-col">
                    <AdminTableActions>
                      <AdminButton
                        href={`/admin/rfqs/${row.id}/`}
                        size="sm"
                        variant="outline"
                        className="admin-btn--table"
                      >
                        Open
                      </AdminButton>
                    </AdminTableActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>

          <ul className="dash-rfq-cards" aria-label="Recent RFQs">
            {rows.map((row) => (
              <li key={`card-${row.id}`} className="dash-rfq-card">
                <div className="dash-rfq-card__top">
                  <Link href={`/admin/rfqs/${row.id}/`}>{row.rfqNumber}</Link>
                  <span className={`admin-status admin-status--${row.status}`}>
                    {row.status}
                  </span>
                </div>
                <p>{row.customer}</p>
                <p className="dash-rfq-card__meta">
                  {row.service} · {row.location}
                </p>
                <p className="dash-rfq-card__meta">
                  {formatSubmitted(row.submittedAt)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminPanel>
  );
}
