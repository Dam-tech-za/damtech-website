import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { SERVICE_LABELS, STAGE_LABELS, todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { PROJECT_SERVICES } from "@/lib/operations/types";
import { createProjectAction } from "@/app/admin/operations/project-actions";
import {
  AdminActionForm,
  AdminBackLink,
  AdminCheckbox,
  AdminDateInput,
  AdminField,
  AdminHelpText,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminSubmitButton,
  AdminTextarea,
} from "@/components/admin/ui";

export const metadata: Metadata = { title: "New project" };

/**
 * Manual project creation for jobs that did not come through an accepted
 * Xero quote. If the quote exists, enter its number so the Xero sync links
 * it to this project instead of creating a second one.
 */
export default async function NewProjectPage() {
  const admin = await requireAdmin();
  if (!canPerform(admin.profile.role, "manageOperations")) redirect("/admin/operations/projects/");
  const today = todayInSouthAfrica();

  return (
    <div className="admin-stack--page ops">
      <AdminBackLink listPath="/admin/operations/projects/" label="Projects" />
      <AdminPageHeader
        title="New project"
        description="Accepted Xero quotes become projects automatically. Use this for anything else, such as a job agreed by phone."
      />
      <AdminPanel>
        <AdminActionForm action={createProjectAction} className="ops-form ops-form--grid">
          <AdminField label="Project name" htmlFor="title" required className="ops-form__full">
            <AdminInput id="title" name="title" maxLength={200} placeholder="e.g. Clinton – 1.0mm HDPE relining, Lanseria" />
          </AdminField>
          <AdminField label="Customer" htmlFor="customer_name" required>
            <AdminInput id="customer_name" name="customer_name" maxLength={200} placeholder="Name as it appears in Xero" />
          </AdminField>
          <AdminField label="Service" htmlFor="service">
            <AdminSelect id="service" name="service" defaultValue="unclassified">
              {PROJECT_SERVICES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_LABELS[s]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Starting stage" htmlFor="stage">
            <AdminSelect id="stage" name="stage" defaultValue="awaiting_deposit">
              {(["awaiting_deposit", "planning", "scheduled"] as const).map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Site" htmlFor="site_location">
            <AdminInput id="site_location" name="site_location" maxLength={300} placeholder="Town or farm" />
          </AdminField>
          <AdminField label="Xero quote number(s)" htmlFor="xero_quote_numbers">
            <AdminInput id="xero_quote_numbers" name="xero_quote_numbers" maxLength={300} placeholder="QU0301" />
            <AdminHelpText>Links the quote and its invoices on the next Xero sync.</AdminHelpText>
          </AdminField>
          <AdminField label="Xero invoice number(s)" htmlFor="xero_invoice_numbers">
            <AdminInput id="xero_invoice_numbers" name="xero_invoice_numbers" maxLength={300} placeholder="INV0143" />
          </AdminField>
          <AdminField label="Contact person" htmlFor="contact_person">
            <AdminInput id="contact_person" name="contact_person" maxLength={200} />
          </AdminField>
          <AdminField label="Contact phone" htmlFor="contact_phone">
            <AdminInput id="contact_phone" name="contact_phone" type="tel" maxLength={40} />
          </AdminField>
          <AdminField label="Contact email" htmlFor="contact_email">
            <AdminInput id="contact_email" name="contact_email" type="email" maxLength={200} />
          </AdminField>
          <AdminField label="Next action" htmlFor="next_action" required className="ops-form__full">
            <AdminInput id="next_action" name="next_action" maxLength={500} defaultValue="Confirm the deposit invoice and payment in Xero" />
          </AdminField>
          <AdminField label="Next action by" htmlFor="next_action_due" required>
            <AdminDateInput id="next_action_due" name="next_action_due" defaultValue={today} />
          </AdminField>
          <AdminField label="Responsible person" htmlFor="next_action_owner">
            <AdminInput id="next_action_owner" name="next_action_owner" maxLength={120} placeholder="Optional" />
          </AdminField>
          <AdminCheckbox name="is_supply_only" label="Supply only (no installation)" />
          <AdminCheckbox name="materials_by_client" label="Client supplies the materials" />
          <AdminField label="Scope" htmlFor="scope" className="ops-form__full">
            <AdminTextarea id="scope" name="scope" rows={5} maxLength={8000} />
          </AdminField>
          <AdminSubmitButton pendingLabel="Creating…">Create project</AdminSubmitButton>
        </AdminActionForm>
      </AdminPanel>
    </div>
  );
}
