"use client";

import type { ReactNode } from "react";
import { AdminDialog } from "./AdminDialog";
import { AdminButton } from "./AdminButton";

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
};

export function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onClose,
  children,
}: AdminConfirmDialogProps) {
  return (
    <AdminDialog
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            {cancelLabel}
          </AdminButton>
          <AdminButton
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AdminButton>
        </>
      }
    >
      <p>{message}</p>
      {children}
    </AdminDialog>
  );
}
