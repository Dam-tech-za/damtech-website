import Link from "next/link";
import type { ReactNode } from "react";

type SettingsNavCardProps = {
  href: string;
  title: string;
  description: string;
  meta?: string;
  icon?: ReactNode;
};

export function SettingsNavCard({
  href,
  title,
  description,
  meta,
  icon,
}: SettingsNavCardProps) {
  return (
    <Link href={href} className="admin-settings-card">
      {icon ? <span className="admin-settings-card__icon">{icon}</span> : null}
      <span className="admin-settings-card__title">{title}</span>
      <span className="admin-settings-card__description">{description}</span>
      {meta ? <span className="admin-settings-card__meta">{meta}</span> : null}
    </Link>
  );
}
