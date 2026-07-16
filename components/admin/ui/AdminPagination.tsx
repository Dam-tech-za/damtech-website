import type { ReactNode } from "react";

type AdminPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  children?: ReactNode;
};

export function AdminPagination({
  page,
  pageSize,
  total,
  children,
}: AdminPaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="admin-pagination">
      <p className="admin-pagination__summary">
        Showing {from}–{to} of {total}
      </p>
      {children ? (
        <div className="admin-pagination__controls">{children}</div>
      ) : null}
    </div>
  );
}
