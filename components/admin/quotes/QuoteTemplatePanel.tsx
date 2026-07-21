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
  onSelectTemplate: (templateId: string) => void;
  onReset: () => void;
};

export function QuoteTemplatePanel({
  templates,
  appliedTemplateId,
  appliedTemplateName,
  pending,
  onSelectTemplate,
  onReset,
}: Props) {
  const [changing, setChanging] = useState(false);
  const applied = templates.find((t) => t.id === appliedTemplateId) ?? null;

  const groups = Array.from(
    new Set(templates.map((t) => t.projectCategory || "Other")),
  );

  if (!templates.length) return null;

  const showSelector = !appliedTemplateId || changing;

  return (
    <AdminPanel id="quote-section-template" title="Project type" compact>
      {appliedTemplateId && !changing ? (
        <div className="quote-template-summary">
          <p className="quote-template-summary__name">
            {applied?.name ?? appliedTemplateName}
            <span className="quote-template-status">Template applied</span>
          </p>
          {applied?.shortDescription ? (
            <p className="quote-template-summary__desc">
              {applied.shortDescription}
            </p>
          ) : null}
          <div className="quote-template-actions">
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setChanging(true)}
            >
              Change
            </AdminButton>
            {applied ? (
              <AdminButton
                variant="ghost"
                size="sm"
                href={`/admin/pricing/project-templates/${applied.id}/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Preview template
              </AdminButton>
            ) : null}
            <AdminButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={pending}
            >
              Reset from template
            </AdminButton>
          </div>
        </div>
      ) : null}

      {showSelector ? (
        <div className="quote-template-selector">
          <AdminSelect
            aria-label="Select project template"
            value={changing ? "" : appliedTemplateId}
            disabled={pending}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return;
              setChanging(false);
              onSelectTemplate(value);
            }}
          >
            <option value="">
              {pending ? "Applying…" : "Search or select project template…"}
            </option>
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
          {changing ? (
            <AdminButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setChanging(false)}
            >
              Cancel
            </AdminButton>
          ) : null}
        </div>
      ) : null}
    </AdminPanel>
  );
}
