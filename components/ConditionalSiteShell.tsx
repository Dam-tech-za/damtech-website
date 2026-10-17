"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Admin and auth routes use their own chrome and are excluded from public analytics. */
export function isAdminSurfacePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/admin") || pathname.startsWith("/auth");
}

/**
 * Chooses between the public marketing chrome and the bare admin/auth chrome.
 *
 * This is a client component on purpose: reading request headers in the root
 * layout forced every public page into dynamic (per-request) rendering. Using
 * `usePathname()` keeps marketing pages statically renderable, while admin and
 * auth routes still render without the public header, footer and tracking.
 * The public chrome is rendered on the server and passed in as slots.
 */
export function ConditionalSiteShell({
  children,
  beforeMain,
  afterMain,
}: {
  children: ReactNode;
  beforeMain: ReactNode;
  afterMain: ReactNode;
}) {
  const pathname = usePathname();

  if (isAdminSurfacePath(pathname)) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {beforeMain}
      <main id="main-content" className="flex-1 pb-[4.5rem] lg:pb-0">
        {children}
      </main>
      {afterMain}
    </>
  );
}
