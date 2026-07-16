import { requireAdmin } from "@/lib/auth/require-admin";
import { getDashboardMetrics } from "@/lib/admin/dashboard/get-dashboard-metrics";
import { parseDashboardRange } from "@/lib/admin/dashboard/types";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { PrimaryKpiGrid } from "@/components/admin/dashboard/PrimaryKpiGrid";
import { RfqWorkflow } from "@/components/admin/dashboard/RfqWorkflow";
import { QuotePipeline } from "@/components/admin/dashboard/QuotePipeline";
import { ProvisionalPipeline } from "@/components/admin/dashboard/ProvisionalPipeline";
import { BreakdownPanel } from "@/components/admin/dashboard/BreakdownPanel";
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity";
import { RecentRfqs } from "@/components/admin/dashboard/RecentRfqs";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";

type PageProps = {
  searchParams: Promise<{ range?: string | string[] }>;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const rangeId = parseDashboardRange(params.range);
  const metrics = await getDashboardMetrics(rangeId);

  return (
    <div className="dash">
      <DashboardHeader rangeId={rangeId} />

      <div className="dash-info-banner" role="note">
        <span className="dash-info-banner__icon" aria-hidden>
          i
        </span>
        <p>
          Accepted quote value is not cash received. RFQ pipeline quantities are
          provisional estimates.
        </p>
      </div>

      <PrimaryKpiGrid metrics={metrics} />

      <div className="dash-split">
        <RfqWorkflow stages={metrics.rfqStages} />
        <QuotePipeline rows={metrics.quotePipeline} />
      </div>

      <ProvisionalPipeline provisional={metrics.provisional} />

      <div className="dash-split">
        <BreakdownPanel
          title="RFQs by Service"
          rows={metrics.services}
          emptyTitle="No RFQ data available for the selected period."
        />
        <BreakdownPanel
          title="RFQs by Province"
          rows={metrics.provinces}
          emptyTitle="No RFQ data available for the selected period."
        />
      </div>

      <div className="dash-split dash-split--activity">
        <RecentActivity items={metrics.recentActivity} />
        <QuickActions expiringQuotesCount={metrics.expiringQuotesCount} />
      </div>

      <RecentRfqs rows={metrics.recentRfqs} />
    </div>
  );
}
