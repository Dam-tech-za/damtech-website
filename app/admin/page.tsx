import { requireAdmin } from "@/lib/auth/require-admin";
import { getDashboardMetrics } from "@/lib/admin/dashboard/get-dashboard-metrics";
import { parseDashboardRange } from "@/lib/admin/dashboard/types";
import { DashboardHeaderControls } from "@/components/admin/dashboard/DashboardHeaderControls";
import { PrimaryKpiGrid } from "@/components/admin/dashboard/PrimaryKpiGrid";
import { RfqWorkflow } from "@/components/admin/dashboard/RfqWorkflow";
import { QuotePipeline } from "@/components/admin/dashboard/QuotePipeline";
import { ProvisionalPipeline } from "@/components/admin/dashboard/ProvisionalPipeline";
import { BreakdownPanel } from "@/components/admin/dashboard/BreakdownPanel";
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity";
import { RecentRfqs } from "@/components/admin/dashboard/RecentRfqs";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";
import { AttentionPanel } from "@/components/admin/dashboard/AttentionPanel";
import { buildAttentionItems } from "@/lib/admin/dashboard/attention";
import {
  AdminErrorState,
  AdminInfoBanner,
  AdminPageHeader,
} from "@/components/admin/ui";

type PageProps = {
  searchParams: Promise<{ range?: string | string[] }>;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const rangeId = parseDashboardRange(params.range);
  const metrics = await getDashboardMetrics(rangeId);
  const attentionItems = buildAttentionItems(metrics.attention);

  return (
    <div className="admin-stack--page dash">
      <AdminPageHeader
        title="Overview"
        description="What needs attention first, then enquiry and quotation activity for the selected period."
        secondaryAction={{ href: "/admin/quotes/new/", label: "New quotation" }}
        primaryAction={{ href: "/admin/rfqs/", label: "Open enquiries" }}
        secondaryActions={<DashboardHeaderControls rangeId={rangeId} />}
      />

      {metrics.loadError ? (
        <AdminErrorState
          title="Live figures could not be loaded."
          message="The numbers below may be incomplete. Refresh the page in a moment; if it keeps happening, check System health under Settings."
        />
      ) : null}

      <AttentionPanel items={attentionItems} />

      <AdminInfoBanner tone="muted">
        Figures below cover {metrics.rangeLabel.toLowerCase()}. Accepted quote
        value is not cash received, and pipeline quantities are provisional
        estimates from customer and calculator input.
      </AdminInfoBanner>

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
