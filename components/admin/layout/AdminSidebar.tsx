import Link from "next/link";
import type { AdminNavItem, AdminNavItemId } from "@/lib/auth/types";

type AdminSidebarProps = {
  items: AdminNavItem[];
  pathname: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

type NavGroup = {
  id: string;
  label: string;
  itemIds: AdminNavItemId[];
};

const NAV_GROUPS: NavGroup[] = [
  { id: "overview", label: "Overview", itemIds: ["dashboard"] },
  {
    id: "sales",
    label: "Sales",
    itemIds: ["rfqs", "quotes", "customers"],
  },
  {
    id: "estimating",
    label: "Estimating",
    itemIds: ["pricing", "project-templates", "suppliers"],
  },
  {
    id: "administration",
    label: "Administration",
    itemIds: ["settings", "audit"],
  },
];

function NavIcon({ id }: { id: AdminNavItemId }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 18,
    height: 18,
    fill: "none",
    "aria-hidden": true as const,
  };
  switch (id) {
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M4 4h7v7H4V4Zm9 0h7v5h-7V4ZM4 13h7v7H4v-7Zm9 3h7v4h-7v-4Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "rfqs":
      return (
        <svg {...common}>
          <path d="M6 4h12v16H6V4Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "quotes":
      return (
        <svg {...common}>
          <path d="M7 3h8l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M15 3v4h4M10 13h6M10 17h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "customers":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="17" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "pricing":
      return (
        <svg {...common}>
          <path d="M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 3 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3-4.5-1.3-4.5-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "project-templates":
      return (
        <svg {...common}>
          <path d="M5 4h9l5 5v11H5V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M14 4v5h5M8 13h8M8 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "suppliers":
      return (
        <svg {...common}>
          <path d="M4 17h16M6 17V9l6-4 6 4v8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "audit":
      return (
        <svg {...common}>
          <path d="M8 5h11v14H8V5Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5 8h3v11H5V8Zm6 3h5M11 13h5M11 16h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin/") {
    return pathname === "/admin" || pathname === "/admin/";
  }
  return (
    pathname === href ||
    pathname === href.replace(/\/$/, "") ||
    pathname.startsWith(href)
  );
}

function SidebarLink({
  item,
  pathname,
  collapsed,
}: {
  item: AdminNavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const active = isActive(pathname, item.href);

  return (
    <li>
      <Link
        href={item.href}
        className={`admin-sidebar__link${collapsed ? " admin-sidebar__link--icon-only" : ""}${active ? " is-active" : ""}`}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
      >
        <span className="admin-sidebar__link-icon">
          <NavIcon id={item.id} />
        </span>
        {!collapsed ? (
          <span className="admin-sidebar__link-text">
            <span className="admin-sidebar__link-label">{item.label}</span>
            <span className="admin-sidebar__link-hint">{item.description}</span>
          </span>
        ) : (
          <span className="admin-sidebar__tooltip">{item.label}</span>
        )}
      </Link>
    </li>
  );
}

function CollapseIcon({ expanded }: { expanded: boolean }) {
  return expanded ? (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        d="M8 6h11M8 12h11M8 18h7M5 6l-2 2 2 2M5 12l-2 2 2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        d="M4 6h11M4 12h11M4 18h7M17 6l3 2-3 2M17 12l3 2-3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function AdminSidebar({
  items,
  pathname,
  collapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const byId = new Map(items.map((item) => [item.id, item]));

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
            <p className="admin-sidebar__brand-title">Admin</p>
          </div>
        ) : (
          <span className="sr-only">Damtech Administration</span>
        )}
        {onToggleCollapse ? (
          <button
            type="button"
            className="admin-sidebar__collapse-btn"
            onClick={onToggleCollapse}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon expanded={!collapsed} />
            {collapsed ? <span className="sr-only">Expand sidebar</span> : null}
          </button>
        ) : null}
      </div>

      <nav className="admin-sidebar__nav">
        {collapsed ? (
          <ul className="admin-sidebar__icon-rail">
            {items.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                pathname={pathname}
                collapsed
              />
            ))}
          </ul>
        ) : (
          NAV_GROUPS.map((group) => {
            const groupItems = group.itemIds
              .map((id) => byId.get(id))
              .filter((item): item is AdminNavItem => Boolean(item));
            if (!groupItems.length) return null;
            return (
              <div key={group.id} className="admin-sidebar__group">
                <p className="admin-sidebar__group-label">{group.label}</p>
                <ul>
                  {groupItems.map((item) => (
                    <SidebarLink
                      key={item.id}
                      item={item}
                      pathname={pathname}
                      collapsed={false}
                    />
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
}
