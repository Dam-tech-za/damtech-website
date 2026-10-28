import { requireAdmin } from "@/lib/auth/require-admin";
import { getDashboardMetrics } from "@/lib/admin/dashboard/get-dashboard-metrics";
import { getOverviewOps } from "@/lib/admin/dashboard/overview-ops";
import { parseDashboardRange } from "@/lib/admin/dashboard/types";
import { DashboardHeaderControls } from "@/components/admin/dashboard/DashboardHeaderControls";
import { PrimaryKpiGrid } from "@/components/admin/dashboard/PrimaryKpiGrid";
import { RfqWorkflow } from "@/components/admin/dashboard/RfqWorkflow";
import { QuotePipeline } from "@/components/admin/dashboard/QuotePipeline";
import { ProvisionalPipeline } from "@/components/admin/dashboard/ProvisionalPipeline";
import { BreakdownPanel } from "@/components/admin/dashboard/BreakdownPanel";
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity";
import { RecentRfqs } from "@/components/admin/dashboard/RecentRfqs";
import { IncomeAndCostsChart } from "@/components/admin/operations/FinancialCharts";
import {
  AdminButton,
  AdminErrorState,
  AdminInfoBanner,
  AdminPageHeader,
} from "@/components/admin/ui";

type PageProps = {
  searchParams: Promise<{ range?: string | string[]; password?: string }>;
};

/**
 * Overview, in the order an owner reads it: four key figures, the money
 * trend from Xero, the latest enquiries. Things that need action live on the
 * header bell. Detailed enquiry statistics stay one click away, folded at the
 * bottom.
 */
export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const rangeId = parseDashboardRange(params.range);
  const [metrics, ops] = await Promise.all([getDashboardMetrics(rangeId), getOverviewOps(admin.profile.role)]);
  const hasProvisional =
    metrics.provisional.linerAreaM2 > 0 || metrics.provisional.tankCapacityKl > 0 || metrics.provisional.torchOnAreaM2 > 0;

  return (
    <div className="admin-stack--page dash">
      <AdminPageHeader title="Overview" primaryAction={{ href: "/admin/rfqs/", label: "Open enquiries" }} />

      {params.password === "changed" ? (
        <AdminInfoBanner tone="info">
          Your password has been changed. Use it next time you sign in with
          email.
        </AdminInfoBanner>
      ) : null}

      {metrics.loadError ? (
        <AdminErrorState
          title="Live figures could not be loaded."
          message="The numbers below may be incomplete. Refresh the page in a moment; if it keeps happening, check System health under Settings."
        />
      ) : null}

      <PrimaryKpiGrid metrics={metrics} activeProjects={ops.activeProjects} financials={ops.financials} />

      {ops.financials ? (
        <section className="fin-charts__panel" aria-labelledby="dash-money-title">
          <header className="fin-charts__head">
            <h2 id="dash-money-title">Income and costs per month</h2>
            <AdminButton href="/admin/operations/financials/" variant="link" size="sm">
              All financials
            </AdminButton>
          </header>
          <IncomeAndCostsChart s={ops.financials} />
        </section>
      ) : null}

      <RecentRfqs rows={metrics.recentRfqs.slice(0, 5)} />

      <details className="dash-more" open={params.range !== undefined}>
        <summary className="dash-more__summary">Enquiry statistics and recent activity</summary>
        <div className="admin-stack--page">
          <DashboardHeaderControls rangeId={rangeId} />
          <div className="dash-split">
            <RfqWorkflow stages={metrics.rfqStages} />
            <QuotePipeline rows={metrics.quotePipeline} />
          </div>
          {hasProvisional ? <ProvisionalPipeline provisional={metrics.provisional} /> : null}
          <div className="dash-split">
            <BreakdownPanel title="Enquiries by service" rows={metrics.services} emptyTitle="No enquiries in this period." />
            <BreakdownPanel title="Enquiries by province" rows={metrics.provinces} emptyTitle="No enquiries in this period." />
          </div>
          <RecentActivity items={metrics.recentActivity} />
        </div>
      </details>
    </div>
  );
}
