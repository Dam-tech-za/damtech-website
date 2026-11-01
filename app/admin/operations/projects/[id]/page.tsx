import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { getOpsProject } from "@/lib/operations/queries";
import { SERVICE_LABELS, stageLabel, stagePath, todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { DOCUMENT_KINDS, PROJECT_SERVICES, type OpsTask } from "@/lib/operations/types";
import { MATERIALS_ROLLUP_LABELS, PAYMENT_LABEL_TEXT } from "@/lib/operations/board";
import { mergeLeadSuggestions } from "@/lib/operations/board-meta";
import { SiteLocationFields } from "@/components/admin/operations/SiteLocationFields";
import { changeStageAction, setOnHoldAction, updateNextActionAction, updateProjectDetailsAction } from "@/app/admin/operations/actions";
import {
  addDocumentAction,
  addNoteAction,
  addTaskAction,
  archiveProjectAction,
  deleteTaskAction,
  linkXeroNumbersAction,
  removeDocumentAction,
  toggleTaskAction,
  updateProjectPeopleAction,
} from "@/app/admin/operations/project-actions";
import { addChecklistAction } from "@/app/admin/operations/checklist-actions";
import type { ProjectQuoteRef } from "@/app/admin/operations/quote-view-actions";
import {
  AdminActionForm,
  AdminBackLink,
  AdminCheckbox,
  AdminDateInput,
  AdminEmptyState,
  AdminErrorState,
  AdminField,
  AdminInfoBanner,
  AdminInput,
  AdminSelect,
  AdminStatusBadge,
  AdminSubmitButton,
  AdminTable,
  AdminTextarea,
} from "@/components/admin/ui";
import { OpsSetupBanners } from "@/components/admin/operations/OpsParts";
import { formatOpsDate, formatOpsDateTime, formatOpsMoney } from "@/components/admin/operations/ops-format";
import { ProjectMaterials } from "@/components/admin/operations/procurement/ProjectMaterials";
import { InvoiceCandidates, InvoiceKindSelect, LeadSelect, ProjectQuotes } from "@/components/admin/operations/project/ProjectClientParts";
import { KIND_LABELS } from "@/lib/operations/project-money";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { saDate, saTime } from "@/lib/operations/calendar";
import { CHECKLIST_SET_LABELS, FAMILY_LABELS, checklistFamily, isReadinessTask, type ChecklistSet } from "@/lib/operations/checklists";
import { costSummary, readinessIssue } from "@/lib/operations/procurement";
import { loadProcurement } from "@/lib/operations/procurement-store";
import { loadSavedLeads } from "@/lib/operations/project-leads";

export const metadata: Metadata = { title: "Project" };

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; existing?: string; tab?: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DOCUMENT_LABELS: Record<(typeof DOCUMENT_KINDS)[number], string> = {
  safety_file: "Safety file",
  supplier_quote: "Supplier quote",
  drawing: "Drawing",
  photo: "Photos",
  handover: "Handover",
  other: "Other",
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "planning", label: "Planning" },
  { id: "materials", label: "Materials" },
  { id: "quality", label: "Quality & handover" },
  { id: "financials", label: "Financials" },
  { id: "files", label: "Files & activity" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const DEPOSIT_IN = new Set(["portion_of_deposit_paid", "deposit_paid", "balance_due", "paid_in_full"]);

type BookingRow = { id: string; start_at: string; end_at: string; status: string; all_day: boolean; title: string; ops_booking_teams: { ops_teams: { name: string } | null }[] | null };

function TaskList({ tasks, canEdit, today, display }: { tasks: OpsTask[]; canEdit: boolean; today: string; display?: (t: OpsTask) => string }) {
  if (!tasks.length) return null;
  return (
    <ul className="pj-tasks">
      {tasks.map((t) => {
        const overdue = !t.done && t.due_date !== null && t.due_date < today;
        return (
          <li key={t.id} className={t.done ? "is-done" : undefined}>
            {canEdit ? (
              <AdminActionForm action={toggleTaskAction} className="pj-tasks__toggle">
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="done" value={t.done ? "false" : "true"} />
                <button type="submit" className={`pj-check${t.done ? " is-on" : ""}`} aria-label={t.done ? `Reopen ${t.title}` : `Mark ${t.title} done`}>
                  {t.done ? "✓" : ""}
                </button>
              </AdminActionForm>
            ) : (
              <span className={`pj-check${t.done ? " is-on" : ""}`} aria-hidden>{t.done ? "✓" : ""}</span>
            )}
            <span className="pj-tasks__text">
              <span>{display ? display(t) : t.title}</span>
              <span className="pj-muted">
                {[t.due_date ? `by ${formatOpsDate(t.due_date)}` : null, t.owner, t.done && t.completed_at ? `done ${formatOpsDateTime(t.completed_at)}` : null].filter(Boolean).join(" · ")}
                {overdue ? <span className="pj-bad"> Overdue</span> : null}
              </span>
            </span>
            {canEdit ? (
              <AdminActionForm action={deleteTaskAction} className="pj-tasks__remove" confirmMessage={`Remove “${t.title}”?`}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="pj-link pj-link--muted">Remove</button>
              </AdminActionForm>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function AddTaskForm({ projectId, kind, placeholder }: { projectId: string; kind: "task" | "quality" | "handover"; placeholder: string }) {
  return (
    <AdminActionForm action={addTaskAction} className="ops-form ops-form--inline pj-add" resetOnSuccess>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="kind" value={kind} />
      <AdminField label="Add an item" htmlFor={`task-${kind}`} className="ops-form__grow">
        <AdminInput id={`task-${kind}`} name="title" maxLength={300} placeholder={placeholder} />
      </AdminField>
      <AdminField label="Due" htmlFor={`task-${kind}-due`}>
        <AdminDateInput id={`task-${kind}-due`} name="due_date" />
      </AdminField>
      <AdminField label="Owner" htmlFor={`task-${kind}-owner`}>
        <AdminInput id={`task-${kind}-owner`} name="owner" maxLength={120} />
      </AdminField>
      <AdminSubmitButton variant="secondary">Add</AdminSubmitButton>
    </AdminActionForm>
  );
}

function ChecklistButton({ projectId, set, family }: { projectId: string; set: ChecklistSet; family: string }) {
  return (
    <AdminActionForm action={addChecklistAction} className="pj-inline-form">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="set" value={set} />
      <AdminSubmitButton variant="outline" pendingLabel="Adding…">
        Add {CHECKLIST_SET_LABELS[set].toLowerCase()} checklist ({family})
      </AdminSubmitButton>
    </AdminActionForm>
  );
}

function Progress({ tasks }: { tasks: OpsTask[] }) {
  if (!tasks.length) return <span className="pj-muted">Not started</span>;
  const done = tasks.filter((t) => t.done).length;
  return (
    <span className="pj-progress" aria-label={`${done} of ${tasks.length} done`}>
      <span className="pj-progress__bar"><span style={{ width: `${Math.round((done / tasks.length) * 100)}%` }} /></span>
      {done}/{tasks.length}
    </span>
  );
}

export default async function OpsProjectPage({ params, searchParams }: PageProps) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { created, existing, tab: rawTab } = await searchParams;
  if (!UUID.test(id)) notFound();
  const tab: TabId = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : "overview";
  const load = await getOpsProject(id);

  if (!load.ok) {
    return (
      <div className="admin-stack--page ops">
        <AdminBackLink listPath="/admin/operations/projects/" label="Projects" />
        <OpsSetupBanners setup={load.setup} />
        {load.error === "load_failed" ? <AdminErrorState title="This project could not be loaded." message="Refresh in a moment." /> : null}
      </div>
    );
  }
  if (!load.data) notFound();

  const { project: p, invoices, quotes, activity, tasks, documents, leads, payment, materialsStatus } = load.data;
  const canEdit = canPerform(admin.profile.role, "manageOperations");
  const canApprove = canPerform(admin.profile.role, "approveProcurement");
  const path = stagePath(p.is_supply_only);
  const nextStage = p.on_hold ? null : (path[path.indexOf(p.stage) + 1] ?? null);
  const today = todayInSouthAfrica();
  const notes = activity.filter((a) => a.kind === "note");
  const history = activity.filter((a) => a.kind !== "note");
  const { db } = await adminOpsDb();
  const [procurement, bookingsRes, savedLeads] = await Promise.all([
    loadProcurement(db, { projectId: p.id }),
    db
      .from("ops_bookings")
      .select("id, start_at, end_at, status, all_day, title, ops_booking_teams(ops_teams(name))")
      .eq("project_id", p.id)
      .neq("status", "cancelled")
      .order("start_at")
      .limit(50),
    loadSavedLeads(db),
  ]);
  const bookings = ((bookingsRes.data ?? []) as unknown as BookingRow[]).map((b) => ({
    ...b,
    teams: (b.ops_booking_teams ?? []).map((t) => t.ops_teams?.name).filter(Boolean) as string[],
  }));
  const upcoming = bookings.filter((b) => b.end_at >= new Date().toISOString());
  const nextBooking = upcoming[0] ?? null;
  const installStart = nextBooking ? saDate(nextBooking.start_at) : (p.scheduled_start ?? null);
  const crew = [...new Set(bookings.flatMap((b) => b.teams))];

  // The board stores the lead as a name (Person list); older projects used an admin account.
  const profileLead = leads.find((l) => l.id === p.project_lead_id);
  const leadName = p.project_lead_name?.trim() || p.crew?.trim() || profileLead?.full_name || profileLead?.email || null;
  const leadOptions = mergeLeadSuggestions([], savedLeads ?? undefined);

  const orders = procurement.state === "ok" ? procurement.orders : [];
  const costs = costSummary(orders.map((o) => ({ status: o.status, totals: o.totals, bills: o.bills })));
  const materialIssues = orders.map((o) => readinessIssue(o, today, installStart)).filter((x): x is string => Boolean(x));

  const family = checklistFamily(p.service);
  const planningTasks = tasks.filter((t) => t.kind === "task");
  const readinessTasks = planningTasks.filter((t) => isReadinessTask(t.title));
  const otherTasks = planningTasks.filter((t) => !isReadinessTask(t.title));
  const qualityTasks = tasks.filter((t) => t.kind === "quality");
  const handoverTasks = tasks.filter((t) => t.kind === "handover");
  const openTasks = tasks.filter((t) => !t.done);

  const quoteRefs: ProjectQuoteRef[] = [
    ...quotes.map((q) => ({ quoteId: q.xero_quote_id, number: q.quote_number, status: q.xero_status, total: q.total_incl_vat, date: null })),
    ...p.xero_quote_numbers
      .filter((n) => !quotes.some((q) => q.quote_number.replace("-", "").toUpperCase() === n.replace("-", "").toUpperCase()))
      .map((n) => ({ quoteId: null, number: n, status: null, total: null, date: null })),
  ];

  const noInvoices = payment.invoiced === 0 && invoices.length === 0;
  const depositIn = payment.label ? DEPOSIT_IN.has(payment.label) : false;
  const nextOverdue = Boolean(p.next_action_due && p.next_action_due < today && p.stage !== "completed");

  // Things that could stop the job, from real records only.
  const blockers: { text: string; tab: TabId; tone: "bad" | "warn" | "muted" }[] = [];
  if (p.on_hold) blockers.push({ text: `On hold: ${p.on_hold_reason ?? "no reason given"}`, tab: "overview", tone: "warn" });
  if (p.stage === "awaiting_deposit" && !depositIn) blockers.push({ text: noInvoices ? "Deposit not invoiced yet (no Xero invoice)" : "Deposit not received yet (per Xero)", tab: "financials", tone: "warn" });
  if (nextOverdue) blockers.push({ text: `Next action overdue (due ${formatOpsDate(p.next_action_due)})`, tab: "overview", tone: "bad" });
  if (!leadName) blockers.push({ text: "No project lead", tab: "overview", tone: "warn" });
  if (!p.is_supply_only && ["planning", "scheduled"].includes(p.stage) && !upcoming.length) blockers.push({ text: "Installation not booked in the calendar", tab: "planning", tone: "warn" });
  if (!p.materials_by_client && !orders.length && p.stage !== "completed") blockers.push({ text: "Materials not assessed: no supplier orders", tab: "materials", tone: "muted" });
  for (const issue of materialIssues.slice(0, 3)) blockers.push({ text: `Materials: ${issue}`, tab: "materials", tone: "warn" });
  const openReadiness = readinessTasks.filter((t) => !t.done).length;
  if (openReadiness && ["planning", "scheduled"].includes(p.stage)) blockers.push({ text: `${openReadiness} site readiness item${openReadiness === 1 ? "" : "s"} open`, tab: "planning", tone: "warn" });
  const openQuality = qualityTasks.filter((t) => !t.done).length;
  if (openQuality && ["in_progress", "handover"].includes(p.stage)) blockers.push({ text: `${openQuality} quality check${openQuality === 1 ? "" : "s"} open`, tab: "quality", tone: "warn" });
  const openHandover = handoverTasks.filter((t) => !t.done).length;
  if (openHandover && p.stage === "handover") blockers.push({ text: `${openHandover} handover item${openHandover === 1 ? "" : "s"} open`, tab: "quality", tone: "warn" });

  const counts: Partial<Record<TabId, number>> = {
    planning: openTasks.filter((t) => t.kind === "task").length,
    materials: orders.filter((o) => o.status !== "collected_delivered" && o.status !== "cancelled").length,
    quality: qualityTasks.filter((t) => !t.done).length + handoverTasks.filter((t) => !t.done).length,
  };
  const href = (t: TabId) => `/admin/operations/projects/${p.id}/?tab=${t}`;
  const locationText = [p.site_town, p.site_province].filter(Boolean).join(", ") || p.site_location || null;

  return (
    <div className="admin-stack--page ops pj">
      <AdminBackLink listPath="/admin/operations/projects/" label="Projects" />

      {/* ------------------------------------------------------------ Header */}
      <header className="pj-head">
        <div className="pj-head__main">
          <h1 className="pj-title">{p.title}</h1>
          <p className="pj-sub">
            {[p.customer_name, locationText, SERVICE_LABELS[p.service] + (p.is_supply_only ? " (supply only)" : ""), quoteRefs.length ? quoteRefs.map((q) => q.number).join(", ") : null].filter(Boolean).join(" · ")}
          </p>
          <div className="pj-chips">
            <span className="pj-chip pj-chip--stage">{stageLabel(p.stage, p.is_supply_only)}</span>
            {p.on_hold ? <span className="pj-chip pj-chip--warn">On hold</span> : null}
            <span className="pj-chip">Lead: {leadName ?? "none"}</span>
            {!p.is_supply_only ? <span className="pj-chip">Team: {crew.length ? crew.join(", ") : "not booked"}</span> : null}
            {!p.is_supply_only ? (
              <span className="pj-chip">{nextBooking ? `On site ${formatOpsDate(saDate(nextBooking.start_at))}` : p.scheduled_start ? `Planned ${formatOpsDate(p.scheduled_start)}` : "Not scheduled"}</span>
            ) : null}
          </div>
        </div>
        <div className="pj-head__actions">
          {canEdit && nextStage && !p.archived_at ? (
            <AdminActionForm action={changeStageAction} className="ops-header-action">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="stage" value={nextStage} />
              <AdminSubmitButton pendingLabel="Moving…">{nextStage === "completed" ? "Mark complete" : `Move to ${stageLabel(nextStage, p.is_supply_only)}`}</AdminSubmitButton>
            </AdminActionForm>
          ) : null}
          {canEdit ? (
            <details className="pj-menu">
              <summary className="admin-btn admin-btn--secondary admin-btn--sm">Change stage…</summary>
              <div className="pj-menu__panel">
                <ol className="pj-stages" aria-label="Project stages">
                  {path.map((s, i) => (
                    <li key={s} className={s === p.stage ? "is-current" : i < path.indexOf(p.stage) ? "is-done" : undefined} aria-current={s === p.stage ? "step" : undefined}>
                      {stageLabel(s, p.is_supply_only)}
                    </li>
                  ))}
                </ol>
                <AdminActionForm action={changeStageAction} className="ops-form">
                  <input type="hidden" name="id" value={p.id} />
                  <AdminField label="Move to" htmlFor="stage">
                    <AdminSelect id="stage" name="stage" defaultValue={p.stage}>
                      {path.map((s) => (
                        <option key={s} value={s}>{stageLabel(s, p.is_supply_only)}</option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  {p.stage === "awaiting_deposit" ? <AdminCheckbox name="allow_without_deposit" label="Proceed without a deposit (agreed with the customer)" /> : null}
                  <AdminSubmitButton variant="secondary">Change stage</AdminSubmitButton>
                </AdminActionForm>
                <AdminActionForm action={setOnHoldAction} className="ops-form">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="on_hold" value={p.on_hold ? "false" : "true"} />
                  {p.on_hold ? null : (
                    <AdminField label="On-hold reason" htmlFor="on_hold_reason">
                      <AdminInput id="on_hold_reason" name="on_hold_reason" maxLength={300} placeholder="e.g. Customer preparing the foundation" />
                    </AdminField>
                  )}
                  <AdminSubmitButton variant="outline">{p.on_hold ? "Take off hold" : "Put on hold"}</AdminSubmitButton>
                </AdminActionForm>
                {p.stage === "completed" ? (
                  <AdminActionForm action={archiveProjectAction} className="ops-form" confirmMessage={p.archived_at ? undefined : "Archive this completed project? It leaves the Completed list but keeps all its records."}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="archive" value={p.archived_at ? "false" : "true"} />
                    <AdminSubmitButton variant="outline">{p.archived_at ? "Restore from archive" : "Archive project"}</AdminSubmitButton>
                  </AdminActionForm>
                ) : null}
                <p className="pj-muted">Payment never changes the stage.</p>
              </div>
            </details>
          ) : null}
        </div>
      </header>

      {created === "xero" ? (
        <AdminInfoBanner tone="info">Project created from Xero with the customer, numbers and amounts filled in. Add what Xero doesn&apos;t know: site, scope, dates, contact person and the next action.</AdminInfoBanner>
      ) : created ? (
        <AdminInfoBanner tone="info">Project created. Add tasks, supplier orders and documents in the tabs below.</AdminInfoBanner>
      ) : null}
      {existing ? <AdminInfoBanner tone="muted">That Xero record was already on this project.</AdminInfoBanner> : null}
      {p.needs_review ? (
        <AdminInfoBanner tone="warning">
          {p.source === "xero_quote" ? "Created automatically from an accepted Xero quote. Check the service, site and scope, then save the details." : "Migrated from Monday. Check the stage and details, then save the details."}
        </AdminInfoBanner>
      ) : null}
      {p.archived_at ? <AdminInfoBanner tone="muted">Archived on {formatOpsDate(p.archived_at.slice(0, 10))}.</AdminInfoBanner> : null}

      {/* ------------------------------------------------------------ Summary */}
      <dl className="pj-summary">
        <div>
          <dt>Contract value</dt>
          <dd>{formatOpsMoney(p.quoted_total_incl_vat)}</dd>
          <small>{quoteRefs.length ? `Quote ${quoteRefs[0].number}, incl. VAT` : "Incl. VAT"}</small>
        </div>
        <div>
          <dt>Invoiced</dt>
          <dd>{noInvoices ? "None yet" : formatOpsMoney(payment.invoiced)}</dd>
          <small>{noInvoices ? "No invoices issued in Xero" : payment.notYetInvoiced !== null ? `${formatOpsMoney(payment.notYetInvoiced)} not yet invoiced` : "From Xero"}</small>
        </div>
        <div>
          <dt>Received</dt>
          <dd>{noInvoices ? "—" : formatOpsMoney(payment.paid)}</dd>
          <small className={payment.overdue ? "pj-bad" : undefined}>{noInvoices ? "Nothing invoiced yet" : payment.due > 0 ? `${formatOpsMoney(payment.due)} owed on invoices${payment.overdue ? ", overdue" : ""}` : "Nothing owed on invoices"}</small>
        </div>
        <div>
          <dt>Materials</dt>
          <dd>{p.materials_by_client ? "Client supplies" : orders.length ? formatOpsMoney(costs.committedInclVat) : "No orders"}</dd>
          <small>{p.materials_by_client ? "No supplier orders needed" : orders.length ? `Committed incl. VAT · ${MATERIALS_ROLLUP_LABELS[materialsStatus]}` : "Not assessed"}</small>
        </div>
      </dl>
      <p className="pj-muted pj-sync">Money from Xero, last synced {formatOpsDateTime(p.payment_synced_at)}.</p>

      {/* ------------------------------------------------------------ Tabs */}
      <nav className="pj-tabs" aria-label="Project sections">
        {TABS.map((t) => (
          <Link key={t.id} href={href(t.id)} aria-current={tab === t.id ? "page" : undefined} scroll={false}>
            {t.label}
            {counts[t.id] ? <span className="pj-tabs__count">{counts[t.id]}</span> : null}
          </Link>
        ))}
      </nav>

      {/* ------------------------------------------------------------ Overview */}
      {tab === "overview" ? (
        <div className="pj-grid">
          <div className="pj-col">
            <section className="pj-card" aria-labelledby="pj-next">
              <h2 id="pj-next" className="pj-card__title">
                Next action {nextOverdue ? <span className="pj-badge pj-badge--bad">Overdue</span> : null}
              </h2>
              <p className="pj-next">{p.next_action || "No next action set."}</p>
              <p className="pj-muted">
                {[p.next_action_due ? `Due ${formatOpsDate(p.next_action_due)}` : "No due date", p.next_action_owner].filter(Boolean).join(" · ")}
                {openTasks.length ? <> · <Link href={href("planning")} className="pj-link">{openTasks.length} open task{openTasks.length === 1 ? "" : "s"}</Link></> : null}
              </p>
              {canEdit ? (
                <details className="pj-edit">
                  <summary>Edit next action</summary>
                  <AdminActionForm action={updateNextActionAction} className="ops-form ops-form--inline">
                    <input type="hidden" name="id" value={p.id} />
                    <AdminField label="What happens next" htmlFor="next_action" required={p.stage !== "completed"} className="ops-form__grow">
                      <AdminInput id="next_action" name="next_action" defaultValue={p.next_action ?? ""} maxLength={500} />
                    </AdminField>
                    <AdminField label="By" htmlFor="next_action_due" required={p.stage !== "completed"}>
                      <AdminDateInput id="next_action_due" name="next_action_due" defaultValue={p.next_action_due ?? ""} />
                    </AdminField>
                    <AdminSubmitButton>Save</AdminSubmitButton>
                  </AdminActionForm>
                </details>
              ) : null}
            </section>

            <section className="pj-card" aria-labelledby="pj-blockers">
              <h2 id="pj-blockers" className="pj-card__title">Blockers and readiness</h2>
              {blockers.length ? (
                <ul className="pj-blockers">
                  {blockers.map((b) => (
                    <li key={b.text} className={`pj-blockers--${b.tone}`}>
                      <Link href={href(b.tab)} className="pj-link">{b.text}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pj-ok">Nothing is blocking this job.</p>
              )}
            </section>

            <section className="pj-card" aria-labelledby="pj-recent">
              <h2 id="pj-recent" className="pj-card__title">Recent activity</h2>
              {activity.length ? (
                <ol className="pj-activity">
                  {activity.slice(0, 3).map((a) => (
                    <li key={a.id}>
                      <span>{a.summary}</span>
                      <span className="pj-muted">{a.actor_label} · {formatOpsDateTime(a.at)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="pj-muted">No activity yet.</p>
              )}
              <Link href={href("files")} className="pj-link">All notes and history</Link>
            </section>
          </div>

          <div className="pj-col">
            {!p.is_supply_only ? (
              <section className="pj-card" aria-labelledby="pj-install">
                <h2 id="pj-install" className="pj-card__title">Installation</h2>
                <dl className="pj-facts">
                  <div><dt>Team</dt><dd>{crew.length ? crew.join(", ") : "Not booked"}</dd></div>
                  <div><dt>Dates</dt><dd>{nextBooking ? `${formatOpsDate(saDate(nextBooking.start_at))} – ${formatOpsDate(saDate(new Date(new Date(nextBooking.end_at).getTime() - 1)))}` : p.scheduled_start ? `${formatOpsDate(p.scheduled_start)} – ${formatOpsDate(p.scheduled_end)} (planned, not booked)` : "Not scheduled"}</dd></div>
                  <div><dt>Site</dt><dd>{locationText ?? "—"}</dd></div>
                  <div><dt>Site readiness</dt><dd><Progress tasks={readinessTasks} /></dd></div>
                </dl>
                <Link href={nextBooking ? `/admin/operations/calendar/?view=week&date=${saDate(nextBooking.start_at)}` : "/admin/operations/calendar/"} className="pj-link">{nextBooking ? "Open in calendar" : "Book in the calendar"}</Link>
              </section>
            ) : null}

            <section className="pj-card" aria-labelledby="pj-details">
              <h2 id="pj-details" className="pj-card__title">Project details</h2>
              <dl className="pj-facts">
                <div><dt>Service</dt><dd>{SERVICE_LABELS[p.service]}{p.is_supply_only ? " (supply only)" : ""}</dd></div>
                <div><dt>Customer</dt><dd>{p.customer_name}</dd></div>
                <div><dt>Project lead</dt><dd>{canEdit ? <LeadSelect projectId={p.id} current={leadName} options={leadOptions} /> : leadName ?? "—"}</dd></div>
                <div><dt>Contact</dt><dd>{[p.contact_person, p.contact_phone, p.contact_email].filter(Boolean).join(" · ") || "—"}</dd></div>
                <div><dt>Site address</dt><dd>{p.site_location || locationText || "—"}{p.one_way_km ? ` (${p.one_way_km} km one way)` : ""}</dd></div>
                {p.onedrive_url ? <div><dt>Files</dt><dd><a href={p.onedrive_url} target="_blank" rel="noopener noreferrer" className="pj-link">OneDrive folder ↗</a></dd></div> : null}
              </dl>
              {p.scope ? <p className="pj-scope">{p.scope}</p> : null}
              {canEdit ? (
                <details className="pj-edit" open={p.needs_review || created !== undefined}>
                  <summary>Edit project details</summary>
                  <AdminActionForm action={updateProjectDetailsAction} className="ops-form ops-form--grid">
                    <input type="hidden" name="id" value={p.id} />
                    <AdminField label="Service" htmlFor="service">
                      <AdminSelect id="service" name="service" defaultValue={p.service}>
                        {PROJECT_SERVICES.map((s) => (
                          <option key={s} value={s}>{SERVICE_LABELS[s]}</option>
                        ))}
                      </AdminSelect>
                    </AdminField>
                    <AdminCheckbox name="is_supply_only" defaultChecked={p.is_supply_only} label="Supply only (no installation)" />
                    <SiteLocationFields province={p.site_province} town={p.site_town} />
                    <AdminField label="Site address (optional extra)" htmlFor="site_location">
                      <AdminInput id="site_location" name="site_location" defaultValue={p.site_location ?? ""} maxLength={300} />
                    </AdminField>
                    <AdminField label="One-way km from base" htmlFor="one_way_km">
                      <AdminInput id="one_way_km" name="one_way_km" inputMode="decimal" defaultValue={p.one_way_km ?? ""} />
                    </AdminField>
                    <AdminField label="Contact person" htmlFor="contact_person">
                      <AdminInput id="contact_person" name="contact_person" defaultValue={p.contact_person ?? ""} maxLength={200} />
                    </AdminField>
                    <AdminField label="Contact phone" htmlFor="contact_phone">
                      <AdminInput id="contact_phone" name="contact_phone" type="tel" defaultValue={p.contact_phone ?? ""} maxLength={40} />
                    </AdminField>
                    <AdminField label="Contact email" htmlFor="contact_email">
                      <AdminInput id="contact_email" name="contact_email" type="email" defaultValue={p.contact_email ?? ""} maxLength={200} />
                    </AdminField>
                    <input type="hidden" name="crew" value={p.crew ?? ""} />
                    <AdminField label="Planned start (before booking)" htmlFor="scheduled_start">
                      <AdminDateInput id="scheduled_start" name="scheduled_start" defaultValue={p.scheduled_start ?? ""} />
                    </AdminField>
                    <AdminField label="Planned end" htmlFor="scheduled_end">
                      <AdminDateInput id="scheduled_end" name="scheduled_end" defaultValue={p.scheduled_end ?? ""} />
                    </AdminField>
                    <AdminField label="Job description / scope" htmlFor="scope" className="ops-form__full">
                      <AdminTextarea id="scope" name="scope" rows={5} defaultValue={p.scope ?? ""} maxLength={8000} />
                    </AdminField>
                    <AdminSubmitButton>Save details</AdminSubmitButton>
                  </AdminActionForm>
                  <AdminActionForm action={updateProjectPeopleAction} className="ops-form ops-form--grid">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="project_lead_id" value={p.project_lead_id ?? ""} />
                    <AdminField label="Project name" htmlFor="people-title" required>
                      <AdminInput id="people-title" name="title" defaultValue={p.title} maxLength={200} />
                    </AdminField>
                    <AdminField label="Customer" htmlFor="people-customer" required>
                      <AdminInput id="people-customer" name="customer_name" defaultValue={p.customer_name} maxLength={200} />
                    </AdminField>
                    <AdminField label="Next action owner" htmlFor="next_action_owner">
                      <AdminInput id="next_action_owner" name="next_action_owner" defaultValue={p.next_action_owner ?? ""} maxLength={120} placeholder="Optional" />
                    </AdminField>
                    <AdminField label="OneDrive folder link" htmlFor="onedrive_url">
                      <AdminInput id="onedrive_url" name="onedrive_url" type="url" defaultValue={p.onedrive_url ?? ""} maxLength={1000} placeholder="https://…" />
                    </AdminField>
                    <AdminCheckbox name="materials_by_client" defaultChecked={p.materials_by_client} label="Client supplies the materials" />
                    <AdminSubmitButton variant="secondary">Save name and folder</AdminSubmitButton>
                  </AdminActionForm>
                </details>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Planning */}
      {tab === "planning" ? (
        <div className="pj-grid">
          <div className="pj-col">
            {!p.is_supply_only ? (
              <section className="pj-card" aria-labelledby="pj-bookings">
                <h2 id="pj-bookings" className="pj-card__title">Calendar bookings</h2>
                {bookings.length ? (
                  <ul className="pj-list">
                    {bookings.map((b) => (
                      <li key={b.id}>
                        <span>
                          <strong>{formatOpsDate(saDate(b.start_at))}{saDate(b.start_at) !== saDate(new Date(new Date(b.end_at).getTime() - 1)) ? ` – ${formatOpsDate(saDate(new Date(new Date(b.end_at).getTime() - 1)))}` : ""}</strong>
                          <span className="pj-muted">{[b.all_day ? "All day" : `${saTime(b.start_at)}–${saTime(b.end_at)}`, b.teams.join(", ") || "No team", b.status === "tentative" ? "tentative" : b.status.replace("_", " ")].join(" · ")}</span>
                        </span>
                        <Link href={`/admin/operations/calendar/?view=week&date=${saDate(b.start_at)}`} className="pj-link">Open</Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="pj-muted">Not booked yet. {p.scheduled_start ? `Planned ${formatOpsDate(p.scheduled_start)} – ${formatOpsDate(p.scheduled_end)}.` : ""}</p>
                )}
                <Link href="/admin/operations/calendar/" className="pj-link">{bookings.length ? "Calendar" : "Book in the calendar"}</Link>
              </section>
            ) : null}

            <section className="pj-card" aria-labelledby="pj-tasks">
              <h2 id="pj-tasks" className="pj-card__title">Tasks</h2>
              <TaskList tasks={otherTasks} canEdit={canEdit} today={today} />
              {!otherTasks.length ? <p className="pj-muted">No tasks yet.</p> : null}
              {canEdit ? <AddTaskForm projectId={p.id} kind="task" placeholder="e.g. Safety file submitted to client" /> : null}
            </section>
          </div>
          <div className="pj-col">
            {!p.is_supply_only ? (
              <section className="pj-card" aria-labelledby="pj-ready">
                <h2 id="pj-ready" className="pj-card__title">Site readiness <Progress tasks={readinessTasks} /></h2>
                <TaskList tasks={readinessTasks} canEdit={canEdit} today={today} display={(t) => t.title.replace(/^Site readiness: /, "")} />
                {!readinessTasks.length ? <p className="pj-muted">Not assessed.</p> : null}
                {canEdit && family ? <ChecklistButton projectId={p.id} set="readiness" family={FAMILY_LABELS[family]} /> : null}
                {!family ? <p className="pj-muted">Set the service to get a starter checklist.</p> : null}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Materials */}
      {tab === "materials" ? (
        <section className="pj-card" aria-labelledby="pj-materials" id="materials">
          <h2 id="pj-materials" className="pj-card__title">Materials and supplier orders</h2>
          <p className="pj-muted">{p.materials_by_client ? "Client supplies the materials. " : ""}Open an order for its items, deliveries, documents and Xero bills. Supplier payment comes from Xero.</p>
          {procurement.state === "ok" ? (
            <ProjectMaterials projectId={p.id} orders={procurement.orders} canEdit={canEdit} canApprove={canApprove} today={today} installStart={installStart} />
          ) : (
            <AdminErrorState title="Supplier orders could not be loaded." message="Refresh in a moment." />
          )}
        </section>
      ) : null}

      {/* ------------------------------------------------------------ Quality & handover */}
      {tab === "quality" ? (
        <div className="pj-grid">
          <section className="pj-card" aria-labelledby="pj-quality">
            <h2 id="pj-quality" className="pj-card__title">Quality checks <Progress tasks={qualityTasks} /></h2>
            <TaskList tasks={qualityTasks} canEdit={canEdit} today={today} />
            {!qualityTasks.length ? <p className="pj-muted">No quality checks yet.</p> : null}
            {canEdit && family ? <ChecklistButton projectId={p.id} set="quality" family={FAMILY_LABELS[family]} /> : null}
            {canEdit ? <AddTaskForm projectId={p.id} kind="quality" placeholder="e.g. Seam test on east wall" /> : null}
            <p className="pj-muted">Test methods and pass criteria follow the project specification and the manufacturer&apos;s instructions.</p>
          </section>
          <section className="pj-card" aria-labelledby="pj-handover">
            <h2 id="pj-handover" className="pj-card__title">Snags and handover <Progress tasks={handoverTasks} /></h2>
            <TaskList tasks={handoverTasks} canEdit={canEdit} today={today} />
            {!handoverTasks.length ? <p className="pj-muted">No handover items yet.</p> : null}
            {canEdit && family ? <ChecklistButton projectId={p.id} set="handover" family={FAMILY_LABELS[family]} /> : null}
            {canEdit ? <AddTaskForm projectId={p.id} kind="handover" placeholder="e.g. Snag: re-weld patch at outlet" /> : null}
            <p className="pj-muted">Add completion photos and sign-off documents in Files &amp; activity.</p>
          </section>
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Financials */}
      {tab === "financials" ? (
        <div className="pj-grid">
          <div className="pj-col">
            <section className="pj-card" aria-labelledby="pj-money">
              <h2 id="pj-money" className="pj-card__title">Customer money (Xero, read-only)</h2>
              <dl className="pj-facts">
                <div><dt>Project value</dt><dd>{p.quoted_total_incl_vat === null ? "Not set" : `${formatOpsMoney(p.quoted_total_incl_vat)} incl. VAT`}{p.quoted_total_manual ? " (entered by hand)" : quoteRefs.length ? ` (quote ${quoteRefs[0].number})` : ""}</dd></div>
                <div><dt>Payment</dt><dd>{payment.label ? PAYMENT_LABEL_TEXT[payment.label] : "No invoices issued"}</dd></div>
                <div><dt>Invoiced</dt><dd>{noInvoices ? "Nothing yet" : formatOpsMoney(payment.invoiced)}</dd></div>
                <div><dt>Paid</dt><dd>{noInvoices ? "—" : formatOpsMoney(payment.paid)}{payment.pctPaid !== null && !noInvoices ? <span className="pj-muted"> · {payment.pctPaid}% paid</span> : null}</dd></div>
                <div><dt>Owed now</dt><dd className={payment.overdue ? "pj-bad" : undefined}>{noInvoices ? "—" : formatOpsMoney(payment.due)}{payment.overdue ? " (overdue)" : ""}</dd></div>
                {payment.credited ? <div><dt>Credited</dt><dd>{formatOpsMoney(payment.credited)}</dd></div> : null}
                <div><dt>Not yet invoiced</dt><dd>{payment.notYetInvoiced === null ? "Value unknown" : formatOpsMoney(payment.notYetInvoiced)}</dd></div>
                <div><dt>Remaining on quote</dt><dd>{payment.remainingOnQuote === null ? "Value unknown" : formatOpsMoney(payment.remainingOnQuote)}</dd></div>
                <div><dt>Last Xero sync</dt><dd>{formatOpsDateTime(p.payment_synced_at)}</dd></div>
              </dl>
              <p className="pj-muted">Not yet invoiced is project value still to bill, not money owed. Invoices never change the project value.</p>
              {!quoteRefs.length && invoices.length ? <p className="pj-warn-line">Link the accepted quote to track what&apos;s still to invoice.</p> : null}
              {invoices.length ? (
                <AdminTable caption="Linked Xero invoices" className="ops-table ops-table--compact">
                  <thead>
                    <tr>
                      <th scope="col">Invoice</th>
                      <th scope="col">Type</th>
                      <th scope="col">Total</th>
                      <th scope="col">Paid</th>
                      <th scope="col">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((i) => (
                      <tr key={i.id}>
                        <td data-label="Invoice">
                          {i.invoice_number ?? "—"}
                          <span className="ops-table__meta">{i.xero_status.toLowerCase()} · {formatOpsDate(i.invoice_date)}{i.match_method === "manual" ? " · linked by hand" : ""}</span>
                        </td>
                        <td data-label="Type">
                          {canEdit ? (
                            <InvoiceKindSelect linkId={i.id} stored={i.kind} shown={KIND_LABELS[payment.kinds.find((k) => k.invoice_number === i.invoice_number)?.kind ?? "unclassified"]} />
                          ) : (
                            KIND_LABELS[payment.kinds.find((k) => k.invoice_number === i.invoice_number)?.kind ?? i.kind]
                          )}
                        </td>
                        <td data-label="Total">{formatOpsMoney(i.total_incl_vat)}</td>
                        <td data-label="Paid">{formatOpsMoney(i.amount_paid)}</td>
                        <td data-label="Due">
                          {i.amount_due > 0 ? `${formatOpsMoney(i.amount_due)} by ${formatOpsDate(i.due_date)}` : i.xero_status.toUpperCase() === "VOIDED" ? "Voided" : "Settled"}
                          {i.amount_due > 0 && i.due_date && i.due_date < today ? <> <AdminStatusBadge status="ops-bad" label="Overdue" /></> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              ) : (
                <p className="pj-muted">No invoices issued in Xero yet.</p>
              )}
              {canEdit ? <InvoiceCandidates projectId={p.id} /> : null}
            </section>
            <section className="pj-card" aria-labelledby="pj-costs">
              <h2 id="pj-costs" className="pj-card__title">Supplier costs</h2>
              {orders.length ? (
                <dl className="pj-facts">
                  <div><dt>Estimated</dt><dd>{formatOpsMoney(costs.estimatedExclVat)} excl. VAT</dd></div>
                  <div><dt>Committed</dt><dd>{formatOpsMoney(costs.committedExclVat)} excl. VAT</dd></div>
                  <div><dt>Billed (Xero)</dt><dd>{formatOpsMoney(costs.billedInclVat)} incl. VAT</dd></div>
                  <div><dt>Paid (Xero)</dt><dd>{formatOpsMoney(costs.paidInclVat)}</dd></div>
                </dl>
              ) : (
                <p className="pj-muted">No supplier orders yet.</p>
              )}
              <p className="pj-muted">Stages of the same spend; not added together. Profit is not shown until all costs are recorded.</p>
              <Link href={href("materials")} className="pj-link">Supplier orders</Link>
            </section>
          </div>
          <div className="pj-col">
            <section className="pj-card" aria-labelledby="pj-quotes">
              <h2 id="pj-quotes" className="pj-card__title">Xero quotes</h2>
              <ProjectQuotes projectId={p.id} quotes={quoteRefs} />
              {canEdit ? (
                <AdminActionForm action={linkXeroNumbersAction} className="ops-form ops-form--inline" resetOnSuccess>
                  <input type="hidden" name="id" value={p.id} />
                  <AdminField label="Link a Xero quote or invoice" htmlFor="xero-numbers" className="ops-form__grow">
                    <AdminInput id="xero-numbers" name="numbers" maxLength={300} placeholder="QU0301 or INV0143" />
                  </AdminField>
                  <AdminSubmitButton variant="secondary">Link</AdminSubmitButton>
                </AdminActionForm>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Files & activity */}
      {tab === "files" ? (
        <div className="pj-grid">
          <div className="pj-col">
            <section className="pj-card" aria-labelledby="pj-docs" id="documents">
              <h2 id="pj-docs" className="pj-card__title">Documents and photos</h2>
              <p className="pj-muted">
                Links to OneDrive; the files stay there.
                {p.onedrive_url ? <> <a href={p.onedrive_url} target="_blank" rel="noopener noreferrer" className="pj-link">Open the project folder ↗</a></> : null}
              </p>
              {documents.length === 0 ? (
                <AdminEmptyState compact title="No documents linked yet." />
              ) : (
                <ul className="pj-list">
                  {documents.map((d) => (
                    <li key={d.id}>
                      <span>
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="pj-link">{d.title} ↗</a>
                        <span className="pj-muted">{DOCUMENT_LABELS[d.kind]} · {formatOpsDate(d.created_at.slice(0, 10))}</span>
                      </span>
                      {canEdit ? (
                        <AdminActionForm action={removeDocumentAction} className="pj-inline-form" confirmMessage={`Remove the link to “${d.title}”? The file stays in OneDrive.`}>
                          <input type="hidden" name="id" value={d.id} />
                          <button type="submit" className="pj-link pj-link--muted">Remove</button>
                        </AdminActionForm>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {canEdit ? (
                <AdminActionForm action={addDocumentAction} className="ops-form ops-form--inline" resetOnSuccess>
                  <input type="hidden" name="project_id" value={p.id} />
                  <AdminField label="Name" htmlFor="doc-title">
                    <AdminInput id="doc-title" name="title" maxLength={200} placeholder="e.g. Site photos, day 1" />
                  </AdminField>
                  <AdminField label="OneDrive link" htmlFor="doc-url" className="ops-form__grow">
                    <AdminInput id="doc-url" name="url" type="url" maxLength={1000} placeholder="https://…" />
                  </AdminField>
                  <AdminField label="Type" htmlFor="doc-kind">
                    <AdminSelect id="doc-kind" name="kind" defaultValue="other">
                      {DOCUMENT_KINDS.map((k) => (
                        <option key={k} value={k}>{DOCUMENT_LABELS[k]}</option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminSubmitButton>Add link</AdminSubmitButton>
                </AdminActionForm>
              ) : null}
            </section>
            <section className="pj-card" aria-labelledby="pj-notes">
              <h2 id="pj-notes" className="pj-card__title">Notes</h2>
              {canEdit ? (
                <AdminActionForm action={addNoteAction} className="ops-form" resetOnSuccess>
                  <input type="hidden" name="project_id" value={p.id} />
                  <AdminField label="Add a note" htmlFor="note">
                    <AdminTextarea id="note" name="note" rows={3} maxLength={4000} placeholder="Calls, site visits, decisions" />
                  </AdminField>
                  <AdminSubmitButton>Add note</AdminSubmitButton>
                </AdminActionForm>
              ) : null}
              {notes.length === 0 ? (
                <p className="pj-muted">No notes yet.</p>
              ) : (
                <ol className="pj-activity">
                  {notes.map((n) => (
                    <li key={n.id}>
                      <span className="ops-pre">{n.summary}</span>
                      <span className="pj-muted">{n.actor_label} · {formatOpsDateTime(n.at)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
          <div className="pj-col">
            <section className="pj-card" aria-labelledby="pj-history">
              <h2 id="pj-history" className="pj-card__title">History</h2>
              <p className="pj-muted">Every change, who made it and when.</p>
              {history.length === 0 ? (
                <p className="pj-muted">No activity yet.</p>
              ) : (
                <ol className="pj-activity">
                  {history.map((a) => (
                    <li key={a.id}>
                      <span>{a.summary}</span>
                      <span className="pj-muted">{a.actor_label} · {formatOpsDateTime(a.at)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      ) : null}

    </div>
  );
}
