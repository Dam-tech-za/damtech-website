import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { ArrowRightIcon } from "@/components/icons/StrokeIcons";
import { PageSectionHeader } from "@/components/PageSectionHeader";

export type RelatedServiceLink = {
  href: string;
  label: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

type RelatedServicesGridProps = {
  links: readonly RelatedServiceLink[];
  heading?: string;
  eyebrow?: string;
  intro?: string;
  excludeHref?: string;
  className?: string;
  /** When true, omit outer content-wrap padding (use inside an existing section). */
  nested?: boolean;
};

/** Homepage-style related service link cards for inner pages. */
export function RelatedServicesGrid({
  links,
  heading = "Related Damtech Services",
  eyebrow = "EXPLORE SERVICES",
  intro,
  excludeHref,
  className = "",
  nested = false,
}: RelatedServicesGridProps) {
  const visibleLinks = links.filter((link) => link.href !== excludeHref);

  if (visibleLinks.length === 0) return null;

  const sectionClass = nested
    ? `mt-12 ${className}`.trim()
    : `content-wrap ${className}`.trim();

  return (
    <section
      className={sectionClass}
      aria-labelledby="related-services-heading"
    >
      <PageSectionHeader
        id="related-services-heading"
        eyebrow={eyebrow}
        title={heading}
        intro={intro}
      />
      <ul className="home-why-choose__links">
        {visibleLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="home-why-choose__link-card">
              {link.Icon ? (
                <span className="home-why-choose__link-icon-wrap" aria-hidden>
                  <link.Icon className="home-why-choose__link-icon" />
                </span>
              ) : null}
              <span className="home-why-choose__link-label">{link.label}</span>
              <ArrowRightIcon
                className="home-why-choose__link-arrow"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
