"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { AdminNavItem, AdminProfile } from "@/lib/auth/types";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileNav } from "./AdminMobileNav";
import { AdminSidebar } from "./AdminSidebar";

type AdminShellProps = {
  profile: AdminProfile;
  navItems: AdminNavItem[];
  title: string;
  breadcrumbs: { label: string; href?: string }[];
  children: ReactNode;
  showHeaderTitle?: boolean;
};

export function AdminShell({
  profile,
  navItems,
  title,
  breadcrumbs,
  children,
  showHeaderTitle = false,
}: AdminShellProps) {
  const pathname = usePathname() || "/admin/";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`admin-shell${collapsed ? " admin-shell--collapsed" : ""}`}>
      <AdminSidebar
        items={navItems}
        pathname={pathname}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />
      <AdminMobileNav items={navItems} pathname={pathname} />
      <div className="admin-shell__main">
        <AdminHeader
          title={title}
          breadcrumbs={breadcrumbs}
          email={profile.email}
          fullName={profile.full_name}
          role={profile.role}
          avatarUrl={profile.avatar_url}
          showTitle={showHeaderTitle}
        />
        <div className="admin-shell__content">{children}</div>
      </div>
    </div>
  );
}
