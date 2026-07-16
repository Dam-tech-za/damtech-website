import type { ReactNode } from "react";

type TabItem = {
  id: string;
  label: string;
  href: string;
};

type AdminTabsProps = {
  items: TabItem[];
  activeId: string;
  children?: ReactNode;
};

export function AdminTabs({ items, activeId, children }: AdminTabsProps) {
  return (
    <div className="admin-tabs">
      <nav className="admin-tabs__nav" aria-label="Section tabs">
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className={`admin-tabs__link${item.id === activeId ? " is-active" : ""}`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {children ? <div className="admin-tabs__panel">{children}</div> : null}
    </div>
  );
}
