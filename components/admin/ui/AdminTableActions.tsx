import type { ReactNode } from "react";

type AdminTableActionsProps = {
  children: ReactNode;
};

export function AdminTableActions({ children }: AdminTableActionsProps) {
  return <div className="admin-table-actions">{children}</div>;
}
