import type { ReactNode } from "react";
import { AdminButton } from "./AdminButton";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
  children?: ReactNode;
};

export function AdminEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  compact = false,
  children,
}: AdminEmptyStateProps) {
  return (
    <div
      className={`admin-ui-empty${compact ? " admin-ui-empty--compact" : ""}`}
    >
      <p className="admin-ui-empty__title">{title}</p>
      {description ? (
        <p className="admin-ui-empty__description">{description}</p>
      ) : null}
      {children}
      {actionHref && actionLabel ? (
        <AdminButton href={actionHref} size="sm" variant="secondary">
          {actionLabel}
        </AdminButton>
      ) : null}
    </div>
  );
}
