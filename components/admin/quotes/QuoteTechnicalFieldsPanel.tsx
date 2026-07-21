"use client";

import { useState } from "react";
import {
  AdminField,
  AdminInput,
  AdminPanel,
  AdminSelect,
} from "@/components/admin/ui";
import {
  computeFieldCompletion,
  type TemplateProjectFieldDef,
} from "@/lib/quotes/project-autofill";

type Props = {
  fields: TemplateProjectFieldDef[];
  values: Record<string, string>;
  onChange: (fieldKey: string, value: string) => void;
};

function inputTypeFor(fieldType: string): string {
  switch (fieldType) {
    case "number":
    case "area":
    case "length":
    case "capacity":
    case "percentage":
      return "number";
    case "date":
      return "date";
    default:
      return "text";
  }
}

export function QuoteTechnicalFieldsPanel({ fields, values, onChange }: Props) {
  const [open, setOpen] = useState(false);
  if (!fields.length) return null;

  const completion = computeFieldCompletion(fields, values);

  return (
    <AdminPanel
      id="quote-section-technical"
      title="Technical project details"
      compact
      actions={
        <button
          type="button"
          className="quote-technical__toggle"
          aria-expanded={open}
          aria-controls="quote-technical-body"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Hide" : "Show"}
        </button>
      }
    >
      <p className="quote-technical__status">
        {completion.completed} of {completion.total} recommended details completed
        {completion.missingRequired.length > 0 ? (
          <span className="quote-technical__required">
            {" "}
            · {completion.missingRequired.length} required outstanding
          </span>
        ) : null}
      </p>

      {open ? (
        <div id="quote-technical-body" className="admin-form-grid">
          {fields.map((field) => {
            const value = values[field.fieldKey] ?? "";
            const label = field.unit
              ? `${field.label} (${field.unit})`
              : field.label;
            if (field.fieldType === "boolean") {
              return (
                <AdminField
                  key={field.fieldKey}
                  label={label}
                  required={field.isRequired}
                >
                  <AdminSelect
                    value={value}
                    onChange={(e) => onChange(field.fieldKey, e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </AdminSelect>
                </AdminField>
              );
            }
            if (field.fieldType === "select" && field.options.length) {
              return (
                <AdminField
                  key={field.fieldKey}
                  label={label}
                  required={field.isRequired}
                >
                  <AdminSelect
                    value={value}
                    onChange={(e) => onChange(field.fieldKey, e.target.value)}
                  >
                    <option value="">Select…</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
              );
            }
            return (
              <AdminField
                key={field.fieldKey}
                label={label}
                required={field.isRequired}
                description={field.helpText ?? undefined}
              >
                <AdminInput
                  type={inputTypeFor(field.fieldType)}
                  value={value}
                  onChange={(e) => onChange(field.fieldKey, e.target.value)}
                />
              </AdminField>
            );
          })}
        </div>
      ) : null}
    </AdminPanel>
  );
}
