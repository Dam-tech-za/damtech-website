"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AdminButton } from "./AdminButton";

type AdminDrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function AdminDrawer({ open, title, onClose, children }: AdminDrawerProps) {
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
    <div className="admin-drawer" role="presentation">
      <button
        type="button"
        className="admin-drawer__backdrop"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="admin-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="admin-drawer__header">
          <h2 id={titleId}>{title}</h2>
          <AdminButton type="button" size="sm" variant="secondary" onClick={onClose}>
            Close
          </AdminButton>
        </header>
        <div className="admin-drawer__body">{children}</div>
      </div>
    </div>
  );
}
