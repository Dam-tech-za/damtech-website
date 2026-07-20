"use client";

import { useMemo, useState, useTransition } from "react";
import {
  getSupplierPricesForMaterialAction,
  searchPricingItemsAction,
} from "@/app/admin/pricing/actions";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";
import type { PricingItemRecord } from "@/lib/pricing/types";
import { selectEffectivePrice } from "@/lib/pricing/select-effective-price";
import { buildQuoteLinePriceSnapshot } from "@/lib/pricing/snapshot-price";
import { formatUnitLabel } from "@/lib/pricing/units";
import { formatZar } from "@/lib/estimating/money";
import { PriceStatusBadge } from "./PriceStatusBadge";
import { QuantityCalculatorDialog } from "./QuantityCalculatorDialog";
import { SupplierPriceComparison } from "./SupplierPriceComparison";
import type { SupplierPriceRecord } from "./SelectedPricingSource";
import {
  AdminButton,
  AdminInput,
  AdminSelect,
} from "@/components/admin/ui";

const TYPE_FILTERS = [
  { value: "", label: "All types" },
  { value: "material", label: "Materials" },
  { value: "installation_service", label: "Installation" },
  { value: "labour", label: "Labour" },
  { value: "travel", label: "Travel" },
  { value: "delivery", label: "Delivery" },
  { value: "equipment", label: "Equipment" },
  { value: "site_establishment", label: "Site costs" },
  { value: "tank_model", label: "Tank systems" },
  { value: "fixed_price", label: "Fixed price" },
] as const;

type PricingItemPickerProps = {
  showCost: boolean;
  onAddLine: (line: EditableLine) => void;
  onCancel: () => void;
};

function lineTypeForItem(item: PricingItemRecord): EditableLine["lineType"] {
  switch (item.itemType) {
    case "material":
      return "material";
    case "labour":
    case "installation_service":
      return "labour";
    case "travel":
      return "travel";
    case "delivery":
      return "delivery";
    case "subcontractor":
      return "subcontractor";
    default:
      return "custom";
  }
}

function taxCategoryForItem(item: PricingItemRecord): EditableLine["taxCategory"] {
  if (item.taxCategory === "zero_rated") return "zero";
  if (item.taxCategory === "exempt" || item.taxCategory === "no_vat") return "exempt";
  return "standard";
}

export function PricingItemPicker({ showCost, onAddLine, onCancel }: PricingItemPickerProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [items, setItems] = useState<PricingItemRecord[]>([]);
  const [selected, setSelected] = useState<PricingItemRecord | null>(null);
  const [supplierPrices, setSupplierPrices] = useState<SupplierPriceRecord[]>([]);
  const [selectedSupplierPriceId, setSelectedSupplierPriceId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [calcOpen, setCalcOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [loadingPrices, startLoadPrices] = useTransition();

  const selectedSupplierPrice = useMemo(
    () => supplierPrices.find((p) => p.id === selectedSupplierPriceId) ?? null,
    [selectedSupplierPriceId, supplierPrices],
  );

  const effectivePrice = useMemo(() => {
    if (!selected) return null;
    return selectEffectivePrice(selected, {
      supplierPrice: selectedSupplierPrice
        ? {
            id: selectedSupplierPrice.id,
            supplierName: selectedSupplierPrice.supplier_name,
            unitCost: Number(selectedSupplierPrice.unit_cost),
            validTo: selectedSupplierPrice.price_valid_to,
            isPreferred: Boolean(selectedSupplierPrice.is_preferred),
            expired: Boolean(selectedSupplierPrice.expired),
          }
        : null,
    });
  }, [selected, selectedSupplierPrice]);

  function search(term = query) {
    startSearch(async () => {
      setError(null);
      const result = await searchPricingItemsAction(term, typeFilter || undefined);
      if (!result.ok) {
        setItems([]);
        setError(String("error" in result ? result.error : "Unable to search inventory."));
        return;
      }
      setItems(result.items);
    });
  }

  function pickItem(item: PricingItemRecord) {
    setSelected(item);
    setSelectedSupplierPriceId(null);
    setSupplierPrices([]);
    setQuantity(item.pricingMethod === "fixed_price" ? 1 : 1);

    if (!showCost || !item.legacyMaterialItemId) return;

    startLoadPrices(async () => {
      const result = await getSupplierPricesForMaterialAction(item.legacyMaterialItemId!);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSupplierPrices(result.supplierPrices as SupplierPriceRecord[]);
    });
  }

  function addToQuote(quantityCalculation?: Record<string, unknown> | null) {
    if (!selected || !effectivePrice) return;
    if (supplierPrices.length > 0 && !selectedSupplierPrice) {
      setError("Select a supplier price before adding this item.");
      return;
    }
    if (effectivePrice.sellPrice == null || effectivePrice.sellPrice <= 0) {
      setError("This item has no approved sell price. Update pricing before quoting.");
      return;
    }

    const costUnitPrice = showCost ? effectivePrice.costPrice : null;
    const snapshot = buildQuoteLinePriceSnapshot({
      item: selected,
      effectivePrice,
      sellUnitPrice: effectivePrice.sellPrice,
      costUnitPrice,
      quantityCalculation,
    });

    onAddLine({
      sortOrder: 0,
      lineType: lineTypeForItem(selected),
      itemCode: selected.itemCode,
      category: selected.category,
      description: selected.quoteDescription ?? selected.name,
      quantity,
      unit: selected.quoteUnit,
      costUnitPrice,
      sellUnitPrice: effectivePrice.sellPrice,
      discountPercent: 0,
      taxCategory: taxCategoryForItem(selected),
      sourceMaterialItemId: selected.legacyMaterialItemId,
      sourceLabourItemId: selected.legacyLabourItemId,
      sourceSupplierPriceId: effectivePrice.supplierPriceId,
      sourcePricingItemId: selected.id,
      metadata: { pricingSource: snapshot },
    });
    onCancel();
  }

  const canCalculate =
    selected &&
    (selected.pricingMethod === "calculated_consumption" ||
      selected.itemType === "material" ||
      selected.itemType === "installation_service" ||
      selected.itemType === "travel");

  return (
    <div className="admin-stack">
      <div className="admin-filter-toolbar__form">
        <AdminInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search code, name, category…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
        />
        <AdminSelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Item type"
        >
          {TYPE_FILTERS.map((filter) => (
            <option key={filter.value || "all"} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </AdminSelect>
        <AdminButton type="button" variant="primary" onClick={() => search()} disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </AdminButton>
      </div>

      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}

      <div className="admin-table-wrap admin-pricing-item-table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Sell price</th>
              {showCost ? <th>Cost</th> : null}
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <div className="admin-help-text">{item.itemCode}</div>
                </td>
                <td>{item.category}</td>
                <td>{formatUnitLabel(item.quoteUnit)}</td>
                <td>
                  {item.defaultSellPrice != null
                    ? formatZar(item.defaultSellPrice)
                    : effectivePrice?.sellPrice && selected?.id === item.id
                      ? formatZar(effectivePrice.sellPrice!)
                      : "—"}
                </td>
                {showCost ? (
                  <td>
                    {item.defaultCost != null ? formatZar(item.defaultCost) : "—"}
                  </td>
                ) : null}
                <td>
                  <PriceStatusBadge status={item.priceStatus} />
                </td>
                <td>
                  <AdminButton
                    type="button"
                    size="sm"
                    variant={selected?.id === item.id ? "primary" : "secondary"}
                    onClick={() => pickItem(item)}
                  >
                    Select
                  </AdminButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <section className="admin-panel admin-pricing-item-detail">
          <h3>{selected.name}</h3>
          <p className="admin-help-text">
            {selected.itemCode} · {selected.category} · Quote unit:{" "}
            {formatUnitLabel(selected.quoteUnit)}
            {selected.purchaseUnit
              ? ` · Purchase: ${formatUnitLabel(selected.purchaseUnit)}`
              : ""}
          </p>

          {showCost && supplierPrices.length > 0 ? (
            <div style={{ marginTop: "1rem" }}>
              <h4>Supplier prices</h4>
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
          ) : null}

          <div className="admin-form-grid" style={{ marginTop: "1rem" }}>
            <label className="admin-field">
              <span className="admin-label">Quantity</span>
              <AdminInput
                type="number"
                step="0.01"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="admin-panel__actions" style={{ marginTop: "1rem" }}>
            <AdminButton type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </AdminButton>
            {canCalculate ? (
              <AdminButton type="button" variant="secondary" onClick={() => setCalcOpen(true)}>
                Calculate quantity
              </AdminButton>
            ) : null}
            <AdminButton type="button" variant="primary" onClick={() => addToQuote()}>
              Add to quote
            </AdminButton>
          </div>
        </section>
      ) : (
        <p className="admin-help-text">
          Search and select an inventory item to review pricing and add it to the quotation.
        </p>
      )}

      {selected && calcOpen ? (
        <QuantityCalculatorDialog
          open={calcOpen}
          onClose={() => setCalcOpen(false)}
          item={selected}
          onApply={(qty, calculation) => {
            setQuantity(qty);
            setCalcOpen(false);
            addToQuote(calculation);
          }}
        />
      ) : null}
    </div>
  );
}
