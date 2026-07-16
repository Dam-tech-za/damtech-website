import type { ReactNode } from "react";

type AdminSectionProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminSection({
  title,
  description,
  action,
  children,
  className,
}: AdminSectionProps) {
  return (
    <section className={`admin-section${className ? ` ${className}` : ""}`}>
      {title || action ? (
        <header className="admin-section__header">
          <div>
            {title ? <h2 className="admin-section__title">{title}</h2> : null}
            {description ? (
              <p className="admin-section__description">{description}</p>
            ) : null}
          </div>
          {action ? <div className="admin-section__action">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
