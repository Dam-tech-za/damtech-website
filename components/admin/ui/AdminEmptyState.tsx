import Link from "next/link";
import type { ReactNode } from "react";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
};

export function AdminEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: AdminEmptyStateProps) {
  return (
    <div className="admin-ui-empty">
      <p className="admin-ui-empty__title">{title}</p>
      {description ? (
        <p className="admin-ui-empty__description">{description}</p>
      ) : null}
      {children}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn btn--sm btn--secondary">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
