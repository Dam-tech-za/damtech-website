"use client";

export type AddressValue = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export type CustomerRecord = {
  id: string;
  customer_type: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  vat_number: string | null;
  registration_number: string | null;
  billing_address: AddressValue | Record<string, unknown> | null;
  site_address: AddressValue | Record<string, unknown> | null;
  province: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type Props = {
  customer: CustomerRecord | null;
  title?: string;
};

function asAddress(value: CustomerRecord["billing_address"]) {
  if (!value || typeof value !== "object") return null;
  const record = value as AddressValue;
  const parts = [
    record.line1,
    record.line2,
    [record.city, record.province, record.postal_code].filter(Boolean).join(", "),
    record.country,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

export function CustomerSummaryCard({ customer, title = "Selected customer" }: Props) {
  if (!customer) {
    return (
      <article className="admin-panel">
        <header className="admin-panel__header">
          <h3>{title}</h3>
        </header>
        <div className="admin-empty">
          <p>No customer selected yet.</p>
          <p className="admin-empty__hint">Pick an existing customer or create one inline.</p>
        </div>
      </article>
    );
  }

  const billing = asAddress(customer.billing_address);
  const site = asAddress(customer.site_address);

  return (
    <article className="admin-panel">
      <header className="admin-panel__header">
        <h3>{title}</h3>
      </header>
      <dl className="admin-definition-list">
        <div>
          <dt>Name</dt>
          <dd>{customer.name}</dd>
        </div>
        <div>
          <dt>Company</dt>
          <dd>{customer.company_name ?? "—"}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{customer.customer_type}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{customer.email ?? "—"}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{customer.phone ?? "—"}</dd>
        </div>
        <div>
          <dt>VAT / reg</dt>
          <dd>
            {customer.vat_number ?? "—"}
            {customer.registration_number ? ` · ${customer.registration_number}` : ""}
          </dd>
        </div>
        <div>
          <dt>Province</dt>
          <dd>{customer.province ?? "—"}</dd>
        </div>
        <div>
          <dt>Billing address</dt>
          <dd>{billing ? billing.join(" · ") : "—"}</dd>
        </div>
        <div>
          <dt>Site address</dt>
          <dd>{site ? site.join(" · ") : "—"}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{customer.notes ?? "—"}</dd>
        </div>
      </dl>
    </article>
  );
}
