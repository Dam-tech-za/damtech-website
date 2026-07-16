import type { ReactNode } from "react";

type AdminMobileCardProps = {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  href?: string;
};

export function AdminMobileCard({
  title,
  subtitle,
  meta,
  actions,
  children,
  href,
}: AdminMobileCardProps) {
  const body = (
    <>
      <div className="admin-mobile-card__head">
        <div>
          <p className="admin-mobile-card__title">{title}</p>
          {subtitle ? (
            <p className="admin-mobile-card__subtitle">{subtitle}</p>
          ) : null}
        </div>
        {meta ? <div className="admin-mobile-card__meta">{meta}</div> : null}
      </div>
      {children ? (
        <div className="admin-mobile-card__body">{children}</div>
      ) : null}
      {actions ? (
        <div className="admin-mobile-card__actions">{actions}</div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a href={href} className="admin-mobile-card">
        {body}
      </a>
    );
  }

  return <article className="admin-mobile-card">{body}</article>;
}
