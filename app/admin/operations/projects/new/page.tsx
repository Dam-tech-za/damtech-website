import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { SERVICE_LABELS, STAGE_LABELS, todayInSouthAfrica } from "@/lib/operations/lifecycle";
import { loadXeroStart } from "@/lib/operations/queries";
import { PROJECT_SERVICES } from "@/lib/operations/types";
import { createProjectAction, createProjectFromXeroAction } from "@/app/admin/operations/project-actions";
import {
  AdminActionForm,
  AdminBackLink,
  AdminButton,
  AdminCheckbox,
  AdminDateInput,
  AdminEmptyState,
  AdminField,
  AdminHelpText,
  AdminInfoBanner,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminSubmitButton,
  AdminTextarea,
} from "@/components/admin/ui";
import { OpsSetupBanners } from "@/components/admin/operations/OpsParts";
import { formatOpsDate, formatOpsMoney } from "@/components/admin/operations/ops-format";

export const metadata: Metadata = { title: "New project" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = {
  searchParams: Promise<{ xero?: string; contact_id?: string; contact_name?: string; contact_email?: string }>;
};

/**
 * New project. The quickest way is from Xero: pick an accepted quote or an
 * invoice and the customer, numbers and amounts are filled in. A Xero
 * customer can also be picked to prefill the form for a job without either.
 */
export default async function NewProjectPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  if (!canPerform(admin.profile.role, "manageOperations")) redirect("/admin/operations/projects/");
  const today = todayInSouthAfrica();
  const sp = await searchParams;
  const search = (sp.xero ?? "").trim().slice(0, 80);
  const contactId = sp.contact_id && UUID.test(sp.contact_id) ? sp.contact_id : null;
  const contactName = contactId ? (sp.contact_name ?? "").trim().slice(0, 200) : "";
  const contactEmail = contactId ? (sp.contact_email ?? "").trim().slice(0, 200) : "";
  const load = await loadXeroStart({ search, contact: contactId ? { id: contactId, name: contactName } : null });
  const start = load.ok ? load.data : null;

  const contactHref = (c: { id: string; name: string; email: string | null }) => {
    const q = new URLSearchParams({ contact_id: c.id, contact_name: c.name });
    if (c.email) q.set("contact_email", c.email);
    return `/admin/operations/projects/new/?${q.toString()}#from-xero`;
  };

  return (
    <div className="admin-stack--page ops">
      <AdminBackLink listPath="/admin/operations/projects/" label="Projects" />
      <AdminPageHeader
        title="New project"
        description="Start from a Xero quote or invoice so the customer and amounts are filled in. You then add the site, scope and dates."
      />
      <OpsSetupBanners setup={load.setup} />

      <AdminPanel title="1. Start from Xero" description="Accepted quotes and invoices from the last few months that aren't on a project yet." >
        <div id="from-xero" className="ops-xero-start">
          <form className="ops-board-filters" method="get" role="search" aria-label="Find a Xero customer">
            <label className="ops-board-filters__search">
              <span className="sr-only">Customer name or email</span>
              <input className="admin-input" type="search" name="xero" defaultValue={search} placeholder="Find a customer in Xero (name or email)" />
            </label>
            <button type="submit" className="admin-btn admin-btn--secondary">
              Search Xero
            </button>
          </form>

          {start?.xeroError ? <AdminInfoBanner tone="warning">{start.xeroError}</AdminInfoBanner> : null}

          {search && start && !start.xeroError ? (
            start.contacts.length === 0 ? (
              <p className="ops-table__meta">No Xero customer matches “{search}”.</p>
            ) : (
              <ul className="ops-xero-start__contacts">
                {start.contacts.map((c) => (
                  <li key={c.id}>
                    <span>
                      <strong>{c.name}</strong>
                      {c.email ? <span className="ops-table__meta">{c.email}</span> : null}
                    </span>
                    <AdminButton href={contactHref(c)} size="sm" variant={c.id === contactId ? "primary" : "outline"}>
                      {c.id === contactId ? "Selected" : "Use this customer"}
                    </AdminButton>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {contactId ? (
            <AdminInfoBanner tone="info">
              Showing Xero quotes and invoices for <strong>{contactName || "this customer"}</strong>. Their details are also filled into the form below.{" "}
              <AdminButton href="/admin/operations/projects/new/" size="sm" variant="ghost">
                Show everyone
              </AdminButton>
            </AdminInfoBanner>
          ) : null}

          {start && !start.xeroError ? (
            start.items.length === 0 ? (
              <AdminEmptyState
                compact
                title={contactId ? "No unlinked quotes or invoices for this customer." : "Every recent accepted quote and invoice is already on a project."}
                description="Fill in the form below instead."
              />
            ) : (
              <table className="admin-table ops-table ops-board-table ops-xero-start__table">
                <caption className="sr-only">Xero quotes and invoices not on a project</caption>
                <thead>
                  <tr>
                    <th scope="col">Xero record</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Amount</th>
                    <th scope="col">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {start.items.map((item) => (
                    <tr key={`${item.kind}-${item.id}`}>
                      <td data-label="Xero record">
                        <AdminStatusBadge status={item.kind === "quote" ? "ops-info" : "ops-neutral"} label={item.kind === "quote" ? "Quote" : "Invoice"} />{" "}
                        <strong>{item.number}</strong>
                        <span className="ops-table__meta">
                          {formatOpsDate(item.date)} · {item.status.toLowerCase()}
                          {item.label ? ` · ${item.label}` : ""}
                        </span>
                      </td>
                      <td data-label="Customer">{item.contact}</td>
                      <td data-label="Amount">
                        {formatOpsMoney(item.total)}
                        {item.amountDue !== null ? (
                          <span className="ops-table__meta">{item.amountDue > 0 ? `${formatOpsMoney(item.amountDue)} due` : "paid"}</span>
                        ) : null}
                      </td>
                      <td data-label="Action">
                        <AdminActionForm action={createProjectFromXeroAction} className="ops-xero-start__create">
                          <input type="hidden" name="kind" value={item.kind} />
                          <input type="hidden" name="xero_id" value={item.id} />
                          <AdminSubmitButton pendingLabel="Creating…">Create project</AdminSubmitButton>
                        </AdminActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : null}
        </div>
      </AdminPanel>

      <AdminPanel
        title="2. Or fill it in yourself"
        description="For a job agreed by phone with no quote yet. Pick the customer from Xero above to fill in their name and email."
      >
        <AdminActionForm action={createProjectAction} className="ops-form ops-form--grid">
          {contactId ? <input type="hidden" name="xero_contact_id" value={contactId} /> : null}
          <AdminField label="Project name" htmlFor="title" required className="ops-form__full">
            <AdminInput id="title" name="title" maxLength={200} defaultValue={contactName ? `${contactName} – ` : ""} placeholder="e.g. Clinton – 1.0mm HDPE relining, Lanseria" />
          </AdminField>
          <AdminField label="Customer" htmlFor="customer_name" required>
            <AdminInput id="customer_name" name="customer_name" maxLength={200} defaultValue={contactName} placeholder="Name as it appears in Xero" />
            {contactId ? <AdminHelpText>From Xero.</AdminHelpText> : null}
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
            <AdminInput id="contact_email" name="contact_email" type="email" maxLength={200} defaultValue={contactEmail} />
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
