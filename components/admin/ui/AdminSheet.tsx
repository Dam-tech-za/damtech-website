import type { ReactNode } from "react";

type AdminSheetProps = {
  children: ReactNode;
  caption: string;
  className?: string;
};

/**
 * The shared admin list table, in the projects-board style (class
 * "admin-sheet"): fixed row height, light grid lines, centred cells.
 * Mark the name column `admin-sheet__lead`, the checkbox and "…" columns
 * `admin-sheet__check` / `admin-sheet__actions`, and write cells as an
 * `admin-sheet__main` line with an optional `admin-sheet__sub` line.
 * See docs/design/admin-sheet-template.md.
 */
export function AdminSheet({ children, caption, className }: AdminSheetProps) {
  return (
    <div className="admin-sheet-wrap">
      <table className={`admin-sheet${className ? ` ${className}` : ""}`}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}
