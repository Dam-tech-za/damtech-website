import Link from "next/link";

type AdminMetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "default" | "muted" | "success" | "warning" | "info";
};

export function AdminMetricCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: AdminMetricCardProps) {
  const className = `admin-metric-compact admin-metric-compact--${tone}`;
  const body = (
    <>
      <p className="admin-metric-compact__label">{label}</p>
      <p className="admin-metric-compact__value">{value}</p>
      {hint ? <p className="admin-metric-compact__hint">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`${label}: ${value}`}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
