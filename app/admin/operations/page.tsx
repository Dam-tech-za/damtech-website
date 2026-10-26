import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { getOperationsOverview } from "@/lib/operations/queries";
import { buildAttentionList, todayInSouthAfrica, type AttentionReason } from "@/lib/operations/lifecycle";
import {
  AdminErrorState,
  AdminMetricCard,
  AdminMetricStrip,
  AdminPageHeader,
  AdminPanel,
  AdminEmptyState,
} from "@/components/admin/ui";
import { OpsSetupBanners, ProjectTable, SyncStatus } from "@/components/admin/operations/OpsParts";
import { formatOpsDate, formatOpsMoney } from "@/components/admin/operations/ops-format";

export const metadata: Metadata = { title: "Operations" };

const REASON_LABEL: Record<AttentionReason, string> = {
  next_action_overdue: "Overdue",
  next_action_today: "Due today",
  awaiting_deposit: "Awaiting deposit",
  needs_review: "Check details",
  money_outstanding_after_completion: "Money still owed",
};

export default async function OperationsOverviewPage() {
  const admin = await requireAdmin();
  const load = await getOperationsOverview();
  const canSync = canPerform(admin.profile.role, "runXeroSync");

  if (!load.ok) {
    return (
      <div className="admin-stack--page ops">
        <AdminPageHeader title="Operations" description="Won jobs from Xero, what happens next, and supplier orders." />
        <OpsSetupBanners setup={load.setup} />
        {load.error === "load_failed" ? (
          <AdminErrorState title="Operations could not be loaded." message="Refresh in a moment. If it keeps happening, check System health under Settings." />
        ) : null}
      </div>
    );
  }

  const { open, openMaterialOrders, lastSync, lastSuccessfulSync, hasBaseline } = load.data;
  const today = todayInSouthAfrica();
  const attention = buildAttentionList(open, today);
  const awaitingDeposit = open.filter((p) => p.stage === "awaiting_deposit").length;
  const owed = open.reduce((sum, p) => sum + p.amount_due, 0);

  return (
    <div className="admin-stack--page ops">
      <AdminPageHeader
        title="Operations"
        description="Won jobs from Xero, what happens next, and supplier orders."
        primaryAction={{ href: "/admin/operations/projects/", label: "All projects" }}
        secondaryAction={{ href: "/admin/operations/procurement/", label: "Supplier orders" }}
      />

      <OpsSetupBanners setup={load.setup} />

      <SyncStatus
        lastSync={lastSync}
        lastSuccessfulSync={lastSuccessfulSync}
        hasBaseline={hasBaseline}
        canSync={canSync}
        bridgeConfigured={load.setup.bridgeConfigured}
      />

      <AdminMetricStrip label="Operations summary">
        <AdminMetricCard label="Active projects" value={open.length} href="/admin/operations/projects/" />
        <AdminMetricCard label="Awaiting deposit" value={awaitingDeposit} tone={awaitingDeposit ? "warning" : "default"} />
        <AdminMetricCard label="Open supplier orders" value={openMaterialOrders} href="/admin/operations/procurement/" />
        <AdminMetricCard
          label="Owed on active jobs"
          value={lastSuccessfulSync ? formatOpsMoney(owed) : "—"}
          hint={lastSuccessfulSync ? "From Xero invoices linked to these jobs" : "Shown after the first Xero sync"}
        />
      </AdminMetricStrip>

      <section className="dash-attention" aria-labelledby="ops-attention-title">
        <h2 id="ops-attention-title" className="dash-attention__title">
          What needs attention
        </h2>
        {attention.length === 0 ? (
          <p className="dash-attention__clear">Nothing is overdue. Every active job has a next action in the future.</p>
        ) : (
          <ul className="dash-attention__list">
            {attention.map((item) => (
              <li
                key={item.projectId}
                className={`dash-attention__item${item.reason === "next_action_overdue" ? " dash-attention__item--urgent" : ""}`}
              >
                <Link className="dash-attention__link" href={`/admin/operations/projects/${item.projectId}/`}>
                  <span className="dash-attention__label">
                    {REASON_LABEL[item.reason]}
                    {item.due ? ` · ${formatOpsDate(item.due)}` : ""} — {item.title}
                  </span>
                  {item.detail ? <span className="dash-attention__hint">{item.detail}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AdminPanel title="Active projects" description="Ordered by next action date.">
        {open.length === 0 ? (
          <AdminEmptyState
            compact
            title="No active projects yet."
            description="Projects appear here when a quote is marked Accepted in Xero, or after the Monday jobs are migrated."
          />
        ) : (
          <ProjectTable projects={open} caption="Active projects" />
        )}
      </AdminPanel>
    </div>
  );
}
