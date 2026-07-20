"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AdminButton } from "./AdminButton";

type AdminDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  role?: "dialog" | "alertdialog";
};

export function AdminDialog({
  open,
  title,
  onClose,
  children,
  footer,
  role = "dialog",
}: AdminDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="admin-dialog admin-dialog--portal" role="presentation">
      <button
        type="button"
        className="admin-dialog__backdrop"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="admin-dialog__panel"
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="admin-dialog__header">
          <h2 id={titleId}>{title}</h2>
          <AdminButton size="sm" variant="secondary" onClick={onClose}>
            Close
          </AdminButton>
        </header>
        <div className="admin-dialog__body">{children}</div>
        {footer ? <footer className="admin-dialog__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
