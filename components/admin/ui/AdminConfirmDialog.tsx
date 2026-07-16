"use client";

import type { ReactNode } from "react";
import { AdminDialog } from "./AdminDialog";

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
          <button
            type="button"
            className="btn btn--md btn--secondary"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn--md ${tone === "danger" ? "btn--secondary" : "btn--primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
      {children}
    </AdminDialog>
  );
}
