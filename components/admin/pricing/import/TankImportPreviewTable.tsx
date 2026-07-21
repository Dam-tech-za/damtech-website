"use client";

import { useMemo, useState } from "react";
import { AdminButton, AdminInput, AdminStatusBadge } from "@/components/admin/ui";
import { formatZar } from "@/lib/estimating/money";
import type { TankRowValidationResult } from "@/lib/pricing/tank-import/validate";

export type TankPreviewFilter =
  | "all"
  | "ready"
  | "warnings"
  | "invalid"
  | "duplicates"
  | "manual"
  | "missing_liner";

type TankImportPreviewTableProps = {
  rows: TankRowValidationResult[];
  canSeeCost: boolean;
  filter: TankPreviewFilter;
  onFilterChange: (filter: TankPreviewFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onToggleRow: (rowNumber: number, included: boolean) => void;
};

const FILTERS: Array<{ id: TankPreviewFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "warnings", label: "Warnings" },
  { id: "invalid", label: "Invalid" },
  { id: "duplicates", label: "Duplicates" },
  { id: "manual", label: "Manual confirmation" },
  { id: "missing_liner", label: "Missing liner price" },
];

function matchesFilter(row: TankRowValidationResult, filter: TankPreviewFilter): boolean {
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
      return row.status === "manual_confirmation";
    case "missing_liner":
      return row.warnings.some((w) => w.includes("PVC liner price required"));
    default:
      return true;
  }
}

function money(value: number | null | undefined): string {
  return value == null ? "—" : formatZar(value);
}

export function TankImportPreviewTable({
  rows,
  canSeeCost,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  onToggleRow,
}: TankImportPreviewTableProps) {
  const term = search.trim().toLowerCase();
  const [expanded, setExpanded] = useState<number | null>(null);

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        if (!matchesFilter(row, filter)) return false;
        if (!term) return true;
        const code = (row.data?.tank_code ?? row.raw.tank_code ?? "").toLowerCase();
        const name = (row.data?.model_name ?? row.raw.model_name ?? "").toLowerCase();
        const dia = String(row.data?.diameter_m ?? row.raw.diameter_m ?? "");
        const cap = String(row.data?.usable_capacity_kl ?? row.raw.usable_capacity_kl ?? "");
        const supplier = (row.data?.supplier_model_code ?? "").toLowerCase();
        return (
          code.includes(term) ||
          name.includes(term) ||
          dia.includes(term) ||
          cap.includes(term) ||
          supplier.includes(term)
        );
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
            placeholder="Search code, model, diameter or capacity"
            aria-label="Search preview rows"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="admin-help-text">No rows match this filter.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "3rem" }}>
                  <span className="sr-only">Include</span>
                </th>
                <th style={{ width: "3.5rem" }}>Row</th>
                <th>Tank code</th>
                <th>Model</th>
                <th>Ø</th>
                <th>H</th>
                <th>Rings</th>
                <th>Usable kL</th>
                <th>Steel sell</th>
                <th>Liner sell</th>
                <th>Total sell</th>
                <th>R/kL</th>
                <th>Status</th>
                <th style={{ width: "5rem" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const d = row.data;
                const isOpen = expanded === row.rowNumber;
                return (
                  <>
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
                      <td>{d?.tank_code ?? row.raw.tank_code ?? "—"}</td>
                      <td>{d?.model_name ?? row.raw.model_name ?? "—"}</td>
                      <td>{d?.diameter_m ?? row.raw.diameter_m ?? "—"}</td>
                      <td>{d?.height_m ?? row.raw.height_m ?? "—"}</td>
                      <td>{d?.ring_count ?? row.raw.ring_count ?? "—"}</td>
                      <td>{d?.usable_capacity_kl ?? "—"}</td>
                      <td>{money(d?.steel_tank_sell_ex_vat_zar)}</td>
                      <td>{money(d?.pvc_liner_sell_ex_vat_zar)}</td>
                      <td>{money(d?.total_sell_ex_vat_zar)}</td>
                      <td>
                        {d?.combined_price_per_usable_kl != null
                          ? `${formatZar(d.combined_price_per_usable_kl)}/kL`
                          : "—"}
                      </td>
                      <td>
                        <AdminStatusBadge
                          status={row.status}
                          label={row.status.replaceAll("_", " ")}
                          domain="pricing"
                        />
                      </td>
                      <td>
                        <AdminButton
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-expanded={isOpen}
                          onClick={() => setExpanded(isOpen ? null : row.rowNumber)}
                        >
                          {isOpen ? "Hide" : "Details"}
                        </AdminButton>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr key={`${row.rowNumber}-detail`} className="imp-detail-row">
                        <td colSpan={14}>
                          <div className="tank-detail-grid">
                            {canSeeCost ? (
                              <span>
                                Steel cost: {money(d?.steel_tank_cost_ex_vat_zar)} · Liner cost:{" "}
                                {money(d?.pvc_liner_cost_ex_vat_zar)}
                              </span>
                            ) : null}
                            <span>
                              Nominal: {d?.nominal_capacity_kl ?? "—"} kL · Liner area:{" "}
                              {d?.liner_area_m2 ?? "—"} m²
                            </span>
                            <span>
                              Fittings (mm): in {d?.default_inlet_mm ?? "—"} · out{" "}
                              {d?.default_outlet_mm ?? "—"} · overflow {d?.default_overflow_mm ?? "—"}{" "}
                              · drain {d?.default_drain_mm ?? "—"}
                            </span>
                            <span>
                              Supplier: {d?.supplier_name ?? "—"} · Code:{" "}
                              {d?.supplier_model_code ?? "—"} · Lead {d?.lead_time_days ?? "—"} days
                            </span>
                            <span>
                              Validity: {d?.valid_from ?? "—"} → {d?.valid_to ?? "—"} · Confidence:{" "}
                              {d?.confidence ?? "—"}
                            </span>
                            {d?.notes ? <span>Notes: {d.notes}</span> : null}
                            {row.errors.map((e) => (
                              <span key={e} className="tank-detail-grid__error">
                                {e}
                              </span>
                            ))}
                            {row.warnings.map((w) => (
                              <span key={w} className="tank-detail-grid__warning">
                                {w}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
