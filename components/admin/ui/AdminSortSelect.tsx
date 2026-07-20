import type { SelectHTMLAttributes, ReactNode } from "react";
import { AdminSelect } from "./AdminSelect";

type AdminSortSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  children: ReactNode;
};

export function AdminSortSelect({
  label = "Sort",
  className,
  id,
  children,
  ...props
}: AdminSortSelectProps) {
  const fieldId = id ?? props.name ?? "admin-sort";

  return (
    <label className="admin-filter-field" htmlFor={fieldId}>
      <span className="sr-only">{label}</span>
      <AdminSelect
        id={fieldId}
        className={className}
        aria-label={label}
        {...props}
      >
        {children}
      </AdminSelect>
    </label>
  );
}
