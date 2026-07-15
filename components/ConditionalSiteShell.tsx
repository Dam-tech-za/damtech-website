import { headers } from "next/headers";
import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";

/**
 * Marketing shell for public pages. Admin and auth routes render without
 * the public header/footer so the internal portal has its own chrome.
 */
export async function ConditionalSiteShell({
  children,
}: {
  children: ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-damtech-pathname") ?? "";

  const isAdminSurface =
    pathname.startsWith("/admin") || pathname.startsWith("/auth");

  if (isAdminSurface) {
    return <main className="flex-1">{children}</main>;
  }

  return <PageShell>{children}</PageShell>;
}
