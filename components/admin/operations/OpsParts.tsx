import Link from "next/link";
import { AdminActionForm, AdminInfoBanner, AdminStatusBadge, AdminSubmitButton, AdminTable } from "@/components/admin/ui";
import { runXeroSyncAction } from "@/app/admin/operations/actions";
import { PAYMENT_STATUS_LABELS, SERVICE_LABELS, stageLabel } from "@/lib/operations/lifecycle";
import type { OpsSetup } from "@/lib/operations/queries";
import type { OpsProject, OpsSyncRun, PaymentStatus } from "@/lib/operations/types";
import { formatOpsDate, formatOpsDateTime, formatOpsMoney } from "./ops-format";

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  not_invoiced: "ops-neutral",
  awaiting_payment: "ops-warn",
  part_paid: "ops-info",
  paid_up_to_date: "ops-info",
  paid_in_full: "ops-good",
  overdue: "ops-bad",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <AdminStatusBadge status={PAYMENT_TONE[status]} label={PAYMENT_STATUS_LABELS[status]} />;
}

export function StageBadge({ project }: { project: Pick<OpsProject, "stage" | "is_supply_only" | "on_hold"> }) {
  return (
    <span className="ops-stage">
      <AdminStatusBadge status={project.stage === "completed" ? "ops-good" : "ops-info"} label={stageLabel(project.stage, project.is_supply_only)} />
      {project.on_hold ? <AdminStatusBadge status="ops-warn" label="On hold" /> : null}
    </span>
  );
}

/** Plain statement of what is not set up, so empty screens are never mistaken for real data. */
export function OpsSetupBanners({ setup }: { setup: OpsSetup }) {
  return (
    <>
      {!setup.tablesReady ? (
        <AdminInfoBanner tone="warning">
          <strong>Operations is not switched on yet.</strong> The database tables have not been installed
          (migration <code>20261026150000_operations_foundation.sql</code>). Monday stays the working board until then.
        </AdminInfoBanner>
      ) : null}
      {setup.tablesReady && !setup.bridgeConfigured ? (
        <AdminInfoBanner tone="warning">
          <strong>Xero is not connected to this screen.</strong> Set <code>XERO_BRIDGE_API_KEY</code> on the server so
          accepted quotes and payments can be read from the Damtech Xero bridge.
        </AdminInfoBanner>
      ) : null}
    </>
  );
}

export function SyncStatus({
  lastSync,
  lastSuccessfulSync,
  hasBaseline,
  canSync,
  bridgeConfigured,
}: {
  lastSync: OpsSyncRun | null;
  lastSuccessfulSync: OpsSyncRun | null;
  hasBaseline: boolean;
  canSync: boolean;
  bridgeConfigured: boolean;
}) {
  const failed = lastSync && lastSync.status === "failed";
  return (
    <div className="ops-sync">
      <p className="ops-sync__line">
        Xero last synced: <strong>{lastSuccessfulSync ? formatOpsDateTime(lastSuccessfulSync.finished_at ?? lastSuccessfulSync.started_at) : "never"}</strong>
        {failed ? (
          <span className="ops-sync__error"> · Last attempt failed {formatOpsDateTime(lastSync.started_at)}{lastSync.error ? `: ${lastSync.error.split("\n")[0]}` : ""}</span>
        ) : null}
      </p>
      {canSync && bridgeConfigured ? (
        hasBaseline ? (
          <AdminActionForm action={runXeroSyncAction} className="ops-sync__form">
            <AdminSubmitButton variant="secondary" pendingLabel="Syncing…">Sync with Xero now</AdminSubmitButton>
          </AdminActionForm>
        ) : (
          <AdminActionForm
            action={runXeroSyncAction}
            className="ops-sync__form"
            confirmMessage="Record every quote that is already accepted or invoiced in Xero as existing work? Only quotes accepted after this will create new projects. Quotes listed on migrated Monday jobs are linked to them."
          >
            <input type="hidden" name="baseline" value="true" />
            <AdminSubmitButton pendingLabel="Reading Xero…">Run first sync (baseline)</AdminSubmitButton>
          </AdminActionForm>
        )
      ) : null}
    </div>
  );
}

export function ProjectTable({ projects, caption }: { projects: OpsProject[]; caption: string }) {
  return (
    <AdminTable caption={caption} className="ops-table">
      <thead>
        <tr>
          <th scope="col">Project</th>
          <th scope="col">Stage</th>
          <th scope="col">Next action</th>
          <th scope="col">Due</th>
          <th scope="col">Payment (Xero)</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <tr key={p.id}>
            <td data-label="Project">
              <Link href={`/admin/operations/projects/${p.id}/`} className="ops-table__title">
                {p.title}
              </Link>
              <span className="ops-table__meta">
                {SERVICE_LABELS[p.service]}
                {p.is_supply_only ? " · Supply only" : ""}
                {p.site_location ? ` · ${p.site_location}` : ""}
              </span>
            </td>
            <td data-label="Stage">
              <StageBadge project={p} />
            </td>
            <td data-label="Next action">{p.stage === "completed" ? "—" : p.next_action}</td>
            <td data-label="Due">{p.stage === "completed" ? "—" : formatOpsDate(p.next_action_due)}</td>
            <td data-label="Payment (Xero)">
              <PaymentBadge status={p.payment_status} />
              {p.amount_due > 0 ? <span className="ops-table__meta">{formatOpsMoney(p.amount_due)} due</span> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}
