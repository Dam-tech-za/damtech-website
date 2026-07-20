import type { ReactNode } from "react";

type AdminMainProps = {
  children: ReactNode;
};

export function AdminMain({ children }: AdminMainProps) {
  return (
    <div className="admin-shell__main">
      {children}
    </div>
  );
}

export function AdminMainContent({ children }: AdminMainProps) {
  return <div className="admin-shell__content">{children}</div>;
}
