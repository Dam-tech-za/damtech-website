import type { ComponentType, SVGProps } from "react";
import { CheckCircleIcon } from "@/components/icons/StrokeIcons";
import { PageSectionHeader } from "@/components/PageSectionHeader";
import { SiteSection } from "@/components/SiteSection";

type BenefitCardGridProps = {
  items: readonly string[];
  heading?: string;
  eyebrow?: string;
  intro?: string;
  headingId?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: "default" | "muted";
};

/** Homepage-style benefit/trust cards for service pages. */
export function BenefitCardGrid({
  items,
  heading = "Key Benefits",
  eyebrow = "WHY IT MATTERS",
  intro,
  headingId = "benefits-heading",
  Icon = CheckCircleIcon,
  tone = "muted",
}: BenefitCardGridProps) {
  return (
    <SiteSection tone={tone} aria-labelledby={headingId}>
      <PageSectionHeader
        id={headingId}
        eyebrow={eyebrow}
        title={heading}
        intro={intro}
      />
      <ul className="home-why-choose__cards site-card-grid">
        {items.map((item) => (
          <li key={item} className="home-why-choose__card">
            <span className="home-why-choose__card-icon-wrap" aria-hidden>
              <Icon className="home-why-choose__card-icon" />
            </span>
            <p className="home-why-choose__card-text">{item}</p>
          </li>
        ))}
      </ul>
    </SiteSection>
  );
}
