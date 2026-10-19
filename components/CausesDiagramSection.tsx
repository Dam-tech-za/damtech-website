import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteImage } from "@/lib/images";
import { whatsAppUrl } from "@/lib/site";

export type CausesDiagramFigure = {
  image: SiteImage;
  title: string;
  text: ReactNode;
};

type CausesDiagramSectionProps = {
  id: string;
  eyebrow: string;
  heading: string;
  intro: string;
  signsLabel: string;
  signs: readonly string[];
  figures: readonly CausesDiagramFigure[];
  ctaText: ReactNode;
  ctaLabel: string;
  whatsAppLabel: string;
  quoteHref: string;
};

/**
 * Short, centred "what causes this" section built around explanatory
 * diagrams: a few quick signs, the diagrams (tap to enlarge on phones), then
 * a quote call to action. Used on residential waterproofing pages.
 */
export function CausesDiagramSection({
  id,
  eyebrow,
  heading,
  intro,
  signsLabel,
  signs,
  figures,
  ctaText,
  ctaLabel,
  whatsAppLabel,
  quoteHref,
}: CausesDiagramSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section className="site-section causes-diagram" aria-labelledby={headingId}>
      <div className="site-section__inner">
        <header className="page-section-header page-section-header--center causes-diagram__header">
          <p className="page-section-header__eyebrow">{eyebrow}</p>
          <h2 id={headingId} className="page-section-header__title">
            {heading}
          </h2>
          <p className="page-section-header__intro">{intro}</p>
        </header>

        <ul className="causes-diagram__signs" aria-label={signsLabel}>
          {signs.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>

        {figures.map((figure) => (
          <figure key={figure.image.path} className="causes-diagram__figure">
            <a
              href={figure.image.path}
              className="causes-diagram__zoom"
              target="_blank"
              rel="noopener"
            >
              <Image
                src={figure.image.image}
                alt={figure.image.alt}
                sizes="(max-width: 1180px) 100vw, 1100px"
                placeholder="blur"
                className="causes-diagram__image"
              />
              <span className="causes-diagram__zoom-hint" aria-hidden>
                Tap to enlarge
              </span>
            </a>
            <figcaption>
              <h3 className="causes-diagram__caption-title">{figure.title}</h3>
              <p>{figure.text}</p>
            </figcaption>
          </figure>
        ))}

        <div className="causes-diagram__cta">
          <p>{ctaText}</p>
          <div className="causes-diagram__actions">
            <Link href={quoteHref} className="dt-btn dt-btn--blue">
              {ctaLabel}
            </Link>
            <a
              href={whatsAppUrl}
              className="dt-btn dt-btn--outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {whatsAppLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
