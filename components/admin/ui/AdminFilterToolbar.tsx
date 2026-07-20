import type { ReactNode } from "react";

type AdminFilterToolbarProps = {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function AdminFilterToolbar({
  children,
  aside,
  className,
}: AdminFilterToolbarProps) {
  return (
    <div
      className={["admin-filter-toolbar", className].filter(Boolean).join(" ")}
    >
      <div className="admin-filter-toolbar__main">{children}</div>
      {aside ? <div className="admin-filter-toolbar__aside">{aside}</div> : null}
    </div>
  );
}
