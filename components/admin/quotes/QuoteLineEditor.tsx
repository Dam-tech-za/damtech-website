"use client";

import {
  AdminDropdownMenu,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/ui";
import type { AdminDropdownMenuItem } from "@/components/admin/ui";
import { PricingItemCombobox } from "@/components/admin/pricing/PricingItemCombobox";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";
import { QUOTE_UNIT_OPTIONS } from "@/lib/quotes/quote-builder-types";
import type { QuoteLineType } from "@/lib/quotes/types";
import type { PricingItemRecord } from "@/lib/pricing/types";
import { formatZar } from "@/lib/estimating/money";
import { lineTotalExVat } from "@/lib/quotes/totals";

type Props = {
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

export function QuoteLineEditor({
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
}: Props) {
  const total = lineTotalExVat(line);
  const priceRequired =
    line.lineType !== "heading" &&
    line.lineType !== "note" &&
    (!line.sellUnitPrice || line.sellUnitPrice <= 0);

  const menuItems: AdminDropdownMenuItem[] = [
    { id: "duplicate", label: "Duplicate", onSelect: () => onDuplicate(index) },
    { id: "move-up", label: "Move up", onSelect: () => onMoveUp(index), hidden: isFirst },
    {
      id: "move-down",
      label: "Move down",
      onSelect: () => onMoveDown(index),
      hidden: isLast,
    },
    ...(line.sourcePricingItemId
      ? [
          {
            id: "reset",
            label: "Convert to custom item",
            onSelect: () =>
              onChange(index, { itemCode: "", sourcePricingItemId: null }),
          } as AdminDropdownMenuItem,
        ]
      : []),
    { id: "sep", label: "", separator: true },
    { id: "delete", label: "Remove", tone: "danger", onSelect: () => onDelete(index) },
  ];

  function applyPickedItem(item: PricingItemRecord) {
    onChange(index, {
      lineType: lineTypeForItemType(item.itemType),
      itemCode: item.itemCode,
      category: item.category,
      description: item.quoteDescription || item.name,
      unit: item.quoteUnit,
      sellUnitPrice: item.defaultSellPrice ?? 0,
      costUnitPrice: showCost ? (item.defaultCost ?? null) : line.costUnitPrice,
      taxCategory: taxCategoryFor(item.taxCategory),
      sourcePricingItemId: item.id,
      metadata: { ...(line.metadata ?? {}), pricingItemId: item.id },
    });
  }

  if (line.lineType === "heading" || line.lineType === "note") {
    const isHeading = line.lineType === "heading";
    return (
      <div className={`qline qline--${line.lineType}`}>
        <div className="qline__cell qline__cell--text">
          <span className="qline__label">{isHeading ? "Section heading" : "Note"}</span>
          <AdminInput
            className={isHeading ? "qline__heading-input" : undefined}
            value={line.description}
            onChange={(e) => onChange(index, { description: e.target.value })}
            placeholder={isHeading ? "Section heading" : "Note (not priced)"}
            aria-label={isHeading ? "Section heading" : "Note"}
          />
        </div>
        <div className="qline__cell qline__cell--actions">
          <AdminDropdownMenu items={menuItems} triggerLabel="Line actions" />
        </div>
      </div>
    );
  }

  return (
    <div className="qline qline--item">
      <div className="qline__cell qline__cell--item">
        <span className="qline__label">Item</span>
        {line.itemCode ? (
          <span className="qline__code-chip">
            <span className="qline__code-chip-text">{line.itemCode}</span>
            <button
              type="button"
              className="qline__code-clear"
              aria-label="Clear item"
              onClick={() =>
                onChange(index, { itemCode: "", sourcePricingItemId: null })
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
      </div>

      <div className="qline__cell qline__cell--desc">
        <span className="qline__label">Description</span>
        <AdminTextarea
          className="qline__desc-input"
          rows={1}
          value={line.description}
          onChange={(e) => onChange(index, { description: e.target.value })}
          placeholder="Item description"
          aria-label="Description"
        />
      </div>

      <div className="qline__cell qline__cell--qty">
        <span className="qline__label">Qty</span>
        <AdminInput
          type="number"
          step="0.0001"
          value={line.quantity}
          onChange={(e) => onChange(index, { quantity: Number(e.target.value) })}
          aria-label="Quantity"
        />
      </div>

      <div className="qline__cell qline__cell--unit">
        <span className="qline__label">Unit</span>
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
      </div>

      <div className="qline__cell qline__cell--price">
        <span className="qline__label">Unit price</span>
        <AdminInput
          type="number"
          step="0.01"
          value={line.sellUnitPrice}
          onChange={(e) => onChange(index, { sellUnitPrice: Number(e.target.value) })}
          aria-label="Unit price"
        />
      </div>

      <div className="qline__cell qline__cell--disc">
        <span className="qline__label">Disc %</span>
        <AdminInput
          type="number"
          step="0.01"
          value={line.discountPercent}
          onChange={(e) => onChange(index, { discountPercent: Number(e.target.value) })}
          aria-label="Discount percent"
        />
      </div>

      <div className="qline__cell qline__cell--vat">
        <span className="qline__label">VAT</span>
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
      </div>

      <div className="qline__cell qline__cell--amount">
        <span className="qline__label">Amount</span>
        {priceRequired ? (
          <span className="qline__price-required">Price required</span>
        ) : (
          <span className="qline__amount-value">{formatZar(total)}</span>
        )}
      </div>

      <div className="qline__cell qline__cell--actions">
        <AdminDropdownMenu items={menuItems} triggerLabel="Line actions" />
      </div>
    </div>
  );
}
