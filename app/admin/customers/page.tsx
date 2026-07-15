import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessNavItem, canPerform } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { upsertCustomerAction } from "./actions";

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

  let query = supabase
    .from("customers")
    .select("id, name, company_name, email, phone, province, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (q?.trim()) {
    const term = q.trim();
    query = query.or(
      `name.ilike.%${term}%,company_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  return (
    <div className="admin-stack">
      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Customers</h2>
        </header>
        <form method="get" className="admin-inline-form">
          <input
            name="q"
            className="form-input"
            placeholder="Search customers"
            defaultValue={q ?? ""}
          />
          <button type="submit" className="btn btn--md btn--primary">
            Search
          </button>
        </form>
      </section>

      {canManage ? (
      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Add customer</h2>
        </header>
        <form action={upsertCustomerAction} className="admin-form-grid">
          <input name="name" className="form-input" placeholder="Name *" required />
          <input name="company_name" className="form-input" placeholder="Company" />
          <input name="email" className="form-input" placeholder="Email" type="email" />
          <input name="phone" className="form-input" placeholder="Phone" />
          <input name="province" className="form-input" placeholder="Province" />
          <select name="customer_type" className="form-input" defaultValue="individual">
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
          <button type="submit" className="btn btn--md btn--primary">
            Create customer
          </button>
        </form>
      </section>
      ) : null}

      <section className="admin-panel">
        {error ? (
          <div className="admin-empty">
            <p>Unable to load customers.</p>
            <p className="admin-empty__hint">{error.message}</p>
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="admin-empty">
            <p>No customers yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Province</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.company_name ?? "—"}</td>
                    <td>{customer.email ?? "—"}</td>
                    <td>{customer.phone ?? "—"}</td>
                    <td>{customer.province ?? "—"}</td>
                    <td>
                      <Link href={`/admin/customers/${customer.id}/`}>Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
