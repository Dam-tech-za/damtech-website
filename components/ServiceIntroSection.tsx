import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { StaticImageData } from "next/image";
import { SiteSection } from "@/components/SiteSection";
import {
  CheckCircleIcon,
  DropletIcon,
  ShieldCheckIcon,
} from "@/components/icons/StrokeIcons";

export type ServiceIntroTrustIcon = "check" | "shield" | "droplet";

export type ServiceIntroTrustPoint = {
  label: string;
  icon?: ServiceIntroTrustIcon;
};

export type ServiceIntroCta = {
  label: string;
  href: string;
};

/**
 * Next.js Link often skips same-page hash scrolling. Use a native <a> for any
 * href that includes a fragment so in-page anchors and calculator deep links work.
 */
function ServiceIntroCtaLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (href.includes("#")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export type ServiceIntroSectionProps = {
  eyebrow: string;
  heading: string;
  description: string;
  trustPoints: readonly ServiceIntroTrustPoint[];
  primaryCta: ServiceIntroCta;
  secondaryCta: ServiceIntroCta;
  image: StaticImageData | string;
  imageAlt: string;
  /** Three short commercial facts shown on the photo ribbon. */
  ribbonFacts: readonly string[];
  /** Optional clarification under the media (e.g. delivery available ≠ included). */
  footnote?: string;
  explainerTitle?: string;
  explainerContent?: string;
  explainerSecondaryContent?: string;
  tone?: "default" | "muted";
};

const TRUST_ICONS = {
  check: CheckCircleIcon,
  shield: ShieldCheckIcon,
  droplet: DropletIcon,
} as const;

const DEFAULT_TRUST_ICONS: readonly ServiceIntroTrustIcon[] = [
  "check",
  "shield",
  "droplet",
];

/**
 * Bridge section between the service-page hero and detailed content.
 * Explains the offer quickly, shows the product, builds trust, then guides
 * the next action. Reusable across DamTech service pages via content config.
 */
export function ServiceIntroSection({
  eyebrow,
  heading,
  description,
  trustPoints,
  primaryCta,
  secondaryCta,
  image,
  imageAlt,
  ribbonFacts,
  footnote,
  explainerTitle,
  explainerContent,
  explainerSecondaryContent,
}: ServiceIntroSectionProps) {
  const showExplainer = Boolean(explainerTitle && explainerContent);
  const facts = ribbonFacts.slice(0, 3);

  return (
    <SiteSection className="service-intro-section">
      <div className="service-intro">
        <div className="service-intro__grid">
          <div className="service-intro__copy">
            <div className="service-intro__lead">
              <p className="service-intro__eyebrow">{eyebrow}</p>
              <h2 className="service-intro__heading">{heading}</h2>
              <p className="service-intro__description">{description}</p>
            </div>

            <ul className="service-intro__trust">
              {trustPoints.slice(0, 3).map((point, index) => {
                const iconKey =
                  point.icon ?? DEFAULT_TRUST_ICONS[index] ?? "check";
                const Icon = TRUST_ICONS[iconKey];
                return (
                  <li key={point.label} className="service-intro__trust-item">
                    <Icon className="service-intro__trust-icon" />
                    <span className="service-intro__trust-label">
                      {point.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="service-intro__actions">
              <ServiceIntroCtaLink
                href={primaryCta.href}
                className="btn-primary"
              >
                {primaryCta.label}
              </ServiceIntroCtaLink>
              <ServiceIntroCtaLink
                href={secondaryCta.href}
                className="service-intro__secondary-link"
              >
                {secondaryCta.label}
                <span aria-hidden="true"> →</span>
              </ServiceIntroCtaLink>
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
              {facts.length > 0 ? (
                <figcaption className="service-intro__ribbon">
                  {facts.map((fact, index) => (
                    <span key={fact} className="service-intro__ribbon-fact">
                      {index > 0 ? (
                        <span
                          className="service-intro__ribbon-sep"
                          aria-hidden="true"
                        >
                          •
                        </span>
                      ) : null}
                      {fact}
                    </span>
                  ))}
                </figcaption>
              ) : null}
            </figure>
            {footnote ? (
              <p className="service-intro__footnote">{footnote}</p>
            ) : null}
          </div>
        </div>

        {showExplainer ? (
          <aside
            className="service-intro__explainer"
            aria-labelledby="service-intro-explainer"
          >
            <h3
              id="service-intro-explainer"
              className="service-intro__explainer-title"
            >
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
