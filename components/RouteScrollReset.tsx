"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Reset scroll immediately after cross-page App Router navigations. */
export function RouteScrollReset() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (previousPathname.current === null) {
      previousPathname.current = pathname;
      return;
    }

    if (previousPathname.current !== pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      previousPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}
