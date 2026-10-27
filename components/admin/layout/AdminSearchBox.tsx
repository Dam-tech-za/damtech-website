"use client";

import { useEffect, useRef } from "react";

/** Header search. Ctrl+K (Cmd+K on Mac) or "/" jumps here from anywhere in the admin. */
export function AdminSearchBox() {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if ((event.key === "k" || event.key === "K") && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form action="/admin/search/" method="get" role="search" className="admin-search">
      <label htmlFor="admin-search-q" className="sr-only">
        Search customers, enquiries, projects and invoices
      </label>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className="admin-search__icon">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        ref={input}
        id="admin-search-q"
        name="q"
        type="search"
        className="admin-search__input"
        placeholder="Search"
        autoComplete="off"
        maxLength={80}
      />
      <kbd className="admin-search__kbd" aria-hidden>
        Ctrl K
      </kbd>
    </form>
  );
}
