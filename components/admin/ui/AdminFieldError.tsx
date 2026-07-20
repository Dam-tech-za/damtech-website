import type { ReactNode } from "react";

type AdminFieldErrorProps = {
  id?: string;
  children: ReactNode;
};

export function AdminFieldError({ id, children }: AdminFieldErrorProps) {
  return (
    <p id={id} className="admin-field-error" role="alert">
      {children}
    </p>
  );
}
