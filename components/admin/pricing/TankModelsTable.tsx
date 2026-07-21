"use client";

import { useMemo, useState } from "react";
import { AdminButton, AdminInput, AdminSelect, AdminStatusBadge } from "@/components/admin/ui";
import { formatZar } from "@/lib/estimating/money";

export type TankModelListRow = {
  id: string;
  modelCode: string;
  modelName: string;
  diameterM: number | null;
  heightM: number | null;
  ringCount: number | null;
  nominalKl: number | null;
  usableKl: number | null;
  steelSell: number | null;
  linerSell: number | null;
  totalSell: number | null;
  perKl: number | null;
  supplierName: string | null;
  isActive: boolean;
  requiresManualConfirmation: boolean;
  hasCurrentPrice: boolean;
};

function money(value: number | null): string {
  return value == null ? "—" : formatZar(value);
}

function priceStatus(row: TankModelListRow): { status: string; label: string } {
  if (row.requiresManualConfirmation) return { status: "manual_confirmation", label: "Confirm price" };
  if (!row.hasCurrentPrice) return { status: "missing_price", label: "No price" };
  return { status: "ready", label: "Current" };
}

export function TankModelsTable({ rows }: { rows: TankModelListRow[] }) {
  const [search, setSearch] = useState("");
  const [diameter, setDiameter] = useState("all");
  const [height, setHeight] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive" | "manual">("all");

  const diameters = useMemo(
    () => Array.from(new Set(rows.map((r) => r.diameterM).filter((d): d is number => d != null))).sort((a, b) => a - b),
    [rows],
  );
  const heights = useMemo(
    () => Array.from(new Set(rows.map((r) => r.heightM).filter((h): h is number => h != null))).sort((a, b) => a - b),
    [rows],
  );

  const term = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      rows.filter((r) => {
        if (diameter !== "all" && String(r.diameterM) !== diameter) return false;
        if (height !== "all" && String(r.heightM) !== height) return false;
        if (status === "active" && !r.isActive) return false;
        if (status === "inactive" && r.isActive) return false;
        if (status === "manual" && !r.requiresManualConfirmation) return false;
        if (!term) return true;
        return (
          r.modelCode.toLowerCase().includes(term) ||
          r.modelName.toLowerCase().includes(term) ||
          String(r.usableKl ?? "").includes(term) ||
          String(r.nominalKl ?? "").includes(term)
        );
      }),
    [rows, diameter, height, status, term],
  );

  return (
    <div className="admin-stack" style={{ display: "grid", gap: "0.85rem" }}>
      <div className="imp-filters">
        <div style={{ minWidth: "14rem" }}>
          <AdminInput
            type="search"
            placeholder="Search code, model or capacity"
            aria-label="Search tank models"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <AdminSelect aria-label="Diameter" value={diameter} onChange={(e) => setDiameter(e.target.value)}>
          <option value="all">All diameters</option>
          {diameters.map((d) => (
            <option key={d} value={String(d)}>
              {d} m
            </option>
          ))}
        </AdminSelect>
        <AdminSelect aria-label="Height" value={height} onChange={(e) => setHeight(e.target.value)}>
          <option value="all">All heights</option>
          {heights.map((h) => (
            <option key={h} value={String(h)}>
              {h} m
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="manual">Manual confirmation</option>
        </AdminSelect>
      </div>

      {visible.length === 0 ? (
        <p className="admin-help-text">No tank models match these filters.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="admin-table-wrap imp-desktop-only">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Ø</th>
                  <th>H</th>
                  <th>Rings</th>
                  <th>Nominal kL</th>
                  <th>Usable kL</th>
                  <th>Steel sell</th>
                  <th>Liner sell</th>
                  <th>Total</th>
                  <th>R/kL</th>
                  <th>Supplier</th>
                  <th>Price</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const ps = priceStatus(r);
                  return (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.modelName}</strong>
                        <div className="admin-help-text">{r.modelCode}</div>
                      </td>
                      <td>{r.diameterM ?? "—"}</td>
                      <td>{r.heightM ?? "—"}</td>
                      <td>{r.ringCount ?? "—"}</td>
                      <td>{r.nominalKl ?? "—"}</td>
                      <td>{r.usableKl ?? "—"}</td>
                      <td>{money(r.steelSell)}</td>
                      <td>{money(r.linerSell)}</td>
                      <td>{money(r.totalSell)}</td>
                      <td>{r.perKl != null ? `${formatZar(r.perKl)}/kL` : "—"}</td>
                      <td>{r.supplierName ?? "—"}</td>
                      <td>
                        <AdminStatusBadge status={ps.status} label={ps.label} domain="pricing" />
                      </td>
                      <td>{r.isActive ? "Yes" : "No"}</td>
                      <td>
                        <AdminButton href="/admin/quotes/new/" size="sm" variant="ghost">
                          Add to quote
                        </AdminButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="imp-preview-cards imp-mobile-only">
            {visible.map((r) => {
              const ps = priceStatus(r);
              return (
                <article key={r.id} className="admin-mobile-card">
                  <div className="admin-mobile-card__head">
                    <div>
                      <p className="admin-mobile-card__title">{r.modelName}</p>
                      <p className="admin-mobile-card__subtitle">
                        {r.modelCode} · {r.usableKl ?? "—"} kL usable
                      </p>
                    </div>
                    <AdminStatusBadge status={ps.status} label={ps.label} domain="pricing" />
                  </div>
                  <div className="admin-mobile-card__body">
                    Steel {money(r.steelSell)} · Liner {money(r.linerSell)} · Total{" "}
                    {money(r.totalSell)}
                    {r.perKl != null ? ` · ${formatZar(r.perKl)}/kL` : ""}
                  </div>
                  <div className="admin-mobile-card__actions">
                    <AdminButton href="/admin/quotes/new/" size="sm" variant="secondary">
                      Add to quote
                    </AdminButton>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
