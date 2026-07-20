"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import type { AdminNavItem, AdminProfile } from "@/lib/auth/types";
import {
  readSidebarCollapsedPreference,
  writeSidebarCollapsedPreference,
} from "@/lib/admin/sidebar-preference";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminMain, AdminMainContent } from "./AdminMain";

type AdminShellProps = {
  profile: AdminProfile;
  navItems: AdminNavItem[];
  title: string;
  breadcrumbs: { label: string; href?: string }[];
  children: ReactNode;
  showHeaderTitle?: boolean;
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
  title,
  breadcrumbs,
  children,
  showHeaderTitle = false,
}: AdminShellProps) {
  const pathname = usePathname() || "/admin/";
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
