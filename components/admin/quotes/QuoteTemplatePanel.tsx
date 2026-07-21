"use client";

import { useState } from "react";
import { AdminButton, AdminPanel, AdminSelect } from "@/components/admin/ui";

export type QuoteTemplateOption = {
  id: string;
  code: string;
  name: string;
  shortDescription: string | null;
  projectCategory: string | null;
};

type Props = {
  templates: QuoteTemplateOption[];
  appliedTemplateId: string;
  appliedTemplateName: string;
  pending: boolean;
  onApply: (templateId: string) => void;
};

export function QuoteTemplatePanel({
  templates,
  appliedTemplateId,
  appliedTemplateName,
  pending,
  onApply,
}: Props) {
  const [selectedId, setSelectedId] = useState(appliedTemplateId);
  const selected = templates.find((t) => t.id === selectedId) ?? null;

  const groups = Array.from(
    new Set(templates.map((t) => t.projectCategory || "Other")),
  );

  if (!templates.length) return null;

  return (
    <AdminPanel id="quote-section-template" title="Project type" compact>
      {appliedTemplateId ? (
        <p className="quote-template-applied">
          Applied template: <strong>{appliedTemplateName}</strong>
        </p>
      ) : null}
      <div className="quote-template-selector">
        <AdminSelect
          aria-label="Select project template"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Search or select project template…</option>
          {groups.map((group) => (
            <optgroup key={group} label={group}>
              {templates
                .filter((t) => (t.projectCategory || "Other") === group)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
            </optgroup>
          ))}
        </AdminSelect>
        <AdminButton
          type="button"
          variant="primary"
          size="sm"
          disabled={!selectedId || pending}
          onClick={() => selectedId && onApply(selectedId)}
        >
          {pending ? "Applying…" : "Apply template"}
        </AdminButton>
      </div>
      {selected ? (
        <div className="quote-template-summary">
          <p className="quote-template-summary__name">{selected.name}</p>
          {selected.shortDescription ? (
            <p className="quote-template-summary__desc">
              {selected.shortDescription}
            </p>
          ) : null}
        </div>
      ) : null}
    </AdminPanel>
  );
}
