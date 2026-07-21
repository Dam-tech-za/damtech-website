"use client";

import { AdminCheckbox, AdminRadioGroup } from "@/components/admin/ui";
import type { DuplicateMode } from "@/lib/pricing/csv/commit";

type DuplicateResolutionCardProps = {
  itemCode: string;
  csvCost: number | null;
  csvSell: number | null;
  csvPriceDate: string | null;
  value: DuplicateMode;
  onChange: (mode: DuplicateMode) => void;
  applyToAll: boolean;
  onApplyToAllChange: (value: boolean) => void;
};

const OPTIONS: Array<{ value: DuplicateMode; label: string }> = [
  { value: "skip", label: "Skip (keep existing item and price)" },
  { value: "update_fields", label: "Update details only" },
  { value: "add_price", label: "Add new price version" },
  { value: "reactivate", label: "Reactivate archived item" },
  { value: "create_new", label: "Create with new code" },
];

export function DuplicateResolutionCard({
  itemCode,
  csvCost,
  csvSell,
  csvPriceDate,
  value,
  onChange,
  applyToAll,
  onApplyToAllChange,
}: DuplicateResolutionCardProps) {
  return (
    <div className="imp-dup">
      <p style={{ margin: 0, fontWeight: 700 }}>
        <code className="admin-code">{itemCode}</code> already exists
      </p>
      <dl className="imp-dup__cols">
        <div>
          <dt>CSV cost</dt>
          <dd>{csvCost ?? "—"}</dd>
        </div>
        <div>
          <dt>CSV sell</dt>
          <dd>{csvSell ?? "—"}</dd>
        </div>
        <div>
          <dt>Price date</dt>
          <dd>{csvPriceDate ?? "today"}</dd>
        </div>
      </dl>
      <AdminRadioGroup
        name={`dup-${itemCode}`}
        legend="Resolution"
        options={OPTIONS}
        value={value}
        onChange={(e) => onChange(e.target.value as DuplicateMode)}
      />
      <AdminCheckbox
        label="Apply this decision to all similar duplicates"
        checked={applyToAll}
        onChange={(e) => onApplyToAllChange(e.target.checked)}
      />
    </div>
  );
}
