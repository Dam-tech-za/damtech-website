import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { listUnmatchedInvoices } from "@/lib/operations/queries";
import { STAGE_LABELS } from "@/lib/operations/lifecycle";
import { createProjectFromXeroAction, dismissUnmatchedAction, linkUnmatchedInvoiceAction } from "@/app/admin/operations/project-actions";
import {
  AdminActionForm,
  AdminBackLink,
  AdminButton,
  AdminEmptyState,
  AdminErrorState,
  AdminInfoBanner,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminSubmitButton,
} from "@/components/admin/ui";
import { OpsSetupBanners } from "@/components/admin/operations/OpsParts";
import { formatOpsDate, formatOpsMoney } from "@/components/admin/operations/ops-format";

export const metadata: Metadata = { title: "Unmatched Xero records" };

/**
 * Invoices the Xero sync could not link to exactly one project with
 * certainty. Linking here is remembered: the invoice number is added to the
 * project, so the sync never asks about it again.
 */
export default async function XeroReviewPage() {
  const admin = await requireAdmin();
  const canEdit = canPerform(admin.profile.role, "manageOperations");
  const load = await listUnmatchedInvoices();

  return (
    <div className="admin-stack--page ops">
      <AdminBackLink listPath="/admin/operations/" label="Operations" />
      <AdminPageHeader
        title="Unmatched Xero records"
        description="Invoices that might belong to a project but don't name its quote. Link each to its project once and it is remembered, or make it a new project."
        primaryActionNode={canEdit ? <AdminButton href="/admin/operations/projects/new/" variant="primary">New project from Xero</AdminButton> : null}
      />
      <OpsSetupBanners setup={load.setup} />
      <AdminInfoBanner tone="muted">
        The system never links an invoice on the customer name alone. Invoices for customers with no project yet are not
        listed here: start those from <strong>New project from Xero</strong>.
      </AdminInfoBanner>

      {!load.ok ? (
        load.error === "load_failed" ? <AdminErrorState title="The review list could not be loaded." message="Refresh in a moment." /> : null
      ) : load.data.open.length === 0 ? (
        <AdminPanel>
          <AdminEmptyState compact title="Nothing to review." description="Every invoice the sync found is linked or doesn't belong to a project." />
        </AdminPanel>
      ) : (
        <AdminPanel>
          <ul className="ops-review">
            {load.data.open.map((entry) => (
              <li key={entry.id} className="ops-review__item">
                <div className="ops-review__invoice">
                  <strong>{entry.invoice_number ?? "Invoice"}</strong> · {entry.contact_name ?? "Unknown customer"}
                  <span className="ops-table__meta">
                    {formatOpsDate(entry.invoice_date)} · {entry.xero_status.toLowerCase()} · {formatOpsMoney(entry.total_incl_vat)} total ·{" "}
                    {entry.amount_due > 0 ? `${formatOpsMoney(entry.amount_due)} due` : "settled"}
                    {entry.reference ? ` · ref “${entry.reference}”` : ""}
                  </span>
                  <span className="ops-table__meta">
                    <AdminStatusBadge status="ops-warn" label="Why" /> {entry.reason}
                  </span>
                </div>
                {canEdit ? (
                  <div className="ops-review__actions">
                    <AdminActionForm action={linkUnmatchedInvoiceAction} className="ops-form ops-form--inline">
                      <input type="hidden" name="id" value={entry.id} />
                      <AdminSelect name="project_id" defaultValue={entry.suggested_project_id ?? ""} aria-label={`Project for ${entry.invoice_number ?? "this invoice"}`}>
                        <option value="">Choose the project…</option>
                        {load.data.projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.customer_name} – {p.title} ({STAGE_LABELS[p.stage]})
                            {p.id === entry.suggested_project_id ? " · suggested" : ""}
                          </option>
                        ))}
                      </AdminSelect>
                      <AdminSubmitButton pendingLabel="Linking…">Link</AdminSubmitButton>
                    </AdminActionForm>
                    <AdminActionForm action={createProjectFromXeroAction}>
                      <input type="hidden" name="kind" value="invoice" />
                      <input type="hidden" name="xero_id" value={entry.xero_invoice_id} />
                      <AdminSubmitButton variant="secondary" pendingLabel="Creating…">
                        Create new project from it
                      </AdminSubmitButton>
                    </AdminActionForm>
                    <AdminActionForm
                      action={dismissUnmatchedAction}
                      confirmMessage={`Mark ${entry.invoice_number ?? "this invoice"} as not belonging to any project? It won't be listed again.`}
                    >
                      <input type="hidden" name="id" value={entry.id} />
                      <AdminSubmitButton variant="outline" pendingLabel="…">Not a project invoice</AdminSubmitButton>
                    </AdminActionForm>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </AdminPanel>
      )}
    </div>
  );
}
