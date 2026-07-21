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
import { QuoteLineEditor } from "./QuoteLineEditor";
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
    onLinesChange(
      lines.filter((_, i) => i !== index).map((l, i) => ({ ...l, sortOrder: i })),
    );
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
          <AdminButton size="sm" variant="primary" onClick={() => appendLine("custom")}>
            + Add line
          </AdminButton>
          <AdminButton
            size="sm"
            variant="secondary"
            onClick={() => setInventoryOpen(true)}
          >
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

      <div className="qlines" role="group" aria-label="Quote line items">
        <div className="qlines__head" aria-hidden>
          <span className="qlines__head-cell qlines__head-cell--item">Item</span>
          <span className="qlines__head-cell qlines__head-cell--desc">Description</span>
          <span className="qlines__head-cell qlines__head-cell--qty">Qty</span>
          <span className="qlines__head-cell qlines__head-cell--unit">Unit</span>
          <span className="qlines__head-cell qlines__head-cell--price">Unit price</span>
          <span className="qlines__head-cell qlines__head-cell--disc">Disc %</span>
          <span className="qlines__head-cell qlines__head-cell--vat">VAT</span>
          <span className="qlines__head-cell qlines__head-cell--amount">Amount</span>
          <span className="qlines__head-cell qlines__head-cell--actions" />
        </div>

        {lines.length === 0 ? (
          <p className="qlines__empty">
            No line items yet. Use “Add line” or “Browse inventory” to begin.
          </p>
        ) : null}

        {lines.map((line, index) => (
          <QuoteLineEditor
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
      </div>

      <div className="qlines__footer">
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
