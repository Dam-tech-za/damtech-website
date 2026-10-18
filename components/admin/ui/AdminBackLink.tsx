"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

const STORAGE_PREFIX = "damtech-admin-list:";

function readListUrl(listPath: string): string | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_PREFIX + listPath);
    return value && value.startsWith(listPath) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Place on a list page. Remembers the list URL (search, filters, page) for
 * this browser tab so detail pages can link straight back to it.
 */
export function AdminListMemory({ listPath }: { listPath: string }) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        STORAGE_PREFIX + listPath,
        `${listPath}${query ? `?${query}` : ""}`,
      );
    } catch {
      // Storage unavailable (private mode): back links use the plain list.
    }
  }, [listPath, query]);

  return null;
}

function subscribeNoop() {
  return () => {};
}

type AdminBackLinkProps = {
  /** List page to return to, e.g. "/admin/rfqs/". */
  listPath: string;
  label: string;
};

/** Link back to the list, restoring the filters the user last had there. */
export function AdminBackLink({ listPath, label }: AdminBackLinkProps) {
  const href = useSyncExternalStore(
    subscribeNoop,
    () => readListUrl(listPath) ?? listPath,
    () => listPath,
  );

  return (
    <Link href={href} className="admin-back-link">
      <span aria-hidden>←</span> {label}
    </Link>
  );
}
