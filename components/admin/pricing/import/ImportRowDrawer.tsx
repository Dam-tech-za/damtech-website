"use client";

import { useState } from "react";
import {
  AdminButton,
  AdminDrawer,
  AdminField,
  AdminInput,
  AdminInfoBanner,
} from "@/components/admin/ui";
import type { RowValidationResult } from "@/lib/pricing/csv/validate";
import type { DuplicateMode } from "@/lib/pricing/csv/commit";
import { DuplicateResolutionCard } from "./DuplicateResolutionCard";

export type RowEdits = Partial<
  Record<
    | "item_code"
    | "category"
    | "product_name"
    | "item_type"
    | "quote_unit"
    | "default_cost_ex_vat_zar"
    | "recommended_sell_ex_vat_zar",
    string
  >
>;

type ImportRowDrawerProps = {
  open: boolean;
  row: RowValidationResult | null;
  canSeeCost: boolean;
  onClose: () => void;
  onSave: (rowNumber: number, edits: RowEdits) => void;
  onDuplicateModeChange: (rowNumber: number, mode: DuplicateMode, applyAll: boolean) => void;
  duplicateMode: DuplicateMode;
};

const EDIT_FIELDS: Array<{ key: keyof RowEdits; label: string; cost?: boolean }> = [
  { key: "item_code", label: "Item code" },
  { key: "product_name", label: "Product name" },
  { key: "category", label: "Category" },
  { key: "item_type", label: "Item type" },
  { key: "quote_unit", label: "Quote unit" },
  { key: "default_cost_ex_vat_zar", label: "Cost (ex VAT)", cost: true },
  { key: "recommended_sell_ex_vat_zar", label: "Sell price (ex VAT)" },
];

function initialValue(row: RowValidationResult, key: keyof RowEdits): string {
  const source = row.data as Record<string, unknown> | null;
  const raw = row.raw as Record<string, string>;
  const value = source?.[key] ?? raw?.[key] ?? "";
  return value == null ? "" : String(value);
}

export function ImportRowDrawer({
  open,
  row,
  canSeeCost,
  onClose,
  onSave,
  onDuplicateModeChange,
  duplicateMode,
}: ImportRowDrawerProps) {
  const [edits, setEdits] = useState<RowEdits>({});
  const [dupMode, setDupMode] = useState<DuplicateMode>(duplicateMode);
  const [applyAll, setApplyAll] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);

  // Reset the form when the drawer opens for a (possibly different) row.
  const key = open ? String(row?.rowNumber ?? "none") : null;
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setEdits({});
      setDupMode(duplicateMode);
      setApplyAll(false);
    }
  }

  if (!row) return null;

  return (
    <AdminDrawer open={open} title={`Row ${row.rowNumber}`} onClose={onClose}>
      <div className="admin-stack" style={{ display: "grid", gap: "0.85rem", paddingBottom: "1rem" }}>
        {row.errors.length ? (
          <AdminInfoBanner tone="warning">
            <strong>Errors:</strong> {row.errors.join("; ")}
          </AdminInfoBanner>
        ) : null}
        {row.warnings.length ? (
          <p className="admin-help-text">{row.warnings.join("; ")}</p>
        ) : null}

        {row.status === "duplicate" && row.data ? (
          <DuplicateResolutionCard
            itemCode={row.data.item_code}
            csvCost={row.data.default_cost_ex_vat_zar}
            csvSell={row.data.recommended_sell_ex_vat_zar}
            csvPriceDate={row.data.price_date}
            value={dupMode}
            onChange={(m) => {
              setDupMode(m);
              onDuplicateModeChange(row.rowNumber, m, applyAll);
            }}
            applyToAll={applyAll}
            onApplyToAllChange={(v) => {
              setApplyAll(v);
              onDuplicateModeChange(row.rowNumber, dupMode, v);
            }}
          />
        ) : null}

        <div style={{ display: "grid", gap: "0.6rem" }}>
          {EDIT_FIELDS.filter((f) => !f.cost || canSeeCost).map((f) => (
            <AdminField key={f.key} label={f.label}>
              <AdminInput
                defaultValue={initialValue(row, f.key)}
                onChange={(e) => setEdits((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </AdminField>
          ))}
          <p className="admin-help-text">
            Original CSV values are preserved for audit. Saving re-validates the row.
          </p>
        </div>

        <div className="admin-panel__actions">
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            type="button"
            variant="primary"
            onClick={() => onSave(row.rowNumber, edits)}
          >
            Save &amp; re-validate
          </AdminButton>
        </div>
      </div>
    </AdminDrawer>
  );
}
