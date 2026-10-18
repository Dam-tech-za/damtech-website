"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import type { AdminNavItem, AdminProfile } from "@/lib/auth/types";
import {
  readSidebarCollapsedPreference,
  writeSidebarCollapsedPreference,
} from "@/lib/admin/sidebar-preference";
import { adminBreadcrumbs, adminPageTitle } from "@/lib/admin/navigation";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminMain, AdminMainContent } from "./AdminMain";

type AdminShellProps = {
  profile: AdminProfile;
  navItems: AdminNavItem[];
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
  children,
}: AdminShellProps) {
  // Derived on the client: the layout does not re-render on navigation, so
  // server-computed breadcrumbs would go stale after the first page.
  const pathname = usePathname() || "/admin/";
  const title = adminPageTitle(pathname);
  const breadcrumbs = adminBreadcrumbs(pathname);
  const showHeaderTitle = pathname === "/admin" || pathname === "/admin/";
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
          showTitle={showHeaderTitle}
          sidebarCollapsed={collapsed}
          onExpandSidebar={expandSidebar}
        />
        <AdminMainContent>{children}</AdminMainContent>
      </AdminMain>
    </div>
  );
}
