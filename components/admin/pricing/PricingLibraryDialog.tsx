"use client";

import { AdminDialog, AdminButton } from "@/components/admin/ui";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";
import { PricingItemPicker } from "./PricingItemPicker";

type Props = {
  open: boolean;
  onClose: () => void;
  onAddLine: (line: EditableLine) => void;
  showCost: boolean;
};

/** @deprecated Use InventoryPickerDialog from the same folder. */
export function PricingLibraryDialog({ open, onClose, onAddLine, showCost }: Props) {
  return (
    <AdminDialog open={open} onClose={onClose} title="Add from Inventory & Pricing">
      <PricingItemPicker showCost={showCost} onAddLine={onAddLine} onCancel={onClose} />
      <div className="admin-panel__actions">
        <AdminButton type="button" variant="secondary" onClick={onClose}>
          Close
        </AdminButton>
      </div>
    </AdminDialog>
  );
}
