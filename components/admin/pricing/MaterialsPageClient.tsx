"use client";

import {
  AdminButton,
  AdminEmptyState,
  AdminFilterToolbar,
  AdminPageHeader,
  AdminPanel,
  AdminSearchField,
  AdminSelect,
} from "@/components/admin/ui";
import { formatZar } from "@/lib/estimating/money";
import { formatUnitLabel } from "@/lib/pricing/units";
import { archiveMaterialAction } from "@/app/admin/pricing/actions";
import { PriceStatusBadge } from "./PriceStatusBadge";
import { PriceHistory, type PriceHistoryRow } from "./PriceHistory";
import type { PriceStatus } from "@/lib/pricing/types";

type MaterialsPageClientProps = {
  canManage: boolean;
  canSeeCost: boolean;
  initialQuery: string;
  initialCategory: string;
  initialActive: string;
  rows: Array<Record<string, unknown>>;
  errorMessage?: string;
  onAddMaterial: () => void;
  priceHistory?: PriceHistoryRow[];
};

const MATERIAL_CATEGORIES = [
  "HDPE geomembrane",
  "PVC liner",
  "Dortom liner",
  "Geotextile",
  "Torch-on membrane",
  "Liquid waterproofing",
  "Cementitious waterproofing",
  "Accessories",
  "Miscellaneous",
];

function priceStatus(row: Record<string, unknown>): PriceStatus {
  const sell = row.default_sell_price;
  const cost = row.default_cost;
  if ((sell == null || Number(sell) <= 0) && (cost == null || Number(cost) <= 0)) {
    return "missing";
  }
  return "current";
}

export function MaterialsPageClient({
  canManage,
  canSeeCost,
  initialQuery,
  initialCategory,
  initialActive,
  rows,
  errorMessage,
  onAddMaterial,
  priceHistory = [],
}: MaterialsPageClientProps) {
  return (
    <div className="admin-stack--page">
      <AdminPageHeader
        title="Materials"
        description="Manage waterproofing materials, packaging units, allowances and sell prices used in quotations."
        secondaryAction={{ href: "/admin/pricing/", label: "Pricing & Inventory" }}
        secondaryActions={
          <AdminButton href="/admin/pricing/import/" variant="secondary" size="sm">
            Import CSV
          </AdminButton>
        }
        primaryActionNode={
          canManage ? (
            <AdminButton type="button" variant="primary" onClick={onAddMaterial}>
              Add Material
            </AdminButton>
          ) : undefined
        }
      />

      <AdminPanel title="Filter materials">
        <AdminFilterToolbar>
          <form method="get" className="admin-filter-toolbar__form">
            <AdminSearchField
              name="q"
              placeholder="Search code or name"
              defaultValue={initialQuery}
              label="Search materials"
            />
            <AdminSelect name="category" defaultValue={initialCategory} aria-label="Category">
              <option value="">All categories</option>
              {MATERIAL_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="active" defaultValue={initialActive} aria-label="Status">
              <option value="1">Active</option>
              <option value="0">Archived</option>
              <option value="all">All</option>
            </AdminSelect>
            <AdminButton type="submit" variant="primary">
              Filter
            </AdminButton>
          </form>
        </AdminFilterToolbar>
      </AdminPanel>

      <AdminPanel title="Materials">
        {errorMessage ? (
          <AdminEmptyState title="Unable to load materials." description={errorMessage} />
        ) : rows.length === 0 ? (
          <>
            <AdminEmptyState
              title="No materials have been added."
              description="Add your regularly quoted membranes, liners, coatings, accessories and waterproofing services to use them directly in quotations."
            />
            {canManage ? (
              <div style={{ marginTop: "1rem" }}>
                <AdminButton type="button" variant="primary" onClick={onAddMaterial}>
                  Add first material
                </AdminButton>
              </div>
            ) : null}
          </>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-materials-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Purchase unit</th>
                  <th>Quote unit</th>
                  {canSeeCost ? <th>Current cost</th> : null}
                  <th>Sell price</th>
                  <th>Price status</th>
                  <th>Updated</th>
                  {canManage ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const meta = (item.metadata as Record<string, unknown> | null) ?? {};
                  return (
                    <tr key={String(item.id)}>
                      <td>
                        <strong>{String(item.name)}</strong>
                        <div className="admin-help-text">{String(item.item_code)}</div>
                      </td>
                      <td>{String(item.category)}</td>
                      <td>{formatUnitLabel(String(meta.purchase_unit ?? item.unit ?? "—"))}</td>
                      <td>{formatUnitLabel(String(item.unit ?? "—"))}</td>
                      {canSeeCost ? (
                        <td>
                          {item.default_cost != null
                            ? formatZar(Number(item.default_cost))
                            : "—"}
                        </td>
                      ) : null}
                      <td>
                        {item.default_sell_price != null
                          ? formatZar(Number(item.default_sell_price))
                          : "—"}
                      </td>
                      <td>
                        <PriceStatusBadge status={priceStatus(item)} />
                      </td>
                      <td>
                        {item.updated_at
                          ? new Date(String(item.updated_at)).toLocaleDateString("en-ZA")
                          : "—"}
                      </td>
                      {canManage && item.is_active ? (
                        <td>
                          <form action={archiveMaterialAction}>
                            <input type="hidden" name="id" value={String(item.id)} />
                            <AdminButton type="submit" variant="ghost" size="sm">
                              Archive
                            </AdminButton>
                          </form>
                        </td>
                      ) : canManage ? (
                        <td />
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      {canSeeCost ? (
        <PriceHistory rows={priceHistory} showCost={canSeeCost} canManage={canManage} />
      ) : null}
    </div>
  );
}
