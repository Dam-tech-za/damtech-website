import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { ArrowRightIcon, LayersIcon } from "@/components/icons/StrokeIcons";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { SiteSection } from "@/components/SiteSection";

export type InfoCardItem = {
  id?: string;
  title: string;
  description: string;
  href?: string;
  cta?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

type InfoCardGridProps = {
  items: readonly InfoCardItem[];
  heading?: string;
  eyebrow?: string;
  intro?: string;
  headingId?: string;
  tone?: "default" | "muted";
};

/** Homepage-style material/service info cards. */
export function InfoCardGrid({
  items,
  heading,
  eyebrow,
  intro,
  headingId = "info-cards-heading",
  tone = "muted",
}: InfoCardGridProps) {
  return (
    <SiteSection tone={tone} aria-labelledby={heading ? headingId : undefined}>
      {heading ? (
        <PageSectionHeader
          id={headingId}
          eyebrow={eyebrow}
          title={heading}
          intro={intro}
        />
      ) : null}
      <ul className={`home-services__cards${heading ? " site-card-grid--spaced" : ""}`}>
        {items.map((item) => {
          const Icon = item.Icon ?? LayersIcon;
          return (
            <li key={item.id ?? item.title}>
              <article className="home-services__card">
                <span className="home-services__card-icon-wrap" aria-hidden>
                  <Icon className="home-services__card-icon" />
                </span>
                <h3 className="home-services__card-title">
                  {item.href ? (
                    <Link href={item.href} className="hover:text-water">
                      {item.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                </h3>
                <p className="home-services__card-text">{item.description}</p>
                {item.href ? (
                  <Link href={item.href} className="home-services__card-link">
                    {item.cta ?? "Learn more"}
                    <ArrowRightIcon
                      className="home-services__card-link-icon"
                      aria-hidden
                    />
                  </Link>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
    </SiteSection>
  );
}
