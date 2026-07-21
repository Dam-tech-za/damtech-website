"use client";

import { AdminButton, AdminDialog } from "@/components/admin/ui";
import type { ApplyStrategy } from "@/lib/quotes/project-autofill";

export type TemplateApplyCounts = {
  items: number;
  scopeClauses: number;
  assumptions: number;
  exclusions: number;
  fields?: number;
};

type Props = {
  open: boolean;
  templateName: string;
  counts: TemplateApplyCounts | null;
  hasExistingContent: boolean;
  onChoose: (mode: ApplyStrategy) => void;
  onClose: () => void;
};

export function ApplyTemplateDialog({
  open,
  templateName,
  counts,
  hasExistingContent,
  onChoose,
  onClose,
}: Props) {
  return (
    <AdminDialog open={open} title="Apply project template?" onClose={onClose}>
      <p>
        Applying <strong>{templateName}</strong> will add:
      </p>
      {counts ? (
        <ul className="apply-template-counts">
          <li>{counts.items} suggested quote items</li>
          <li>{counts.scopeClauses} scope clauses</li>
          <li>{counts.assumptions} assumptions</li>
          <li>{counts.exclusions} exclusions</li>
          {counts.fields ? <li>{counts.fields} project detail fields</li> : null}
        </ul>
      ) : null}

      {hasExistingContent ? (
        <p className="apply-template-note">
          This quote already has content. Choose how to apply the template.
        </p>
      ) : null}

      <div className="apply-template-actions">
        {hasExistingContent ? (
          <>
            <AdminButton
              type="button"
              variant="primary"
              onClick={() => onChoose("fill_blank")}
            >
              Keep existing, fill blanks
            </AdminButton>
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => onChoose("append")}
            >
              Append template content
            </AdminButton>
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => onChoose("replace")}
            >
              Replace template content
            </AdminButton>
          </>
        ) : (
          <AdminButton
            type="button"
            variant="primary"
            onClick={() => onChoose("fill_blank")}
          >
            Apply template
          </AdminButton>
        )}
        <AdminButton type="button" variant="ghost" onClick={onClose}>
          Cancel
        </AdminButton>
      </div>
    </AdminDialog>
  );
}
