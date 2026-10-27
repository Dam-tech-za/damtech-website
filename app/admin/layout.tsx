import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/layout";
import { canPerform, getNavItemsForRole } from "@/lib/auth/permissions";
import { getNavBadges } from "@/lib/admin/nav-badges";
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

// Rendered without the admin shell. reset-password still needs the session
// created by the emailed link (checked in proxy.ts and the page).
const PUBLIC_ADMIN_PREFIXES = [
  "/admin/login",
  "/admin/unauthorised",
  "/admin/forgot-password",
  "/admin/reset-password",
];

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

  const role = admin.profile.role;
  const badges = await getNavBadges(role);
  // "+ New": only things this role can create, and only pages that exist.
  const newItems = [
    { href: "/quote/", label: "Enquiry", hint: "Log a phone or walk-in enquiry on the quote form" },
    ...(canPerform(role, "manageOperations")
      ? [{ href: "/admin/operations/projects/new/", label: "Project", hint: "From a Xero quote or invoice, or by hand" }]
      : []),
    ...(canPerform(role, "manageCustomers")
      ? [{ href: "/admin/customers/?new=1#add-customer", label: "Customer", hint: "Name, contact details and addresses" }]
      : []),
  ];

  return (
    <AdminShell
      profile={admin.profile}
      navItems={getNavItemsForRole(role)}
      badges={badges}
      newItems={newItems}
    >
      {children}
    </AdminShell>
  );
}
