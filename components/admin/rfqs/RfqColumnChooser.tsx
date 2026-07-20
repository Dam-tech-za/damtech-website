"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  RFQ_OPTIONAL_COLUMNS,
  type RfqOptionalColumnId,
} from "@/lib/admin/rfqs/rfq-inbox-types";

const STORAGE_KEY = "damtech-rfq-columns";

export function loadOptionalColumns(): RfqOptionalColumnId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const allowed = new Set(RFQ_OPTIONAL_COLUMNS.map((c) => c.id));
    return parsed.filter(
      (id): id is RfqOptionalColumnId =>
        typeof id === "string" && allowed.has(id as RfqOptionalColumnId),
    );
  } catch {
    return [];
  }
}

type RfqColumnChooserProps = {
  visible: RfqOptionalColumnId[];
  onChange: (columns: RfqOptionalColumnId[]) => void;
};

export function RfqColumnChooser({ visible, onChange }: RfqColumnChooserProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

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

  function toggle(id: RfqOptionalColumnId) {
    const next = visible.includes(id)
      ? visible.filter((col) => col !== id)
      : [...visible, id];
    onChange(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <div className="rfq-column-chooser" ref={rootRef}>
      <button
        type="button"
        className="btn btn--sm btn--secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        Columns
      </button>
      {open ? (
        <ul id={menuId} className="rfq-column-chooser__menu" role="menu">
          {RFQ_OPTIONAL_COLUMNS.map((column) => (
            <li key={column.id} role="none">
              <label className="rfq-column-chooser__item" role="menuitemcheckbox">
                <input
                  type="checkbox"
                  checked={visible.includes(column.id)}
                  aria-checked={visible.includes(column.id)}
                  onChange={() => toggle(column.id)}
                />
                {column.label}
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
