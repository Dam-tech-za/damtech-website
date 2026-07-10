import Image from "next/image";
import Link from "next/link";
import type { StaticImageData } from "next/image";
import { SiteSection } from "@/components/SiteSection";

export type ServiceIntroCard = {
  title: string;
  description: string;
  href?: string;
};

export type ServiceIntroChip = {
  title: string;
  description: string;
};

export type ServiceIntroCta = {
  label: string;
  href: string;
};

export type ServiceIntroSectionProps = {
  eyebrow: string;
  heading: string;
  description: string;
  cards: readonly ServiceIntroCard[];
  primaryCta: ServiceIntroCta;
  secondaryCta: ServiceIntroCta;
  image: StaticImageData | string;
  imageAlt: string;
  imageCaption?: string;
  benefitChips: readonly ServiceIntroChip[];
  explainerTitle?: string;
  explainerContent?: string;
  explainerSecondaryContent?: string;
  tone?: "default" | "muted";
};

/**
 * Homepage-style below-hero intro for service pages:
 * two-column layout, system cards, image card, benefit chips, optional explainer.
 */
export function ServiceIntroSection({
  eyebrow,
  heading,
  description,
  cards,
  primaryCta,
  secondaryCta,
  image,
  imageAlt,
  imageCaption,
  benefitChips,
  explainerTitle,
  explainerContent,
  explainerSecondaryContent,
  tone = "default",
}: ServiceIntroSectionProps) {
  const showExplainer = Boolean(explainerTitle && explainerContent);

  return (
    <SiteSection tone={tone}>
      <div className="service-intro">
        <div className="service-intro__grid">
          <div className="service-intro__copy">
            <p className="service-intro__eyebrow">{eyebrow}</p>
            <h2 className="service-intro__heading">{heading}</h2>
            <p className="service-intro__description">{description}</p>

            <ul className="service-intro__cards">
              {cards.map((card) => (
                <li key={card.title} className="service-intro__card">
                  <h3 className="service-intro__card-title">
                    {card.href ? (
                      <Link href={card.href} className="service-intro__card-link">
                        {card.title}
                      </Link>
                    ) : (
                      card.title
                    )}
                  </h3>
                  <p className="service-intro__card-text">{card.description}</p>
                </li>
              ))}
            </ul>

            <div className="service-intro__actions">
              <Link href={primaryCta.href} className="btn-primary">
                {primaryCta.label}
              </Link>
              <Link href={secondaryCta.href} className="btn-secondary">
                {secondaryCta.label}
              </Link>
            </div>
          </div>

          <div className="service-intro__media">
            <figure className="service-intro__figure">
              <div className="service-intro__image-wrap">
                <Image
                  src={image}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="service-intro__image"
                  loading="lazy"
                />
              </div>
              {imageCaption ? (
                <figcaption className="service-intro__caption">
                  {imageCaption}
                </figcaption>
              ) : null}
            </figure>

            <ul className="service-intro__chips">
              {benefitChips.map((chip) => (
                <li key={chip.title} className="service-intro__chip">
                  <p className="service-intro__chip-title">{chip.title}</p>
                  <p className="service-intro__chip-text">{chip.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {showExplainer ? (
          <aside className="service-intro__explainer" aria-labelledby="service-intro-explainer">
            <h3 id="service-intro-explainer" className="service-intro__explainer-title">
              {explainerTitle}
            </h3>
            <p className="service-intro__explainer-text">{explainerContent}</p>
            {explainerSecondaryContent ? (
              <p className="service-intro__explainer-text">
                {explainerSecondaryContent}
              </p>
            ) : null}
          </aside>
        ) : null}
      </div>
    </SiteSection>
  );
}
