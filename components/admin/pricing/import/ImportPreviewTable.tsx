"use client";

import { useMemo } from "react";
import { AdminButton, AdminInput, AdminStatusBadge } from "@/components/admin/ui";
import type { RowValidationResult } from "@/lib/pricing/csv/validate";
import type { PreviewFilter } from "./types";

type ImportPreviewTableProps = {
  rows: RowValidationResult[];
  canSeeCost: boolean;
  filter: PreviewFilter;
  onFilterChange: (filter: PreviewFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onToggleRow: (rowNumber: number, included: boolean) => void;
  onOpenRow: (rowNumber: number) => void;
};

const FILTERS: Array<{ id: PreviewFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "warnings", label: "Warnings" },
  { id: "invalid", label: "Invalid" },
  { id: "duplicates", label: "Duplicates" },
  { id: "manual", label: "Manual confirmation" },
];

function matchesFilter(row: RowValidationResult, filter: PreviewFilter): boolean {
  switch (filter) {
    case "ready":
      return row.status === "ready";
    case "warnings":
      return row.status === "ready_with_warning";
    case "invalid":
      return row.status === "invalid";
    case "duplicates":
      return row.status === "duplicate";
    case "manual":
      return row.status === "manual_confirmation" || row.status === "missing_price";
    default:
      return true;
  }
}

function statusLabel(row: RowValidationResult): string {
  if (row.status === "duplicate") return "Duplicate";
  return row.status.replaceAll("_", " ");
}

export function ImportPreviewTable({
  rows,
  canSeeCost,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  onToggleRow,
  onOpenRow,
}: ImportPreviewTableProps) {
  const term = search.trim().toLowerCase();

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        if (!matchesFilter(row, filter)) return false;
        if (!term) return true;
        const code = (row.data?.item_code ?? row.raw.item_code ?? "").toLowerCase();
        const name = (row.data?.product_name ?? row.raw.product_name ?? "").toLowerCase();
        const category = (row.data?.category ?? row.raw.category ?? "").toLowerCase();
        return code.includes(term) || name.includes(term) || category.includes(term);
      }),
    [rows, filter, term],
  );

  return (
    <div className="admin-stack" style={{ display: "grid", gap: "0.85rem" }}>
      <div className="imp-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`imp-filter-chip${filter === f.id ? " is-active" : ""}`}
            aria-pressed={filter === f.id}
            onClick={() => onFilterChange(f.id)}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", minWidth: "12rem" }}>
          <AdminInput
            type="search"
            placeholder="Search code, product or category"
            aria-label="Search preview rows"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="admin-help-text">No rows match this filter.</p>
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="admin-table-wrap imp-desktop-only">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "3rem" }}>
                    <span className="sr-only">Include</span>
                  </th>
                  <th style={{ width: "3.5rem" }}>Row</th>
                  <th>Item code</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Category</th>
                  {canSeeCost ? <th>Cost</th> : null}
                  <th>Sell</th>
                  <th>Status</th>
                  <th style={{ width: "5rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Include row ${row.rowNumber}`}
                        checked={!row.excluded && row.status !== "invalid"}
                        disabled={row.status === "invalid"}
                        onChange={(e) => onToggleRow(row.rowNumber, e.target.checked)}
                      />
                    </td>
                    <td>{row.rowNumber}</td>
                    <td>{row.data?.item_code ?? row.raw.item_code ?? "—"}</td>
                    <td>{row.data?.product_name ?? row.raw.product_name ?? "—"}</td>
                    <td>{row.data?.item_type ?? "—"}</td>
                    <td>{row.data?.category ?? row.raw.category ?? "—"}</td>
                    {canSeeCost ? <td>{row.data?.default_cost_ex_vat_zar ?? "—"}</td> : null}
                    <td>{row.data?.recommended_sell_ex_vat_zar ?? "—"}</td>
                    <td>
                      <AdminStatusBadge
                        status={row.status}
                        label={statusLabel(row)}
                        domain="pricing"
                      />
                    </td>
                    <td>
                      <AdminButton
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenRow(row.rowNumber)}
                      >
                        {row.status === "invalid" || row.status === "duplicate" ? "Fix" : "Details"}
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile row cards */}
          <div className="imp-preview-cards imp-mobile-only">
            {visible.map((row) => (
              <article key={row.rowNumber} className="admin-mobile-card">
                <div className="admin-mobile-card__head">
                  <div>
                    <p className="admin-mobile-card__title">
                      {row.data?.product_name ?? row.raw.product_name ?? `Row ${row.rowNumber}`}
                    </p>
                    <p className="admin-mobile-card__subtitle">
                      {row.data?.item_code ?? row.raw.item_code ?? "—"} · {row.data?.category ?? "—"}
                    </p>
                  </div>
                  <AdminStatusBadge status={row.status} label={statusLabel(row)} domain="pricing" />
                </div>
                <div className="admin-mobile-card__body">
                  {canSeeCost ? `Cost ${row.data?.default_cost_ex_vat_zar ?? "—"} · ` : ""}
                  Sell {row.data?.recommended_sell_ex_vat_zar ?? "—"}
                  {row.errors[0] ? ` · ${row.errors[0]}` : ""}
                </div>
                <div className="admin-mobile-card__actions">
                  <label className="admin-checkbox-field">
                    <input
                      type="checkbox"
                      className="admin-checkbox-field__input"
                      checked={!row.excluded && row.status !== "invalid"}
                      disabled={row.status === "invalid"}
                      onChange={(e) => onToggleRow(row.rowNumber, e.target.checked)}
                    />
                    <span className="admin-checkbox-field__label">Include</span>
                  </label>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onOpenRow(row.rowNumber)}
                  >
                    {row.status === "invalid" || row.status === "duplicate" ? "Fix" : "Details"}
                  </AdminButton>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
