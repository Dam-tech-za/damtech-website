"use client";

import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";
import { QUOTE_SERVICE_OPTIONS } from "@/lib/quotes/quote-builder-types";

type QuoteProjectPanelProps = {
  title: string;
  rfqReference: string;
  projectReference: string;
  projectLocation: string;
  serviceRequired: string;
  projectDescription: string;
  onChange: (field: string, value: string) => void;
  onImportRfq?: () => void;
};

export function QuoteProjectPanel({
  title,
  rfqReference,
  projectReference,
  projectLocation,
  serviceRequired,
  projectDescription,
  onChange,
  onImportRfq,
}: QuoteProjectPanelProps) {
  return (
    <AdminPanel
      id="quote-section-project"
      title="Project"
      actions={
        onImportRfq ? (
          <AdminButton type="button" variant="secondary" size="sm" onClick={onImportRfq}>
            Import from RFQ
          </AdminButton>
        ) : undefined
      }
    >
      <div className="admin-form-grid">
        <AdminField label="Quote title" required className="admin-field--full">
          <AdminInput
            name="title"
            required
            value={title}
            onChange={(e) => onChange("title", e.target.value)}
          />
        </AdminField>
        <AdminField label="RFQ reference">
          <AdminInput
            name="rfqReference"
            value={rfqReference}
            readOnly
            placeholder="Linked when imported from RFQ"
          />
        </AdminField>
        <AdminField label="Project reference">
          <AdminInput
            name="projectReference"
            value={projectReference}
            onChange={(e) => onChange("projectReference", e.target.value)}
          />
        </AdminField>
        <AdminField label="Project location">
          <AdminInput
            name="projectLocation"
            value={projectLocation}
            onChange={(e) => onChange("projectLocation", e.target.value)}
          />
        </AdminField>
        <AdminField label="Service">
          <AdminSelect
            name="serviceRequired"
            value={serviceRequired}
            onChange={(e) => onChange("serviceRequired", e.target.value)}
          >
            <option value="">Select service…</option>
            {QUOTE_SERVICE_OPTIONS.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
        <AdminField label="Project description" className="admin-field--full">
          <AdminTextarea
            name="projectDescription"
            rows={3}
            value={projectDescription}
            onChange={(e) => onChange("projectDescription", e.target.value)}
          />
        </AdminField>
      </div>
    </AdminPanel>
  );
}
