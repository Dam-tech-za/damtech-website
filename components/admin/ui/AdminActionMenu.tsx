"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AdminButton } from "./AdminButton";

export type AdminActionMenuItem = {
  id: string;
  label: string;
  onSelect?: () => void;
  href?: string;
  tone?: "default" | "danger";
};

type AdminActionMenuProps = {
  label?: string;
  items: AdminActionMenuItem[];
};

export function AdminActionMenu({
  label = "Actions",
  items,
}: AdminActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="admin-action-menu" ref={rootRef}>
      <AdminButton
        type="button"
        size="sm"
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </AdminButton>
      {open ? (
        <ul id={menuId} className="admin-action-menu__list" role="menu">
          {items.map((item) => (
            <li key={item.id} role="none">
              {item.href ? (
                <a
                  href={item.href}
                  role="menuitem"
                  className={`admin-action-menu__item${item.tone === "danger" ? " is-danger" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className={`admin-action-menu__item${item.tone === "danger" ? " is-danger" : ""}`}
                  onClick={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
