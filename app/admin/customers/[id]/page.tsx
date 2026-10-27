import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { STAGE_LABELS } from "@/lib/operations/lifecycle";
import type { ProjectStage } from "@/lib/operations/types";
import { formatOpsDate, formatOpsMoney } from "@/components/admin/operations/ops-format";
import { upsertCustomerAction } from "../actions";
import {
  AdminButton,
  AdminEmptyState,
  AdminInfoBanner,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminStatusBadge,
  AdminTextarea,
} from "@/components/admin/ui";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Item = { key: string; date: string | null; kind: string; title: string; href: string; status: { value: string; domain?: "rfq" | "quote"; label?: string; tone?: string }; meta?: string };

/** South African numbers for wa.me: 082… → 2782…. */
function whatsappHref(phone: string | null): string | null {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^0(?=\d{9}$)/, "27");
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

/**
 * One customer: how to reach them, what they've been billed and owe on their
 * projects (from Xero), and everything for them in one list, newest first.
 * Contact details are edited behind "Edit".
 */
export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const admin = await requireAdmin({ permission: "manageCustomers" });
  const role = admin.profile.role;
  const { id } = await params;
  const supabase = await createClient();
  const canOps = canAccessNavItem(role, "operations");
  const canNewProject = canPerform(role, "manageOperations");

  const { data: customer, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (error || !customer) notFound();

  const names = [...new Set([customer.company_name, customer.name].filter((n): n is string => Boolean(n?.trim())).map((n) => n.trim()))];
  const dupFilters = [customer.email ? `email.eq.${customer.email}` : null, customer.phone ? `phone.eq.${customer.phone}` : null].filter(Boolean);

  const [{ data: rfqs }, { data: quotes }, duplicates, projectsLoad] = await Promise.all([
    supabase
      .from("rfqs")
      .select("id, rfq_number, status, submitted_at, service_required, town")
      .eq("customer_id", id)
      .order("submitted_at", { ascending: false })
      .limit(30),
    supabase
      .from("quotes")
      .select("id, quote_number, revision_number, status, title, updated_at")
      .eq("customer_id", id)
      .eq("is_latest_revision", true)
      .order("updated_at", { ascending: false })
      .limit(30),
    dupFilters.length && !/[,()]/.test(dupFilters.join(""))
      ? supabase.from("customers").select("id, name, company_name").neq("id", id).or(dupFilters.join(",")).limit(5)
      : Promise.resolve({ data: [] as { id: string; name: string; company_name: string | null }[] }),
    canOps && names.length
      ? createServiceRoleClient()
          .from("ops_projects")
          .select("id, title, stage, created_at, site_location, quoted_total_incl_vat, ops_xero_invoice_links(invoice_number, xero_status, total_incl_vat, amount_paid, amount_due, invoice_date, due_date)")
          .or(names.map((n) => `customer_name.ilike.${n.replace(/[,()%*\\"]/g, " ")}`).join(","))
          .limit(30)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  type ProjectRow = {
    id: string;
    title: string;
    stage: ProjectStage;
    created_at: string;
    site_location: string | null;
    ops_xero_invoice_links: { invoice_number: string | null; xero_status: string; total_incl_vat: number; amount_paid: number; amount_due: number; invoice_date: string | null; due_date: string | null }[];
  };
  const projects = (projectsLoad.data ?? []) as unknown as ProjectRow[];
  const invoices = projects.flatMap((p) => p.ops_xero_invoice_links.map((i) => ({ ...i, project: p })));
  const live = invoices.filter((i) => i.xero_status === "AUTHORISED" || i.xero_status === "PAID");
  const billed = live.reduce((sum, i) => sum + Number(i.total_incl_vat), 0);
  const owed = live.reduce((sum, i) => sum + Number(i.amount_due), 0);

  const items: Item[] = [
    ...(rfqs ?? []).map((r) => ({
      key: `rfq-${r.id}`,
      date: r.submitted_at,
      kind: "Enquiry",
      title: `${r.rfq_number}${r.service_required ? ` · ${r.service_required}` : ""}`,
      href: `/admin/rfqs/${r.id}/`,
      status: { value: r.status, domain: "rfq" as const },
      meta: r.town ?? undefined,
    })),
    ...(quotes ?? []).map((q) => ({
      key: `quote-${q.id}`,
      date: q.updated_at,
      kind: "Website quote",
      title: `${q.quote_number}${q.revision_number ? ` Rev ${q.revision_number}` : ""}${q.title ? ` · ${q.title}` : ""}`,
      href: `/admin/quotes/${q.id}/`,
      status: { value: q.status, domain: "quote" as const },
    })),
    ...projects.map((p) => ({
      key: `project-${p.id}`,
      date: p.created_at,
      kind: "Project",
      title: p.title,
      href: `/admin/operations/projects/${p.id}/`,
      status: { value: "ops-info", label: STAGE_LABELS[p.stage] },
      meta: p.site_location ?? undefined,
    })),
    ...invoices.map((i) => ({
      key: `inv-${i.invoice_number}-${i.project.id}`,
      date: i.invoice_date,
      kind: "Xero invoice",
      title: `${i.invoice_number ?? "Invoice"} · ${formatOpsMoney(Number(i.total_incl_vat))}`,
      href: `/admin/operations/projects/${i.project.id}/#financials`,
      status:
        i.xero_status === "PAID"
          ? { value: "ops-good", label: "Paid" }
          : i.xero_status === "VOIDED"
            ? { value: "ops-neutral", label: "Voided" }
            : { value: Number(i.amount_due) > 0 ? "ops-warn" : "ops-good", label: Number(i.amount_due) > 0 ? `${formatOpsMoney(Number(i.amount_due))} due` : "Paid" },
      meta: i.project.title,
    })),
  ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const displayName = customer.company_name || customer.name;
  const wa = whatsappHref(customer.phone);
  const newProjectHref = `/admin/operations/projects/new/?xero=${encodeURIComponent(displayName)}#from-xero`;

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title={displayName}
        description={[customer.company_name ? customer.name : null, customer.province].filter(Boolean).join(" · ") || undefined}
        primaryAction={canNewProject ? { href: newProjectHref, label: "New project for this customer" } : undefined}
        toolbar={
          <div className="rfq-contact-card__actions">
            {customer.phone ? (
              <AdminButton href={`tel:${customer.phone}`} size="sm" variant="secondary">
                Call {customer.phone}
              </AdminButton>
            ) : null}
            {wa ? (
              <AdminButton href={wa} size="sm" variant="secondary" target="_blank" rel="noopener">
                WhatsApp
              </AdminButton>
            ) : null}
            {customer.email ? (
              <AdminButton href={`mailto:${customer.email}`} size="sm" variant="secondary">
                Email
              </AdminButton>
            ) : null}
          </div>
        }
      />

      {(duplicates.data ?? []).length ? (
        <AdminInfoBanner tone="warning">
          Possible duplicate: same email or phone as{" "}
          {(duplicates.data ?? []).map((d, i) => (
            <span key={d.id}>
              {i ? ", " : ""}
              <Link href={`/admin/customers/${d.id}/`}>{d.company_name || d.name}</Link>
            </span>
          ))}
          . Nothing is merged automatically.
        </AdminInfoBanner>
      ) : null}

      {canOps && invoices.length ? (
        <div className="ops-money" aria-label="Money on this customer's projects">
          <div className="ops-money__cell">
            <span className="ops-money__label">Billed (Xero)</span>
            <strong>{formatOpsMoney(billed)}</strong>
          </div>
          <div className="ops-money__cell">
            <span className="ops-money__label">Owed (Xero)</span>
            <strong>{formatOpsMoney(owed)}</strong>
          </div>
        </div>
      ) : null}

      <AdminPanel title="Everything for this customer" description={canOps ? "Enquiries, quotes, projects and Xero invoices, newest first. Projects are matched on the customer name." : undefined}>
        {items.length === 0 ? (
          <AdminEmptyState compact title="Nothing yet." description="Enquiries and projects for this customer will show here." />
        ) : (
          <ul className="admin-search-results">
            {items.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="admin-search-results__link cust-item">
                  <span className="cust-item__main">
                    <span className="ops-table__meta">
                      {item.kind} · {formatOpsDate(item.date ? item.date.slice(0, 10) : null)}
                    </span>
                    <strong>{item.title}</strong>
                    {item.meta ? <span className="ops-table__meta">{item.meta}</span> : null}
                  </span>
                  {item.status.domain ? (
                    <AdminStatusBadge status={item.status.value} domain={item.status.domain} />
                  ) : (
                    <AdminStatusBadge status={item.status.value} label={item.status.label} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel compact>
        <details className="ops-collapse">
          <summary>Edit contact details and notes</summary>
          <form action={upsertCustomerAction} className="admin-form-grid">
            <input type="hidden" name="id" value={customer.id} />
            <AdminInput name="name" defaultValue={customer.name} required aria-label="Contact name" />
            <AdminInput name="company_name" defaultValue={customer.company_name ?? ""} placeholder="Company" aria-label="Company" />
            <AdminInput name="email" defaultValue={customer.email ?? ""} placeholder="Email" aria-label="Email" />
            <AdminInput name="phone" defaultValue={customer.phone ?? ""} placeholder="Phone" aria-label="Phone" />
            <AdminInput name="province" defaultValue={customer.province ?? ""} placeholder="Province" aria-label="Province" />
            <AdminInput name="vat_number" defaultValue={customer.vat_number ?? ""} placeholder="VAT number" aria-label="VAT number" />
            <AdminSelect name="customer_type" defaultValue={customer.customer_type} aria-label="Customer type">
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </AdminSelect>
            <AdminTextarea name="notes" rows={4} defaultValue={customer.notes ?? ""} placeholder="Internal notes" aria-label="Internal notes" />
            <AdminButton type="submit" variant="primary">
              Save customer
            </AdminButton>
          </form>
        </details>
        {customer.notes ? <p className="ops-pre">{customer.notes}</p> : null}
      </AdminPanel>
    </div>
  );
}
