import type { ReactNode } from "react";

type AdminLabelProps = {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function AdminLabel({
  htmlFor,
  required,
  children,
  className,
}: AdminLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={["admin-label", className].filter(Boolean).join(" ")}
    >
      {children}
      {required ? (
        <span className="admin-label__required" aria-hidden>
          {" "}
          *
        </span>
      ) : null}
    </label>
  );
}
