"use client";

import { useMemo, useState } from "react";
import {
  AdminButton,
  AdminDialog,
  AdminInfoBanner,
} from "@/components/admin/ui";
import { formatZar } from "@/lib/estimating/money";
import type { StaleLineAssessment } from "@/lib/pricing/stale-prices";
import { countStaleLines } from "@/lib/pricing/stale-prices";

type StalePriceWarningProps = {
  assessments: StaleLineAssessment[];
  onKeepCurrent: () => void;
  onUpdateSelected: (lineIds: string[]) => void;
  onUpdateAll: () => void;
};

export function StalePriceWarning({
  assessments,
  onKeepCurrent,
  onUpdateSelected,
  onUpdateAll,
}: StalePriceWarningProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const stale = useMemo(
    () =>
      assessments.filter((row) =>
        ["newer_available", "original_expired", "item_archived", "supplier_unavailable"].includes(
          row.status,
        ),
      ),
    [assessments],
  );

  const count = countStaleLines(assessments);
  if (count === 0) return null;

  return (
    <>
      <AdminInfoBanner tone="warning">
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <span>
            {count} quote line{count === 1 ? "" : "s"} {count === 1 ? "has" : "have"} newer or
            changed pricing available.
          </span>
          <AdminButton type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
            Review changes
          </AdminButton>
          <AdminButton type="button" size="sm" variant="ghost" onClick={onKeepCurrent}>
            Keep current prices
          </AdminButton>
        </div>
      </AdminInfoBanner>

      <AdminDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Review pricing changes"
        footer={
          <>
            <AdminButton type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => {
                onUpdateSelected(selected);
                setOpen(false);
              }}
              disabled={selected.length === 0}
            >
              Update selected
            </AdminButton>
            <AdminButton
              type="button"
              variant="primary"
              onClick={() => {
                onUpdateAll();
                setOpen(false);
              }}
            >
              Update all eligible
            </AdminButton>
          </>
        }
      >
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th />
                <th>Line</th>
                <th>Current</th>
                <th>New</th>
                <th>Difference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stale.map((row) => {
                const key = row.lineId ?? String(row.sortOrder);
                return (
                  <tr key={key}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(key)}
                        onChange={(e) => {
                          setSelected((prev) =>
                            e.target.checked
                              ? [...prev, key]
                              : prev.filter((id) => id !== key),
                          );
                        }}
                        aria-label={`Select ${row.description}`}
                      />
                    </td>
                    <td>{row.description}</td>
                    <td>{formatZar(row.currentSellPrice)}</td>
                    <td>
                      {row.newSellPrice != null ? formatZar(row.newSellPrice) : "—"}
                    </td>
                    <td>
                      {row.difference != null
                        ? `${row.difference >= 0 ? "+" : ""}${formatZar(row.difference)}`
                        : "—"}
                    </td>
                    <td>{row.status.replaceAll("_", " ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="admin-help-text">
          Sent, approved, viewed or accepted quotations are never updated automatically. Draft
          price updates create a new snapshot on the next save.
        </p>
      </AdminDialog>
    </>
  );
}
