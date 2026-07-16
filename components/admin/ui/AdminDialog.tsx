"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type AdminDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function AdminDialog({
  open,
  title,
  onClose,
  children,
  footer,
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

  if (!open) return null;

  return (
    <div className="admin-dialog" role="presentation">
      <button
        type="button"
        className="admin-dialog__backdrop"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="admin-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="admin-dialog__header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="btn btn--sm btn--secondary"
            onClick={onClose}
          >
            Close
          </button>
        </header>
        <div className="admin-dialog__body">{children}</div>
        {footer ? <footer className="admin-dialog__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
