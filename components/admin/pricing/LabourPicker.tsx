"use client";

import { useMemo, useState, useTransition } from "react";
import { searchLabourItemsAction } from "@/app/admin/pricing/actions";
import { formatZar } from "@/lib/estimating/money";
import type { EditableLine } from "@/components/admin/QuoteBuilder";
import {
  SelectedPricingSource,
  type LabourSearchItem,
} from "./SelectedPricingSource";
import { AdminButton, AdminInput } from "@/components/admin/ui";

type Props = {
  showCost: boolean;
  onAddLine: (line: EditableLine) => void;
  onCancel: () => void;
};

function toNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function LabourPicker({ showCost, onAddLine, onCancel }: Props) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LabourSearchItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LabourSearchItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [hoursOverride, setHoursOverride] = useState("");
  const [hoursOverrideReason, setHoursOverrideReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearchTransition] = useTransition();

  const estimatedHours = useMemo(() => {
    if (!selectedItem?.productivity_rate || selectedItem.productivity_rate <= 0) return null;
    const qty = toNumber(quantity);
    return qty / selectedItem.productivity_rate;
  }, [quantity, selectedItem]);

  const resolvedHours = hoursOverride.trim() ? toNumber(hoursOverride) : estimatedHours;

  function search(term = query) {
    startSearchTransition(async () => {
      setError(null);
      const result = await searchLabourItemsAction(term);
      if (!result.ok) {
        setItems([]);
        setError(result.error);
        return;
      }
      setItems(result.labour as LabourSearchItem[]);
    });
  }

  function pickItem(item: LabourSearchItem) {
    setSelectedItem(item);
    setError(null);
  }

  function addToQuote() {
    if (!selectedItem) return;

    const qty = toNumber(quantity);
    const costUnitPrice = showCost
      ? selectedItem.hourly_cost ?? selectedItem.unit_cost
      : null;
    const sellUnitPrice = selectedItem.unit_cost ?? selectedItem.hourly_cost ?? 0;

    onAddLine({
      id: undefined,
      sortOrder: 0,
      lineType: "labour",
      itemCode: selectedItem.item_code,
      category: selectedItem.category,
      description: selectedItem.name,
      quantity: qty,
      unit: selectedItem.unit,
      costUnitPrice,
      sellUnitPrice,
      discountPercent: 0,
      taxCategory: "standard",
      sourceMaterialItemId: null,
      sourceLabourItemId: selectedItem.id,
      sourceSupplierPriceId: null,
      metadata: {
        pricingSource: {
          pricingCapturedAt: new Date().toISOString(),
          sourceType: "labour",
          labour: {
            id: selectedItem.id,
            itemCode: selectedItem.item_code,
            name: selectedItem.name,
            unit: selectedItem.unit,
            category: selectedItem.category,
            costUnitPrice,
            sellUnitPrice,
            productivityRate: selectedItem.productivity_rate,
            productivityUnit: selectedItem.productivity_unit,
            estimatedHours,
            hoursOverride: hoursOverride.trim() ? toNumber(hoursOverride) : null,
            hoursOverrideReason: hoursOverrideReason.trim() || null,
          },
        },
      },
    });
    onCancel();
  }

  return (
    <div className="admin-stack">
      <div className="admin-inline-form">
        <AdminInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search labour by code, category, name…"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              search();
            }
          }}
        />
        <AdminButton type="button" variant="primary" onClick={() => search()} disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </AdminButton>
      </div>

      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Productivity</th>
              {showCost ? <th>Cost</th> : null}
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.item_code}</td>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.unit}</td>
                <td>
                  {item.productivity_rate ?? "—"}
                  {item.productivity_unit ? ` ${item.productivity_unit}` : ""}
                </td>
                {showCost ? (
                  <td>
                    {item.hourly_cost != null
                      ? formatZar(Number(item.hourly_cost))
                      : item.unit_cost != null
                        ? formatZar(Number(item.unit_cost))
                        : "—"}
                  </td>
                ) : null}
                <td>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant={selectedItem?.id === item.id ? "primary" : "secondary"}
                    onClick={() => pickItem(item)}
                  >
                    Pick
                  </AdminButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedItem ? (
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h3>Selected labour</h3>
          </header>
          <SelectedPricingSource
            metadata={{
              pricingSource: {
                pricingCapturedAt: new Date().toISOString(),
                sourceType: "labour",
                labour: {
                  id: selectedItem.id,
                  itemCode: selectedItem.item_code,
                  name: selectedItem.name,
                  unit: selectedItem.unit,
                  category: selectedItem.category,
                  costUnitPrice: showCost ? selectedItem.hourly_cost ?? selectedItem.unit_cost : null,
                  sellUnitPrice: selectedItem.unit_cost ?? selectedItem.hourly_cost ?? 0,
                  productivityRate: selectedItem.productivity_rate,
                  productivityUnit: selectedItem.productivity_unit,
                  estimatedHours,
                  hoursOverride: hoursOverride.trim() ? toNumber(hoursOverride) : null,
                  hoursOverrideReason: hoursOverrideReason.trim() || null,
                },
              },
            }}
          />
          <div className="admin-form-grid" style={{ marginTop: "1rem" }}>
            <label className="admin-field">
              <span>Quantity</span>
              <AdminInput
                type="number"
                step="0.0001"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>
            <label className="admin-field">
              <span>Estimated hours</span>
              <AdminInput value={estimatedHours == null ? "—" : estimatedHours.toFixed(2)} readOnly />
            </label>
            <label className="admin-field">
              <span>Override hours</span>
              <AdminInput
                type="number"
                step="0.01"
                value={hoursOverride}
                onChange={(event) => setHoursOverride(event.target.value)}
                placeholder="Optional"
              />
            </label>
            <label className="admin-field admin-field--full">
              <span>Override reason</span>
              <AdminInput
                value={hoursOverrideReason}
                onChange={(event) => setHoursOverrideReason(event.target.value)}
                placeholder="Explain why the productivity rate is overridden"
              />
            </label>
          </div>
          {resolvedHours != null ? (
            <p className="admin-empty__hint">
              Productivity estimate: {resolvedHours.toFixed(2)} hour{resolvedHours === 1 ? "" : "s"}
            </p>
          ) : null}
          <div className="admin-panel__actions" style={{ marginTop: "1rem" }}>
            <AdminButton type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </AdminButton>
            <AdminButton type="button" variant="primary" onClick={addToQuote}>
              Add to quote
            </AdminButton>
          </div>
        </section>
      ) : (
        <div className="admin-empty">
          <p>Select a labour item to snapshot it into the quote.</p>
        </div>
      )}
    </div>
  );
}
