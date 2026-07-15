import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { upsertCustomerAction } from "../actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  await requireAdmin({ permission: "manageCustomers" });
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !customer) notFound();

  const { data: rfqs } = await supabase
    .from("rfqs")
    .select("id, rfq_number, status, submitted_at, service_required")
    .eq("customer_id", id)
    .order("submitted_at", { ascending: false })
    .limit(20);

  return (
    <div className="admin-stack">
      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>{customer.name}</h2>
        </header>
        <form action={upsertCustomerAction} className="admin-form-grid">
          <input type="hidden" name="id" value={customer.id} />
          <input name="name" className="form-input" defaultValue={customer.name} required />
          <input
            name="company_name"
            className="form-input"
            defaultValue={customer.company_name ?? ""}
            placeholder="Company"
          />
          <input
            name="email"
            className="form-input"
            defaultValue={customer.email ?? ""}
            placeholder="Email"
          />
          <input
            name="phone"
            className="form-input"
            defaultValue={customer.phone ?? ""}
            placeholder="Phone"
          />
          <input
            name="province"
            className="form-input"
            defaultValue={customer.province ?? ""}
            placeholder="Province"
          />
          <input
            name="vat_number"
            className="form-input"
            defaultValue={customer.vat_number ?? ""}
            placeholder="VAT number"
          />
          <select
            name="customer_type"
            className="form-input"
            defaultValue={customer.customer_type}
          >
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
          <textarea
            name="notes"
            className="form-input"
            rows={4}
            defaultValue={customer.notes ?? ""}
            placeholder="Notes"
          />
          <button type="submit" className="btn btn--md btn--primary">
            Save customer
          </button>
        </form>
      </section>

      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2>Related RFQs</h2>
        </header>
        {(rfqs ?? []).length === 0 ? (
          <div className="admin-empty">
            <p>No RFQs linked.</p>
          </div>
        ) : (
          <ul className="admin-list">
            {(rfqs ?? []).map((rfq) => (
              <li key={rfq.id}>
                <Link href={`/admin/rfqs/${rfq.id}/`}>{rfq.rfq_number}</Link>
                {" · "}
                {rfq.status}
                {" · "}
                {rfq.service_required ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
