"use client";

import { useState } from "react";
import {
  AdminButton,
  AdminCheckbox,
  AdminInfoBanner,
  AdminInput,
  AdminPanel,
  AdminSelect,
} from "@/components/admin/ui";
import { PricingItemCombobox } from "@/components/admin/pricing/PricingItemCombobox";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";
import { QUOTE_UNIT_OPTIONS } from "@/lib/quotes/quote-builder-types";
import type { QuoteLineType } from "@/lib/quotes/types";
import type { PricingItemRecord } from "@/lib/pricing/types";
import { lineTotalExVat } from "@/lib/quotes/totals";
import { formatZar } from "@/lib/estimating/money";
import { QuoteItemRow } from "./QuoteItemRow";
import { InventoryPickerDialog } from "./InventoryPickerDialog";
import {
  TankModelPickerDialog,
  type TankModelRecord,
} from "./TankModelPickerDialog";

type QuoteItemsPanelProps = {
  lines: EditableLine[];
  showCost: boolean;
  hasCalculatorSuggestions: boolean;
  estimatorConfirmedSuggestions: boolean;
  tankModels?: TankModelRecord[];
  onLinesChange: (lines: EditableLine[]) => void;
  onEstimatorConfirmChange: (confirmed: boolean) => void;
};

function emptyLine(sortOrder: number, lineType: QuoteLineType = "custom"): EditableLine {
  return {
    sortOrder,
    lineType,
    itemCode: "",
    category: "",
    description: lineType === "heading" ? "Section heading" : "",
    quantity: lineType === "heading" || lineType === "note" ? 0 : 1,
    unit: "ea",
    costUnitPrice: null,
    sellUnitPrice: 0,
    discountPercent: 0,
    taxCategory: "standard",
    sourceMaterialItemId: null,
    sourceLabourItemId: null,
    sourceSupplierPriceId: null,
    metadata: null,
  };
}

function lineTypeForItemType(itemType: string): QuoteLineType {
  switch (itemType) {
    case "material":
      return "material";
    case "installation_service":
    case "labour":
      return "labour";
    case "travel":
      return "travel";
    case "delivery":
      return "delivery";
    default:
      return "item";
  }
}

function taxCategoryFor(value: string): EditableLine["taxCategory"] {
  if (value === "zero_rated" || value === "zero") return "zero";
  if (value === "exempt" || value === "no_vat") return "exempt";
  return "standard";
}

export function QuoteItemsPanel({
  lines,
  showCost,
  hasCalculatorSuggestions,
  estimatorConfirmedSuggestions,
  tankModels = [],
  onLinesChange,
  onEstimatorConfirmChange,
}: QuoteItemsPanelProps) {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [tankOpen, setTankOpen] = useState(false);

  function updateLine(index: number, patch: Partial<EditableLine>) {
    onLinesChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function appendLine(lineType: QuoteLineType) {
    onLinesChange([...lines, emptyLine(lines.length, lineType)]);
  }

  function duplicateLine(index: number) {
    const source = lines[index];
    const updated = [
      ...lines.slice(0, index + 1),
      { ...source, id: undefined, sortOrder: index + 1 },
      ...lines.slice(index + 1),
    ].map((l, i) => ({ ...l, sortOrder: i }));
    onLinesChange(updated);
  }

  function moveLine(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= lines.length) return;
    const next = [...lines];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    onLinesChange(next.map((l, i) => ({ ...l, sortOrder: i })));
  }

  function deleteLine(index: number) {
    onLinesChange(lines.filter((_, i) => i !== index).map((l, i) => ({ ...l, sortOrder: i })));
  }

  function addFromInventory(line: EditableLine) {
    onLinesChange([...lines, { ...line, sortOrder: lines.length }]);
  }

  function applyPickedItemToMobile(index: number, item: PricingItemRecord) {
    updateLine(index, {
      lineType: lineTypeForItemType(item.itemType),
      itemCode: item.itemCode,
      category: item.category,
      description: item.quoteDescription || item.name,
      unit: item.quoteUnit,
      sellUnitPrice: item.defaultSellPrice ?? 0,
      costUnitPrice: showCost ? item.defaultCost ?? null : lines[index].costUnitPrice,
      taxCategory: taxCategoryFor(item.taxCategory),
      sourcePricingItemId: item.id,
      metadata: { ...(lines[index].metadata ?? {}), pricingItemId: item.id },
    });
  }

  return (
    <AdminPanel
      id="quote-section-items"
      title="Quote Items"
      actions={
        <>
          <AdminButton size="sm" variant="primary" onClick={() => appendLine("custom")}>
            + Add line
          </AdminButton>
          <AdminButton size="sm" variant="secondary" onClick={() => setInventoryOpen(true)}>
            Browse inventory
          </AdminButton>
          {tankModels.length > 0 ? (
            <AdminButton size="sm" variant="secondary" onClick={() => setTankOpen(true)}>
              Add Tank Model
            </AdminButton>
          ) : null}
          <AdminButton size="sm" variant="ghost" onClick={() => appendLine("heading")}>
            Add heading
          </AdminButton>
          <AdminButton size="sm" variant="ghost" onClick={() => appendLine("note")}>
            Add note
          </AdminButton>
        </>
      }
    >
      {hasCalculatorSuggestions && !estimatorConfirmedSuggestions ? (
        <AdminInfoBanner tone="warning">
          <p>
            Suggested quantities originate from customer, project or calculator
            information and require estimator confirmation.
          </p>
          <AdminCheckbox
            label="Estimator confirms quote quantities"
            checked={estimatorConfirmedSuggestions}
            onChange={(e) => onEstimatorConfirmChange(e.target.checked)}
            style={{ marginTop: "0.5rem" }}
          />
        </AdminInfoBanner>
      ) : null}

      {/* Desktop table */}
      <div className="admin-table-wrap quote-items-desktop">
        <table className="admin-table quote-items-table">
          <thead>
            <tr>
              <th style={{ width: "16%" }}>Item</th>
              <th style={{ width: "26%" }}>Description</th>
              <th style={{ width: "9%" }}>Qty</th>
              <th style={{ width: "9%" }}>Unit</th>
              <th style={{ width: "11%" }}>Unit price</th>
              <th style={{ width: "8%" }}>Disc %</th>
              <th style={{ width: "8%" }}>VAT</th>
              <th style={{ width: "9%" }}>Amount</th>
              <th style={{ width: "4%" }}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <QuoteItemRow
                key={`${line.id ?? "new"}-${index}`}
                line={line}
                index={index}
                showCost={showCost}
                onChange={updateLine}
                onDuplicate={duplicateLine}
                onMoveUp={(i) => moveLine(i, -1)}
                onMoveDown={(i) => moveLine(i, 1)}
                onDelete={deleteLine}
                isFirst={index === 0}
                isLast={index === lines.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile editable cards */}
      <div className="quote-items-mobile">
        {lines.map((line, index) => {
          if (line.lineType === "heading") {
            return (
              <div key={`${line.id ?? "new"}-${index}`} className="quote-item-card quote-item-card--heading">
                <AdminInput
                  value={line.description}
                  onChange={(e) => updateLine(index, { description: e.target.value })}
                  placeholder="Section heading"
                  aria-label="Section heading"
                />
                <AdminButton size="sm" variant="ghost" onClick={() => deleteLine(index)}>
                  Remove
                </AdminButton>
              </div>
            );
          }
          if (line.lineType === "note") {
            return (
              <div key={`${line.id ?? "new"}-${index}`} className="quote-item-card">
                <AdminInput
                  value={line.description}
                  onChange={(e) => updateLine(index, { description: e.target.value })}
                  placeholder="Note"
                  aria-label="Note"
                />
                <AdminButton size="sm" variant="ghost" onClick={() => deleteLine(index)}>
                  Remove
                </AdminButton>
              </div>
            );
          }
          return (
            <div key={`${line.id ?? "new"}-${index}`} className="quote-item-card">
              {line.itemCode ? (
                <div className="quote-item-card__chip">
                  <span>{line.itemCode}</span>
                  <button
                    type="button"
                    aria-label="Clear item"
                    onClick={() =>
                      updateLine(index, { itemCode: "", sourcePricingItemId: null })
                    }
                  >
                    ×
                  </button>
                </div>
              ) : (
                <PricingItemCombobox
                  showCost={showCost}
                  ariaLabel={`Search item for line ${index + 1}`}
                  onSelect={(item) => applyPickedItemToMobile(index, item)}
                  onCustomText={(text) => updateLine(index, { description: text })}
                />
              )}
              <AdminInput
                value={line.description}
                onChange={(e) => updateLine(index, { description: e.target.value })}
                placeholder="Description"
                aria-label="Description"
              />
              <div className="quote-item-card__row">
                <AdminInput
                  type="number"
                  step="0.0001"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                  aria-label="Quantity"
                />
                <AdminSelect
                  value={line.unit}
                  onChange={(e) => updateLine(index, { unit: e.target.value })}
                  aria-label="Unit"
                >
                  {QUOTE_UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </AdminSelect>
                <AdminInput
                  type="number"
                  step="0.01"
                  value={line.sellUnitPrice}
                  onChange={(e) =>
                    updateLine(index, { sellUnitPrice: Number(e.target.value) })
                  }
                  aria-label="Unit price"
                />
              </div>
              <div className="quote-item-card__foot">
                <span>{formatZar(lineTotalExVat(line))}</span>
                <AdminButton size="sm" variant="ghost" onClick={() => deleteLine(index)}>
                  Remove
                </AdminButton>
              </div>
            </div>
          );
        })}
        <AdminButton size="sm" variant="secondary" onClick={() => appendLine("custom")}>
          + Add line
        </AdminButton>
      </div>

      <InventoryPickerDialog
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        onAddLine={addFromInventory}
        showCost={showCost}
      />
      {tankModels.length > 0 ? (
        <TankModelPickerDialog
          open={tankOpen}
          onClose={() => setTankOpen(false)}
          models={tankModels}
          showCost={showCost}
          onAddLines={(newLines) => {
            onLinesChange([
              ...lines,
              ...newLines.map((line, i) => ({
                ...line,
                sortOrder: lines.length + i,
              })),
            ]);
          }}
        />
      ) : null}
    </AdminPanel>
  );
}
