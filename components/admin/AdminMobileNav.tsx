import Link from "next/link";
import type { AdminNavItem } from "@/lib/auth/types";
import { SignOutButton } from "./SignOutButton";

type AdminMobileNavProps = {
  items: AdminNavItem[];
  pathname: string;
  toggleId?: string;
};

export function AdminMobileNav({
  items,
  pathname,
  toggleId = "admin-mobile-nav-toggle",
}: AdminMobileNavProps) {
  return (
    <>
      <input
        type="checkbox"
        id={toggleId}
        className="admin-mobile-nav__toggle"
        aria-hidden
      />
      <div className="admin-mobile-nav" role="dialog" aria-label="Admin menu">
        <div className="admin-mobile-nav__panel">
          <div className="admin-mobile-nav__top">
            <p className="admin-mobile-nav__title">Menu</p>
            <label htmlFor={toggleId} className="admin-mobile-nav__close">
              Close
            </label>
          </div>
          <nav>
            <ul>
              {items.map((item) => {
                const active =
                  item.href === "/admin/"
                    ? pathname === "/admin" || pathname === "/admin/"
                    : pathname.startsWith(item.href.replace(/\/$/, ""));
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`admin-mobile-nav__link${active ? " is-active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
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
