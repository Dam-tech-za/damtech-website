import Link from "next/link";
import type { ReactNode } from "react";

export type AdminFilterChip = {
  key: string;
  label: ReactNode;
  clearHref: string;
};

type AdminActiveFilterChipsProps = {
  chips: AdminFilterChip[];
  clearHref?: string;
  clearLabel?: string;
};

export function AdminActiveFilterChips({
  chips,
  clearHref,
  clearLabel = "Clear all",
}: AdminActiveFilterChipsProps) {
  if (chips.length === 0 && !clearHref) return null;

  return (
    <div className="admin-filter-chips" aria-label="Active filters">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.clearHref}
          className="admin-filter-chip"
        >
          <span>{chip.label}</span>
          <span className="admin-filter-chip__remove" aria-hidden>
            ×
          </span>
        </Link>
      ))}
      {clearHref ? (
        <Link href={clearHref} className="admin-filter-chip admin-filter-chip--clear">
          {clearLabel}
        </Link>
      ) : null}
    </div>
  );
}
