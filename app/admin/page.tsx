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
import { AttentionPanel } from "@/components/admin/dashboard/AttentionPanel";
import { buildAttentionItems } from "@/lib/admin/dashboard/attention";
import { AdminErrorState, AdminPageHeader } from "@/components/admin/ui";

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

      <PrimaryKpiGrid metrics={metrics} />

      <div className="dash-split">
        <RfqWorkflow stages={metrics.rfqStages} />
        <QuotePipeline rows={metrics.quotePipeline} />
      </div>

      {metrics.provisional.linerAreaM2 > 0 ||
      metrics.provisional.tankCapacityKl > 0 ||
      metrics.provisional.torchOnAreaM2 > 0 ? (
        <ProvisionalPipeline provisional={metrics.provisional} />
      ) : null}

      <div className="dash-split">
        <BreakdownPanel
          title="Enquiries by service"
          rows={metrics.services}
          emptyTitle="No enquiries in this period."
        />
        <BreakdownPanel
          title="Enquiries by province"
          rows={metrics.provinces}
          emptyTitle="No enquiries in this period."
        />
      </div>

      <RecentRfqs rows={metrics.recentRfqs} />

      <RecentActivity items={metrics.recentActivity} />
    </div>
  );
}
