"use client";

import {
  AdminDropdownMenu,
  AdminInput,
  AdminSelect,
} from "@/components/admin/ui";
import type { AdminDropdownMenuItem } from "@/components/admin/ui";
import { PricingItemCombobox } from "@/components/admin/pricing/PricingItemCombobox";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";
import { QUOTE_UNIT_OPTIONS } from "@/lib/quotes/quote-builder-types";
import type { QuoteLineType } from "@/lib/quotes/types";
import type { PricingItemRecord } from "@/lib/pricing/types";
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
    case "subcontractor":
      return "subcontractor";
    default:
      return "item";
  }
}

function taxCategoryFor(value: string): EditableLine["taxCategory"] {
  if (value === "zero_rated" || value === "zero") return "zero";
  if (value === "exempt" || value === "no_vat") return "exempt";
  return "standard";
}

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

  function applyPickedItem(item: PricingItemRecord) {
    onChange(index, {
      lineType: lineTypeForItemType(item.itemType),
      itemCode: item.itemCode,
      category: item.category,
      description: item.quoteDescription || item.name,
      unit: item.quoteUnit,
      sellUnitPrice: item.defaultSellPrice ?? 0,
      costUnitPrice: showCost ? item.defaultCost ?? null : line.costUnitPrice,
      taxCategory: taxCategoryFor(item.taxCategory),
      sourcePricingItemId: item.id,
      metadata: { ...(line.metadata ?? {}), pricingItemId: item.id },
    });
  }

  if (line.lineType === "heading") {
    return (
      <tr className="quote-item-row quote-item-row--heading">
        <td colSpan={8}>
          <AdminInput
            className="quote-item-heading-input"
            value={line.description}
            onChange={(e) => onChange(index, { description: e.target.value })}
            placeholder="Section heading"
            aria-label="Section heading"
          />
        </td>
        <td className="quote-item-row__actions">
          <AdminDropdownMenu items={menuItems} triggerLabel="Line actions" />
        </td>
      </tr>
    );
  }

  if (line.lineType === "note") {
    return (
      <tr className="quote-item-row quote-item-row--note">
        <td colSpan={8}>
          <AdminInput
            value={line.description}
            onChange={(e) => onChange(index, { description: e.target.value })}
            placeholder="Note (not priced)"
            aria-label="Note"
          />
        </td>
        <td className="quote-item-row__actions">
          <AdminDropdownMenu items={menuItems} triggerLabel="Line actions" />
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="quote-item-row">
        <td className="quote-item-row__item">
          {line.itemCode ? (
            <span className="quote-item-row__code-chip">
              <span>{line.itemCode}</span>
              <button
                type="button"
                className="quote-item-row__code-clear"
                aria-label="Clear item"
                onClick={() =>
                  onChange(index, {
                    itemCode: "",
                    sourcePricingItemId: null,
                  })
                }
              >
                ×
              </button>
            </span>
          ) : (
            <PricingItemCombobox
              showCost={showCost}
              ariaLabel={`Search item for line ${index + 1}`}
              onSelect={applyPickedItem}
              onCustomText={(text) => onChange(index, { description: text })}
            />
          )}
        </td>
        <td className="quote-item-row__description">
          <AdminInput
            value={line.description}
            onChange={(e) => onChange(index, { description: e.target.value })}
            placeholder="Item description"
            aria-label="Description"
          />
        </td>
        <td className="quote-item-row__qty">
          <AdminInput
            type="number"
            step="0.0001"
            value={line.quantity}
            onChange={(e) => onChange(index, { quantity: Number(e.target.value) })}
            aria-label="Quantity"
          />
        </td>
        <td className="quote-item-row__unit">
          <AdminSelect
            value={line.unit}
            onChange={(e) => onChange(index, { unit: e.target.value })}
            aria-label="Unit"
          >
            {QUOTE_UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </AdminSelect>
        </td>
        <td className="quote-item-row__price">
          <AdminInput
            type="number"
            step="0.01"
            value={line.sellUnitPrice}
            onChange={(e) => onChange(index, { sellUnitPrice: Number(e.target.value) })}
            aria-label="Unit price"
          />
        </td>
        <td className="quote-item-row__discount">
          <AdminInput
            type="number"
            step="0.01"
            value={line.discountPercent}
            onChange={(e) =>
              onChange(index, { discountPercent: Number(e.target.value) })
            }
            aria-label="Discount percent"
          />
        </td>
        <td className="quote-item-row__vat">
          <AdminSelect
            value={line.taxCategory}
            onChange={(e) =>
              onChange(index, {
                taxCategory: e.target.value as EditableLine["taxCategory"],
              })
            }
            aria-label="VAT category"
          >
            <option value="standard">Standard</option>
            <option value="exempt">Exempt</option>
            <option value="zero">Zero</option>
          </AdminSelect>
        </td>
        <td className="quote-item-row__total">{formatZar(total)}</td>
        <td className="quote-item-row__actions">
          <AdminDropdownMenu items={menuItems} triggerLabel="Line actions" />
        </td>
      </tr>
      {showCost && line.showCosting ? (
        <tr className="quote-item-row quote-item-row--costing">
          <td colSpan={9}>
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
