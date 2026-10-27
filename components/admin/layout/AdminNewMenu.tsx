"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export type NewMenuItem = { href: string; label: string; hint: string };

/** One "+ New" button for the things people create: an enquiry, a project, a customer. */
export function AdminNewMenu({ items }: { items: NewMenuItem[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function close(event: MouseEvent | KeyboardEvent) {
      const el = ref.current;
      if (!el?.open) return;
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !el.contains(event.target as Node)) el.open = false;
    }
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  if (!items.length) return null;
  return (
    <details ref={ref} className="admin-new-menu">
      <summary className="admin-btn admin-btn--primary admin-btn--sm admin-new-menu__button">
        <span aria-hidden>+</span> New
      </summary>
      <ul className="admin-new-menu__list">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="admin-new-menu__item"
              target={item.href.startsWith("/admin") ? undefined : "_blank"}
              rel={item.href.startsWith("/admin") ? undefined : "noopener"}
              onClick={() => {
                if (ref.current) ref.current.open = false;
              }}
            >
              <span>{item.label}</span>
              <span className="admin-new-menu__hint">{item.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
