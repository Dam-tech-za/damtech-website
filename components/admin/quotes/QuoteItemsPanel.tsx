"use client";

import { useState } from "react";
import {
  AdminButton,
  AdminCheckbox,
  AdminInfoBanner,
  AdminPanel,
} from "@/components/admin/ui";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";
import type { QuoteLineType } from "@/lib/quotes/types";
import { QuoteItemRow } from "./QuoteItemRow";
import { InventoryPickerDialog } from "./InventoryPickerDialog";

type QuoteItemsPanelProps = {
  lines: EditableLine[];
  showCost: boolean;
  hasCalculatorSuggestions: boolean;
  estimatorConfirmedSuggestions: boolean;
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

export function QuoteItemsPanel({
  lines,
  showCost,
  hasCalculatorSuggestions,
  estimatorConfirmedSuggestions,
  onLinesChange,
  onEstimatorConfirmChange,
}: QuoteItemsPanelProps) {
  const [inventoryOpen, setInventoryOpen] = useState(false);

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

  return (
    <AdminPanel
      id="quote-section-items"
      title="Quote Items"
      actions={
        <>
          <AdminButton size="sm" variant="secondary" onClick={() => setInventoryOpen(true)}>
            Add from Inventory
          </AdminButton>
          <AdminButton size="sm" variant="secondary" onClick={() => appendLine("custom")}>
            Add Custom Item
          </AdminButton>
          <AdminButton size="sm" variant="secondary" onClick={() => appendLine("heading")}>
            Add Section Heading
          </AdminButton>
          <AdminButton size="sm" variant="secondary" onClick={() => appendLine("note")}>
            Add Note
          </AdminButton>
        </>
      }
    >
      {hasCalculatorSuggestions && !estimatorConfirmedSuggestions ? (
        <AdminInfoBanner tone="warning">
          <p>
            Suggested quantities originate from customer or calculator information and require
            estimator confirmation.
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
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "36%" }}>Description</th>
              <th style={{ width: "10%" }}>Qty</th>
              <th style={{ width: "10%" }}>Unit</th>
              <th style={{ width: "14%" }}>Unit price</th>
              <th style={{ width: "10%" }}>VAT</th>
              <th style={{ width: "14%" }}>Total</th>
              <th style={{ width: "6%" }} />
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

      {/* Mobile cards */}
      <div className="quote-items-mobile">
        {lines.map((line, index) => (
          <div key={`${line.id ?? "new"}-${index}`} className="quote-item-card">
            <p className="quote-item-card__description">
              {line.description || <em>No description</em>}
            </p>
            <p className="quote-item-card__meta">
              {line.quantity} × {line.unit} @ {line.sellUnitPrice}
            </p>
            <p className="quote-item-card__meta">
              VAT: {line.taxCategory}
            </p>
          </div>
        ))}
      </div>

      <InventoryPickerDialog
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        onAddLine={addFromInventory}
        showCost={showCost}
      />
    </AdminPanel>
  );
}
