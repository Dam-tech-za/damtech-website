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
import { AdminButton, AdminInput } from "@/components/admin/ui";

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

  function search(term = query, type = typeFilter) {
    startSearch(async () => {
      setError(null);
      const result = await searchPricingItemsAction(term, type || undefined);
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
    <div className="admin-stack inv-picker">
      <div className="inv-picker__toolbar">
        <div className="inv-picker__search">
          <AdminInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search item code, name or category…"
            aria-label="Search inventory"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
          />
          <AdminButton
            type="button"
            variant="primary"
            onClick={() => search()}
            disabled={searching}
          >
            {searching ? "Searching…" : "Search"}
          </AdminButton>
        </div>
        <div className="inv-picker__chips" role="group" aria-label="Filter by type">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value || "all"}
              type="button"
              className={`inv-picker__chip${
                typeFilter === filter.value ? " is-active" : ""
              }`}
              aria-pressed={typeFilter === filter.value}
              onClick={() => {
                setTypeFilter(filter.value);
                search(query, filter.value);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="admin-flash admin-flash--error">{error}</p> : null}

      <div
        className={`inv-results${showCost ? " inv-results--cost" : ""}`}
        role="table"
        aria-label="Inventory results"
      >
        <div className="inv-results__head" role="row" aria-hidden>
          <span role="columnheader">Item</span>
          <span role="columnheader">Category</span>
          <span role="columnheader">Unit</span>
          <span role="columnheader" className="inv-results__num">
            Sell price
          </span>
          {showCost ? (
            <span role="columnheader" className="inv-results__num">
              Cost
            </span>
          ) : null}
          {showCost ? (
            <span role="columnheader" className="inv-results__num">
              Margin
            </span>
          ) : null}
          <span role="columnheader">Status</span>
          <span role="columnheader" className="inv-results__action">
            Action
          </span>
        </div>
        {items.length === 0 ? (
          <p className="inv-results__empty">
            Search the catalogue to list matching inventory items.
          </p>
        ) : null}
        {items.map((item) => {
          const sell =
            item.defaultSellPrice != null
              ? item.defaultSellPrice
              : effectivePrice?.sellPrice && selected?.id === item.id
                ? effectivePrice.sellPrice
                : null;
          const margin =
            showCost &&
            item.defaultCost != null &&
            sell != null &&
            sell > 0
              ? (((sell - item.defaultCost) / sell) * 100).toFixed(1)
              : null;
          return (
            <div
              key={item.id}
              role="row"
              className={`inv-results__row${
                selected?.id === item.id ? " is-selected" : ""
              }`}
            >
              <span role="cell" className="inv-results__item">
                <strong>{item.name}</strong>
                <span className="inv-results__code">{item.itemCode}</span>
              </span>
              <span role="cell">
                <span className="inv-results__badge">{item.category}</span>
              </span>
              <span role="cell">{formatUnitLabel(item.quoteUnit)}</span>
              <span role="cell" className="inv-results__num">
                {sell != null ? formatZar(sell) : "—"}
              </span>
              {showCost ? (
                <span role="cell" className="inv-results__num">
                  {item.defaultCost != null ? formatZar(item.defaultCost) : "—"}
                </span>
              ) : null}
              {showCost ? (
                <span role="cell" className="inv-results__num">
                  {margin != null ? `${margin}%` : "—"}
                </span>
              ) : null}
              <span role="cell">
                <PriceStatusBadge status={item.priceStatus} />
              </span>
              <span role="cell" className="inv-results__action">
                <AdminButton
                  type="button"
                  size="sm"
                  variant={selected?.id === item.id ? "primary" : "secondary"}
                  onClick={() => pickItem(item)}
                >
                  Select
                </AdminButton>
              </span>
            </div>
          );
        })}
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
