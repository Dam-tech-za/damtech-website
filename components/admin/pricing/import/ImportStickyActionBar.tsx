"use client";

import { AdminButton } from "@/components/admin/ui";

type ImportStickyActionBarProps = {
  selected: number;
  ready: number;
  warnings: number;
  invalidExcluded: number;
  primaryLabel: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  onBack?: () => void;
};

export function ImportStickyActionBar({
  selected,
  ready,
  warnings,
  invalidExcluded,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  onBack,
}: ImportStickyActionBarProps) {
  return (
    <div className="imp-sticky-bar" role="region" aria-label="Import actions">
      <p className="imp-sticky-bar__summary">
        <span>
          <strong>{selected}</strong> selected
        </span>
        <span>
          <strong>{ready}</strong> ready
        </span>
        <span>
          <strong>{warnings}</strong> warnings
        </span>
        <span>
          <strong>{invalidExcluded}</strong> invalid excluded
        </span>
      </p>
      <div className="imp-sticky-bar__actions">
        {onBack ? (
          <AdminButton type="button" variant="secondary" onClick={onBack}>
            Back
          </AdminButton>
        ) : null}
        <AdminButton type="button" variant="primary" onClick={onPrimary} disabled={primaryDisabled}>
          {primaryLabel}
        </AdminButton>
      </div>
    </div>
  );
}
