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
};

export function AdminShell({
  profile,
  navItems,
  title,
  breadcrumbs,
  children,
}: AdminShellProps) {
  const pathname = usePathname() || "/admin/";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`admin-shell${collapsed ? " admin-shell--collapsed" : ""}`}>
      <AdminSidebar items={navItems} pathname={pathname} collapsed={collapsed} />
      <AdminMobileNav items={navItems} pathname={pathname} />
      <div className="admin-shell__main">
        <AdminHeader
          title={title}
          breadcrumbs={breadcrumbs}
          email={profile.email}
          fullName={profile.full_name}
          role={profile.role}
          avatarUrl={profile.avatar_url}
        />
        <div className="admin-shell__toolbar">
          <button
            type="button"
            className="admin-shell__collapse-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-pressed={collapsed}
          >
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </button>
        </div>
        <div className="admin-shell__content">{children}</div>
      </div>
    </div>
  );
}
