import Link from "next/link";
import type { ReactNode } from "react";

export type AdminPageHeaderAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type AdminPageHeaderProps = {
  title: string;
  description: string;
  primaryAction?: AdminPageHeaderAction;
  secondaryAction?: AdminPageHeaderAction;
  children?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header__copy">
        <h1 className="admin-page-header__title">{title}</h1>
        <p className="admin-page-header__description">{description}</p>
      </div>
      <div className="admin-page-header__actions">
        {children}
        {secondaryAction ? (
          <Link
            href={secondaryAction.href}
            className={`btn btn--md btn--${secondaryAction.variant || "secondary"}`}
          >
            {secondaryAction.label}
          </Link>
        ) : null}
        {primaryAction ? (
          <Link
            href={primaryAction.href}
            className={`btn btn--md btn--${primaryAction.variant || "primary"}`}
          >
            {primaryAction.label}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
