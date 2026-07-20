import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/layout";
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

function breadcrumbsFromPath(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin/" }];
  const rest = pathname.replace(/^\/admin\/?/, "").replace(/\/$/, "");
  if (!rest) return crumbs;

  const segments = rest.split("/").filter(Boolean);
  const labels: Record<string, string> = {
    rfqs: "RFQs",
    quotes: "Quotes",
    customers: "Customers",
    pricing: "Pricing",
    import: "CSV Import",
    materials: "Materials",
    labour: "Labour",
    travel: "Travel & Delivery",
    services: "Services & Installation",
    equipment: "Equipment & Site Costs",
    "tank-models": "Tank Models",
    review: "Price Review",
    new: "New Quote",
    edit: "Edit Quote",
    preview: "Preview",
    estimating: "Estimating Rules",
  };

  let path = "/admin";
  segments.forEach((segment, index) => {
    path += `/${segment}`;
    const label = labels[segment] ?? segment.replace(/-/g, " ");
    const entry: { label: string; href?: string } = { label };
    if (index < segments.length - 1) entry.href = `${path}/`;
    crumbs.push(entry);
  });

  return crumbs;
}

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
  const breadcrumbs = breadcrumbsFromPath(pathname);

  return (
    <AdminShell
      profile={admin.profile}
      navItems={getNavItemsForRole(admin.profile.role)}
      title={title}
      breadcrumbs={breadcrumbs}
      showHeaderTitle={pathname === "/admin" || pathname === "/admin/"}
    >
      {children}
    </AdminShell>
  );
}

function titleFromPath(pathname: string): string {
  if (pathname === "/admin" || pathname === "/admin/") return "Dashboard";
  const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0];
  if (!segment) return "Dashboard";
  const labels: Record<string, string> = {
    rfqs: "RFQs",
    quotes: "Quotes",
    customers: "Customers",
    pricing: "Pricing",
    settings: "Settings",
    audit: "Audit Log",
  };
  if (labels[segment]) return labels[segment];
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
