"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/admin/actions";
import { AdminDropdownMenu } from "@/components/admin/ui/AdminDropdownMenu";

type AdminUserMenuProps = {
  email: string;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
};

export function AdminUserMenu({
  email,
  fullName,
  role,
  avatarUrl,
}: AdminUserMenuProps) {
  const [pending, startTransition] = useTransition();
  const initials = (fullName || email)
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="admin-user-menu">
      <AdminDropdownMenu
        items={[
          {
            id: "profile",
            label: "My profile",
            href: "/admin/settings/",
          },
          {
            id: "settings",
            label: "Account settings",
            href: "/admin/settings/system/",
          },
          { id: "sep", label: "", separator: true },
          {
            id: "sign-out",
            label: pending ? "Signing out…" : "Sign out",
            onSelect: () => startTransition(() => signOutAction()),
            tone: "danger",
          },
        ]}
        triggerLabel="Open user menu"
        triggerClassName="admin-user-menu__trigger"
        menuClassName="admin-portal-menu__list admin-user-menu__dropdown"
        align="end"
      >
        <span className="admin-user-menu__identity">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar
            <img
              src={avatarUrl}
              alt=""
              width={32}
              height={32}
              className="admin-user-menu__avatar"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="admin-user-menu__initials" aria-hidden>
              {initials || "A"}
            </span>
          )}
          <span className="admin-user-menu__text">
            <span className="admin-user-menu__name">{fullName || email}</span>
            <span className="admin-user-menu__meta">
              {role} · {email}
            </span>
          </span>
          <span className="admin-user-menu__chevron" aria-hidden>
            ▾
          </span>
        </span>
      </AdminDropdownMenu>
    </div>
  );
}
