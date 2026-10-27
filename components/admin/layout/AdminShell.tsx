"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import type { AdminNavItem, AdminProfile } from "@/lib/auth/types";
import type { AdminSectionId } from "@/lib/admin/navigation";
import type { NewMenuItem } from "./AdminNewMenu";
import { AdminBottomBar } from "./AdminBottomBar";
import { AdminSectionTabs } from "./AdminSectionTabs";
import {
  readSidebarCollapsedPreference,
  writeSidebarCollapsedPreference,
} from "@/lib/admin/sidebar-preference";
import { adminPageTitle, detailBreadcrumbs } from "@/lib/admin/navigation";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminMain, AdminMainContent } from "./AdminMain";

type AdminShellProps = {
  profile: AdminProfile;
  navItems: AdminNavItem[];
  badges?: Partial<Record<AdminSectionId, number>>;
  newItems?: NewMenuItem[];
  children: ReactNode;
};

const SIDEBAR_STORE_KEY = "damtech-admin-sidebar-store";

function subscribeSidebarPreference(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === "damtech-admin-sidebar-collapsed") {
      onStoreChange();
    }
  };

  const onLocalChange = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(SIDEBAR_STORE_KEY, onLocalChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SIDEBAR_STORE_KEY, onLocalChange);
  };
}

function getSidebarCollapsedSnapshot() {
  return readSidebarCollapsedPreference();
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}

export function AdminShell({
  profile,
  navItems,
  badges,
  newItems,
  children,
}: AdminShellProps) {
  // Derived on the client: the layout does not re-render on navigation, so
  // server-computed breadcrumbs would go stale after the first page.
  const pathname = usePathname() || "/admin/";
  const title = adminPageTitle(pathname);
  // Breadcrumbs only on detail pages; section pages have the menu and tabs.
  const breadcrumbs = detailBreadcrumbs(pathname);
  const collapsed = useSyncExternalStore(
    subscribeSidebarPreference,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  );

  function toggleCollapsed() {
    writeSidebarCollapsedPreference(!collapsed);
    window.dispatchEvent(new Event(SIDEBAR_STORE_KEY));
  }

  function expandSidebar() {
    if (!collapsed) return;
    writeSidebarCollapsedPreference(false);
    window.dispatchEvent(new Event(SIDEBAR_STORE_KEY));
  }

  return (
    <div className={`admin-shell${collapsed ? " admin-shell--collapsed" : ""}`}>
      <AdminSidebar
        items={navItems}
        pathname={pathname}
        badges={badges}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />
      <AdminMobileSidebar items={navItems} pathname={pathname} />
      <AdminMain>
        <AdminHeader
          title={title}
          breadcrumbs={breadcrumbs}
          email={profile.email}
          fullName={profile.full_name}
          role={profile.role}
          avatarUrl={profile.avatar_url}
          sidebarCollapsed={collapsed}
          onExpandSidebar={expandSidebar}
          newItems={newItems}
        />
        <AdminMainContent>
          <AdminSectionTabs items={navItems} pathname={pathname} />
          {children}
        </AdminMainContent>
      </AdminMain>
      <AdminBottomBar items={navItems} pathname={pathname} badges={badges} />
    </div>
  );
}
