import Link from "next/link";
import type { DashboardRecentRfq } from "@/lib/admin/dashboard/types";
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
    <section className="dash-panel" aria-labelledby="recent-rfqs-heading">
      <header className="dash-panel__header">
        <h2 id="recent-rfqs-heading">Recent RFQs</h2>
        <Link href="/admin/rfqs/" className="dash-panel__link">
          View all RFQs
        </Link>
      </header>

      {rows.length === 0 ? (
        <DashboardEmptyState
          title="No RFQs have been submitted yet."
          actionHref="/quote/"
          actionLabel="View public quote form"
        />
      ) : (
        <>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>RFQ</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
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
                    <td>
                      <Link href={`/admin/rfqs/${row.id}/`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
    </section>
  );
}
