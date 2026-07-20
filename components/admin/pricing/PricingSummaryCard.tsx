import Link from "next/link";
import { AdminButton } from "@/components/admin/ui";

type PricingSummaryCardProps = {
  title: string;
  description: string;
  href: string;
  metrics: { label: string; value: string | number }[];
  actionLabel?: string;
};

export function PricingSummaryCard({
  title,
  description,
  href,
  metrics,
  actionLabel = "Open",
}: PricingSummaryCardProps) {
  return (
    <article className="admin-pricing-card">
      <header className="admin-pricing-card__header">
        <h2 className="admin-pricing-card__title">
          <Link href={href}>{title}</Link>
        </h2>
        <p className="admin-pricing-card__description">{description}</p>
      </header>
      <dl className="admin-pricing-card__metrics">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
      <div className="admin-pricing-card__actions">
        <AdminButton href={href} variant="secondary" size="sm">
          {actionLabel}
        </AdminButton>
      </div>
    </article>
  );
}
