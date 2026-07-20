import Link from "next/link";
import type { DashboardStageRow } from "@/lib/admin/dashboard/types";
import { AdminButton, AdminPanel } from "@/components/admin/ui";
import { DashboardEmptyState } from "./DashboardEmptyState";

type RfqWorkflowProps = {
  stages: DashboardStageRow[];
};

const STAGE_CLASS: Record<string, string> = {
  new: "is-new",
  reviewing: "is-reviewing",
  information_required: "is-info",
  site_measurement_required: "is-measure",
  ready_for_quote: "is-ready",
  converted: "is-converted",
};

export function RfqWorkflow({ stages }: RfqWorkflowProps) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <AdminPanel
      title="RFQ Workflow"
      description="Current pipeline by status"
      actions={
        <AdminButton href="/admin/rfqs/" variant="link" size="sm">
          View RFQs
        </AdminButton>
      }
    >
      {total === 0 ? (
        <DashboardEmptyState
          title="No RFQs have been submitted yet."
          description="New website enquiries will appear here as they arrive."
          actionHref="/quote/"
          actionLabel="View public quote form"
        />
      ) : (
        <ul className="dash-workflow">
          {stages.map((stage) => (
            <li key={stage.status}>
              <Link
                href={stage.href}
                className={`dash-workflow__row ${STAGE_CLASS[stage.status] || ""}`}
              >
                <div className="dash-workflow__meta">
                  <span className="dash-workflow__label">{stage.label}</span>
                  <span className="dash-workflow__count">
                    {stage.count}
                    <span className="dash-workflow__pct">
                      {" "}
                      · {stage.percentage}%
                    </span>
                  </span>
                </div>
                <div
                  className="dash-workflow__track"
                  role="presentation"
                  aria-hidden
                >
                  <span
                    className="dash-workflow__fill"
                    style={{ width: `${Math.max(stage.percentage, stage.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}
