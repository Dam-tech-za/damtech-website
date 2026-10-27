import Link from "next/link";
import type { AdminNavItem } from "@/lib/auth/types";
import { activeSectionId, visibleSections, type AdminSectionId } from "@/lib/admin/navigation";
import { NavIcon } from "./AdminSidebar";

const BAR: AdminSectionId[] = ["overview", "enquiries", "projects", "money"];
const ICON = { overview: "dashboard", enquiries: "rfqs", projects: "projects", money: "money", customers: "customers", settings: "settings" } as const;

/** Phones: the main sections along the bottom; "More" opens the full menu. */
export function AdminBottomBar({
  items,
  pathname,
  badges = {},
  menuToggleId = "admin-mobile-nav-toggle",
}: {
  items: AdminNavItem[];
  pathname: string;
  badges?: Partial<Record<AdminSectionId, number>>;
  menuToggleId?: string;
}) {
  const active = activeSectionId(pathname, items);
  const sections = visibleSections(items).filter((s) => BAR.includes(s.section.id));
  const moreActive = active !== null && !BAR.includes(active);
  return (
    <nav className="admin-bottom-bar" aria-label="Main sections">
      {sections.map(({ section, href }) => (
        <Link
          key={section.id}
          href={href}
          className={`admin-bottom-bar__item${section.id === active ? " is-active" : ""}`}
          aria-current={section.id === active ? "page" : undefined}
        >
          <span className="admin-bottom-bar__icon">
            <NavIcon id={ICON[section.id]} />
            {badges[section.id] ? <span className="admin-bottom-bar__badge">{badges[section.id]}</span> : null}
          </span>
          <span>{section.label}</span>
        </Link>
      ))}
      <label htmlFor={menuToggleId} className={`admin-bottom-bar__item${moreActive ? " is-active" : ""}`}>
        <span className="admin-bottom-bar__icon">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <circle cx="6" cy="12" r="1.6" fill="currentColor" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <circle cx="18" cy="12" r="1.6" fill="currentColor" />
          </svg>
        </span>
        <span>More</span>
      </label>
    </nav>
  );
}
