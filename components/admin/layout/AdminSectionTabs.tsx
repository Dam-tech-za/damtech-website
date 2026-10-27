import Link from "next/link";
import type { AdminNavItem } from "@/lib/auth/types";
import { activeNavItemId, activeSectionId, visibleSections } from "@/lib/admin/navigation";

/** The pages of the current section as tabs above the page (hidden when a section has one page). */
export function AdminSectionTabs({ items, pathname }: { items: AdminNavItem[]; pathname: string }) {
  const sectionId = activeSectionId(pathname, items);
  const entry = visibleSections(items).find((s) => s.section.id === sectionId);
  if (!entry || entry.tabs.length < 2) return null;
  const activeItem = activeNavItemId(pathname, items);
  return (
    <nav className="admin-section-tabs" aria-label={`${entry.section.label} pages`}>
      <ul>
        {entry.tabs.map(({ item, label }) => {
          const active = item.id === activeItem;
          return (
            <li key={item.id}>
              <Link href={item.href} className={`admin-section-tabs__tab${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
