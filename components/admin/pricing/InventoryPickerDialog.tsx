"use client";

import { AdminButton, AdminDialog } from "@/components/admin/ui";
import type { EditableLine } from "@/lib/quotes/quote-builder-types";
import { PricingItemPicker } from "./PricingItemPicker";

type InventoryPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  onAddLine: (line: EditableLine) => void;
  showCost: boolean;
};

export function InventoryPickerDialog({
  open,
  onClose,
  onAddLine,
  showCost,
}: InventoryPickerDialogProps) {
  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title="Inventory & Pricing"
      footer={
        <AdminButton type="button" variant="secondary" onClick={onClose}>
          Close
        </AdminButton>
      }
    >
      <p className="admin-help-text">
        Search materials, services, labour, travel and other quotable items. Selected pricing is
        snapshotted into the quote line.
      </p>
      <PricingItemPicker showCost={showCost} onAddLine={onAddLine} onCancel={onClose} />
    </AdminDialog>
  );
}
