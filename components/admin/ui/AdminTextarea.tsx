import type { TextareaHTMLAttributes } from "react";
import { adminControlClassName } from "./admin-control-class";

export type AdminTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function AdminTextarea({
  invalid,
  className,
  ...props
}: AdminTextareaProps) {
  return (
    <textarea
      className={adminControlClassName(invalid, className)}
      {...props}
    />
  );
}
