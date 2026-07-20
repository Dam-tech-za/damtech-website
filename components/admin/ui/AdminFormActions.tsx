import type { ReactNode } from "react";

type AdminFormActionsProps = {
  children: ReactNode;
  sticky?: boolean;
  className?: string;
};

export function AdminFormActions({ children, sticky, className }: AdminFormActionsProps) {
  return (
    <div
      className={[
        "admin-form-actions",
        sticky ? "admin-form-actions--sticky" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
