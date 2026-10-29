"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/**
 * Shared admin list toolbar, in the projects-board style: one row of quiet
 * buttons (primary action, Search, Person, Filter, Sort, …) and small
 * popovers. Uses the same ops-toolbar classes as the projects board so
 * every list looks alike. The projects board keeps its own copy.
 */

export function ToolbarIconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ToolbarIconPerson() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 13.5c.8-2.4 2.4-3.5 4.5-3.5s3.7 1.1 4.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ToolbarIconFilter() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 3.5h11M4.5 8h7M6.5 12.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ToolbarIconSort() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 3.5v9M4 12.5 2.5 11M4 12.5 5.5 11M12 12.5v-9M12 3.5 10.5 5M12 3.5 13.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ToolbarIconMore() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="3.5" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12.5" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function ToolbarChevron() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true" className="ops-toolbar__chevron">
      <path d="M1 1.2 5 4.8 9 1.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A small panel under a toolbar button; closes on Escape or a click outside. */
export function AdminToolbarPopover({
  open,
  anchorRef,
  onClose,
  width = 260,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  width?: number;
  children: ReactNode;
}) {
  const [style, setStyle] = useState<CSSProperties>({});
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const panelW = Math.max(width, panelRef.current?.offsetWidth ?? width);
      let left = rect.left;
      if (left + panelW > window.innerWidth - 8) left = Math.max(8, window.innerWidth - panelW - 8);
      setStyle({ top: rect.bottom + 4, left, width: panelW, maxWidth: "calc(100vw - 16px)" });
    };
    place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, anchorRef, onClose, width]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div ref={panelRef} className="ops-toolbar__popover" role="dialog" style={style}>
      {children}
    </div>,
    document.body,
  );
}
