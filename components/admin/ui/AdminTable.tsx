import type { ReactNode } from "react";

type AdminTableProps = {
  children: ReactNode;
  caption?: string;
  className?: string;
};

/** Semantic table wrapper — no horizontal scroll on desktop by default. */
export function AdminTable({ children, caption, className }: AdminTableProps) {
  return (
    <div className={`admin-table-shell${className ? ` ${className}` : ""}`}>
      <table className="admin-table">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}
