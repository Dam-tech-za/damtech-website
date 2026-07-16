import type { ReactNode } from "react";

type AdminCardProps = {
  children: ReactNode;
  className?: string;
};

export function AdminCard({ children, className }: AdminCardProps) {
  return (
    <article className={`admin-ui-card${className ? ` ${className}` : ""}`}>
      {children}
    </article>
  );
}
