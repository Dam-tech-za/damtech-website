import type { ComponentType, SVGProps } from "react";
import { PageSectionHeader } from "@/components/PageSectionHeader";

export type TrustCardItem = {
  id: string;
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type TrustCardGridProps = {
  items: readonly TrustCardItem[];
  heading?: string;
  eyebrow?: string;
  intro?: string;
  className?: string;
};

/** Homepage-style trust cards for About and conversion pages. */
export function TrustCardGrid({
  items,
  heading = "Experience You Can Trust",
  eyebrow = "WHY DAMTECH",
  intro,
  className = "",
}: TrustCardGridProps) {
  return (
    <section className={className} aria-labelledby="trust-cards-heading">
      <PageSectionHeader
        id="trust-cards-heading"
        eyebrow={eyebrow}
        title={heading}
        intro={intro}
        align="center"
      />
      <ul className="home-why-choose__cards">
        {items.map((card) => (
          <li key={card.id} className="home-why-choose__card">
            <span className="home-why-choose__card-icon-wrap" aria-hidden>
              <card.Icon className="home-why-choose__card-icon" />
            </span>
            <h3 className="home-why-choose__card-title">{card.title}</h3>
            <span className="home-why-choose__card-accent" aria-hidden />
            <p className="home-why-choose__card-text">{card.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
