import Link from "next/link";
import type { AdminNavItem } from "@/lib/auth/types";

type AdminSidebarProps = {
  items: AdminNavItem[];
  pathname: string;
  collapsed?: boolean;
};

export function AdminSidebar({ items, pathname, collapsed }: AdminSidebarProps) {
  return (
    <aside
      className={`admin-sidebar${collapsed ? " admin-sidebar--collapsed" : ""}`}
      aria-label="Admin navigation"
    >
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__brand-mark" aria-hidden />
        {!collapsed ? (
          <div>
            <p className="admin-sidebar__brand-kicker">Damtech</p>
            <p className="admin-sidebar__brand-title">Administration</p>
          </div>
        ) : null}
      </div>
      <nav className="admin-sidebar__nav">
        <ul>
          {items.map((item) => {
            const active =
              item.href === "/admin/"
                ? pathname === "/admin" || pathname === "/admin/"
                : pathname === item.href ||
                  pathname === item.href.replace(/\/$/, "") ||
                  pathname.startsWith(item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`admin-sidebar__link${active ? " is-active" : ""}`}
                  title={item.description}
                >
                  <span className="admin-sidebar__link-label">{item.label}</span>
                  {!collapsed ? (
                    <span className="admin-sidebar__link-hint">{item.description}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
