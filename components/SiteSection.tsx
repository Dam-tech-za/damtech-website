import type { ReactNode } from "react";

type SiteSectionTone = "default" | "muted" | "dark";

type SiteSectionProps = {
  children: ReactNode;
  tone?: SiteSectionTone;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
};

/** Homepage-aligned section shell — 80rem container, consistent padding. */
export function SiteSection({
  children,
  tone = "default",
  className = "",
  id,
  "aria-labelledby": ariaLabelledby,
}: SiteSectionProps) {
  const toneClass =
    tone === "muted"
      ? "site-section--muted"
      : tone === "dark"
        ? "site-section--dark"
        : "";

  return (
    <section
      id={id}
      className={`site-section ${toneClass} ${className}`.trim()}
      aria-labelledby={ariaLabelledby}
    >
      <div className="site-section__inner">{children}</div>
    </section>
  );
}
