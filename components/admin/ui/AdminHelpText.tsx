import type { ReactNode } from "react";

type AdminHelpTextProps = {
  id?: string;
  children: ReactNode;
};

export function AdminHelpText({ id, children }: AdminHelpTextProps) {
  return (
    <p id={id} className="admin-help-text">
      {children}
    </p>
  );
}
