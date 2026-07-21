"use client";

import { useState } from "react";
import { CustomerSelector } from "@/components/admin/customers/CustomerSelector";
import type { CustomerRecord } from "@/components/admin/customers/CustomerSummaryCard";
import {
  AdminButton,
  AdminField,
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
  const [changing, setChanging] = useState(false);

  const summaryLine = [contactName, phone, province].filter(Boolean).join(" · ");

  if (!customerId) {
    return (
      <AdminPanel id="quote-section-customer" title="Customer" compact>
        <div className="quote-customer-empty">
          <CustomerSelector
            customers={customers}
            value=""
            onSelectCustomer={onCustomerSelect}
            canCreateCustomer={canCreateCustomer}
          />
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel id="quote-section-customer" title="Customer" compact>
      <div className="quote-customer-card">
        <div className="quote-customer-card__body">
          <p className="quote-customer-card__name">
            {companyName || contactName || "Selected customer"}
          </p>
          {summaryLine ? (
            <p className="quote-customer-card__meta">{summaryLine}</p>
          ) : (
            <p className="quote-customer-card__meta admin-field-warning">
              Contact details incomplete
            </p>
          )}
        </div>
        <div className="quote-customer-card__actions">
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setChanging((v) => !v)}
          >
            Change
          </AdminButton>
          {selectedCustomer ? (
            <AdminButton
              href={`/admin/customers/${selectedCustomer.id}/`}
              variant="ghost"
              size="sm"
            >
              View
            </AdminButton>
          ) : null}
          <AdminButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEditDetailsToggle}
          >
            {editDetailsOpen ? "Done" : "Edit"}
          </AdminButton>
        </div>
      </div>

      {changing ? (
        <div className="quote-customer-card__change">
          <CustomerSelector
            customers={customers}
            value={customerId}
            onSelectCustomer={(customer) => {
              onCustomerSelect(customer);
              setChanging(false);
            }}
            canCreateCustomer={canCreateCustomer}
          />
        </div>
      ) : null}

      {editDetailsOpen ? (
        <div className="admin-form-grid quote-customer-card__edit">
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
    </AdminPanel>
  );
}
