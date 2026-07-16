import Link from "next/link";
import { formatZar } from "@/lib/estimating/money";
import type { DashboardQuotePipelineRow } from "@/lib/admin/dashboard/types";
import { DashboardEmptyState } from "./DashboardEmptyState";

type QuotePipelineProps = {
  rows: DashboardQuotePipelineRow[];
};

export function QuotePipeline({ rows }: QuotePipelineProps) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);
  const totalCount = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="dash-panel" aria-labelledby="quote-pipeline-heading">
      <header className="dash-panel__header">
        <div>
          <h2 id="quote-pipeline-heading">Quote Pipeline</h2>
          <p className="dash-panel__subtitle">
            Latest revision counts and values ·{" "}
            <Link href="/admin/quotes/">Open quotes</Link>
          </p>
        </div>
      </header>

      {totalCount === 0 ? (
        <DashboardEmptyState
          title="No quote data available for the selected period."
          description="Create a quote from an RFQ or start a blank quotation."
          actionHref="/admin/quotes/new/"
          actionLabel="Create Quote"
        />
      ) : (
        <>
          <ul className="dash-pipeline">
            {rows.map((row) => (
              <li key={row.status}>
                <Link href={row.href} className="dash-pipeline__row">
                  <div className="dash-pipeline__meta">
                    <span className="dash-pipeline__label">{row.label}</span>
                    <span className="dash-pipeline__stats">
                      {row.count} quote{row.count === 1 ? "" : "s"} ·{" "}
                      {formatZar(row.value)}
                    </span>
                  </div>
                  <div className="dash-pipeline__track" aria-hidden>
                    <span
                      className="dash-pipeline__fill"
                      style={{
                        width: `${Math.max((row.value / maxValue) * 100, row.count > 0 ? 4 : 0)}%`,
                      }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="dash-note">Accepted value is not cash received.</p>
        </>
      )}
    </section>
  );
}
