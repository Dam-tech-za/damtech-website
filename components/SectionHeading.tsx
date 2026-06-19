import type { ReactNode } from "react";
import { slugifyHeading } from "@/lib/headings";

type SectionHeadingProps = {
  as?: "h2" | "h3";
  id?: string;
  className?: string;
  children: ReactNode;
};

/** Section heading — use h2/h3 only (one h1 per page lives in Hero / article header). */
export function SectionHeading({
  as: Tag = "h2",
  id,
  className = "",
  children,
}: SectionHeadingProps) {
  const label = typeof children === "string" ? children : "";
  const sectionId = id ?? (label ? slugifyHeading(label) : undefined);
  const baseClass = Tag === "h2" ? "section-heading" : "subsection-heading";

  return (
    <Tag id={sectionId} className={`${baseClass} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
