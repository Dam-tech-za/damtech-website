"use client";

import { useRef, useState, useTransition } from "react";
import { createCustomerInlineAction } from "@/app/admin/customers/actions";
import {
  AdminButton,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";
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
            <AdminButton type="button" variant="secondary" onClick={onClose}>
              Close
            </AdminButton>
          </div>
        </header>

        {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}
        <DuplicateList duplicates={duplicates} />

        <form ref={formRef} className="admin-form-grid" onSubmit={(event) => {
          event.preventDefault();
          submit(false);
        }}>
          <AdminSelect name="customer_type" defaultValue="individual">
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </AdminSelect>
          <AdminInput name="name" placeholder="Name *" required />
          <AdminInput name="company_name" placeholder="Company" />
          <AdminInput name="email" type="email" placeholder="Email" />
          <AdminInput name="phone" placeholder="Phone" />
          <AdminInput name="vat_number" placeholder="VAT number" />
          <AdminInput name="registration_number" placeholder="Registration number" />
          <AdminInput name="province" placeholder="Province" />
          <AdminTextarea name="notes" rows={3} placeholder="Notes" style={{ gridColumn: "1 / -1" }} />

          <label className="admin-field admin-field--full">
            <span>Billing address</span>
          </label>
          <AdminInput name="billingAddressLine1" placeholder="Billing address line 1" />
          <AdminInput name="billingAddressLine2" placeholder="Billing address line 2" />
          <AdminInput name="billingCity" placeholder="Billing city" />
          <AdminInput name="billingProvince" placeholder="Billing province" />
          <AdminInput name="billingPostalCode" placeholder="Billing postal code" />
          <AdminInput name="billingCountry" placeholder="Billing country" defaultValue="South Africa" />

          <label className="admin-field admin-field--full">
            <span>Site address</span>
          </label>
          <AdminInput name="siteAddressLine1" placeholder="Site address line 1" />
          <AdminInput name="siteAddressLine2" placeholder="Site address line 2" />
          <AdminInput name="siteCity" placeholder="Site city" />
          <AdminInput name="siteProvince" placeholder="Site province" />
          <AdminInput name="sitePostalCode" placeholder="Site postal code" />
          <AdminInput name="siteCountry" placeholder="Site country" defaultValue="South Africa" />

          <div className="admin-panel__actions" style={{ gridColumn: "1 / -1" }}>
            {duplicates.length > 0 ? (
              <AdminButton
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => submit(true)}
              >
                {pending ? "Creating…" : "Create anyway"}
              </AdminButton>
            ) : null}
            <AdminButton type="submit" variant="primary" disabled={pending}>
              {pending ? "Creating…" : "Create customer"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
