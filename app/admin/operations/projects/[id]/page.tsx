import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { getOpsProject } from "@/lib/operations/queries";
import {
  SERVICE_LABELS,
  stageLabel,
  stagePath,
  todayInSouthAfrica,
} from "@/lib/operations/lifecycle";
import { DOCUMENT_KINDS, PROJECT_SERVICES } from "@/lib/operations/types";
import { SiteLocationFields } from "@/components/admin/operations/SiteLocationFields";
import {
  changeStageAction,
  setOnHoldAction,
  updateNextActionAction,
  updateProjectDetailsAction,
} from "@/app/admin/operations/actions";
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
import {
  AdminActionForm,
  AdminBackLink,
  AdminCheckbox,
  AdminDataList,
  AdminDateInput,
  AdminEmptyState,
  AdminErrorState,
  AdminField,
  AdminInfoBanner,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminSubmitButton,
  AdminTable,
  AdminTextarea,
} from "@/components/admin/ui";
import { OpsSetupBanners, StageBadge } from "@/components/admin/operations/OpsParts";
import { MaterialsBadge, NextActionCell, PaymentPictureBadge } from "@/components/admin/operations/BoardParts";
import { formatOpsDate, formatOpsDateTime, formatOpsMoney } from "@/components/admin/operations/ops-format";
import { ProjectMaterials } from "@/components/admin/operations/procurement/ProjectMaterials";
import { adminOpsDb } from "@/lib/operations/admin-db";
import { saDate } from "@/lib/operations/calendar";
import { loadProcurement } from "@/lib/operations/procurement-store";

export const metadata: Metadata = { title: "Project" };

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; existing?: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DOCUMENT_LABELS: Record<(typeof DOCUMENT_KINDS)[number], string> = {
  safety_file: "Safety file",
  supplier_quote: "Supplier quote",
  drawing: "Drawing",
  photo: "Photos",
  handover: "Handover",
  other: "Other",
};

const TASK_KIND_LABELS = { task: "Task", quality: "Quality check", handover: "Handover" } as const;

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "materials", label: "Materials" },
  { id: "financials", label: "Financials" },
  { id: "documents", label: "Documents & activity" },
] as const;

export default async function OpsProjectPage({ params, searchParams }: PageProps) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { created, existing } = await searchParams;
  if (!UUID.test(id)) notFound();
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

  const { project: p, materials, invoices, quotes, activity, tasks, documents, leads, payment, materialsStatus } = load.data;
  const canEdit = canPerform(admin.profile.role, "manageOperations");
  const path = stagePath(p.is_supply_only);
  // One main action: move the job to its next stage (on hold jobs wait).
  const nextStage = p.on_hold ? null : (path[path.indexOf(p.stage) + 1] ?? null);
  const today = todayInSouthAfrica();
  const notes = activity.filter((a) => a.kind === "note");
  const history = activity.filter((a) => a.kind !== "note");
  const openTasks = tasks.filter((t) => !t.done).length;
  const { db } = await adminOpsDb();
  const [procurement, firstBooking] = await Promise.all([
    loadProcurement(db, { projectId: p.id }),
    db.from("ops_bookings").select("start_at").eq("project_id", p.id).neq("status", "cancelled").gte("end_at", new Date().toISOString()).order("start_at").limit(1),
  ]);
  const bookedStart = (firstBooking.data?.[0]?.start_at as string | undefined) ?? null;
  const installStart = bookedStart ? saDate(bookedStart) : (p.scheduled_start ?? null);

  return (
    <div className="admin-stack--page ops">
      <AdminBackLink listPath="/admin/operations/projects/" label="Projects" />
      <AdminPageHeader
        title={p.title}
        description={`${p.customer_name}${p.site_location ? ` · ${p.site_location}` : ""} · Value ${formatOpsMoney(p.quoted_total_incl_vat)} · Paid ${formatOpsMoney(payment.paid)} · Owed ${formatOpsMoney(payment.due)}`}
        primaryActionNode={
          canEdit && nextStage && !p.archived_at ? (
            <AdminActionForm action={changeStageAction} className="ops-header-action">
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="stage" value={nextStage} />
              <AdminSubmitButton pendingLabel="Moving…">
                {nextStage === "completed" ? "Mark complete" : `Move to ${stageLabel(nextStage, p.is_supply_only)}`}
              </AdminSubmitButton>
            </AdminActionForm>
          ) : null
        }
        toolbar={
          <span className="ops-stage">
            <StageBadge project={p} />
            <PaymentPictureBadge payment={payment} />
            <MaterialsBadge status={materialsStatus} />
          </span>
        }
      />

      {created === "xero" ? (
        <AdminInfoBanner tone="info">
          Project created from Xero with the customer, numbers and amounts filled in. Add what Xero doesn&apos;t know: site, scope, dates, contact person and the next action.
        </AdminInfoBanner>
      ) : created ? (
        <AdminInfoBanner tone="info">Project created. Add tasks, supplier orders and documents below.</AdminInfoBanner>
      ) : null}
      {existing ? <AdminInfoBanner tone="muted">That Xero record was already on this project.</AdminInfoBanner> : null}
      {p.needs_review ? (
        <AdminInfoBanner tone="warning">
          {p.source === "xero_quote"
            ? "Created automatically from an accepted Xero quote. Check the service, site and scope below, then save the details."
            : "Migrated from Monday. Check the stage and details, then save the details."}
        </AdminInfoBanner>
      ) : null}
      {p.on_hold ? <AdminInfoBanner tone="warning">On hold: {p.on_hold_reason}</AdminInfoBanner> : null}
      {p.archived_at ? <AdminInfoBanner tone="muted">Archived on {formatOpsDate(p.archived_at.slice(0, 10))}.</AdminInfoBanner> : null}

      <nav className="ops-sections" aria-label="Project sections">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.label}
            {s.id === "tasks" && openTasks ? ` (${openTasks})` : ""}
            {s.id === "materials" && materials.length ? ` (${materials.length})` : ""}
          </a>
        ))}
      </nav>

      {/* ------------------------------------------------------------ Overview */}
      <section id="overview" className="ops-detail" aria-label="Overview">
        <div className="ops-detail__main">
          <AdminPanel title="Next action">
            <NextActionCell project={p} today={today} />
            {canEdit ? (
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
            ) : null}
          </AdminPanel>

          <AdminPanel title="Stage" description="The project moves to its group automatically. Payment never changes the stage.">
            <ol className="ops-stages" aria-label="Project stages">
              {path.map((s) => {
                const index = path.indexOf(s);
                const current = path.indexOf(p.stage);
                return (
                  <li
                    key={s}
                    className={`ops-stages__step${s === p.stage ? " ops-stages__step--current" : index < current ? " ops-stages__step--done" : ""}`}
                    aria-current={s === p.stage ? "step" : undefined}
                  >
                    {stageLabel(s, p.is_supply_only)}
                  </li>
                );
              })}
            </ol>
            {canEdit ? (
              <div className="ops-form-row">
                <AdminActionForm action={changeStageAction} className="ops-form ops-form--inline">
                  <input type="hidden" name="id" value={p.id} />
                  <AdminField label="Move to" htmlFor="stage">
                    <AdminSelect id="stage" name="stage" defaultValue={p.stage}>
                      {path.map((s) => (
                        <option key={s} value={s}>
                          {stageLabel(s, p.is_supply_only)}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  {p.stage === "awaiting_deposit" ? (
                    <AdminCheckbox name="allow_without_deposit" label="Proceed without a deposit (agreed with the customer)" />
                  ) : null}
                  <AdminSubmitButton variant="secondary">Change stage</AdminSubmitButton>
                </AdminActionForm>
                <AdminActionForm action={setOnHoldAction} className="ops-form ops-form--inline">
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
                  <AdminActionForm
                    action={archiveProjectAction}
                    className="ops-form ops-form--inline"
                    confirmMessage={p.archived_at ? undefined : "Archive this completed project? It leaves the Completed list but keeps all its records."}
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="archive" value={p.archived_at ? "false" : "true"} />
                    <AdminSubmitButton variant="outline">{p.archived_at ? "Restore from archive" : "Archive project"}</AdminSubmitButton>
                  </AdminActionForm>
                ) : null}
              </div>
            ) : null}
          </AdminPanel>

          <AdminPanel title="Details" description={canEdit ? "Saving also clears the “check details” flag." : undefined}>
            {canEdit ? (
              <details className="ops-collapse" open={p.needs_review || created !== undefined}>
              <summary>Edit site, contact, crew, dates and scope</summary>
              <AdminActionForm action={updateProjectDetailsAction} className="ops-form ops-form--grid">
                <input type="hidden" name="id" value={p.id} />
                <AdminField label="Service" htmlFor="service">
                  <AdminSelect id="service" name="service" defaultValue={p.service}>
                    {PROJECT_SERVICES.map((s) => (
                      <option key={s} value={s}>
                        {SERVICE_LABELS[s]}
                      </option>
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
                <AdminField label="Crew" htmlFor="crew">
                  <AdminInput id="crew" name="crew" defaultValue={p.crew ?? ""} maxLength={300} />
                </AdminField>
                <AdminField label="Site work starts" htmlFor="scheduled_start">
                  <AdminDateInput id="scheduled_start" name="scheduled_start" defaultValue={p.scheduled_start ?? ""} />
                </AdminField>
                <AdminField label="Site work ends" htmlFor="scheduled_end">
                  <AdminDateInput id="scheduled_end" name="scheduled_end" defaultValue={p.scheduled_end ?? ""} />
                </AdminField>
                <AdminField label="Job description / scope" htmlFor="scope" className="ops-form__full">
                  <AdminTextarea id="scope" name="scope" rows={6} defaultValue={p.scope ?? ""} maxLength={8000} />
                </AdminField>
                <AdminSubmitButton>Save details</AdminSubmitButton>
              </AdminActionForm>
              </details>
            ) : (
              <p className="ops-pre">{p.scope ?? "—"}</p>
            )}
          </AdminPanel>
        </div>

        <aside className="ops-detail__side">
          <AdminPanel title="Summary" compact>
            <AdminDataList
              items={[
                { label: "Customer", value: p.customer_name },
                { label: "Service", value: `${SERVICE_LABELS[p.service]}${p.is_supply_only ? " (supply only)" : ""}` },
                { label: "Lead", value: leads.find((l) => l.id === p.project_lead_id)?.full_name || leads.find((l) => l.id === p.project_lead_id)?.email || "Not assigned" },
                { label: "Crew", value: p.crew ?? "—" },
                { label: "Site dates", value: p.scheduled_start ? `${formatOpsDate(p.scheduled_start)} – ${formatOpsDate(p.scheduled_end)}` : "Not scheduled" },
                { label: "Contact", value: [p.contact_person, p.contact_phone, p.contact_email].filter(Boolean).join(" · ") || "—" },
                { label: "Quoted (incl. VAT)", value: formatOpsMoney(p.quoted_total_incl_vat) },
                { label: "Outstanding (Xero)", value: payment.due > 0 ? formatOpsMoney(payment.due) : "Nothing due" },
              ]}
            />
            {p.onedrive_url ? (
              <p>
                <a href={p.onedrive_url} target="_blank" rel="noopener noreferrer" className="admin-back-link">
                  Open OneDrive folder ↗
                </a>
              </p>
            ) : null}
          </AdminPanel>

          {canEdit ? (
            <AdminPanel compact>
              <details className="ops-collapse">
              <summary>Name, lead and OneDrive folder</summary>
              <AdminActionForm action={updateProjectPeopleAction} className="ops-form">
                <input type="hidden" name="id" value={p.id} />
                <AdminField label="Project name" htmlFor="people-title" required>
                  <AdminInput id="people-title" name="title" defaultValue={p.title} maxLength={200} />
                </AdminField>
                <AdminField label="Customer" htmlFor="people-customer" required>
                  <AdminInput id="people-customer" name="customer_name" defaultValue={p.customer_name} maxLength={200} />
                </AdminField>
                <AdminField label="Project lead" htmlFor="project_lead_id">
                  <AdminSelect id="project_lead_id" name="project_lead_id" defaultValue={p.project_lead_id ?? ""}>
                    <option value="">Not assigned</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name || l.email}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Next action owner" htmlFor="next_action_owner">
                  <AdminInput id="next_action_owner" name="next_action_owner" defaultValue={p.next_action_owner ?? ""} maxLength={120} placeholder="Optional" />
                </AdminField>
                <AdminField label="OneDrive folder link" htmlFor="onedrive_url">
                  <AdminInput id="onedrive_url" name="onedrive_url" type="url" defaultValue={p.onedrive_url ?? ""} maxLength={1000} placeholder="https://…" />
                </AdminField>
                <AdminCheckbox name="materials_by_client" defaultChecked={p.materials_by_client} label="Client supplies the materials" />
                <AdminSubmitButton variant="secondary">Save</AdminSubmitButton>
              </AdminActionForm>
              </details>
            </AdminPanel>
          ) : null}
        </aside>
      </section>

      {/* ------------------------------------------------------------ Tasks */}
      <AdminPanel id="tasks" title="Tasks and checklist" description="Only what this job needs. Quality checks and handover items can be added as you go.">
        {tasks.length === 0 ? (
          <AdminEmptyState compact title="No tasks yet." />
        ) : (
          <ul className="ops-tasks">
            {tasks.map((t) => {
              const overdue = !t.done && t.due_date !== null && t.due_date < today;
              return (
                <li key={t.id} className={`ops-tasks__item${t.done ? " ops-tasks__item--done" : ""}`}>
                  {canEdit ? (
                    <AdminActionForm action={toggleTaskAction} className="ops-tasks__toggle">
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="done" value={t.done ? "false" : "true"} />
                      <AdminSubmitButton variant="outline" pendingLabel="…">{t.done ? "Reopen" : "Done"}</AdminSubmitButton>
                    </AdminActionForm>
                  ) : null}
                  <span className="ops-tasks__text">
                    <span>{t.title}</span>
                    <span className="ops-table__meta">
                      {TASK_KIND_LABELS[t.kind]}
                      {t.due_date ? ` · by ${formatOpsDate(t.due_date)}` : ""}
                      {t.owner ? ` · ${t.owner}` : ""}
                      {t.done && t.completed_at ? ` · done ${formatOpsDateTime(t.completed_at)}` : ""}
                      {overdue ? (
                        <>
                          {" "}
                          <AdminStatusBadge status="ops-bad" label="Overdue" />
                        </>
                      ) : null}
                    </span>
                  </span>
                  {canEdit ? (
                    <AdminActionForm action={deleteTaskAction} className="ops-tasks__remove" confirmMessage={`Remove the task “${t.title}”?`}>
                      <input type="hidden" name="id" value={t.id} />
                      <AdminSubmitButton variant="outline" pendingLabel="…">Remove</AdminSubmitButton>
                    </AdminActionForm>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {canEdit ? (
          <AdminActionForm action={addTaskAction} className="ops-form ops-form--inline" resetOnSuccess>
            <input type="hidden" name="project_id" value={p.id} />
            <AdminField label="New task" htmlFor="task-title" className="ops-form__grow">
              <AdminInput id="task-title" name="title" maxLength={300} placeholder="e.g. Safety file submitted to client" />
            </AdminField>
            <AdminField label="Type" htmlFor="task-kind">
              <AdminSelect id="task-kind" name="kind" defaultValue="task">
                <option value="task">Task</option>
                <option value="quality">Quality check</option>
                <option value="handover">Handover</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Due" htmlFor="task-due">
              <AdminDateInput id="task-due" name="due_date" />
            </AdminField>
            <AdminField label="Owner" htmlFor="task-owner">
              <AdminInput id="task-owner" name="owner" maxLength={120} />
            </AdminField>
            <AdminSubmitButton>Add task</AdminSubmitButton>
          </AdminActionForm>
        ) : null}
      </AdminPanel>

      {/* ------------------------------------------------------------ Materials */}
      <AdminPanel
        id="materials"
        title="Materials and supplier orders"
        description={`${p.materials_by_client ? "Client supplies the materials. " : ""}Open an order for its items, deliveries, documents and Xero bills. Supplier payment comes from Xero.`}
      >
        {procurement.state === "ok" ? (
          <ProjectMaterials
            projectId={p.id}
            orders={procurement.orders}
            canEdit={canEdit}
            canApprove={canPerform(admin.profile.role, "approveProcurement")}
            today={today}
            installStart={installStart}
          />
        ) : (
          <AdminErrorState title="Supplier orders could not be loaded." message="Refresh in a moment." />
        )}
      </AdminPanel>

      {/* ------------------------------------------------------------ Financials */}
      <AdminPanel
        id="financials"
        title="Financials (from Xero, read-only)"
        description={`Last synced ${formatOpsDateTime(p.payment_synced_at)}. Invoices, payments and credits are changed in Xero, never here.`}
      >
        <div className="ops-money">
          <div>
            <span className="ops-money__label">Payment</span>
            <PaymentPictureBadge payment={payment} />
          </div>
          <div>
            <span className="ops-money__label">Contract value</span>
            <strong>{formatOpsMoney(p.quoted_total_incl_vat)}</strong>
          </div>
          <div>
            <span className="ops-money__label">Invoiced</span>
            <strong>{formatOpsMoney(payment.invoiced)}</strong>
          </div>
          <div>
            <span className="ops-money__label">Paid</span>
            <strong>{formatOpsMoney(payment.paid)}</strong>
          </div>
          <div>
            <span className="ops-money__label">Credited</span>
            <strong>{formatOpsMoney(payment.credited)}</strong>
          </div>
          <div>
            <span className="ops-money__label">Due on invoices</span>
            <strong>{formatOpsMoney(payment.due)}</strong>
          </div>
          <div>
            <span className="ops-money__label">Not yet invoiced</span>
            <strong>{payment.notYetInvoiced === null ? "Quote unknown" : formatOpsMoney(payment.notYetInvoiced)}</strong>
          </div>
        </div>
        {quotes.length || p.xero_quote_numbers.length ? (
          <p className="ops-table__meta">
            Quotes: {(quotes.length ? quotes.map((q) => `${q.quote_number} (${q.xero_status.toLowerCase()}${q.total_incl_vat !== null ? `, ${formatOpsMoney(q.total_incl_vat)}` : ""})`) : p.xero_quote_numbers).join(", ")}
          </p>
        ) : (
          <p className="ops-table__meta">No Xero quote linked.</p>
        )}
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
                    <span className="ops-table__meta">
                      {i.xero_status.toLowerCase()} · {formatOpsDate(i.invoice_date)}
                      {i.match_method === "manual" ? " · linked by hand" : ""}
                    </span>
                  </td>
                  <td data-label="Type">{i.kind === "unclassified" ? "—" : i.kind}</td>
                  <td data-label="Total">{formatOpsMoney(i.total_incl_vat)}</td>
                  <td data-label="Paid">{formatOpsMoney(i.amount_paid)}</td>
                  <td data-label="Due">
                    {i.amount_due > 0 ? `${formatOpsMoney(i.amount_due)} by ${formatOpsDate(i.due_date)}` : i.xero_status.toUpperCase() === "VOIDED" ? "Voided" : "Settled"}
                    {i.amount_due > 0 && i.due_date && i.due_date < today ? (
                      <>
                        {" "}
                        <AdminStatusBadge status="ops-bad" label="Overdue" />
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : (
          <p className="ops-table__meta">No invoices linked yet.</p>
        )}
        {canEdit ? (
          <AdminActionForm action={linkXeroNumbersAction} className="ops-form ops-form--inline" resetOnSuccess>
            <input type="hidden" name="id" value={p.id} />
            <AdminField label="Link a Xero quote or invoice" htmlFor="xero-numbers" className="ops-form__grow">
              <AdminInput id="xero-numbers" name="numbers" maxLength={300} placeholder="QU0301 or INV0143" />
            </AdminField>
            <AdminSubmitButton variant="secondary">Link</AdminSubmitButton>
          </AdminActionForm>
        ) : null}
      </AdminPanel>

      {/* ------------------------------------------------------------ Documents & activity */}
      <section id="documents" className="ops-detail" aria-label="Documents and activity">
        <div className="ops-detail__main">
          <AdminPanel title="Documents and photos" description="Links to OneDrive. The files stay in OneDrive.">
            {documents.length === 0 ? (
              <AdminEmptyState compact title="No documents linked yet." />
            ) : (
              <ul className="ops-docs">
                {documents.map((d) => (
                  <li key={d.id}>
                    <a href={d.url} target="_blank" rel="noopener noreferrer">
                      {d.title} ↗
                    </a>
                    <span className="ops-table__meta">
                      {DOCUMENT_LABELS[d.kind]} · {formatOpsDate(d.created_at.slice(0, 10))}
                    </span>
                    {canEdit ? (
                      <AdminActionForm action={removeDocumentAction} className="ops-docs__remove" confirmMessage={`Remove the link to “${d.title}”? The file stays in OneDrive.`}>
                        <input type="hidden" name="id" value={d.id} />
                        <AdminSubmitButton variant="outline" pendingLabel="…">Remove</AdminSubmitButton>
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
                      <option key={k} value={k}>
                        {DOCUMENT_LABELS[k]}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminSubmitButton>Add link</AdminSubmitButton>
              </AdminActionForm>
            ) : null}
          </AdminPanel>

          <AdminPanel title="Notes">
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
              <p className="ops-table__meta">No notes yet.</p>
            ) : (
              <ol className="ops-activity">
                {notes.map((n) => (
                  <li key={n.id}>
                    <span className="ops-pre">{n.summary}</span>
                    <span className="ops-table__meta">
                      {n.actor_label} · {formatOpsDateTime(n.at)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </AdminPanel>
        </div>
        <aside className="ops-detail__side">
          <AdminPanel title="History" compact description="Every change, who made it and when.">
            {history.length === 0 ? (
              <p className="ops-table__meta">No activity yet.</p>
            ) : (
              <ol className="ops-activity">
                {history.map((a) => (
                  <li key={a.id}>
                    <span>{a.summary}</span>
                    <span className="ops-table__meta">
                      {a.actor_label} · {formatOpsDateTime(a.at)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </AdminPanel>
        </aside>
      </section>
    </div>
  );
}
