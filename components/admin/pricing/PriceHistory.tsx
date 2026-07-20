"use client";

import { formatZar } from "@/lib/estimating/money";
import { AdminButton, AdminEmptyState, AdminPanel } from "@/components/admin/ui";

export type PriceHistoryRow = {
  id: string;
  costPrice: number | null;
  sellPrice: number | null;
  supplierName: string | null;
  sourceType: string;
  sourceReference: string | null;
  validFrom: string;
  validTo: string | null;
  isPreferred: boolean;
  createdAt: string;
  status: "current" | "future" | "expired" | "superseded" | "manual";
};

type PriceHistoryProps = {
  rows: PriceHistoryRow[];
  showCost: boolean;
  onAddPrice?: () => void;
  canManage?: boolean;
};

const STATUS_LABEL: Record<PriceHistoryRow["status"], string> = {
  current: "Current",
  future: "Future",
  expired: "Expired",
  superseded: "Superseded",
  manual: "Manual",
};

export function PriceHistory({
  rows,
  showCost,
  onAddPrice,
  canManage,
}: PriceHistoryProps) {
  return (
    <AdminPanel
      title="Price history"
      actions={
        canManage && onAddPrice ? (
          <AdminButton type="button" size="sm" variant="secondary" onClick={onAddPrice}>
            Add new price
          </AdminButton>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <AdminEmptyState
          title="No price versions recorded yet."
          description="New prices create history versions rather than overwriting previous rates."
          compact
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Effective</th>
                <th>End</th>
                {showCost ? <th>Cost</th> : null}
                <th>Sell</th>
                <th>Supplier</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.validFrom}</td>
                  <td>{row.validTo ?? "—"}</td>
                  {showCost ? (
                    <td>{row.costPrice != null ? formatZar(row.costPrice) : "—"}</td>
                  ) : null}
                  <td>{row.sellPrice != null ? formatZar(row.sellPrice) : "—"}</td>
                  <td>{row.supplierName ?? "—"}</td>
                  <td>
                    {row.sourceType}
                    {row.sourceReference ? ` · ${row.sourceReference}` : ""}
                  </td>
                  <td>
                    <span className={`admin-price-status admin-price-status--${row.status === "current"}`}>
                      {STATUS_LABEL[row.status]}
                      {row.isPreferred ? " · Preferred" : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  );
}

export function resolvePriceHistoryStatus(row: {
  validFrom: string;
  validTo: string | null;
  isPreferred: boolean;
  sourceType: string;
}): PriceHistoryRow["status"] {
  const today = new Date().toISOString().slice(0, 10);
  if (row.sourceType === "manual") return "manual";
  if (row.validFrom > today) return "future";
  if (row.validTo && row.validTo < today) return "expired";
  if (row.isPreferred) return "current";
  return "superseded";
}
