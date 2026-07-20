"use client";

import { AdminButton, AdminDialog } from "@/components/admin/ui";

type VatModeChangeDialogProps = {
  open: boolean;
  onClose: () => void;
  onChoose: (strategy: "preserve_value" | "preserve_total") => void;
};

export function VatModeChangeDialog({
  open,
  onClose,
  onChoose,
}: VatModeChangeDialogProps) {
  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title="Change VAT pricing mode?"
      footer={
        <>
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() => onChoose("preserve_value")}
          >
            Keep numeric values
          </AdminButton>
          <AdminButton
            type="button"
            variant="primary"
            onClick={() => onChoose("preserve_total")}
          >
            Convert to preserve totals
          </AdminButton>
        </>
      }
    >
      <p>
        Choose whether existing unit prices should keep their numeric value and be
        reinterpreted, or be converted so the customer-facing total remains unchanged.
      </p>
    </AdminDialog>
  );
}
