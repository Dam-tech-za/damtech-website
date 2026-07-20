import { AdminEmptyState } from "@/components/admin/ui";

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
    <AdminEmptyState
      title={title}
      description={description}
      actionHref={actionHref}
      actionLabel={actionLabel}
      compact
    />
  );
}
