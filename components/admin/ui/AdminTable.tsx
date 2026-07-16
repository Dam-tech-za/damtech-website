import type { ReactNode } from "react";

type AdminTableProps = {
  children: ReactNode;
  caption?: string;
};

/** Semantic table wrapper with sticky header support. */
export function AdminTable({ children, caption }: AdminTableProps) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}
