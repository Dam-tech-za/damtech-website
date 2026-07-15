"use client";

import { formatZar } from "@/lib/estimating/money";
import type { SupplierPriceRecord } from "./SelectedPricingSource";

type Props = {
  supplierPrices: SupplierPriceRecord[];
  selectedId: string | null;
  onSelect: (supplierPrice: SupplierPriceRecord) => void;
};

export function SupplierPriceComparison({ supplierPrices, selectedId, onSelect }: Props) {
  if (supplierPrices.length === 0) {
    return (
      <div className="admin-empty">
        <p>No supplier prices found for this material.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Supplier</th>
            <th>SKU</th>
            <th>Cost</th>
            <th>Validity</th>
            <th>Lead time</th>
            <th>Flags</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {supplierPrices.map((price) => {
            const active = price.id === selectedId;
            return (
              <tr key={price.id}>
                <td>{price.supplier_name ?? "—"}</td>
                <td>{price.supplier_sku ?? "—"}</td>
                <td>{formatZar(Number(price.unit_cost))}</td>
                <td>
                  {price.price_valid_to ?? "—"}
                  {price.expired ? (
                    <span className="admin-status admin-status--spam"> expired</span>
                  ) : null}
                </td>
                <td>{price.lead_time_days ?? "—"} days</td>
                <td>
                  {price.is_preferred ? "Preferred" : "—"}
                  {price.minimum_quantity ? ` · Min ${price.minimum_quantity}` : ""}
                </td>
                <td>
                  <button
                    type="button"
                    className={active ? "btn btn--sm btn--primary" : "btn btn--sm btn--secondary"}
                    onClick={() => onSelect(price)}
                  >
                    {active ? "Selected" : "Select"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
