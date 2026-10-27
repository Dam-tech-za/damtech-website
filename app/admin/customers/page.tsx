import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { upsertCustomerAction } from "./actions";
import {
  AdminButton,
  AdminEmptyState,
  AdminErrorState,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTable,
} from "@/components/admin/ui";

type PageProps = {
  searchParams: Promise<{ q?: string; new?: string }>;
};

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "customers")) {
    redirect("/admin/unauthorised/");
  }
  const canManage = canPerform(admin.profile.role, "manageCustomers");
  const { q, new: openNew } = await searchParams;
  const showNew = openNew === "1";
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let query = supabase
    .from("customers")
    .select(
      "id, name, company_name, email, phone, province, updated_at, created_at",
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (q?.trim()) {
    // Characters that would break the or() filter are dropped.
    const term = q.trim().replace(/[,()%*\\"]/g, " ").trim();
    query = query.or(
      `name.ilike.%${term}%,company_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const [
    { data, error },
    { count: totalCustomers },
    { count: newThisMonth },
  ] = await Promise.all([
    query,
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Customers"
        description={`${totalCustomers ?? 0} customers${newThisMonth ? `, ${newThisMonth} new this month` : ""}.`}
        primaryAction={canManage ? { href: "/admin/customers/?new=1#add-customer", label: "Add customer" } : undefined}
      />

      <form method="get" className="ops-board-filters" role="search" aria-label="Search customers">
        <label className="ops-board-filters__search">
          <span className="sr-only">Search customers</span>
          <input className="admin-input" type="search" name="q" defaultValue={q ?? ""} placeholder="Search name, company, email or phone" />
        </label>
        <button type="submit" className="admin-btn admin-btn--secondary">
          Search
        </button>
        {q ? (
          <AdminButton href="/admin/customers/" variant="ghost">
            Clear
          </AdminButton>
        ) : null}
      </form>

      {canManage ? (
        <details id="add-customer" className="ops-collapse admin-panel" open={showNew}>
          <summary>Add a customer</summary>
          <form action={upsertCustomerAction} className="admin-form-grid">
            <AdminInput name="name" placeholder="Name *" required aria-label="Contact name" />
            <AdminInput name="company_name" placeholder="Company" aria-label="Company" />
            <AdminInput name="email" placeholder="Email" type="email" aria-label="Email" />
            <AdminInput name="phone" placeholder="Phone" aria-label="Phone" />
            <AdminInput name="province" placeholder="Province" aria-label="Province" />
            <AdminSelect name="customer_type" defaultValue="individual" aria-label="Customer type">
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </AdminSelect>
            <AdminButton type="submit" variant="primary">
              Save customer
            </AdminButton>
          </form>
        </details>
      ) : null}

      <AdminPanel>
        {error ? (
          <AdminErrorState title="Customers could not be loaded." message="Refresh in a moment." />
        ) : (data ?? []).length === 0 ? (
          <AdminEmptyState
            title={q ? `No customer matches “${q}”.` : "No customers yet."}
            description={q ? "Check the spelling, or try a phone number or email." : "Customers are added from enquiries, or by hand."}
            actionHref={canManage ? "/admin/customers/?new=1#add-customer" : undefined}
            actionLabel={canManage ? "Add customer" : undefined}
          />
        ) : (
          <AdminTable caption="Customers">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Province</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((customer) => (
                <tr key={customer.id}>
                  <td data-label="Customer">
                    <Link href={`/admin/customers/${customer.id}/`} className="ops-table__title">
                      {customer.company_name || customer.name}
                    </Link>
                    {customer.company_name ? <span className="ops-table__meta">{customer.name}</span> : null}
                  </td>
                  <td data-label="Phone">{customer.phone ? <a href={`tel:${customer.phone}`}>{customer.phone}</a> : "—"}</td>
                  <td data-label="Email">{customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : "—"}</td>
                  <td data-label="Province">{customer.province ?? "—"}</td>
                  <td data-label="Updated">
                    {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminPanel>
    </div>
  );
}
