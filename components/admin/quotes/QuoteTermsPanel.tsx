"use client";

import {
  AdminDateInput,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminTextarea,
} from "@/components/admin/ui";

type QuoteTermsPanelProps = {
  issueDate: string;
  validUntil: string;
  depositPercent: number;
  paymentTerms: string;
  warrantyWording: string;
  programmeNotes: string;
  onChange: (field: string, value: string | number) => void;
};

export function QuoteTermsPanel({
  issueDate,
  validUntil,
  depositPercent,
  paymentTerms,
  warrantyWording,
  programmeNotes,
  onChange,
}: QuoteTermsPanelProps) {
  return (
    <AdminPanel id="quote-section-terms" title="Dates & Terms">
      <div className="admin-form-grid">
        <AdminField label="Issue date" required>
          <AdminDateInput
            name="issueDate"
            required
            value={issueDate}
            onChange={(e) => onChange("issueDate", e.target.value)}
          />
        </AdminField>
        <AdminField label="Valid until" required>
          <AdminDateInput
            name="validUntil"
            required
            value={validUntil}
            onChange={(e) => onChange("validUntil", e.target.value)}
          />
        </AdminField>
        <AdminField label="Deposit %">
          <AdminInput
            type="number"
            step="0.1"
            name="depositPercent"
            value={depositPercent}
            onChange={(e) => onChange("depositPercent", Number(e.target.value))}
          />
        </AdminField>
        <AdminField label="Payment terms" className="admin-field--full">
          <AdminTextarea
            name="paymentTerms"
            rows={2}
            value={paymentTerms}
            onChange={(e) => onChange("paymentTerms", e.target.value)}
          />
        </AdminField>
        <AdminField label="Warranty" className="admin-field--full">
          <AdminTextarea
            name="warrantyWording"
            rows={2}
            value={warrantyWording}
            onChange={(e) => onChange("warrantyWording", e.target.value)}
          />
        </AdminField>
        <AdminField label="Programme notes" className="admin-field--full">
          <AdminTextarea
            name="programmeNotes"
            rows={2}
            value={programmeNotes}
            onChange={(e) => onChange("programmeNotes", e.target.value)}
          />
        </AdminField>
      </div>
    </AdminPanel>
  );
}
