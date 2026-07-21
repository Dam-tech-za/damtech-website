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
import type { FieldSource } from "@/lib/quotes/project-autofill";

type QuoteProjectPanelProps = {
  title: string;
  rfqId: string;
  rfqReference: string;
  manualRfqReference: string;
  projectReference: string;
  projectLocation: string;
  serviceRequired: string;
  projectDescription: string;
  templateName?: string | null;
  sources?: Partial<Record<string, FieldSource>>;
  onChange: (field: string, value: string) => void;
  onImportRfq?: () => void;
};

function SourceBadge({ source }: { source?: FieldSource }) {
  if (!source || source === "manual") return null;
  const label =
    source === "rfq"
      ? "Imported from RFQ"
      : source === "template"
        ? "From template"
        : source === "customer"
          ? "From customer"
          : "Calculated";
  return <span className="quote-field-source">{label}</span>;
}

export function QuoteProjectPanel({
  title,
  rfqId,
  rfqReference,
  manualRfqReference,
  projectReference,
  projectLocation,
  serviceRequired,
  projectDescription,
  templateName,
  sources,
  onChange,
  onImportRfq,
}: QuoteProjectPanelProps) {
  return (
    <AdminPanel id="quote-section-project" title="Project">
      <div className="admin-form-grid">
        <AdminField label="Quote title" required className="admin-field--full">
          <AdminInput
            name="title"
            required
            value={title}
            onChange={(e) => onChange("title", e.target.value)}
          />
        </AdminField>

        <AdminField label="Project location">
          <AdminInput
            name="projectLocation"
            value={projectLocation}
            onChange={(e) => onChange("projectLocation", e.target.value)}
          />
          <SourceBadge source={sources?.projectLocation} />
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
          <SourceBadge source={sources?.serviceRequired} />
        </AdminField>

        <AdminField label="RFQ reference">
          {rfqId ? (
            <div className="quote-rfq-linked">
              <span className="quote-rfq-linked__ref">
                {rfqReference || "Linked RFQ"}
              </span>
              <span className="quote-field-source">Imported from RFQ</span>
              <AdminButton
                variant="ghost"
                size="sm"
                href={`/admin/rfqs/${rfqId}/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View RFQ
              </AdminButton>
            </div>
          ) : (
            <div className="quote-rfq-manual">
              <AdminInput
                name="manualRfqReference"
                value={manualRfqReference}
                placeholder="No RFQ linked — enter a reference"
                onChange={(e) => onChange("manualRfqReference", e.target.value)}
              />
              {onImportRfq ? (
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onImportRfq}
                >
                  Link existing RFQ
                </AdminButton>
              ) : null}
            </div>
          )}
        </AdminField>

        <AdminField label="Project reference">
          <AdminInput
            name="projectReference"
            value={projectReference}
            onChange={(e) => onChange("projectReference", e.target.value)}
          />
        </AdminField>

        {templateName ? (
          <AdminField label="Template source">
            <p className="quote-template-source-value">{templateName}</p>
          </AdminField>
        ) : null}

        <AdminField label="Project description" className="admin-field--full">
          <AdminTextarea
            name="projectDescription"
            rows={3}
            value={projectDescription}
            onChange={(e) => onChange("projectDescription", e.target.value)}
          />
          <SourceBadge source={sources?.projectDescription} />
        </AdminField>
      </div>
    </AdminPanel>
  );
}
