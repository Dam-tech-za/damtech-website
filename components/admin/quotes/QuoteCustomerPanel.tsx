"use client";

import Link from "next/link";
import { CustomerSelector } from "@/components/admin/customers/CustomerSelector";
import type { CustomerRecord } from "@/components/admin/customers/CustomerSummaryCard";
import {
  AdminButton,
  AdminField,
  AdminInfoBanner,
  AdminInput,
  AdminPanel,
} from "@/components/admin/ui";

type QuoteCustomerPanelProps = {
  customers: CustomerRecord[];
  customerId: string;
  onCustomerSelect: (customer: CustomerRecord | null) => void;
  canCreateCustomer: boolean;
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  province: string;
  onSnapshotChange: (field: string, value: string) => void;
  editDetailsOpen: boolean;
  onEditDetailsToggle: () => void;
};

export function QuoteCustomerPanel({
  customers,
  customerId,
  onCustomerSelect,
  canCreateCustomer,
  contactName,
  companyName,
  email,
  phone,
  province,
  onSnapshotChange,
  editDetailsOpen,
  onEditDetailsToggle,
}: QuoteCustomerPanelProps) {
  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;

  return (
    <AdminPanel id="quote-section-customer" title="Customer">
      {!customerId ? (
        <div className="admin-ui-empty">
          <p className="admin-ui-empty__title">No customer selected</p>
          <p className="admin-ui-empty__description">
            Select the customer receiving this quotation.
          </p>
          <div className="admin-panel__actions">
            <CustomerSelector
              customers={customers}
              value=""
              onSelectCustomer={onCustomerSelect}
              canCreateCustomer={canCreateCustomer}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="admin-form-grid">
            <div>
              <dt className="admin-label">Contact</dt>
              <dd>{contactName || <FieldWarning text="Contact name not provided" />}</dd>
            </div>
            <div>
              <dt className="admin-label">Company</dt>
              <dd>{companyName || <FieldWarning text="Company not provided" />}</dd>
            </div>
            <div>
              <dt className="admin-label">Email</dt>
              <dd>{email || <FieldWarning text="Email not provided" />}</dd>
            </div>
            <div>
              <dt className="admin-label">Phone</dt>
              <dd>{phone || <FieldWarning text="Phone not provided" />}</dd>
            </div>
            <div>
              <dt className="admin-label">Province</dt>
              <dd>{province || <FieldWarning text="Province not provided" />}</dd>
            </div>
            {selectedCustomer && !selectedCustomer.billing_address ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldWarning text="Billing address not provided" />
              </div>
            ) : null}
          </div>

          <div className="admin-panel__actions" style={{ marginTop: "1rem" }}>
            <CustomerSelector
              customers={customers}
              value={customerId}
              onSelectCustomer={onCustomerSelect}
              canCreateCustomer={canCreateCustomer}
            />
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={onEditDetailsToggle}
            >
              {editDetailsOpen ? "Hide details" : "Edit details"}
            </AdminButton>
            {selectedCustomer ? (
              <AdminButton
                href={`/admin/customers/${selectedCustomer.id}`}
                variant="ghost"
                size="sm"
              >
                View customer
              </AdminButton>
            ) : null}
          </div>

          {editDetailsOpen ? (
            <div className="admin-form-grid" style={{ marginTop: "1rem" }}>
              <AdminField label="Contact name">
                <AdminInput
                  value={contactName}
                  onChange={(e) => onSnapshotChange("contactName", e.target.value)}
                />
              </AdminField>
              <AdminField label="Company">
                <AdminInput
                  value={companyName}
                  onChange={(e) => onSnapshotChange("companyName", e.target.value)}
                />
              </AdminField>
              <AdminField label="Email">
                <AdminInput
                  type="email"
                  value={email}
                  onChange={(e) => onSnapshotChange("email", e.target.value)}
                />
              </AdminField>
              <AdminField label="Phone">
                <AdminInput
                  value={phone}
                  onChange={(e) => onSnapshotChange("phone", e.target.value)}
                />
              </AdminField>
              <AdminField label="Province">
                <AdminInput
                  value={province}
                  onChange={(e) => onSnapshotChange("province", e.target.value)}
                />
              </AdminField>
            </div>
          ) : null}
        </>
      )}
    </AdminPanel>
  );
}

function FieldWarning({ text }: { text: string }) {
  return <span className="admin-field-warning">{text}</span>;
}
