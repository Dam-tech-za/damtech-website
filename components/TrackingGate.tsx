"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isTrackablePath } from "@/lib/analytics/private-paths";

/** Renders analytics children only on public pages without private tokens in the URL. */
export function TrackingGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isTrackablePath(pathname) ? <>{children}</> : null;
}
