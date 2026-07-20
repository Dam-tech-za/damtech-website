import type { ReactNode } from "react";

type AdminPanelProps = {
  id?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
  children: ReactNode;
  className?: string;
};

export function AdminPanel({
  id,
  title,
  description,
  actions,
  compact,
  children,
  className,
}: AdminPanelProps) {
  return (
    <section
      id={id}
      className={[
        "admin-panel",
        compact ? "admin-panel--compact" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title || description || actions ? (
        <header className="admin-panel__header">
          <div>
            {title ? <h2 className="admin-panel__title">{title}</h2> : null}
            {description ? (
              <p className="admin-panel__description">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="admin-panel__actions">{actions}</div>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
