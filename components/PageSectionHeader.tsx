type PageSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  intro?: string;
  id?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
};

/** Homepage-style section header for inner pages (eyebrow → title → divider → intro). */
export function PageSectionHeader({
  eyebrow,
  title,
  intro,
  id,
  align = "left",
  light = false,
  className = "",
}: PageSectionHeaderProps) {
  const alignClass =
    align === "center" ? "page-section-header--center" : "page-section-header--left";
  const toneClass = light ? "page-section-header--light" : "";

  return (
    <header
      className={`page-section-header ${alignClass} ${toneClass} ${className}`.trim()}
    >
      {eyebrow ? <p className="page-section-header__eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="page-section-header__title">
        {title}
      </h2>
      <span className="page-section-header__divider" aria-hidden />
      {intro ? <p className="page-section-header__intro">{intro}</p> : null}
    </header>
  );
}
