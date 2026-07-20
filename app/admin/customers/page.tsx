import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { upsertCustomerAction } from "./actions";
import {
  AdminButton,
  AdminEmptyState,
  AdminErrorState,
  AdminFilterToolbar,
  AdminInput,
  AdminMetricCard,
  AdminMetricStrip,
  AdminPageHeader,
  AdminPanel,
  AdminSearchField,
  AdminSelect,
  AdminTable,
} from "@/components/admin/ui";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  if (!canAccessNavItem(admin.profile.role, "customers")) {
    redirect("/admin/unauthorised/");
  }
  const canManage = canPerform(admin.profile.role, "manageCustomers");
  const { q } = await searchParams;
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
    const term = q.trim();
    query = query.or(
      `name.ilike.%${term}%,company_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const [
    { data, error },
    { count: totalCustomers },
    { count: newThisMonth },
    { data: openRfqCustomers },
    { data: acceptedQuoteCustomers },
  ] = await Promise.all([
    query,
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("rfqs")
      .select("customer_id")
      .not("customer_id", "is", null)
      .not("status", "in", "(converted,closed,spam)"),
    supabase
      .from("quotes")
      .select("customer_id")
      .eq("is_latest_revision", true)
      .eq("status", "accepted")
      .not("customer_id", "is", null),
  ]);

  const openRfqCount = new Set(
    (openRfqCustomers ?? []).map((r) => r.customer_id).filter(Boolean),
  ).size;
  const acceptedCount = new Set(
    (acceptedQuoteCustomers ?? []).map((r) => r.customer_id).filter(Boolean),
  ).size;

  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Customers"
        description="Manage customer, company and project contact records."
        primaryAction={
          canManage
            ? { href: "#add-customer", label: "Add Customer" }
            : undefined
        }
      />

      <AdminMetricStrip label="Customer summary">
        <AdminMetricCard
          label="Total customers"
          value={totalCustomers ?? 0}
          tone="default"
        />
        <AdminMetricCard
          label="New this month"
          value={newThisMonth ?? 0}
          tone="info"
        />
        <AdminMetricCard
          label="With open RFQs"
          value={openRfqCount}
          tone="warning"
        />
        <AdminMetricCard
          label="With accepted quotes"
          value={acceptedCount}
          tone="success"
        />
      </AdminMetricStrip>

      <AdminPanel title="Directory">
        <AdminFilterToolbar>
          <form method="get" className="admin-filter-toolbar__form">
            <AdminSearchField
              name="q"
              placeholder="Search name, company, email, phone…"
              defaultValue={q ?? ""}
              label="Search customers"
            />
            <AdminButton type="submit" variant="primary">
              Search
            </AdminButton>
            {q ? (
              <AdminButton href="/admin/customers/" variant="secondary">
                Clear
              </AdminButton>
            ) : null}
          </form>
        </AdminFilterToolbar>
      </AdminPanel>

      {canManage ? (
        <AdminPanel id="add-customer" title="Add customer">
          <form action={upsertCustomerAction} className="admin-form-grid">
            <AdminInput
              name="name"
              placeholder="Name *"
              required
              aria-label="Contact name"
            />
            <AdminInput
              name="company_name"
              placeholder="Company"
              aria-label="Company"
            />
            <AdminInput
              name="email"
              placeholder="Email"
              type="email"
              aria-label="Email"
            />
            <AdminInput
              name="phone"
              placeholder="Phone"
              aria-label="Phone"
            />
            <AdminInput
              name="province"
              placeholder="Province"
              aria-label="Province"
            />
            <AdminSelect
              name="customer_type"
              defaultValue="individual"
              aria-label="Customer type"
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </AdminSelect>
            <AdminButton type="submit" variant="primary">
              Create customer
            </AdminButton>
          </form>
        </AdminPanel>
      ) : null}

      <AdminPanel>
        {error ? (
          <AdminErrorState
            title="Unable to load customers"
            message="Please retry shortly."
          />
        ) : (data ?? []).length === 0 ? (
          <AdminEmptyState
            title="No customers match your search."
            description="Add a customer record, or clear the search to see the full directory."
            actionHref={canManage ? "#add-customer" : undefined}
            actionLabel={canManage ? "Add Customer" : undefined}
          />
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <th>Customer / company</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Province</th>
                <th>Last activity</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.company_name || customer.name}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email ?? "—"}</td>
                  <td>{customer.phone ?? "—"}</td>
                  <td>{customer.province ?? "—"}</td>
                  <td>
                    {customer.updated_at
                      ? new Date(customer.updated_at).toLocaleDateString(
                          "en-ZA",
                        )
                      : "—"}
                  </td>
                  <td>
                    <AdminButton
                      href={`/admin/customers/${customer.id}/`}
                      size="sm"
                      variant="secondary"
                      className="admin-btn--table"
                    >
                      Open
                    </AdminButton>
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
