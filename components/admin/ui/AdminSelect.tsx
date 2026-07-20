import type { SelectHTMLAttributes } from "react";
import { adminControlClassName } from "./admin-control-class";

export type AdminSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export function AdminSelect({
  invalid,
  className,
  children,
  ...props
}: AdminSelectProps) {
  return (
    <select
      className={adminControlClassName(invalid, className)}
      {...props}
    >
      {children}
    </select>
  );
}
