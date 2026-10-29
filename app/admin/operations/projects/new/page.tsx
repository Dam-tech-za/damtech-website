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
  AdminButton,
  AdminCheckbox,
  AdminDateInput,
  AdminField,
  AdminHelpText,
  AdminInfoBanner,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminSubmitButton,
  AdminTextarea,
} from "@/components/admin/ui";

export const metadata: Metadata = { title: "New project (full form)" };

/**
 * Full-form fallback. Default creation is on the board (+ Add Project / New > Project).
 * Xero quotes are picked from the board “Add from Xero” dialog (last 30 days only).
 */
export default async function NewProjectPage() {
  const admin = await requireAdmin();
  if (!canPerform(admin.profile.role, "manageOperations")) redirect("/admin/operations/projects/");
  const today = todayInSouthAfrica();

  return (
    <div className="admin-stack--page ops">
      <AdminBackLink listPath="/admin/operations/projects/" label="Projects" />
      <AdminPageHeader
        title="New project (full form)"
        description="Prefer the board: type a name under a stage, or use Add from Xero for the last 30 days of accepted quotes."
        primaryActionNode={
          <AdminButton href="/admin/operations/projects/?add=1" variant="primary">
            Back to board
          </AdminButton>
        }
      />

      <AdminInfoBanner tone="info">
        To start from Xero, open the projects board and use <strong>+ Add from Xero</strong> on a stage. That list is limited to accepted quotes from the last 30 days.
      </AdminInfoBanner>

      <AdminPanel title="Fill in by hand" description="Nothing here is required except what the database needs for an open job (next action). Leave fields blank if you do not know them yet.">
        <AdminActionForm action={createProjectAction} className="ops-form ops-form--grid">
          <AdminField label="Project name" htmlFor="title" className="ops-form__full">
            <AdminInput id="title" name="title" maxLength={200} placeholder="Leave blank for Untitled project" />
          </AdminField>
          <AdminField label="Customer" htmlFor="customer_name">
            <AdminInput id="customer_name" name="customer_name" maxLength={200} placeholder="Optional" />
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
          <AdminField label="Next action" htmlFor="next_action" className="ops-form__full">
            <AdminInput id="next_action" name="next_action" maxLength={500} defaultValue="Fill in the site, scope and dates" />
          </AdminField>
          <AdminField label="Next action by" htmlFor="next_action_due">
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
