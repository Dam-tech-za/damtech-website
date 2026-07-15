import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getNavItemsForRole } from "@/lib/auth/permissions";
import { getCurrentAdmin, getCurrentUser } from "@/lib/auth/get-current-user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  title: {
    default: "Damtech Administration",
    template: "%s | Damtech Admin",
  },
};

const PUBLIC_ADMIN_PREFIXES = ["/admin/login", "/admin/unauthorised"];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headerList = await headers();
  const pathname =
    headerList.get("x-damtech-pathname") ||
    headerList.get("next-url") ||
    "/admin/";

  const isPublicAdminPage = PUBLIC_ADMIN_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname === `${prefix}/` ||
      pathname.startsWith(`${prefix}/`),
  );

  if (isPublicAdminPage) {
    return <div className="admin-public">{children}</div>;
  }

  const admin = await getCurrentAdmin();
  if (!admin) {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/admin/login/");
    }
    redirect("/admin/unauthorised/");
  }

  const title = titleFromPath(pathname);
  const breadcrumbs = [
    { label: "Admin", href: "/admin/" },
    ...(pathname === "/admin" || pathname === "/admin/"
      ? []
      : [{ label: title }]),
  ];

  return (
    <AdminShell
      profile={admin.profile}
      navItems={getNavItemsForRole(admin.profile.role)}
      title={title}
      breadcrumbs={breadcrumbs}
    >
      {children}
    </AdminShell>
  );
}

function titleFromPath(pathname: string): string {
  if (pathname === "/admin" || pathname === "/admin/") return "Dashboard";
  const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0];
  if (!segment) return "Dashboard";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
