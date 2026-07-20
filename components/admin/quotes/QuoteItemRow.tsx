"use client";

import {
  AdminDropdownMenu,
  AdminInput,
  AdminSelect,
} from "@/components/admin/ui";
import type { AdminDropdownMenuItem } from "@/components/admin/ui";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";
import { QUOTE_UNIT_OPTIONS } from "@/lib/quotes/quote-builder-types";
import { formatZar } from "@/lib/estimating/money";
import { lineTotalExVat, lineMarkupPercent, lineMarginPercent } from "@/lib/quotes/totals";

type QuoteItemRowProps = {
  line: EditableLine;
  index: number;
  showCost: boolean;
  onChange: (index: number, patch: Partial<EditableLine>) => void;
  onDuplicate: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
};

export function QuoteItemRow({
  line,
  index,
  showCost,
  onChange,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete,
  isFirst,
  isLast,
}: QuoteItemRowProps) {
  const total = lineTotalExVat(line);

  const menuItems: AdminDropdownMenuItem[] = [
    { id: "duplicate", label: "Duplicate", onSelect: () => onDuplicate(index) },
    { id: "move-up", label: "Move up", onSelect: () => onMoveUp(index), hidden: isFirst },
    { id: "move-down", label: "Move down", onSelect: () => onMoveDown(index), hidden: isLast },
    { id: "sep", label: "", separator: true },
    { id: "delete", label: "Delete", tone: "danger", onSelect: () => onDelete(index) },
  ];

  return (
    <>
      <tr className="quote-item-row">
        {/* Description 36% */}
        <td className="quote-item-row__description">
          <AdminInput
            value={line.description}
            onChange={(e) => onChange(index, { description: e.target.value })}
            placeholder="Item description"
          />
        </td>
        {/* Qty 10% */}
        <td className="quote-item-row__qty">
          <AdminInput
            type="number"
            step="0.0001"
            value={line.quantity}
            onChange={(e) => onChange(index, { quantity: Number(e.target.value) })}
          />
        </td>
        {/* Unit 10% */}
        <td className="quote-item-row__unit">
          <AdminSelect
            value={line.unit}
            onChange={(e) => onChange(index, { unit: e.target.value })}
          >
            {QUOTE_UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </AdminSelect>
        </td>
        {/* Unit price 14% */}
        <td className="quote-item-row__price">
          <AdminInput
            type="number"
            step="0.01"
            value={line.sellUnitPrice}
            onChange={(e) => onChange(index, { sellUnitPrice: Number(e.target.value) })}
          />
        </td>
        {/* VAT 10% */}
        <td className="quote-item-row__vat">
          <AdminSelect
            value={line.taxCategory}
            onChange={(e) => onChange(index, { taxCategory: e.target.value as EditableLine["taxCategory"] })}
          >
            <option value="standard">Standard</option>
            <option value="exempt">Exempt</option>
            <option value="zero">Zero</option>
          </AdminSelect>
        </td>
        {/* Total 14% */}
        <td className="quote-item-row__total">{formatZar(total)}</td>
        {/* Actions 6% */}
        <td className="quote-item-row__actions">
          <AdminDropdownMenu items={menuItems} triggerLabel="Line actions" />
        </td>
      </tr>
      {showCost && line.showCosting ? (
        <tr className="quote-item-row quote-item-row--costing">
          <td colSpan={7}>
            <div className="quote-item-row__costing-grid admin-form-grid">
              <span className="admin-label">Cost</span>
              <AdminInput
                type="number"
                step="0.01"
                value={line.costUnitPrice ?? ""}
                onChange={(e) =>
                  onChange(index, {
                    costUnitPrice: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <span className="admin-label">Markup</span>
              <span>{lineMarkupPercent(line).toFixed(1)}%</span>
              <span className="admin-label">Margin</span>
              <span>{lineMarginPercent(line).toFixed(1)}%</span>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
