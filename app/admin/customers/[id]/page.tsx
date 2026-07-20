import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { upsertCustomerAction } from "../actions";
import {
  AdminButton,
  AdminEmptyState,
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

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const admin = await requireAdmin({ permission: "manageCustomers" });
  const { id } = await params;
  const supabase = await createClient();
  const canQuotes = canPerform(admin.profile.role, "manageQuotes");
  const canRfqs = canPerform(admin.profile.role, "manageRfqs");

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !customer) notFound();

  const [{ data: rfqs }, { data: quotes }] = await Promise.all([
    supabase
      .from("rfqs")
      .select("id, rfq_number, status, submitted_at, service_required")
      .eq("customer_id", id)
      .order("submitted_at", { ascending: false })
      .limit(20),
    supabase
      .from("quotes")
      .select("id, quote_number, revision_number, status, title, updated_at")
      .eq("customer_id", id)
      .eq("is_latest_revision", true)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  const displayName = customer.company_name || customer.name;

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title={displayName}
        description={`Primary contact: ${customer.name}${customer.email ? ` · ${customer.email}` : ""}`}
        primaryAction={
          canQuotes
            ? { href: "/admin/quotes/new/", label: "Create Quote" }
            : undefined
        }
        secondaryAction={
          canRfqs
            ? { href: "/admin/rfqs/", label: "View RFQs", variant: "secondary" }
            : undefined
        }
      />

      <div className="admin-tabs">
        <nav className="admin-tabs__nav" aria-label="Customer sections">
          <ul>
            <li>
              <a className="admin-tabs__link" href="#customer-overview">
                Overview
              </a>
            </li>
            <li>
              <a className="admin-tabs__link" href="#customer-rfqs">
                RFQs
              </a>
            </li>
            <li>
              <a className="admin-tabs__link" href="#customer-quotes">
                Quotes
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <AdminPanel id="customer-overview" title="Contact &amp; company">
        <form action={upsertCustomerAction} className="admin-form-grid">
          <input type="hidden" name="id" value={customer.id} />
          <AdminInput
            name="name"
            defaultValue={customer.name}
            required
            aria-label="Contact name"
          />
          <AdminInput
            name="company_name"
            defaultValue={customer.company_name ?? ""}
            placeholder="Company"
            aria-label="Company"
          />
          <AdminInput
            name="email"
            defaultValue={customer.email ?? ""}
            placeholder="Email"
            aria-label="Email"
          />
          <AdminInput
            name="phone"
            defaultValue={customer.phone ?? ""}
            placeholder="Phone"
            aria-label="Phone"
          />
          <AdminInput
            name="province"
            defaultValue={customer.province ?? ""}
            placeholder="Province"
            aria-label="Province"
          />
          <AdminInput
            name="vat_number"
            defaultValue={customer.vat_number ?? ""}
            placeholder="VAT number"
            aria-label="VAT number"
          />
          <AdminSelect
            name="customer_type"
            defaultValue={customer.customer_type}
            aria-label="Customer type"
          >
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </AdminSelect>
          <AdminTextarea
            name="notes"
            rows={4}
            defaultValue={customer.notes ?? ""}
            placeholder="Internal notes"
            aria-label="Internal notes"
          />
          <AdminButton type="submit" variant="primary">
            Save customer
          </AdminButton>
        </form>
      </AdminPanel>

      <AdminPanel id="customer-rfqs" title="RFQs">
        {(rfqs ?? []).length === 0 ? (
          <AdminEmptyState
            title="No RFQs linked."
            description="Incoming enquiries for this customer will appear here."
          />
        ) : (
          <ul className="admin-list">
            {(rfqs ?? []).map((rfq) => (
              <li key={rfq.id}>
                <Link href={`/admin/rfqs/${rfq.id}/`}>{rfq.rfq_number}</Link>
                {" · "}
                <AdminStatusBadge status={rfq.status} domain="rfq" />
                {" · "}
                {rfq.service_required ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel id="customer-quotes" title="Quotes">
        {(quotes ?? []).length === 0 ? (
          <AdminEmptyState
            title="No quotations yet."
            description="Create a quote once an RFQ is ready."
            actionHref={canQuotes ? "/admin/quotes/new/" : undefined}
            actionLabel={canQuotes ? "Create Quote" : undefined}
          />
        ) : (
          <ul className="admin-list">
            {(quotes ?? []).map((quote) => (
              <li key={quote.id}>
                <Link href={`/admin/quotes/${quote.id}/`}>
                  {quote.quote_number}
                  {quote.revision_number
                    ? ` Rev ${quote.revision_number}`
                    : ""}
                </Link>
                {" · "}
                <AdminStatusBadge status={quote.status} domain="quote" />
                {quote.title ? ` · ${quote.title}` : ""}
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
