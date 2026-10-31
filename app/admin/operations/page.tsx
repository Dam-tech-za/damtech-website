import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { getOperationsOverview } from "@/lib/operations/queries";
import { MATERIAL_STATUS_LABELS, todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { ATTENTION_LABELS, attentionBuckets, orderNeedsAction, type AttentionBucket } from "@/lib/operations/board";
import { completeNextActionAction, rescheduleNextActionAction } from "@/app/admin/operations/project-actions";
import {
  AdminActionForm,
  AdminButton,
  AdminDateInput,
  AdminErrorState,
  AdminField,
  AdminInput,
  AdminMetricCard,
  AdminMetricStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
  AdminSubmitButton,
} from "@/components/admin/ui";
import { OpsSetupBanners, SyncStatus } from "@/components/admin/operations/OpsParts";
import { formatOpsDate, formatOpsMoney } from "@/components/admin/operations/ops-format";

export const metadata: Metadata = { title: "Operations" };

const BUCKET_TONE: Record<AttentionBucket, string> = {
  overdue: "ops-bad",
  today: "ops-warn",
  no_next_action: "ops-bad",
  on_hold: "ops-warn",
  next_7_days: "ops-info",
  needs_review: "ops-info",
};

export default async function OperationsOverviewPage() {
  const admin = await requireAdmin();
  const load = await getOperationsOverview();
  const canSync = canPerform(admin.profile.role, "runXeroSync");
  const canEdit = canPerform(admin.profile.role, "manageOperations");

  if (!load.ok) {
    return (
      <div className="admin-stack--page ops">
        <AdminPageHeader title="Operations" description="Won jobs, what happens next, and supplier orders." />
        <OpsSetupBanners setup={load.setup} />
        {load.error === "load_failed" ? (
          <AdminErrorState title="Operations could not be loaded." message="Refresh in a moment. If it keeps happening, check System health under Settings." />
        ) : null}
      </div>
    );
  }

  const { open, openMaterialOrders, openOrders, unmatchedInvoices, lastSync, lastSuccessfulSync, hasBaseline } = load.data;
  const today = todayInSouthAfrica();
  const buckets = attentionBuckets(open, today);
  const ordersToAction = openOrders.filter((o) => orderNeedsAction(o, today));
  const awaitingDeposit = open.filter((p) => p.stage === "awaiting_deposit").length;
  const owed = open.reduce((sum, p) => sum + p.amount_due, 0);
  const overdueCount = buckets.find((b) => b.bucket === "overdue")?.projects.length ?? 0;

  return (
    <div className="admin-stack--page ops">
      <AdminPageHeader
        title="Operations"
        description="Won jobs, what happens next, and supplier orders. Money comes from Xero."
        primaryActionNode={canEdit ? <AdminButton href="/admin/operations/projects/?add=1" variant="primary">New project</AdminButton> : null}
        secondaryAction={{ href: "/admin/operations/projects/", label: "All projects" }}
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
        <AdminMetricCard label="Overdue actions" value={overdueCount} tone={overdueCount ? "warning" : "default"} />
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
        {unmatchedInvoices > 0 ? (
          <p className="ops-attention-note">
            <AdminStatusBadge status="ops-warn" label={`${unmatchedInvoices} unmatched Xero record${unmatchedInvoices === 1 ? "" : "s"}`} />{" "}
            <AdminButton href="/admin/operations/xero-review/" size="sm" variant="primary">
              Review and link
            </AdminButton>
          </p>
        ) : null}
        {buckets.length === 0 ? (
          <p className="dash-attention__clear">Nothing is overdue or due this week, and every active job has a next action.</p>
        ) : (
          buckets.map(({ bucket, projects }) => (
            <div key={bucket} className="ops-bucket">
              <h3 className="ops-bucket__title">
                <AdminStatusBadge status={BUCKET_TONE[bucket]} label={ATTENTION_LABELS[bucket]} /> <span className="ops-group__count">{projects.length}</span>
              </h3>
              <ul className="ops-bucket__list">
                {projects.map((p) => (
                  <li key={p.id} className="ops-bucket__item">
                    <div className="ops-bucket__text">
                      <Link href={`/admin/operations/projects/${p.id}/`} className="ops-table__title">
                        {p.title}
                      </Link>
                      <span className="ops-table__meta">
                        {bucket === "on_hold"
                          ? `On hold: ${p.on_hold_reason ?? "no reason given"}`
                          : `${p.next_action || "No next action"}${p.next_action_due ? ` · ${formatOpsDate(p.next_action_due)}` : ""}${p.next_action_owner ? ` · ${p.next_action_owner}` : ""}`}
                      </span>
                    </div>
                    {canEdit && bucket !== "on_hold" ? (
                      <details className="ops-bucket__act">
                        <summary>{bucket === "no_next_action" ? "Set next action" : "Done / move"}</summary>
                        <AdminActionForm action={completeNextActionAction} className="ops-form ops-form--inline" resetOnSuccess>
                          <input type="hidden" name="id" value={p.id} />
                          <AdminField label="Then" htmlFor={`then-${p.id}`}>
                            <AdminInput id={`then-${p.id}`} name="next_action" maxLength={500} placeholder="The next thing to do" />
                          </AdminField>
                          <AdminField label="By" htmlFor={`by-${p.id}`}>
                            <AdminDateInput id={`by-${p.id}`} name="next_action_due" />
                          </AdminField>
                          <AdminSubmitButton pendingLabel="…">{bucket === "no_next_action" ? "Save" : "Mark done"}</AdminSubmitButton>
                        </AdminActionForm>
                        {p.next_action ? (
                          <AdminActionForm action={rescheduleNextActionAction} className="ops-form ops-form--inline">
                            <input type="hidden" name="id" value={p.id} />
                            <AdminField label="Move to" htmlFor={`move-${p.id}`}>
                              <AdminDateInput id={`move-${p.id}`} name="next_action_due" defaultValue={p.next_action_due ?? ""} />
                            </AdminField>
                            <AdminSubmitButton variant="outline" pendingLabel="…">Reschedule</AdminSubmitButton>
                          </AdminActionForm>
                        ) : null}
                      </details>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <AdminPanel
        title="Supplier orders awaiting action"
        description="Not ordered yet, waiting on a quote, a problem, or past the expected date."
        actions={<Link href="/admin/operations/procurement/">All supplier orders</Link>}
      >
        {ordersToAction.length === 0 ? (
          <p className="ops-table__meta">No supplier order needs action.</p>
        ) : (
          <ul className="ops-bucket__list">
            {ordersToAction.map((o) => (
              <li key={o.id} className="ops-bucket__item">
                <div className="ops-bucket__text">
                  <Link href={`/admin/operations/projects/${o.project_id}/?tab=materials`} className="ops-table__title">
                    {o.supplier_name} · {o.description}
                  </Link>
                  <span className="ops-table__meta">
                    {o.project_title} · {MATERIAL_STATUS_LABELS[o.status]}
                    {o.expected_date ? ` · expected ${formatOpsDate(o.expected_date)}` : ""}
                    {o.expected_date && o.expected_date < today ? (
                      <>
                        {" "}
                        <AdminStatusBadge status="ops-bad" label="Late" />
                      </>
                    ) : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

