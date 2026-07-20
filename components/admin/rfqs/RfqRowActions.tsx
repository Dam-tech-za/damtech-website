"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type RfqRowActionsProps = {
  rowId: string;
  canManage: boolean;
  compact?: boolean;
};

export function RfqRowActions({ rowId, canManage, compact }: RfqRowActionsProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const detailHref = `/admin/rfqs/${rowId}/`;

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
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

  const items = [
    { id: "edit", label: "Edit", href: detailHref },
    ...(canManage
      ? [
          { id: "assign", label: "Assign", href: `${detailHref}#assign` },
          { id: "status", label: "Update status", href: `${detailHref}#status` },
          {
            id: "info",
            label: "Request information",
            href: `${detailHref}#information`,
          },
          {
            id: "convert",
            label: "Convert to quote",
            href: `${detailHref}#convert`,
          },
          { id: "close", label: "Close", href: `${detailHref}#status` },
        ]
      : []),
  ];

  return (
    <div
      className={`rfq-row-actions${compact ? " rfq-row-actions--compact" : ""}`}
      ref={rootRef}
      onClick={(event) => event.stopPropagation()}
    >
      {!compact ? (
        <Link href={detailHref} className="btn btn--sm btn--secondary">
          View
        </Link>
      ) : null}
      <button
        type="button"
        className="btn btn--sm btn--secondary rfq-row-actions__menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="More RFQ actions"
        onClick={() => setOpen((value) => !value)}
      >
        ⋯
      </button>
      {open ? (
        <ul id={menuId} className="admin-action-menu__list" role="menu">
          {items.map((item) => (
            <li key={item.id} role="none">
              <Link
                href={item.href}
                role="menuitem"
                className="admin-action-menu__item"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
