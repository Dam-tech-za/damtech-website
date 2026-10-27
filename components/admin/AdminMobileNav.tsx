"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { AdminNavItem } from "@/lib/auth/types";
import { activeNavItemId, visibleSections } from "@/lib/admin/navigation";
import { SignOutButton } from "./SignOutButton";

type AdminMobileNavProps = {
  items: AdminNavItem[];
  pathname: string;
  toggleId?: string;
};

function closeMenu(toggleId: string) {
  const toggle = document.getElementById(toggleId);
  if (toggle instanceof HTMLInputElement) toggle.checked = false;
}

export function AdminMobileNav({
  items,
  pathname,
  toggleId = "admin-mobile-nav-toggle",
}: AdminMobileNavProps) {
  const activeId = activeNavItemId(pathname, items);

  // The menu lives in the persistent admin layout, so it must close itself
  // after client-side navigation and on Escape.
  useEffect(() => {
    closeMenu(toggleId);
  }, [pathname, toggleId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu(toggleId);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleId]);

  return (
    <>
      <input
        type="checkbox"
        id={toggleId}
        className="admin-mobile-nav__toggle"
        aria-hidden
        tabIndex={-1}
      />
      <div className="admin-mobile-nav" role="dialog" aria-label="Admin menu">
        <div className="admin-mobile-nav__panel">
          <div className="admin-mobile-nav__top">
            <p className="admin-mobile-nav__title">Menu</p>
            <label htmlFor={toggleId} className="admin-mobile-nav__close">
              Close
            </label>
          </div>
          <nav aria-label="Admin sections">
            {visibleSections(items).map(({ section, tabs }) => (
              <div key={section.id} className="admin-mobile-nav__group">
                <p className="admin-mobile-nav__group-label">{section.label}</p>
                <ul>
                  {tabs.map(({ item, label }) => {
                    const active = item.id === activeId;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`admin-mobile-nav__link${active ? " is-active" : ""}`}
                          aria-current={active ? "page" : undefined}
                          onClick={() => closeMenu(toggleId)}
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="admin-mobile-nav__footer">
            <SignOutButton />
          </div>
        </div>
        <label
          htmlFor={toggleId}
          className="admin-mobile-nav__backdrop"
          aria-hidden
        />
      </div>
    </>
  );
}
