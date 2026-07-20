"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { AdminButton } from "./AdminButton";

type AdminFilterDrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function AdminFilterDrawer({
  open,
  title,
  onClose,
  children,
  footer,
}: AdminFilterDrawerProps) {
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
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="admin-drawer__panel admin-filter-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="admin-drawer__header">
          <h2 id={titleId}>{title}</h2>
          <AdminButton variant="ghost" size="sm" type="button" onClick={onClose}>
            Close
          </AdminButton>
        </header>
        <div className="admin-filter-drawer__body">{children}</div>
        {footer ? <footer className="admin-filter-drawer__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
