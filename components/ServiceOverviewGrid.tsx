import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRightIcon,
  DropletIcon,
  LayersIcon,
  ReservoirIcon,
  WrenchIcon,
} from "@/components/icons/StrokeIcons";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { SiteSection } from "@/components/SiteSection";

export type ServiceOverviewItem = {
  title: string;
  description: string;
  href: string;
  cta?: string;
};

const ICON_BY_HREF: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  "/dam-liners": LayersIcon,
  "/steel-water-storage-tanks": ReservoirIcon,
  "/bitumen-waterproofing": DropletIcon,
  "/dam-repair-services": WrenchIcon,
  "/reservoir-lining": ReservoirIcon,
  "/agricultural-water-storage": ReservoirIcon,
};

type ServiceOverviewGridProps = {
  items: readonly ServiceOverviewItem[];
  heading?: string;
  eyebrow?: string;
  intro?: string;
  headingId?: string;
  tone?: "default" | "muted";
};

/** Homepage-style service overview cards. */
export function ServiceOverviewGrid({
  items,
  heading = "Our Services",
  eyebrow = "WHAT WE OFFER",
  intro,
  headingId = "our-services-heading",
  tone = "muted",
}: ServiceOverviewGridProps) {
  return (
    <SiteSection tone={tone} aria-labelledby={headingId}>
      <PageSectionHeader
        id={headingId}
        eyebrow={eyebrow}
        title={heading}
        intro={intro}
        align="center"
        className="site-section-header--center"
      />
      <ul className="home-services__cards">
        {items.map((item) => {
          const Icon = ICON_BY_HREF[item.href] ?? LayersIcon;
          return (
            <li key={item.href}>
              <article className="home-services__card">
                <span className="home-services__card-icon-wrap" aria-hidden>
                  <Icon className="home-services__card-icon" />
                </span>
                <h3 className="home-services__card-title">{item.title}</h3>
                <p className="home-services__card-text">{item.description}</p>
                <Link href={item.href} className="home-services__card-link">
                  {item.cta ?? "Learn more"}
                  <ArrowRightIcon
                    className="home-services__card-link-icon"
                    aria-hidden
                  />
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
    </SiteSection>
  );
}
