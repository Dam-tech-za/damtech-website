import Link from "next/link";
import { AdminActionForm, AdminSelect, AdminStatusBadge, AdminSubmitButton } from "@/components/admin/ui";
import { changeStageAction } from "@/app/admin/operations/actions";
import {
  GROUP_LABELS,
  PROJECT_GROUPS,
  groupForStage,
  MATERIALS_ROLLUP_LABELS,
  PAYMENT_LABEL_TEXT,
  type MaterialsRollup,
  type PaymentPicture,
  type ProjectGroup,
} from "@/lib/operations/board";
import { SERVICE_LABELS, stageLabel, stagePath } from "@/lib/operations/lifecycle";
import type { BoardProject } from "@/lib/operations/queries";
import { StageBadge } from "./OpsParts";
import { formatOpsDate, formatOpsMoney } from "./ops-format";

const PAYMENT_TONE: Record<PaymentPicture["label"], string> = {
  deposit_not_invoiced: "ops-neutral",
  deposit_invoiced: "ops-warn",
  deposit_paid: "ops-info",
  balance_due: "ops-warn",
  paid_in_full: "ops-good",
};

export function PaymentPictureBadge({ payment }: { payment: PaymentPicture }) {
  return (
    <span className="ops-stage">
      <AdminStatusBadge status={PAYMENT_TONE[payment.label]} label={PAYMENT_LABEL_TEXT[payment.label]} />
      {payment.overdue ? <AdminStatusBadge status="ops-bad" label="Overdue" /> : null}
    </span>
  );
}

const MATERIALS_TONE: Record<MaterialsRollup, string> = {
  client_supplies: "ops-neutral",
  none: "ops-neutral",
  problem: "ops-bad",
  to_order: "ops-warn",
  awaiting_supplier: "ops-info",
  all_in: "ops-good",
};

export function MaterialsBadge({ status }: { status: MaterialsRollup }) {
  return <AdminStatusBadge status={MATERIALS_TONE[status]} label={MATERIALS_ROLLUP_LABELS[status]} />;
}

/** Next action and its date, with an overdue / today marker. */
export function NextActionCell({ project, today }: { project: Pick<BoardProject, "stage" | "next_action" | "next_action_due" | "next_action_owner">; today: string }) {
  if (project.stage === "completed") return <span className="ops-table__meta">—</span>;
  const due = project.next_action_due;
  const tone = !due ? "ops-bad" : due < today ? "ops-bad" : due === today ? "ops-warn" : null;
  return (
    <span className="ops-next">
      <span>{project.next_action || "No next action"}</span>
      <span className="ops-table__meta">
        {due ? formatOpsDate(due) : "No date"}
        {project.next_action_owner ? ` · ${project.next_action_owner}` : ""}
        {tone ? (
          <>
            {" "}
            <AdminStatusBadge status={tone} label={!due ? "Missing" : due < today ? "Overdue" : "Today"} />
          </>
        ) : null}
      </span>
    </span>
  );
}

/** Inline stage change: the project moves to its new group automatically. */
export function QuickStage({ project, canEdit }: { project: BoardProject; canEdit: boolean }) {
  if (!canEdit) return <StageBadge project={project} />;
  const path = stagePath(project.is_supply_only);
  return (
    <AdminActionForm action={changeStageAction} className="ops-quick-stage">
      <input type="hidden" name="id" value={project.id} />
      <AdminSelect name="stage" defaultValue={project.stage} aria-label={`Stage for ${project.title}`}>
        {path.map((s) => (
          <option key={s} value={s}>
            {stageLabel(s, project.is_supply_only)}
          </option>
        ))}
      </AdminSelect>
      <AdminSubmitButton variant="outline" pendingLabel="…">
        Set
      </AdminSubmitButton>
      {project.on_hold ? <AdminStatusBadge status="ops-warn" label="On hold" /> : null}
    </AdminActionForm>
  );
}

/**
 * One row per project. Desktop: a compact table; phones: each row collapses
 * into a card (CSS on data-label), with the details behind a disclosure.
 */
export function BoardTable({
  projects,
  today,
  canEdit,
  caption,
}: {
  projects: BoardProject[];
  today: string;
  canEdit: boolean;
  caption: string;
}) {
  return (
    <table className="admin-table ops-table ops-board-table">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Project</th>
          <th scope="col">Stage</th>
          <th scope="col">Next action</th>
          <th scope="col">Payment (Xero)</th>
          <th scope="col">Value / outstanding</th>
          <th scope="col">Materials</th>
          <th scope="col">Site dates</th>
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
                {p.customer_name} · {SERVICE_LABELS[p.service]}
                {p.is_supply_only ? " · Supply only" : ""}
                {p.leadName ? ` · Lead: ${p.leadName}` : ""}
              </span>
              {p.needs_review ? <AdminStatusBadge status="ops-warn" label="Check details" /> : null}
            </td>
            <td data-label="Stage">
              <QuickStage project={p} canEdit={canEdit} />
            </td>
            <td data-label="Next action">
              <NextActionCell project={p} today={today} />
            </td>
            <td data-label="Payment (Xero)">
              <PaymentPictureBadge payment={p.payment} />
            </td>
            <td data-label="Value / outstanding">
              {formatOpsMoney(p.quoted_total_incl_vat)}
              <span className="ops-table__meta">
                {p.payment.due > 0 ? `${formatOpsMoney(p.payment.due)} due` : "Nothing due"}
                {p.payment.notYetInvoiced && p.payment.notYetInvoiced > 1 ? ` · ${formatOpsMoney(p.payment.notYetInvoiced)} not yet invoiced` : ""}
              </span>
            </td>
            <td data-label="Materials">
              <MaterialsBadge status={p.materialsStatus} />
              {p.openOrders ? (
                <Link href={`/admin/operations/projects/${p.id}/#materials`} className="ops-table__meta">
                  {p.openOrders} open order{p.openOrders === 1 ? "" : "s"}
                </Link>
              ) : null}
            </td>
            <td data-label="Site dates">
              {p.scheduled_start ? `${formatOpsDate(p.scheduled_start)} – ${formatOpsDate(p.scheduled_end)}` : <span className="ops-table__meta">Not scheduled</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function GroupHeading({ group, count }: { group: ProjectGroup; count: number }) {
  return (
    <h2 className={`ops-group__title ops-group__title--${group}`}>
      {GROUP_LABELS[group]} <span className="ops-group__count">{count}</span>
    </h2>
  );
}

/** One project as a board card: who, where, value, next step and Xero payment. */
function ProjectCard({ project: p, today }: { project: BoardProject; today: string }) {
  return (
    <li className={`ops-card${p.on_hold ? " ops-card--hold" : ""}`}>
      <Link href={`/admin/operations/projects/${p.id}/`} className="ops-card__link">
        <span className="ops-card__title">{p.title}</span>
        <span className="ops-table__meta">
          {p.customer_name}
          {p.site_location ? ` · ${p.site_location}` : ""}
        </span>
        <span className="ops-card__row">
          <span className="ops-card__value">{formatOpsMoney(p.quoted_total_incl_vat)}</span>
          <PaymentPictureBadge payment={p.payment} />
        </span>
        <NextActionCell project={p} today={today} />
        {p.on_hold ? <AdminStatusBadge status="ops-warn" label="On hold" /> : null}
      </Link>
    </li>
  );
}

/** Columns by stage group; on phones the columns scroll sideways. */
export function ProjectKanban({ projects, today }: { projects: BoardProject[]; today: string }) {
  const groups = PROJECT_GROUPS.map((group) => ({ group, items: projects.filter((p) => groupForStage(p.stage) === group) }));
  return (
    <div className="ops-kanban" role="list" aria-label="Projects by stage">
      {groups.map(({ group, items }) => (
        <section key={group} className={`ops-kanban__col ops-kanban__col--${group}`} role="listitem" aria-label={GROUP_LABELS[group]}>
          <h2 className="ops-kanban__title">
            {GROUP_LABELS[group]} <span className="ops-group__count">{items.length}</span>
          </h2>
          {items.length ? (
            <ul className="ops-kanban__cards">
              {items.map((p) => (
                <ProjectCard key={p.id} project={p} today={today} />
              ))}
            </ul>
          ) : (
            <p className="ops-kanban__empty">Nothing here</p>
          )}
        </section>
      ))}
    </div>
  );
}
