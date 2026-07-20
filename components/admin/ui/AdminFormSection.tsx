import type { ReactNode } from "react";

type AdminFormSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function AdminFormSection({
  title,
  description,
  children,
}: AdminFormSectionProps) {
  return (
    <section className="admin-form-section">
      {title ? <h3 className="admin-form-section__title">{title}</h3> : null}
      {description ? (
        <p className="admin-form-section__description">{description}</p>
      ) : null}
      {children}
    </section>
  );
}
