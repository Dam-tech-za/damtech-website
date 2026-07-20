import type { InputHTMLAttributes } from "react";
import { adminControlClassName } from "./admin-control-class";

export type AdminInputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function AdminInput({
  invalid,
  className,
  ...props
}: AdminInputProps) {
  return (
    <input
      className={adminControlClassName(invalid, className)}
      {...props}
    />
  );
}
