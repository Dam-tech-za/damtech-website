"use client";

import { useMemo, useState, useTransition } from "react";
import { searchMaterialItemsAction, getSupplierPricesForMaterialAction } from "@/app/admin/pricing/actions";
import { formatZar } from "@/lib/estimating/money";
import type { EditableLine } from "@/components/admin/QuoteBuilder";
import {
  SelectedPricingSource,
  type MaterialSearchItem,
  type SupplierPriceRecord,
} from "./SelectedPricingSource";
import { SupplierPriceComparison } from "./SupplierPriceComparison";
import { AdminButton, AdminInput } from "@/components/admin/ui";

type Props = {
  showCost: boolean;
  onAddLine: (line: EditableLine) => void;
  onCancel: () => void;
};

function toNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function MaterialPicker({ showCost, onAddLine, onCancel }: Props) {
  const [query, setQuery] = useState("");
  const [materials, setMaterials] = useState<MaterialSearchItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialSearchItem | null>(null);
  const [supplierPrices, setSupplierPrices] = useState<SupplierPriceRecord[]>([]);
  const [selectedSupplierPriceId, setSelectedSupplierPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearchTransition] = useTransition();
  const [loadingSupplierPrices, startSupplierPriceTransition] = useTransition();

  const selectedSupplierPrice = useMemo(
    () => supplierPrices.find((price) => price.id === selectedSupplierPriceId) ?? null,
    [selectedSupplierPriceId, supplierPrices],
  );

  function search(term = query) {
    startSearchTransition(async () => {
      setError(null);
      const result = await searchMaterialItemsAction(term);
      if (!result.ok) {
        setMaterials([]);
        setError(result.error);
        return;
      }
      setMaterials(result.materials as MaterialSearchItem[]);
    });
  }

  function pickMaterial(material: MaterialSearchItem) {
    setSelectedMaterial(material);
    setSelectedSupplierPriceId(null);
    setSupplierPrices([]);

    if (!showCost) {
      return;
    }

    startSupplierPriceTransition(async () => {
      const result = await getSupplierPricesForMaterialAction(material.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSupplierPrices(result.supplierPrices as SupplierPriceRecord[]);
    });
  }

  function addToQuote() {
    if (!selectedMaterial) return;
    if (supplierPrices.length > 0 && !selectedSupplierPrice) {
      setError("Select a supplier price before adding this material.");
      return;
    }

    const costUnitPrice = showCost
      ? selectedSupplierPrice
        ? toNumber(selectedSupplierPrice.unit_cost)
        : selectedMaterial.default_cost
      : null;

    const sellUnitPrice = toNumber(
      selectedMaterial.default_sell_price ??
        selectedSupplierPrice?.unit_cost ??
        selectedMaterial.default_cost,
    );

    onAddLine({
      id: undefined,
      sortOrder: 0,
      lineType: "material",
      itemCode: selectedMaterial.item_code,
      category: selectedMaterial.category,
      description: selectedMaterial.description || selectedMaterial.name,
      quantity: 1,
      unit: selectedMaterial.unit,
      costUnitPrice,
      sellUnitPrice,
      discountPercent: 0,
      taxCategory: "standard",
      sourceMaterialItemId: selectedMaterial.id,
      sourceLabourItemId: null,
      sourceSupplierPriceId: selectedSupplierPrice?.id ?? null,
      metadata: {
        pricingSource: {
          pricingCapturedAt: new Date().toISOString(),
          sourceType: "material",
          material: {
            id: selectedMaterial.id,
            itemCode: selectedMaterial.item_code,
            name: selectedMaterial.name,
            description: selectedMaterial.description,
            unit: selectedMaterial.unit,
            category: selectedMaterial.category,
            costUnitPrice,
            sellUnitPrice,
            supplierPriceId: selectedSupplierPrice?.id ?? null,
            supplierName: selectedSupplierPrice?.supplier_name ?? null,
            supplierSku: selectedSupplierPrice?.supplier_sku ?? null,
            supplierValidTo: selectedSupplierPrice?.price_valid_to ?? null,
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
          placeholder="Search materials by code, name, category…"
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
              {showCost ? <th>Cost</th> : null}
              <th>Sell</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr key={material.id}>
                <td>{material.item_code}</td>
                <td>{material.name}</td>
                <td>{material.category}</td>
                <td>{material.unit}</td>
                {showCost ? <td>{material.default_cost != null ? formatZar(Number(material.default_cost)) : "—"}</td> : null}
                <td>
                  {material.default_sell_price != null
                    ? formatZar(Number(material.default_sell_price))
                    : "—"}
                </td>
                <td>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant={selectedMaterial?.id === material.id ? "primary" : "secondary"}
                    onClick={() => pickMaterial(material)}
                  >
                    Pick
                  </AdminButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMaterial ? (
        <section className="admin-panel">
          <header className="admin-panel__header">
            <h3>Selected material</h3>
          </header>
          <SelectedPricingSource
            metadata={{
              pricingSource: {
                pricingCapturedAt: new Date().toISOString(),
                sourceType: "material",
                material: {
                  id: selectedMaterial.id,
                  itemCode: selectedMaterial.item_code,
                  name: selectedMaterial.name,
                  description: selectedMaterial.description,
                  unit: selectedMaterial.unit,
                  category: selectedMaterial.category,
                  costUnitPrice: showCost ? selectedMaterial.default_cost : null,
                  sellUnitPrice: toNumber(selectedMaterial.default_sell_price ?? selectedMaterial.default_cost),
                  supplierPriceId: selectedSupplierPrice?.id ?? null,
                  supplierName: selectedSupplierPrice?.supplier_name ?? null,
                  supplierSku: selectedSupplierPrice?.supplier_sku ?? null,
                  supplierValidTo: selectedSupplierPrice?.price_valid_to ?? null,
                },
              },
            }}
          />
          <div style={{ marginTop: "1rem" }}>
            <h4>Supplier prices</h4>
            {loadingSupplierPrices ? <p className="admin-empty__hint">Loading supplier prices…</p> : null}
            <SupplierPriceComparison
              supplierPrices={supplierPrices}
              selectedId={selectedSupplierPriceId}
              onSelect={(price) => {
                if (price.expired) {
                  setError(`Warning: ${price.supplier_name ?? "Supplier"} price is expired.`);
                } else {
                  setError(null);
                }
                setSelectedSupplierPriceId(price.id);
              }}
            />
          </div>
          <div className="admin-panel__actions" style={{ marginTop: "1rem" }}>
            <AdminButton type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </AdminButton>
            <AdminButton
              type="button"
              variant="primary"
              onClick={addToQuote}
              disabled={supplierPrices.length > 0 && !selectedSupplierPrice}
            >
              Add to quote
            </AdminButton>
          </div>
        </section>
      ) : (
        <div className="admin-empty">
          <p>Select a material to review supplier prices and snapshot it into the quote.</p>
        </div>
      )}
    </div>
  );
}
