import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { getOpsProject } from "@/lib/operations/queries";
import {
  FULFILMENT_LABELS,
  MATERIAL_STATUS_LABELS,
  SERVICE_LABELS,
  stageLabel,
  stagePath,
} from "@/lib/operations/lifecycle";
import { MATERIAL_FULFILMENT, MATERIAL_ORDER_STATUSES, PROJECT_SERVICES } from "@/lib/operations/types";
import {
  addMaterialOrderAction,
  changeStageAction,
  setOnHoldAction,
  updateMaterialOrderAction,
  updateNextActionAction,
  updateProjectDetailsAction,
} from "@/app/admin/operations/actions";
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
import { OpsSetupBanners, PaymentBadge, StageBadge } from "@/components/admin/operations/OpsParts";
import { formatOpsDate, formatOpsDateTime, formatOpsMoney } from "@/components/admin/operations/ops-format";

export const metadata: Metadata = { title: "Project" };

type PageProps = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OpsProjectPage({ params }: PageProps) {
  const admin = await requireAdmin();
  const { id } = await params;
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

  const { project: p, materials, invoices, quotes, activity } = load.data;
  const canEdit = canPerform(admin.profile.role, "manageOperations");
  const path = stagePath(p.is_supply_only);

  return (
    <div className="admin-stack--page ops">
      <AdminBackLink listPath="/admin/operations/projects/" label="Projects" />
      <AdminPageHeader title={p.title} description={`${p.customer_name}${p.site_location ? ` · ${p.site_location}` : ""}`} />

      {p.needs_review ? (
        <AdminInfoBanner tone="warning">
          {p.source === "xero_quote"
            ? "Created automatically from an accepted Xero quote. Check the service, site and scope below, then save the details."
            : "Migrated from Monday. Check the stage and details, then save the details."}
        </AdminInfoBanner>
      ) : null}
      {p.on_hold ? <AdminInfoBanner tone="warning">On hold: {p.on_hold_reason}</AdminInfoBanner> : null}

      <div className="ops-detail">
        <div className="ops-detail__main">
          <AdminPanel title="Next action">
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
            ) : (
              <p>
                {p.next_action ?? "—"} · {formatOpsDate(p.next_action_due)}
              </p>
            )}
          </AdminPanel>

          <AdminPanel title="Stage">
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
              </div>
            ) : null}
          </AdminPanel>

          <AdminPanel id="materials" title="Supplier orders" description="Materials for this job. Costs are excl. VAT.">
            {materials.length === 0 ? (
              <AdminEmptyState compact title="No supplier orders yet." />
            ) : (
              <ul className="ops-orders">
                {materials.map((m) => (
                  <li key={m.id} className="ops-orders__item">
                    <div className="ops-orders__head">
                      <strong>{m.supplier_name}</strong> · {m.description}
                      {m.quantity ? ` · ${m.quantity}` : ""}
                      <span className="ops-table__meta">
                        {FULFILMENT_LABELS[m.fulfilment]}
                        {m.cost_excl_vat !== null ? ` · ${formatOpsMoney(m.cost_excl_vat)} excl. VAT` : ""}
                        {m.notes ? ` · ${m.notes}` : ""}
                      </span>
                    </div>
                    {canEdit ? (
                      <AdminActionForm action={updateMaterialOrderAction} className="ops-form ops-form--inline">
                        <input type="hidden" name="id" value={m.id} />
                        <AdminField label="Status" htmlFor={`status-${m.id}`}>
                          <AdminSelect id={`status-${m.id}`} name="status" defaultValue={m.status}>
                            {MATERIAL_ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {MATERIAL_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </AdminSelect>
                        </AdminField>
                        <AdminField label="Expected" htmlFor={`expected-${m.id}`}>
                          <AdminDateInput id={`expected-${m.id}`} name="expected_date" defaultValue={m.expected_date ?? ""} />
                        </AdminField>
                        <AdminField label="Supplier ref." htmlFor={`ref-${m.id}`}>
                          <AdminInput id={`ref-${m.id}`} name="supplier_reference" defaultValue={m.supplier_reference ?? ""} maxLength={200} />
                        </AdminField>
                        <AdminSubmitButton variant="secondary">Update</AdminSubmitButton>
                      </AdminActionForm>
                    ) : (
                      <p>
                        <AdminStatusBadge status="ops-info" label={MATERIAL_STATUS_LABELS[m.status]} /> {formatOpsDate(m.expected_date)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canEdit ? (
              <details className="ops-add">
                <summary>Add a supplier order</summary>
                <AdminActionForm action={addMaterialOrderAction} className="ops-form ops-form--grid" resetOnSuccess>
                  <input type="hidden" name="project_id" value={p.id} />
                  <AdminField label="Supplier" htmlFor="new-supplier" required>
                    <AdminInput id="new-supplier" name="supplier_name" maxLength={200} placeholder="e.g. Gundle API" />
                  </AdminField>
                  <AdminField label="Materials" htmlFor="new-description" required>
                    <AdminInput id="new-description" name="description" maxLength={1000} placeholder="e.g. 1.0mm smooth HDPE" />
                  </AdminField>
                  <AdminField label="Quantity" htmlFor="new-quantity">
                    <AdminInput id="new-quantity" name="quantity" maxLength={200} placeholder="e.g. 1,480 m²" />
                  </AdminField>
                  <AdminField label="Supplier ref." htmlFor="new-ref">
                    <AdminInput id="new-ref" name="supplier_reference" maxLength={200} />
                  </AdminField>
                  <AdminField label="Status" htmlFor="new-status">
                    <AdminSelect id="new-status" name="status" defaultValue="quote_requested">
                      {MATERIAL_ORDER_STATUSES.filter((s) => s !== "cancelled").map((s) => (
                        <option key={s} value={s}>
                          {MATERIAL_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Delivery or collection" htmlFor="new-fulfilment">
                    <AdminSelect id="new-fulfilment" name="fulfilment" defaultValue="tbc">
                      {MATERIAL_FULFILMENT.map((f) => (
                        <option key={f} value={f}>
                          {FULFILMENT_LABELS[f]}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Expected date" htmlFor="new-expected">
                    <AdminDateInput id="new-expected" name="expected_date" />
                  </AdminField>
                  <AdminField label="Cost excl. VAT (R)" htmlFor="new-cost">
                    <AdminInput id="new-cost" name="cost_excl_vat" inputMode="decimal" />
                  </AdminField>
                  <AdminField label="Notes" htmlFor="new-notes" className="ops-form__full">
                    <AdminTextarea id="new-notes" name="notes" rows={2} maxLength={2000} />
                  </AdminField>
                  <AdminSubmitButton>Add order</AdminSubmitButton>
                </AdminActionForm>
              </details>
            ) : null}
          </AdminPanel>

          <AdminPanel title="Details" description={canEdit ? "Saving also clears the “check details” flag." : undefined}>
            {canEdit ? (
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
                <AdminField label="Site" htmlFor="site_location">
                  <AdminInput id="site_location" name="site_location" defaultValue={p.site_location ?? ""} maxLength={300} />
                </AdminField>
                <AdminField label="One-way km from Pretoria" htmlFor="one_way_km">
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
                <AdminField label="Scope" htmlFor="scope" className="ops-form__full">
                  <AdminTextarea id="scope" name="scope" rows={6} defaultValue={p.scope ?? ""} maxLength={8000} />
                </AdminField>
                <AdminSubmitButton>Save details</AdminSubmitButton>
              </AdminActionForm>
            ) : (
              <p className="ops-pre">{p.scope ?? "—"}</p>
            )}
          </AdminPanel>
        </div>

        <aside className="ops-detail__side">
          <AdminPanel title="Summary" compact>
            <AdminDataList
              items={[
                { label: "Stage", value: <StageBadge project={p} /> },
                { label: "Service", value: `${SERVICE_LABELS[p.service]}${p.is_supply_only ? " (supply only)" : ""}` },
                { label: "Quoted (incl. VAT)", value: formatOpsMoney(p.quoted_total_incl_vat) },
                { label: "Crew", value: p.crew ?? "—" },
                {
                  label: "Site dates",
                  value: p.scheduled_start ? `${formatOpsDate(p.scheduled_start)} – ${formatOpsDate(p.scheduled_end)}` : "Not scheduled",
                },
              ]}
            />
          </AdminPanel>

          <AdminPanel title="Money (from Xero)" compact description={`Last synced ${formatOpsDateTime(p.payment_synced_at)}. Change payments in Xero, not here.`}>
            <AdminDataList
              items={[
                { label: "Payment", value: <PaymentBadge status={p.payment_status} /> },
                { label: "Invoiced", value: formatOpsMoney(p.amount_invoiced) },
                { label: "Paid", value: formatOpsMoney(p.amount_paid) },
                { label: "Due", value: formatOpsMoney(p.amount_due) },
              ]}
            />
            {quotes.length || p.xero_quote_numbers.length ? (
              <p className="ops-table__meta">
                Quotes: {(quotes.length ? quotes.map((q) => `${q.quote_number} (${q.xero_status.toLowerCase()})`) : p.xero_quote_numbers).join(", ")}
              </p>
            ) : null}
            {invoices.length ? (
              <AdminTable caption="Linked Xero invoices" className="ops-table ops-table--compact">
                <thead>
                  <tr>
                    <th scope="col">Invoice</th>
                    <th scope="col">Total</th>
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
                        </span>
                      </td>
                      <td data-label="Total">{formatOpsMoney(i.total_incl_vat)}</td>
                      <td data-label="Due">{i.amount_due > 0 ? `${formatOpsMoney(i.amount_due)} by ${formatOpsDate(i.due_date)}` : "Paid"}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            ) : (
              <p className="ops-table__meta">No invoices linked yet.</p>
            )}
          </AdminPanel>

          <AdminPanel title="Activity" compact>
            {activity.length === 0 ? (
              <p className="ops-table__meta">No activity yet.</p>
            ) : (
              <ol className="ops-activity">
                {activity.map((a) => (
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
      </div>
    </div>
  );
}
