import type { ReactNode } from "react";
import { AdminButton } from "./AdminButton";

export type AdminPageHeaderAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
};

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  primaryAction?: AdminPageHeaderAction;
  secondaryAction?: AdminPageHeaderAction;
  primaryActionNode?: ReactNode;
  secondaryActions?: ReactNode;
  toolbar?: ReactNode;
  children?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  primaryAction,
  secondaryAction,
  primaryActionNode,
  secondaryActions,
  toolbar,
  children,
}: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header__copy">
        <h1 className="admin-page-header__title">{title}</h1>
        {description ? (
          <p className="admin-page-header__description">{description}</p>
        ) : null}
        {toolbar ? (
          <div className="admin-page-header__toolbar">{toolbar}</div>
        ) : null}
      </div>
      <div className="admin-page-header__actions">
        {children}
        {secondaryActions}
        {secondaryAction ? (
          <AdminButton
            href={secondaryAction.href}
            variant={secondaryAction.variant || "secondary"}
          >
            {secondaryAction.label}
          </AdminButton>
        ) : null}
        {primaryActionNode}
        {primaryAction ? (
          <AdminButton
            href={primaryAction.href}
            variant={primaryAction.variant || "primary"}
          >
            {primaryAction.label}
          </AdminButton>
        ) : null}
      </div>
    </header>
  );
}
