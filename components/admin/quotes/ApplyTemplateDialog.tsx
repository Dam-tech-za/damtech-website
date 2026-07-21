"use client";

import { AdminButton, AdminDialog } from "@/components/admin/ui";

export type TemplateApplyCounts = {
  items: number;
  scopeClauses: number;
  assumptions: number;
  exclusions: number;
};

type Props = {
  open: boolean;
  templateName: string;
  counts: TemplateApplyCounts | null;
  hasExistingContent: boolean;
  onChoose: (mode: "append" | "replace") => void;
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
        </ul>
      ) : null}

      {hasExistingContent ? (
        <p className="apply-template-note">
          You already have content on this quote. Choose whether to keep and
          append the template content, or replace existing content.
        </p>
      ) : null}

      <div className="apply-template-actions">
        <AdminButton
          type="button"
          variant="primary"
          onClick={() => onChoose("append")}
        >
          {hasExistingContent ? "Keep and append" : "Apply template"}
        </AdminButton>
        {hasExistingContent ? (
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() => onChoose("replace")}
          >
            Replace existing content
          </AdminButton>
        ) : null}
        <AdminButton type="button" variant="ghost" onClick={onClose}>
          Cancel
        </AdminButton>
      </div>
    </AdminDialog>
  );
}
