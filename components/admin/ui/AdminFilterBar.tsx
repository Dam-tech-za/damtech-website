import type { ReactNode } from "react";

type AdminFilterBarProps = {
  children: ReactNode;
  action?: ReactNode;
};

export function AdminFilterBar({ children, action }: AdminFilterBarProps) {
  return (
    <div className="admin-filter-bar">
      <div className="admin-filter-bar__fields">{children}</div>
      {action ? <div className="admin-filter-bar__action">{action}</div> : null}
    </div>
  );
}
