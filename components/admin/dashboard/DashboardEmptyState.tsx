import Link from "next/link";

type DashboardEmptyStateProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function DashboardEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: DashboardEmptyStateProps) {
  return (
    <div className="dash-empty">
      <p className="dash-empty__title">{title}</p>
      {description ? <p className="dash-empty__desc">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn btn--sm btn--secondary">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
