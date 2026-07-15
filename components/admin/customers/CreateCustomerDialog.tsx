"use client";

import { useRef, useState, useTransition } from "react";
import { createCustomerInlineAction } from "@/app/admin/customers/actions";
import type { CustomerRecord } from "./CustomerSummaryCard";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: CustomerRecord) => void;
};

type DuplicateCustomer = {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  vat_number: string | null;
  province: string | null;
  reasons: string[];
};

function DuplicateList({ duplicates }: { duplicates: DuplicateCustomer[] }) {
  if (duplicates.length === 0) return null;

  return (
    <div className="admin-empty" style={{ marginBottom: "1rem" }}>
      <p>Possible duplicate customer found.</p>
      <ul className="admin-list">
        {duplicates.map((duplicate) => (
          <li key={duplicate.id}>
            <strong>{duplicate.company_name || duplicate.name}</strong>
            {duplicate.email ? ` · ${duplicate.email}` : ""}
            {duplicate.phone ? ` · ${duplicate.phone}` : ""}
            {duplicate.vat_number ? ` · VAT ${duplicate.vat_number}` : ""}
            {duplicate.reasons.length ? ` · ${duplicate.reasons.join(", ")}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CreateCustomerDialog({ open, onClose, onCreated }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCustomer[]>([]);

  if (!open) return null;

  function submit(allowConfirmDuplicate = false) {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    formData.set("allowConfirmDuplicate", allowConfirmDuplicate ? "true" : "false");

    setError(null);
    startTransition(async () => {
      const result = await createCustomerInlineAction(formData);
      if (result.ok && result.customer) {
        setDuplicates([]);
        form.reset();
        onCreated(result.customer);
        onClose();
        return;
      }

      if (result.duplicates?.length) {
        setDuplicates(result.duplicates);
      } else {
        setDuplicates([]);
      }
      setError(result.error ?? "Unable to create customer.");
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(3, 25, 38, 0.6)",
        padding: "1.5rem",
        overflowY: "auto",
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="admin-panel"
        style={{ maxWidth: "960px", margin: "2rem auto" }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create customer"
      >
        <header className="admin-panel__header admin-panel__header--row">
          <div>
            <h3>Create customer</h3>
            <p className="admin-empty__hint">Create the record without leaving the quote builder.</p>
          </div>
          <div className="admin-panel__actions">
            <button type="button" className="btn btn--md btn--secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
        <DuplicateList duplicates={duplicates} />

        <form ref={formRef} className="admin-form-grid" onSubmit={(event) => {
          event.preventDefault();
          submit(false);
        }}>
          <select name="customer_type" className="form-input" defaultValue="individual">
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
          <input name="name" className="form-input" placeholder="Name *" required />
          <input name="company_name" className="form-input" placeholder="Company" />
          <input name="email" className="form-input" type="email" placeholder="Email" />
          <input name="phone" className="form-input" placeholder="Phone" />
          <input name="vat_number" className="form-input" placeholder="VAT number" />
          <input name="registration_number" className="form-input" placeholder="Registration number" />
          <input name="province" className="form-input" placeholder="Province" />
          <textarea name="notes" className="form-input" rows={3} placeholder="Notes" style={{ gridColumn: "1 / -1" }} />

          <label className="admin-field admin-field--full">
            <span>Billing address</span>
          </label>
          <input name="billingAddressLine1" className="form-input" placeholder="Billing address line 1" />
          <input name="billingAddressLine2" className="form-input" placeholder="Billing address line 2" />
          <input name="billingCity" className="form-input" placeholder="Billing city" />
          <input name="billingProvince" className="form-input" placeholder="Billing province" />
          <input name="billingPostalCode" className="form-input" placeholder="Billing postal code" />
          <input name="billingCountry" className="form-input" placeholder="Billing country" defaultValue="South Africa" />

          <label className="admin-field admin-field--full">
            <span>Site address</span>
          </label>
          <input name="siteAddressLine1" className="form-input" placeholder="Site address line 1" />
          <input name="siteAddressLine2" className="form-input" placeholder="Site address line 2" />
          <input name="siteCity" className="form-input" placeholder="Site city" />
          <input name="siteProvince" className="form-input" placeholder="Site province" />
          <input name="sitePostalCode" className="form-input" placeholder="Site postal code" />
          <input name="siteCountry" className="form-input" placeholder="Site country" defaultValue="South Africa" />

          <div className="admin-panel__actions" style={{ gridColumn: "1 / -1" }}>
            {duplicates.length > 0 ? (
              <button
                type="button"
                className="btn btn--md btn--secondary"
                disabled={pending}
                onClick={() => submit(true)}
              >
                {pending ? "Creating…" : "Create anyway"}
              </button>
            ) : null}
            <button type="submit" className="btn btn--md btn--primary" disabled={pending}>
              {pending ? "Creating…" : "Create customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
